// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

// ---------------------------
// OpenZeppelin imports
// ---------------------------
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/IERC20Metadata.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/security/Pausable.sol";

// ---------------------------
// Internal library import
// ---------------------------
import "./InterestCalculator.sol";

// ---------------------------
// Optional price feed interface (Chainlink-compatible: Protofire/DIA)
// ---------------------------
interface IPriceFeed {
    function latestAnswer() external view returns (int256);
}

contract SavingsPool is AccessControl, Pausable, ReentrancyGuard {
    using SafeERC20 for IERC20;

    // ---------------------------
    // Roles
    // ---------------------------
    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");
    bytes32 public constant EMERGENCY_ROLE = keccak256("EMERGENCY_ROLE");

    // ---------------------------
    // Constants
    // ---------------------------
    uint256 public constant BASIS_POINTS = 10000;
    uint256 public constant SECONDS_PER_YEAR = 365 days;

    // ---------------------------
    // State variables
    // ---------------------------

    // Supported tokens → true/false
    mapping(address => bool) public supportedTokens;

    // Per-token interest rates in basis points (e.g., 500 = 5% APR)
    mapping(address => uint256) public interestRates;

    // User balances per token (principal only)
    mapping(address => mapping(address => uint256)) public balances;

    // Last claim timestamp per user per token
    mapping(address => mapping(address => uint256)) public lastClaimTime;

    // Total deposits per token
    mapping(address => uint256) public totalDeposits;

    // Protocol fee on interest, in basis points
    uint256 public protocolFee = 100; // 1% default

    // Treasury wallet for collecting fees
    address public treasury;

    // Collected fees per token
    mapping(address => uint256) public protocolFeesCollected;

    // Optional: Chainlink/Protofire price feeds per token
    mapping(address => address) public priceFeeds;

    // ---------------------------
    // Events
    // ---------------------------
    event Deposited(address indexed user, address indexed token, uint256 amount);
    event Withdrawn(address indexed user, address indexed token, uint256 amount, uint256 interest);
    event InterestClaimed(address indexed user, address indexed token, uint256 interestAmount);
    event TokenAdded(address indexed token, uint256 initialRate);
    event InterestRateUpdated(address indexed token, uint256 oldRate, uint256 newRate);
    event ProtocolFeeUpdated(uint256 oldFee, uint256 newFee);

    // ---------------------------
    // Constructor
    // ---------------------------
    constructor(address _treasury) {
        require(_treasury != address(0), "Invalid treasury");
        treasury = _treasury;

        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(ADMIN_ROLE, msg.sender);
        _grantRole(EMERGENCY_ROLE, msg.sender);
    }

    // ---------------------------
    // Modifiers
    // ---------------------------
    modifier onlySupportedToken(address token) {
        require(supportedTokens[token], "Token not supported");
        _;
    }

    modifier validAmount(uint256 amount) {
        require(amount > 0, "Amount must be > 0");
        _;
    }

    // ---------------------------
    // Admin Functions
    // ---------------------------

    function addSupportedToken(address token, uint256 initialRate, address priceFeed)
        external
        onlyRole(ADMIN_ROLE)
    {
        require(token != address(0), "Invalid token");
        require(initialRate <= BASIS_POINTS, "Rate too high");

        supportedTokens[token] = true;
        interestRates[token] = initialRate;
        priceFeeds[token] = priceFeed;

        emit TokenAdded(token, initialRate);
    }

    function updateInterestRate(address token, uint256 newRate)
        external
        onlyRole(ADMIN_ROLE)
        onlySupportedToken(token)
    {
        require(newRate <= BASIS_POINTS, "Rate too high");

        uint256 oldRate = interestRates[token];
        interestRates[token] = newRate;

        emit InterestRateUpdated(token, oldRate, newRate);
    }

    function updateProtocolFee(uint256 newFee) external onlyRole(ADMIN_ROLE) {
        require(newFee <= 1000, "Max fee = 10%");
        uint256 oldFee = protocolFee;
        protocolFee = newFee;
        emit ProtocolFeeUpdated(oldFee, newFee);
    }

    function pause() external onlyRole(EMERGENCY_ROLE) {
        _pause();
    }

    function unpause() external onlyRole(EMERGENCY_ROLE) {
        _unpause();
    }

    // ---------------------------
    // Core User Functions
    // ---------------------------

    function deposit(address token, uint256 amount)
        external
        nonReentrant
        whenNotPaused
        onlySupportedToken(token)
        validAmount(amount)
    {
        // Claim any existing interest before depositing new funds
        if (balances[msg.sender][token] > 0) {
            _claimInterest(msg.sender, token);
        }

        IERC20(token).safeTransferFrom(msg.sender, address(this), amount);

        balances[msg.sender][token] += amount;
        totalDeposits[token] += amount;
        lastClaimTime[msg.sender][token] = block.timestamp;

        emit Deposited(msg.sender, token, amount);
    }

    function withdraw(address token, uint256 amount)
        external
        nonReentrant
        whenNotPaused
        onlySupportedToken(token)
    {
        uint256 principal = balances[msg.sender][token];
        require(principal > 0, "No balance");

        // Withdraw full balance if amount = 0
        if (amount == 0) {
            amount = principal;
        }

        require(amount <= principal, "Insufficient balance");

        // Claim interest first
        uint256 interestEarned = _claimInterest(msg.sender, token);

        // Deduct principal
        balances[msg.sender][token] -= amount;
        totalDeposits[token] -= amount;

        // Transfer principal + interest
        IERC20(token).safeTransfer(msg.sender, amount + interestEarned);

        emit Withdrawn(msg.sender, token, amount, interestEarned);
    }

    function claimInterest(address token)
        external
        nonReentrant
        whenNotPaused
        onlySupportedToken(token)
    {
        uint256 interest = _claimInterest(msg.sender, token);
        require(interest > 0, "No interest");

        // Pay user immediately
        IERC20(token).safeTransfer(msg.sender, interest);

        emit InterestClaimed(msg.sender, token, interest);
    }

    // ---------------------------
    // Internal Interest Logic
    // ---------------------------

    function _claimInterest(address user, address token) internal returns (uint256 interest) {
        uint256 lastClaim = lastClaimTime[user][token];
        uint256 balance = balances[user][token];
        if (balance == 0 || lastClaim == 0) return 0;

        // Calculate interest using InterestCalculator
        uint256 elapsed = block.timestamp - lastClaim;
        interest = InterestCalculator.calculateSimpleInterest(
            balance,
            interestRates[token],
            elapsed
        );

        if (interest > 0) {
            // Mint tokens if mock token supports it
            try IERC20Metadata(token).decimals() returns (uint8) {
                // If the token has a mint() function, call it
                // (works for testnet mock tokens)
                (bool success, ) = token.call(
                    abi.encodeWithSignature("mint(address,uint256)", address(this), interest)
                );
                require(success, "Mint failed");
            } catch {
                // Otherwise, assume we pre-funded the pool for interest
                require(
                    IERC20(token).balanceOf(address(this)) >= interest,
                    "Insufficient reserve"
                );
            }

            // Deduct protocol fee
            uint256 fee = (interest * protocolFee) / BASIS_POINTS;
            if (fee > 0) {
                protocolFeesCollected[token] += fee;
                interest -= fee;
            }

            // Update last claim timestamp
            lastClaimTime[user][token] = block.timestamp;
        }
    }

    // ---------------------------
    // Oracle Helpers
    // ---------------------------

    function getTokenPrice(address token) external view returns (int256 price) {
        require(priceFeeds[token] != address(0), "No price feed");
        price = IPriceFeed(priceFeeds[token]).latestAnswer();
    }

    function getAPY(address token) external view returns (uint256) {
        return interestRates[token];
    }

    function getEarningsPerSecond(address user, address token)
        external
        view
        returns (uint256)
    {
        return InterestCalculator.calculateEarningsPerSecond(
            balances[user][token],
            interestRates[token]
        );
    }
}

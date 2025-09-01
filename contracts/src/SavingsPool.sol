// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;


import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";


contract SavingsPool is ReentrancyGuard, Pausable, AccessControl {
    using SafeERC20 for IERC20;

    // constants and roles
    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");
    bytes32 public constant EMERGENCY_ROLE = keccak256("EMERGENCY_ROLE");
    
    uint256 public constant MAX_INTEREST_RATE = 10000;
    uint256 public constant BASIS_POINTS = 10000;
    uint256 public constant SECONDS_PER_YEAR = 365 days;


    // state variables
    mapping(address => bool) public supportedTokens;
    mapping(address => uint256) public interestRates;
    mapping(address => mapping(address => uint256)) public balances;
    mapping(address => mapping(address => uint256)) public lastClaimTime;
    mapping(address => uint256) public totalDeposits;

    uint256 public protocolFee = 100;
    address public treasury;

    mapping(address => uint256) public protocolFeesCollected;

    //events
    event Deposited(
        address indexed user,
        address indexed token,
        uint256 amount,
        uint256 newBalance,
        uint256 timestamp
    );

    event Withdrawn(
        address indexed user,
        address indexed token,
        uint256 amount,
        uint256 interest,
        uint256 newBalance,
        uint256 timestamp
    );

     event InterestClaimed(
        address indexed user,
        address indexed token,
        uint256 interestAmount,
        uint256 timestamp
    );

    event TokenAdded(address indexed token, uint256 initialInterestRate);
    event InterestRateUpdated(address indexed token, uint256 oldRate, uint256 newRate);
    event ProtocolFeeUpdated(uint256 oldFee, uint256 newFee);

    modifier onlySupportedToken(address token) {
        require(supportedTokens[token], "Token not supported");
        _;
    }

    modifier hasBalance(address token) {
        require(balances[msg.sender][token] > 0, "No balance for this token");
        _;
    }

    modifier validAmount(uint256 amount) {
        require(amount > 0, "Amount must be greater than zero");
        _;
    }



    constructor(address _treasury) {
        require(_treasury != address(0), "Treasury cannot be zero address");
        
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(ADMIN_ROLE, msg.sender);
        _grantRole(EMERGENCY_ROLE, msg.sender);
        
        treasury = _treasury;
    }


    function deposit(address token, uint256 amount) 
        external 
        nonReentrant 
        whenNotPaused 
        onlySupportedToken(token) 
        validAmount(amount) 
    {
        // Claim any existing interest first to prevent gaming
        if (balances[msg.sender][token] > 0) {
            _claimInterest(msg.sender, token);
        }
        
        // Transfer tokens from user to this contract
        IERC20(token).safeTransferFrom(msg.sender, address(this), amount);
        
        // Update user balance and total deposits
        balances[msg.sender][token] += amount;
        totalDeposits[token] += amount;
        
        // Set the timestamp for interest calculation
        lastClaimTime[msg.sender][token] = block.timestamp;
        
        emit Deposited(msg.sender, token, amount, balances[msg.sender][token], block.timestamp);
    }


    function withdraw(address token, uint256 amount) 
        external 
        nonReentrant 
        whenNotPaused 
        onlySupportedToken(token) 
        hasBalance(token) 
    {
        // If amount is 0, withdraw everything
        if (amount == 0) {
            amount = balances[msg.sender][token];
        }
        
        require(balances[msg.sender][token] >= amount, "Insufficient balance");
        
        // Claim interest first
        uint256 interestEarned = _claimInterest(msg.sender, token);
        
        // Update balances before external call (CEI pattern)
        balances[msg.sender][token] -= amount;
        totalDeposits[token] -= amount;
        
        // Calculate and deduct protocol fee from interest
        uint256 protocolFeeAmount = (interestEarned * protocolFee) / BASIS_POINTS;
        uint256 userInterest = interestEarned - protocolFeeAmount;
        
        // Update protocol fees collected
        if (protocolFeeAmount > 0) {
            protocolFeesCollected[token] += protocolFeeAmount;
        }
        
        // Transfer principal + net interest to user
        uint256 totalTransfer = amount + userInterest;
        IERC20(token).safeTransfer(msg.sender, totalTransfer);
        
        emit Withdrawn(
            msg.sender, 
            token, 
            amount, 
            userInterest, 
            balances[msg.sender][token], 
            block.timestamp
        );
    }





     function claimInterest(address token) 
        external 
        nonReentrant 
        whenNotPaused 
        onlySupportedToken(token) 
        hasBalance(token) 
    {
        uint256 interest = _claimInterest(msg.sender, token);
        require(interest > 0, "No interest to claim");
        
        // Calculate protocol fee
        uint256 protocolFeeAmount = (interest * protocolFee) / BASIS_POINTS;
        uint256 userInterest = interest - protocolFeeAmount;
        
        // Update protocol fees
        if (protocolFeeAmount > 0) {
            protocolFeesCollected[token] += protocolFeeAmount;
        }
        
        // Transfer net interest to user
        IERC20(token).safeTransfer(msg.sender, userInterest);
        
        emit InterestClaimed(msg.sender, token, userInterest, block.timestamp);
    }


     function _claimInterest(address user, address token) internal returns (uint256 interest) {
        interest = calculateInterest(user, token);
        
        if (interest > 0) {
            // Add interest to user's balance (compounding effect)
            balances[user][token] += interest;
            totalDeposits[token] += interest;
            
            // Update last claim time
            lastClaimTime[user][token] = block.timestamp;
        }
    }





    function calculateInterest(address user, address token) 
        public 
        view 
        returns (uint256 interest) 
    {
        uint256 userBalance = balances[user][token];
        uint256 lastClaim = lastClaimTime[user][token];
        
        // Return 0 if no balance or no previous deposit
        if (userBalance == 0 || lastClaim == 0) {
            return 0;
        }
        
        // Calculate time elapsed since last claim
        uint256 timeElapsed = block.timestamp - lastClaim;
        
        // Interest = (principal * rate * time) / (BASIS_POINTS * SECONDS_PER_YEAR)
        interest = (userBalance * interestRates[token] * timeElapsed) / 
                  (BASIS_POINTS * SECONDS_PER_YEAR);
    }


    function getTotalBalance(address user, address token) 
        external 
        view 
        returns (uint256 totalBalance) 
    {
        return balances[user][token] + calculateInterest(user, token);
    }


    function getAPY(address token) external view returns (uint256 apy) {
        return interestRates[token];
    }


    function getEarningsPerSecond(address user, address token) 
        external 
        view 
        returns (uint256 earningsPerSecond) 
    {
        uint256 userBalance = balances[user][token];
        if (userBalance == 0) return 0;
        
        // Earnings per second = (principal * rate) / (BASIS_POINTS * SECONDS_PER_YEAR)
        earningsPerSecond = (userBalance * interestRates[token]) / 
                           (BASIS_POINTS * SECONDS_PER_YEAR);
    }


    function addSupportedToken(address token, uint256 initialRate) 
        external 
        onlyRole(ADMIN_ROLE) 
    {
        require(token != address(0), "Token cannot be zero address");
        require(initialRate <= MAX_INTEREST_RATE, "Interest rate too high");
        require(!supportedTokens[token], "Token already supported");
        
        supportedTokens[token] = true;
        interestRates[token] = initialRate;
        
        emit TokenAdded(token, initialRate);
    }


    function updateInterestRate(address token, uint256 newRate) 
        external 
        onlyRole(ADMIN_ROLE) 
        onlySupportedToken(token) 
    {
        require(newRate <= MAX_INTEREST_RATE, "Interest rate too high");
        
        uint256 oldRate = interestRates[token];
        interestRates[token] = newRate;
        
        emit InterestRateUpdated(token, oldRate, newRate);
    }



    function updateProtocolFee(uint256 newFee) external onlyRole(ADMIN_ROLE) {
        require(newFee <= 1000, "Protocol fee cannot exceed 10%"); // Max 10%
        
        uint256 oldFee = protocolFee;
        protocolFee = newFee;
        
        emit ProtocolFeeUpdated(oldFee, newFee);
    }


    function withdrawProtocolFees(address token) 
        external 
        onlyRole(ADMIN_ROLE) 
        onlySupportedToken(token) 
    {
        uint256 fees = protocolFeesCollected[token];
        require(fees > 0, "No fees to withdraw");
        
        protocolFeesCollected[token] = 0;
        IERC20(token).safeTransfer(treasury, fees);
    }


    function pause() external onlyRole(EMERGENCY_ROLE) {
        _pause();
    }


    function unpause() external onlyRole(EMERGENCY_ROLE) {
        _unpause();
    }


    function emergencyRecover(address token, uint256 amount) 
        external 
        onlyRole(DEFAULT_ADMIN_ROLE) 
    {
        require(amount <= IERC20(token).balanceOf(address(this)), "Insufficient contract balance");
        IERC20(token).safeTransfer(treasury, amount);
    }

    
}
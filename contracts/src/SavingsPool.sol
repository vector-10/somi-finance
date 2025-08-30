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

    
    
}
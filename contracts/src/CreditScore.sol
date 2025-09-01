// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

contract CreditScore is AccessControl, ReentrancyGuard {
    bytes32 public constant UPDATER_ROLE = keccak256("UPDATER_ROLE");
    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");

    struct UserScore {
        uint256 totalDeposits;
        uint256 totalWithdrawals;
        uint256 averageDepositTime;
        uint256 consistencyScore;
        uint256 podParticipation;
        uint256 earlyWithdrawalCount;
        uint256 lastUpdateTime;
        uint256 creditScore;
        uint256 depositCount;
        uint256 longestStreak;
        uint256 currentStreak;
    }

    struct DepositRecord {
        uint256 amount;
        uint256 timestamp;
        uint256 withdrawalTime;
        bool isWithdrawn;
        bool isEarlyWithdrawal;
    }

    mapping(address => UserScore) public userScores;
    mapping(address => DepositRecord[]) public depositHistory;
    mapping(address => bool) public isBlacklisted;
    
    uint256 public constant MIN_SCORE = 300;
    uint256 public constant MAX_SCORE = 850;
    uint256 public constant EARLY_WITHDRAWAL_PENALTY = 50;
    uint256 public constant CONSISTENCY_REWARD = 25;
    uint256 public constant POD_BONUS = 10;
    uint256 public constant LONG_TERM_BONUS = 30;
    uint256 public constant STREAK_MULTIPLIER = 5;
    
    uint256 public constant MIN_DEPOSIT_TIME = 7 days;
    uint256 public constant SCORE_UPDATE_INTERVAL = 1 days;

    event ScoreUpdated(address indexed user, uint256 oldScore, uint256 newScore);
    event DepositRecorded(address indexed user, uint256 amount, uint256 timestamp);
    event WithdrawalRecorded(address indexed user, uint256 amount, bool isEarly);
    event UserBlacklisted(address indexed user, string reason);
    event UserWhitelisted(address indexed user);

    constructor() {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(ADMIN_ROLE, msg.sender);
        _grantRole(UPDATER_ROLE, msg.sender);
    }

    function recordDeposit(
        address user,
        uint256 amount,
        bool isPodDeposit
    ) external onlyRole(UPDATER_ROLE) {
        require(!isBlacklisted[user], "User is blacklisted");
        
        UserScore storage score = userScores[user];
        
        score.totalDeposits += amount;
        score.depositCount++;
        score.lastUpdateTime = block.timestamp;
        
        if (isPodDeposit) {
            score.podParticipation++;
        }
        
        depositHistory[user].push(DepositRecord({
            amount: amount,
            timestamp: block.timestamp,
            withdrawalTime: 0,
            isWithdrawn: false,
            isEarlyWithdrawal: false
        }));
        
        _updateConsistencyScore(user);
        _updateCreditScore(user);
        
        emit DepositRecorded(user, amount, block.timestamp);
    }

    function recordWithdrawal(
        address user,
        uint256 amount,
        uint256 depositIndex
    ) external onlyRole(UPDATER_ROLE) {
        require(depositIndex < depositHistory[user].length, "Invalid deposit index");
        
        UserScore storage score = userScores[user];
        DepositRecord storage deposit = depositHistory[user][depositIndex];
        
        require(!deposit.isWithdrawn, "Already withdrawn");
        
        score.totalWithdrawals += amount;
        deposit.withdrawalTime = block.timestamp;
        deposit.isWithdrawn = true;
        
        uint256 holdTime = block.timestamp - deposit.timestamp;
        
        if (holdTime < MIN_DEPOSIT_TIME) {
            deposit.isEarlyWithdrawal = true;
            score.earlyWithdrawalCount++;
        }
        
        _updateAverageDepositTime(user);
        _updateCreditScore(user);
        
        emit WithdrawalRecorded(user, amount, deposit.isEarlyWithdrawal);
    }

    function updateStreakData(
        address user,
        uint256 currentStreak,
        uint256 longestStreak
    ) external onlyRole(UPDATER_ROLE) {
        UserScore storage score = userScores[user];
        score.currentStreak = currentStreak;
        if (longestStreak > score.longestStreak) {
            score.longestStreak = longestStreak;
        }
        _updateCreditScore(user);
    }

    function _updateConsistencyScore(address user) internal {
        UserScore storage score = userScores[user];
        
        if (score.depositCount < 2) {
            score.consistencyScore = 50;
            return;
        }
        
        uint256 totalTimeGaps = 0;
        uint256 gapCount = 0;
        
        for (uint256 i = 1; i < depositHistory[user].length; i++) {
            uint256 gap = depositHistory[user][i].timestamp - depositHistory[user][i-1].timestamp;
            totalTimeGaps += gap;
            gapCount++;
        }
        
        uint256 averageGap = totalTimeGaps / gapCount;
        
        if (averageGap <= 7 days) {
            score.consistencyScore = 100;
        } else if (averageGap <= 30 days) {
            score.consistencyScore = 75;
        } else if (averageGap <= 90 days) {
            score.consistencyScore = 50;
        } else {
            score.consistencyScore = 25;
        }
    }

    function _updateAverageDepositTime(address user) internal {
        UserScore storage score = userScores[user];
        DepositRecord[] storage deposits = depositHistory[user];
        
        uint256 totalTime = 0;
        uint256 withdrawnCount = 0;
        
        for (uint256 i = 0; i < deposits.length; i++) {
            if (deposits[i].isWithdrawn) {
                totalTime += deposits[i].withdrawalTime - deposits[i].timestamp;
                withdrawnCount++;
            }
        }
        
        if (withdrawnCount > 0) {
            score.averageDepositTime = totalTime / withdrawnCount;
        }
    }

    function _updateCreditScore(address user) internal {
        UserScore storage score = userScores[user];
        uint256 oldScore = score.creditScore;
        
        uint256 baseScore = 500;
        
        uint256 depositBonus = _calculateDepositBonus(score.totalDeposits);
        uint256 consistencyBonus = (score.consistencyScore * CONSISTENCY_REWARD) / 100;
        uint256 podBonus = score.podParticipation * POD_BONUS;
        uint256 timeBonus = _calculateTimeBonus(score.averageDepositTime);
        uint256 streakBonus = score.longestStreak * STREAK_MULTIPLIER;
        
        uint256 earlyWithdrawalPenalty = score.earlyWithdrawalCount * EARLY_WITHDRAWAL_PENALTY;
        
        uint256 newScore = baseScore + depositBonus + consistencyBonus + podBonus + timeBonus + streakBonus;
        
        if (newScore > earlyWithdrawalPenalty) {
            newScore -= earlyWithdrawalPenalty;
        } else {
            newScore = MIN_SCORE;
        }
        
        if (newScore < MIN_SCORE) {
            newScore = MIN_SCORE;
        } else if (newScore > MAX_SCORE) {
            newScore = MAX_SCORE;
        }
        
        score.creditScore = newScore;
        
        if (oldScore != newScore) {
            emit ScoreUpdated(user, oldScore, newScore);
        }
    }

    function _calculateDepositBonus(uint256 totalDeposits) internal pure returns (uint256) {
        if (totalDeposits >= 100000e18) return 100;
        if (totalDeposits >= 50000e18) return 80;
        if (totalDeposits >= 10000e18) return 60;
        if (totalDeposits >= 5000e18) return 40;
        if (totalDeposits >= 1000e18) return 20;
        return 0;
    }

    function _calculateTimeBonus(uint256 averageTime) internal pure returns (uint256) {
        if (averageTime >= 365 days) return LONG_TERM_BONUS;
        if (averageTime >= 180 days) return LONG_TERM_BONUS * 3 / 4;
        if (averageTime >= 90 days) return LONG_TERM_BONUS / 2;
        if (averageTime >= 30 days) return LONG_TERM_BONUS / 4;
        return 0;
    }

    function getCreditScore(address user) external view returns (uint256) {
        return userScores[user].creditScore;
    }

    function getUserScore(address user) external view returns (UserScore memory) {
        return userScores[user];
    }

    function getDepositHistory(address user) external view returns (DepositRecord[] memory) {
        return depositHistory[user];
    }

    function getCreditTier(address user) external view returns (string memory) {
        uint256 score = userScores[user].creditScore;
        
        if (score >= 750) return "Excellent";
        if (score >= 700) return "Good";
        if (score >= 650) return "Fair";
        if (score >= 600) return "Poor";
        return "Very Poor";
    }

    function getLoanEligibility(address user) external view returns (bool eligible, uint256 maxLoanAmount) {
        uint256 score = userScores[user].creditScore;
        
        if (isBlacklisted[user] || score < 600) {
            return (false, 0);
        }
        
        uint256 totalDeposits = userScores[user].totalDeposits;
        
        if (score >= 750) {
            maxLoanAmount = totalDeposits * 80 / 100;
        } else if (score >= 700) {
            maxLoanAmount = totalDeposits * 60 / 100;
        } else if (score >= 650) {
            maxLoanAmount = totalDeposits * 40 / 100;
        } else {
            maxLoanAmount = totalDeposits * 20 / 100;
        }
        
        return (true, maxLoanAmount);
    }

    function blacklistUser(address user, string calldata reason) external onlyRole(ADMIN_ROLE) {
        isBlacklisted[user] = true;
        emit UserBlacklisted(user, reason);
    }

    function whitelistUser(address user) external onlyRole(ADMIN_ROLE) {
        isBlacklisted[user] = false;
        emit UserWhitelisted(user);
    }

    function batchUpdateScores(address[] calldata users) external onlyRole(ADMIN_ROLE) {
        for (uint256 i = 0; i < users.length; i++) {
            _updateCreditScore(users[i]);
        }
    }

    function emergencyResetScore(address user, uint256 newScore) external onlyRole(DEFAULT_ADMIN_ROLE) {
        require(newScore >= MIN_SCORE && newScore <= MAX_SCORE, "Invalid score");
        uint256 oldScore = userScores[user].creditScore;
        userScores[user].creditScore = newScore;
        emit ScoreUpdated(user, oldScore, newScore);
    }
}
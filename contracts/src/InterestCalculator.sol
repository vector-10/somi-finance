// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

library InterestCalculator {
    uint256 public constant BASIS_POINTS = 10000;
    uint256 public constant SECONDS_PER_YEAR = 365 days;
    uint256 public constant PRECISION = 1e18;

    struct InterestData {
        uint256 principal;
        uint256 rate;
        uint256 timeElapsed;
        uint256 compoundFrequency;
        bool isCompounding;
    }

    function calculateSimpleInterest(
        uint256 principal,
        uint256 rateInBasisPoints,
        uint256 timeInSeconds
    ) internal pure returns (uint256) {
        if (principal == 0 || rateInBasisPoints == 0 || timeInSeconds == 0) {
            return 0;
        }

        return (principal * rateInBasisPoints * timeInSeconds) / (BASIS_POINTS * SECONDS_PER_YEAR);
    }

    function calculateCompoundInterest(
        uint256 principal,
        uint256 rateInBasisPoints,
        uint256 timeInSeconds,
        uint256 compoundFrequency
    ) internal pure returns (uint256) {
        if (principal == 0 || rateInBasisPoints == 0 || timeInSeconds == 0) {
            return 0;
        }

        uint256 periodsPerYear = SECONDS_PER_YEAR / compoundFrequency;
        uint256 totalPeriods = timeInSeconds / compoundFrequency;
        
        if (totalPeriods == 0) {
            return calculateSimpleInterest(principal, rateInBasisPoints, timeInSeconds);
        }

        uint256 ratePerPeriod = rateInBasisPoints / periodsPerYear;
        uint256 amount = principal;

        for (uint256 i = 0; i < totalPeriods; i++) {
            amount = amount + (amount * ratePerPeriod) / BASIS_POINTS;
        }

        return amount - principal;
    }

    function calculateAPY(uint256 nominalRate, uint256 compoundFrequency) internal pure returns (uint256) {
        if (nominalRate == 0) return 0;
        
        uint256 periodsPerYear = SECONDS_PER_YEAR / compoundFrequency;
        uint256 ratePerPeriod = nominalRate / periodsPerYear;
        
        uint256 apy = BASIS_POINTS;
        uint256 factor = BASIS_POINTS + ratePerPeriod;
        
        for (uint256 i = 0; i < periodsPerYear; i++) {
            apy = (apy * factor) / BASIS_POINTS;
        }
        
        return apy - BASIS_POINTS;
    }

    function calculateEarningsPerSecond(
        uint256 principal,
        uint256 rateInBasisPoints
    ) internal pure returns (uint256) {
        if (principal == 0 || rateInBasisPoints == 0) return 0;
        
        return (principal * rateInBasisPoints) / (BASIS_POINTS * SECONDS_PER_YEAR);
    }

    function calculateTimeToTarget(
        uint256 principal,
        uint256 targetAmount,
        uint256 rateInBasisPoints
    ) internal pure returns (uint256) {
        if (principal >= targetAmount || rateInBasisPoints == 0) return 0;
        
        uint256 interestNeeded = targetAmount - principal;
        uint256 annualInterest = (principal * rateInBasisPoints) / BASIS_POINTS;
        
        return (interestNeeded * SECONDS_PER_YEAR) / annualInterest;
    }

    function calculateEffectiveRate(
        uint256 baseRate,
        uint256 boost,
        uint256 maxBoost
    ) internal pure returns (uint256) {
        uint256 cappedBoost = boost > maxBoost ? maxBoost : boost;
        return baseRate + cappedBoost;
    }

    function calculatePodBonus(
        uint256 memberCount,
        uint256 totalDeposits,
        uint256 baseBonus
    ) internal pure returns (uint256) {
        uint256 memberBonus = memberCount * 25;
        if (memberBonus > 250) memberBonus = 250;
        
        uint256 depositBonus = (totalDeposits / 1000e6) * 1;
        if (depositBonus > 250) depositBonus = 250;
        
        return baseBonus + memberBonus + depositBonus;
    }

    function calculateWithdrawalPenalty(
        uint256 amount,
        uint256 penaltyRate,
        uint256 timeHeld,
        uint256 minimumHoldTime
    ) internal pure returns (uint256) {
        if (timeHeld >= minimumHoldTime || penaltyRate == 0) return 0;
        
        uint256 timeRatio = (minimumHoldTime - timeHeld) * BASIS_POINTS / minimumHoldTime;
        return (amount * penaltyRate * timeRatio) / (BASIS_POINTS * BASIS_POINTS);
    }

    function calculateProtocolFee(
        uint256 amount,
        uint256 feeRate
    ) internal pure returns (uint256) {
        return (amount * feeRate) / BASIS_POINTS;
    }

    function calculateDailyYield(
        uint256 principal,
        uint256 annualRate
    ) internal pure returns (uint256) {
        return (principal * annualRate) / (BASIS_POINTS * 365);
    }

    function calculateMonthlyYield(
        uint256 principal,
        uint256 annualRate
    ) internal pure returns (uint256) {
        return (principal * annualRate) / (BASIS_POINTS * 12);
    }

    function interpolateRate(
        uint256 amount,
        uint256 minAmount,
        uint256 maxAmount,
        uint256 minRate,
        uint256 maxRate
    ) internal pure returns (uint256) {
        if (amount <= minAmount) return minRate;
        if (amount >= maxAmount) return maxRate;
        
        uint256 ratio = ((amount - minAmount) * BASIS_POINTS) / (maxAmount - minAmount);
        return minRate + ((maxRate - minRate) * ratio) / BASIS_POINTS;
    }
}
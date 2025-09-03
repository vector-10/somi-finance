// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Test.sol";
import "../src/InterestCalculator.sol";

contract InterestCalculatorWrapper {
    function calculateSimpleInterest(
        uint256 principal,
        uint256 rateInBasisPoints,
        uint256 timeInSeconds
    ) external pure returns (uint256) {
        return InterestCalculator.calculateSimpleInterest(principal, rateInBasisPoints, timeInSeconds);
    }

    function calculateCompoundInterest(
        uint256 principal,
        uint256 rateInBasisPoints,
        uint256 timeInSeconds,
        uint256 compoundFrequency
    ) external pure returns (uint256) {
        return InterestCalculator.calculateCompoundInterest(principal, rateInBasisPoints, timeInSeconds, compoundFrequency);
    }

    function calculateAPY(uint256 nominalRate, uint256 compoundFrequency) external pure returns (uint256) {
        return InterestCalculator.calculateAPY(nominalRate, compoundFrequency);
    }

    function calculateEarningsPerSecond(
        uint256 principal,
        uint256 rateInBasisPoints
    ) external pure returns (uint256) {
        return InterestCalculator.calculateEarningsPerSecond(principal, rateInBasisPoints);
    }

    function calculateTimeToTarget(
        uint256 principal,
        uint256 targetAmount,
        uint256 rateInBasisPoints
    ) external pure returns (uint256) {
        return InterestCalculator.calculateTimeToTarget(principal, targetAmount, rateInBasisPoints);
    }

    function calculateEffectiveRate(
        uint256 baseRate,
        uint256 boost,
        uint256 maxBoost
    ) external pure returns (uint256) {
        return InterestCalculator.calculateEffectiveRate(baseRate, boost, maxBoost);
    }

    function calculatePodBonus(
        uint256 memberCount,
        uint256 totalDeposits,
        uint256 baseBonus
    ) external pure returns (uint256) {
        return InterestCalculator.calculatePodBonus(memberCount, totalDeposits, baseBonus);
    }

    function calculateWithdrawalPenalty(
        uint256 amount,
        uint256 penaltyRate,
        uint256 timeHeld,
        uint256 minimumHoldTime
    ) external pure returns (uint256) {
        return InterestCalculator.calculateWithdrawalPenalty(amount, penaltyRate, timeHeld, minimumHoldTime);
    }

    function calculateProtocolFee(
        uint256 amount,
        uint256 feeRate
    ) external pure returns (uint256) {
        return InterestCalculator.calculateProtocolFee(amount, feeRate);
    }

    function interpolateRate(
        uint256 amount,
        uint256 minAmount,
        uint256 maxAmount,
        uint256 minRate,
        uint256 maxRate
    ) external pure returns (uint256) {
        return InterestCalculator.interpolateRate(amount, minAmount, maxAmount, minRate, maxRate);
    }
}

contract InterestCalculatorTest is Test {
    InterestCalculatorWrapper public calculator;

    // Test constants
    uint256 constant BPS = 10000;
    uint256 constant YEAR = 365 days;
    uint256 constant PRINCIPAL = 1000e18;
    uint256 constant RATE_5_PERCENT = 500;
    uint256 constant RATE_10_PERCENT = 1000;
    uint256 constant RATE_12_PERCENT = 1200;

    function setUp() public {
        calculator = new InterestCalculatorWrapper();
    }

    // --------------------------------------------------
    // 1. Simple Interest Tests
    // --------------------------------------------------
    function testSimpleInterestZeroCases() public { 
        assertEq(calculator.calculateSimpleInterest(0, RATE_5_PERCENT, 30 days), 0);
        assertEq(calculator.calculateSimpleInterest(PRINCIPAL, 0, 30 days), 0);
        assertEq(calculator.calculateSimpleInterest(PRINCIPAL, RATE_5_PERCENT, 0), 0);
    }

    function testSimpleInterestOneYear() public {
        // 1,000 * 5% for one year = 50
        uint256 interest = calculator.calculateSimpleInterest(PRINCIPAL, RATE_5_PERCENT, YEAR);
        assertEq(interest, 50e18, "One year simple interest calculation failed");
    }

    function test_SimpleInterest_PartialTime() public {
        uint256 interest = InterestCalculator.calculateSimpleInterest(
            1000e18,
            1200,
            90 days
        );
        uint256 expected = 29589041095890410958;
        assertApproxEqAbs(interest, expected, 1e12);
    }



    // --------------------------------------------------
    // 2. Compound Interest Tests
    // --------------------------------------------------
    function testCompoundInterestFallbackToSimple() public {
        // When periods < 1, should fallback to simple interest
        uint256 compound = calculator.calculateCompoundInterest(PRINCIPAL, RATE_12_PERCENT, 1 days, 7 days);
        uint256 simple = calculator.calculateSimpleInterest(PRINCIPAL, RATE_12_PERCENT, 1 days);
        assertEq(compound, simple, "Compound should fallback to simple for partial periods");
    }

    function testCompoundInterestMonthly() public {
        // Monthly compounding for 10% over one year
        uint256 interest = calculator.calculateCompoundInterest(PRINCIPAL, RATE_10_PERCENT, YEAR, 30 days);
        uint256 expected = 1047e17; // Approximately 104.7
        assertApproxEqAbs(interest, expected, 5e18);
    }

    // --------------------------------------------------
    // 3. APY Calculation Tests
    // --------------------------------------------------
    function testAPYCalculationMonthly() public {
        // 10% nominal rate with monthly compounding should give ~10.47% APY
        uint256 apy = calculator.calculateAPY(RATE_10_PERCENT, 30 days);
        assertApproxEqAbs(apy, 1047, 10);
    }

    function testAPYCalculationZeroRate() public {
        assertEq(calculator.calculateAPY(0, 30 days), 0);
    }

    // --------------------------------------------------
    // 4. Earnings Per Second Tests
    // --------------------------------------------------
    function testEarningsPerSecondBasic() public {
        uint256 eps = calculator.calculateEarningsPerSecond(PRINCIPAL, RATE_5_PERCENT);
        uint256 expected = (PRINCIPAL * RATE_5_PERCENT) / (BPS * YEAR);
        assertEq(eps, expected);
    }

    function testEarningsPerSecondZeroCases() public {
        assertEq(calculator.calculateEarningsPerSecond(0, RATE_5_PERCENT), 0);
        assertEq(calculator.calculateEarningsPerSecond(PRINCIPAL, 0), 0);
    }

    // --------------------------------------------------
    // 5. Time to Target Tests
    // --------------------------------------------------
    function testTimeToTargetBasic() public {
        // 1000 to 1100 at 10% should take ~1 year
        uint256 timeNeeded = calculator.calculateTimeToTarget(PRINCIPAL, 1100e18, RATE_10_PERCENT);
        assertApproxEqAbs(timeNeeded, YEAR, 1 days);
    }

    function testTimeToTargetAlreadyReached() public {
        uint256 timeNeeded = calculator.calculateTimeToTarget(1200e18, 1100e18, RATE_10_PERCENT);
        assertEq(timeNeeded, 0);
    }

    // --------------------------------------------------
    // 6. Effective Rate Tests
    // --------------------------------------------------
    function testEffectiveRateWithCap() public {
        // 5% base + 2% boost (capped at 1.5%) = 6.5%
        uint256 effectiveRate = calculator.calculateEffectiveRate(RATE_5_PERCENT, 200, 150);
        assertEq(effectiveRate, 650);
    }

    function testEffectiveRateNoCap() public {
        // 5% base + 1% boost (under 2% cap) = 6%
        uint256 effectiveRate = calculator.calculateEffectiveRate(RATE_5_PERCENT, 100, 200);
        assertEq(effectiveRate, 600);
    }

    // --------------------------------------------------
    // 7. Pod Bonus Tests
    // --------------------------------------------------
    function testPodBonusCapped() public {
        // Large values should be capped at 250 each
        uint256 memberCount = 20; // Should cap at 250
        uint256 totalDeposits = 600_000e6; // Should cap at 250
        uint256 baseBonus = 100;
        
        uint256 bonus = calculator.calculatePodBonus(memberCount, totalDeposits, baseBonus);
        assertEq(bonus, 600); // 100 + 250 + 250
    }

    function testPodBonusUncapped() public {
        uint256 memberCount = 5; // 5 * 25 = 125
        uint256 totalDeposits = 100_000e6; // 100 * 1 = 100
        uint256 baseBonus = 50;
        
        uint256 bonus = calculator.calculatePodBonus(memberCount, totalDeposits, baseBonus);
        assertEq(bonus, 275); // 50 + 125 + 100
    }

    // --------------------------------------------------
    // 8. Withdrawal Penalty Tests
    // --------------------------------------------------
    function testWithdrawalPenaltyFullPenalty() public {
        // Immediate withdrawal (0 time held) should incur full penalty
        uint256 penalty = calculator.calculateWithdrawalPenalty(1000e6, 200, 0, 30 days);
        assertEq(penalty, 20e6); // 2% of 1000
    }

    function testWithdrawalPenaltyNoPenalty() public {
        // After minimum hold time, no penalty
        uint256 penalty = calculator.calculateWithdrawalPenalty(1000e6, 200, 30 days, 30 days);
        assertEq(penalty, 0);
    }

    function testWithdrawalPenaltyPartialPenalty() public {
        // Half the minimum hold time should give ~half penalty
        uint256 penalty = calculator.calculateWithdrawalPenalty(1000e6, 200, 15 days, 30 days);
        assertEq(penalty, 10e6); // ~1% of 1000
    }

    // --------------------------------------------------
    // 9. Protocol Fee Tests
    // --------------------------------------------------
    function testProtocolFeeCalculation() public {
        uint256 fee = calculator.calculateProtocolFee(1000e6, 100); // 1%
        assertEq(fee, 10e6);
    }

    function testProtocolFeeZero() public {
        uint256 fee = calculator.calculateProtocolFee(1000e6, 0);
        assertEq(fee, 0);
    }

    // --------------------------------------------------
    // 10. Interpolate Rate Tests
    // --------------------------------------------------
    function testInterpolateRateMiddle() public {
        // 1500 between [1000, 2000] with rates [5%, 10%] should give 7.5%
        uint256 rate = calculator.interpolateRate(1500e6, 1000e6, 2000e6, RATE_5_PERCENT, RATE_10_PERCENT);
        assertApproxEqAbs(rate, 750, 1);
    }

    function testInterpolateRateBounds() public {
        // Below minimum should return minimum rate
        assertEq(calculator.interpolateRate(500e6, 1000e6, 2000e6, RATE_5_PERCENT, RATE_10_PERCENT), RATE_5_PERCENT);
        
        // Above maximum should return maximum rate
        assertEq(calculator.interpolateRate(3000e6, 1000e6, 2000e6, RATE_5_PERCENT, RATE_10_PERCENT), RATE_10_PERCENT);
    }
}
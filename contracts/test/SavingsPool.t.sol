// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Test.sol";
import "../src/SavingsPool.sol";
import "../src/MockERC20.sol";
import "../src/InterestCalculator.sol";

    contract SavingsPoolTest is Test {
        SavingsPool public savingsPool;
        MockERC20 public mockUSDC;
        address public priceFeed = address(0x123); 

        address public admin = address(1);
        address public user = address(2);
        address public treasury = address(3);

        uint256 public initialMint = 1_000_000e6; 
        uint256 public userDeposit = 1_000e6;
        uint256 public apr = 500; 

        function setUp() public {
        vm.deal(admin, 100 ether);
        vm.deal(user, 100 ether);

        vm.startPrank(admin);
        
        // 1. Deploy contracts FIRST
        mockUSDC = new MockERC20("Mock USDC", "mUSDC", 6, initialMint);
        savingsPool = new SavingsPool(treasury);
        savingsPool.addSupportedToken(address(mockUSDC), apr, priceFeed);
        
        // 2. THEN fund yield reserve
        uint256 yieldAmount = 100_000e6;
        mockUSDC.mint(admin, yieldAmount);
        mockUSDC.approve(address(savingsPool), yieldAmount);
        savingsPool.fundYieldReserve(address(mockUSDC), yieldAmount);

        // 3. Transfer to user
        mockUSDC.transfer(user, userDeposit);
        vm.stopPrank();
    }

    // --------------------------------------------------
    // 1. Deposit Tests
    // --------------------------------------------------
    function testDepositUpdatesBalances() public {
        vm.startPrank(user);

        mockUSDC.approve(address(savingsPool), userDeposit);

        savingsPool.deposit(address(mockUSDC), userDeposit);

        uint256 balance = savingsPool.balances(user, address(mockUSDC));
        uint256 totalDeposits = savingsPool.totalDeposits(address(mockUSDC));

        assertEq(balance, userDeposit, "User balance mismatch");
        assertEq(totalDeposits, userDeposit, "Total deposits mismatch");

        vm.stopPrank();
    }

    // --------------------------------------------------
    // 2. Interest Accrual Tests
    // --------------------------------------------------
    function testAccruedInterestAfterTimePasses() public {
    vm.startPrank(user);

    mockUSDC.approve(address(savingsPool), userDeposit);
    savingsPool.deposit(address(mockUSDC), userDeposit);

    uint256 beforeBalance = mockUSDC.balanceOf(user);

    vm.warp(block.timestamp + 365 days);

    savingsPool.claimInterest(address(mockUSDC));

    uint256 afterBalance = mockUSDC.balanceOf(user);

    assertGt(afterBalance, beforeBalance, "Interest should increase user balance");

    // Optional: Validate expected interest ≈ 5% of deposit minus protocol fee
    uint256 grossInterest = (userDeposit * apr * 365 days) / (10000 * 365 days);
    uint256 fee = (grossInterest * savingsPool.protocolFee()) / 10000;
    uint256 expectedNet = grossInterest - fee;
    assertApproxEqAbs(afterBalance - beforeBalance, expectedNet, 1e3);

    vm.stopPrank();
}


    // --------------------------------------------------
    // 3. Withdraw Tests
    // --------------------------------------------------
    function testWithdrawPrincipalAndInterest() public {
        vm.startPrank(user);

        mockUSDC.approve(address(savingsPool), userDeposit);
        savingsPool.deposit(address(mockUSDC), userDeposit);

        // Warp forward 180 days
        vm.warp(block.timestamp + 180 days);

        // Withdraw full balance
        savingsPool.withdraw(address(mockUSDC), 0);

        uint256 finalUserBalance = mockUSDC.balanceOf(user);
        assertGt(finalUserBalance, userDeposit, "Withdraw didn't return interest");

        uint256 poolBalance = mockUSDC.balanceOf(address(savingsPool));
        assertLt(poolBalance, initialMint, "Pool didn't deduct withdrawal");

        vm.stopPrank();
    }

    // --------------------------------------------------
    // 4. Protocol Fee Tests
    // --------------------------------------------------
    function testProtocolFeeIsCollected() public {
        vm.startPrank(user);

        mockUSDC.approve(address(savingsPool), userDeposit);
        savingsPool.deposit(address(mockUSDC), userDeposit);

        // Move time forward
        vm.warp(block.timestamp + 90 days);

        // Claim interest
        savingsPool.claimInterest(address(mockUSDC));

        // Check that some fees were collected
        uint256 fees = savingsPool.protocolFeesCollected(address(mockUSDC));
        assertGt(fees, 0, "Protocol fees not collected");

        vm.stopPrank();
    }

    // --------------------------------------------------
    // 5. Emergency Pause Tests
    // --------------------------------------------------
    function testPauseAndUnpause() public {
        vm.startPrank(admin);

        savingsPool.pause();
        vm.expectRevert();
        savingsPool.deposit(address(mockUSDC), userDeposit);

        savingsPool.unpause();
        mockUSDC.mint(user, userDeposit);
        mockUSDC.approve(address(savingsPool), userDeposit);
        savingsPool.deposit(address(mockUSDC), userDeposit);

        vm.stopPrank();
    }
}

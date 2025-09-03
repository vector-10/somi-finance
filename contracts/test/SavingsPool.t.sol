// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Test.sol";
import "../src/SavingsPool.sol";
import "../src/MockERC20.sol";
import "../src/InterestCalculator.sol";

contract SavingsPoolTest is Test {
    SavingsPool public savingsPool;
    MockERC20 public mockUSDC;
    address public priceFeed = address(0); 

    address public admin = address(1);
    address public user = address(2);
    address public treasury = address(3);

    uint256 public initialMint = 1_000_000e6; 
    uint256 public userDeposit = 1_000e6;
    uint256 public apr = 500; 

    function setUp() public {
        vm.deal(admin, 100 ether);
        vm.deal(user, 100 ether);

        // Deploy Mock USDC (6 decimals)
        mockUSDC = new MockERC20("Mock USDC", "mUSDC", 6, initialMint);

        // Deploy SavingsPool
        vm.startPrank(admin);
        savingsPool = new SavingsPool(treasury);

        // Add mockUSDC as supported token
        savingsPool.addSupportedToken(address(mockUSDC), apr, priceFeed);

        // Transfer some mock USDC to user
        mockUSDC.mint(user, userDeposit);
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

        // Simulate 1 year passing
        vm.warp(block.timestamp + 365 days);

        // Call claimInterest
        savingsPool.claimInterest(address(mockUSDC));

        // Check balance after interest claim
        uint256 newBalance = mockUSDC.balanceOf(user);
        assertGt(newBalance, userDeposit, "Interest not accrued");

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

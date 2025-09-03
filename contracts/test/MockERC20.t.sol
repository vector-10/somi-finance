// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Test.sol";
import "../src/MockERC20.sol";

contract MockERC20Test is Test {
    MockERC20 token;
    address owner = address(this);
    address alice = address(0xA11CE);
    address bob   = address(0xB0B);

    function setUp() public {
        token = new MockERC20("Mock USDC", "mUSDC", 6, 1_000_000e6);
        token.transfer(alice, 10_000e6);
    }

    function test_NameSymbolDecimals() public {
        assertEq(token.name(), "Mock USDC");
        assertEq(token.symbol(), "mUSDC");
        assertEq(token.decimals(), 6);
    }

    function test_InitialSupplyAndTransfer() public {
        assertEq(token.totalSupply(), 1_000_000e6);
        assertEq(token.balanceOf(alice), 10_000e6);

        vm.prank(alice);
        token.transfer(bob, 1_234e6);

        assertEq(token.balanceOf(bob), 1_234e6);
        assertEq(token.balanceOf(alice), 8_766e6);
    }

    function test_MintOnlyOwner() public {
        token.mint(bob, 500e6);
        assertEq(token.balanceOf(bob), 500e6);
        assertEq(token.totalSupply(), 1_000_500e6);
    }


    function test_ApproveAndTransferFrom() public {
        vm.prank(alice);
        token.approve(bob, 2_000e6);

        vm.prank(bob);
        token.transferFrom(alice, bob, 1_999e6);

        assertEq(token.allowance(alice, bob), 1e6);
        assertEq(token.balanceOf(bob), 1_999e6);
        assertEq(token.balanceOf(alice), 8_001e6);
    }
}

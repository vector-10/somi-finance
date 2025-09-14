// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Ownable} from "openzeppelin-contracts/access/Ownable.sol";

/// @title MockTreasury (native STT)
/// @notice Holds native STT to pay yields/bonuses; principal stays in Pool/Vault
contract MockTreasury is Ownable {
    error NotAuthorized();

    mapping(address => bool) public isPayer;

    event Funded(address indexed from, uint256 amount);
    event PayerSet(address indexed payer, bool allowed);
    event PaidOut(address indexed to, uint256 amount);

    receive() external payable { emit Funded(msg.sender, msg.value); }

    function setPayer(address payer, bool allowed) external onlyOwner {
        isPayer[payer] = allowed;
        emit PayerSet(payer, allowed);
    }

    /// @notice Pays native coin to `to` (callers: SavingsPool/PodsVault)
    function payOut(address to, uint256 amount) external {
        if (!isPayer[msg.sender]) revert NotAuthorized();
        (bool ok, ) = to.call{value: amount}("");
        require(ok, "TREASURY_PAY_FAIL");
        emit PaidOut(to, amount);
    }
}

// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {ERC1155} from "openzeppelin-contracts/token/ERC1155/ERC1155.sol";
import {Ownable} from "openzeppelin-contracts/access/Ownable.sol";


contract SavingsReceipt1155 is ERC1155, Ownable {
    enum Tier { Bronze, Silver, Gold }

    mapping(uint256 => Tier) public tierOf;

    mapping(address => bool) public isMinter;

    event MinterSet(address indexed minter, bool allowed);
    event TierSet(uint256 indexed id, Tier tier);

    constructor() ERC1155("") {}

    function setMinter(address minter, bool allowed) external onlyOwner {
        isMinter[minter] = allowed;
        emit MinterSet(minter, allowed);
    }

    function mint(address to, uint256 id, Tier tier) external {
        require(isMinter[msg.sender], "NOT_MINTER");
        _mint(to, id, 1, "");
        tierOf[id] = tier;
        emit TierSet(id, tier);
    }

    function upgradeTier(uint256 id, Tier newTier) external {
        require(isMinter[msg.sender], "NOT_MINTER");
        require(uint256(newTier) >= uint256(tierOf[id]), "TIER_DOWNGRADE");
        tierOf[id] = newTier;
        emit TierSet(id, newTier);
    }

    function safeTransferFrom(
        address, address, uint256, uint256, bytes memory
    ) public virtual override {
        revert("NON_TRANSFERABLE");
    }

    function safeBatchTransferFrom(
        address, address, uint256[] memory, uint256[] memory, bytes memory
    ) public virtual override {
        revert("NON_TRANSFERABLE");
    }

    function setApprovalForAll(address, bool) public virtual override {
        revert("NON_TRANSFERABLE");
    }
}

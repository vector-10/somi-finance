// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title MockERC20
 * @dev Simple ERC20 token for Somnia testnet with unlimited minting.
 * Used to simulate deposits and interest payouts.
 */
contract MockERC20 is ERC20, Ownable {
    uint8 private _decimals;

    /**
     * @notice Constructor
     * @param name Token name (e.g. "Mock USDC")
     * @param symbol Token symbol (e.g. "mUSDC")
     * @param decimals_ Number of decimals (e.g. 6 for USDC, 18 for ETH)
     * @param initialSupply Initial supply minted to deployer
     */
    constructor(
        string memory name,
        string memory symbol,
        uint8 decimals_,
        uint256 initialSupply
    ) ERC20(name, symbol) Ownable(msg.sender) {
        _decimals = decimals_;
        _mint(msg.sender, initialSupply);
    }

    /**
     * @notice Override decimals for USDC-like tokens
     */
    function decimals() public view virtual override returns (uint8) {
        return _decimals;
    }

    /**
     * @notice Mint tokens (admin only)
     * @dev Somnia testnet → unlimited minting for hackathon demos
     * @param to Receiver address
     * @param amount Amount to mint
     */
    function mint(address to, uint256 amount) external onlyOwner {
        _mint(to, amount);
    }
}

// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/// @title InterestCalculator
/// @notice Shared APR math
library InterestCalculator {
    uint256 internal constant BPS  = 10_000;
    uint256 internal constant YEAR = 365 days;

    /// @notice Simple (non-compounding) interest
    function simple(uint256 principal, uint256 aprBps, uint256 elapsed)
        internal pure returns (uint256)
    {
        return (principal * aprBps * elapsed) / (BPS * YEAR);
    }
}

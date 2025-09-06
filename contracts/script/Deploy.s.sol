// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Script.sol";
import "../src/SavingsPool.sol";
import "../src/MockERC20.sol";

contract MockPriceFeed {
    function latestRoundData() external view returns (
        uint80 roundId,
        int256 answer,
        uint256 startedAt,
        uint256 updatedAt,
        uint80 answeredInRound
    ) {
        return (1, 100000000, block.timestamp, block.timestamp, 1);
    }
}

contract DeployScript is Script {
    address public treasury;
    
    SavingsPool public savingsPool;
    MockERC20 public mockUSDC;
    MockPriceFeed public priceFeed;

    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        treasury = 0x05FC2caB02916ad7c7B243550D90186bE7BcB4eA;
        
        vm.startBroadcast(deployerPrivateKey);
        
        deployMockTokens();
        deployPriceFeed();
        deploySavingsPool();
        setupTokenSupport();
        
        vm.stopBroadcast();
        
        logDeployedAddresses();
    }

    function deployMockTokens() internal {
        console.log("Deploying MockUSDC...");
        mockUSDC = new MockERC20("Mock USDC", "mUSDC", 6, 1_000_000e6);
        console.log("MockUSDC deployed at:", address(mockUSDC));
    }

    function deployPriceFeed() internal {
        console.log("Deploying MockPriceFeed...");
        priceFeed = new MockPriceFeed();
        console.log("MockPriceFeed deployed at:", address(priceFeed));
    }

    function deploySavingsPool() internal {
        console.log("Deploying SavingsPool...");
        savingsPool = new SavingsPool(treasury);
        console.log("SavingsPool deployed at:", address(savingsPool));
    }

    function setupTokenSupport() internal {
        console.log("Adding token support...");
        savingsPool.addSupportedToken(address(mockUSDC), 500, address(priceFeed));
    }

    function logDeployedAddresses() internal view {
        console.log("\n=== DEPLOYMENT COMPLETE ===");
        console.log("SavingsPool:", address(savingsPool));
        console.log("MockUSDC:", address(mockUSDC));
        console.log("MockPriceFeed:", address(priceFeed));
        console.log("Treasury:", treasury);
    }
}
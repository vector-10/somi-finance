// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Script.sol";
import "../src/SavingsPool.sol";
import "../src/SavingsPod.sol";
import "../src/CertificateNFT.sol";
import "../src/InterestCalculator.sol";
import "../src/PriceFeedManager.sol";
import "../src/RandomnessProvider.sol";
import "../src/CreditScore.sol";

contract DeployScript is Script {
    address public constant TREASURY = 0x1234567890123456789012345678901234567890;
    
    address public constant USDC_SOMNIA = 0x2345678901234567890123456789012345678901;
    address public constant WETH_SOMNIA = 0x3456789012345678901234567890123456789012;
    address public constant SOM_SOMNIA = 0x4567890123456789012345678901234567890123;
    
    address public constant VRF_COORDINATOR = 0x5678901234567890123456789012345678901234;
    bytes32 public constant KEY_HASH = 0x79d3d8832d904592c0bf9818b621522c988bb8b0c05cdc3b15aea1b6e8db0c15;
    uint64 public constant SUBSCRIPTION_ID = 1;
    
    address public constant USDC_PRICE_FEED = 0x6789012345678901234567890123456789012345;
    address public constant WETH_PRICE_FEED = 0x7890123456789012345678901234567890123456;
    address public constant SOM_PRICE_FEED = 0x8901234567890123456789012345678901234567;


    SavingsPool public savingsPool;
    SavingsPod public savingsPod;
    CertificateNFT public certificateNFT;
    PriceFeedManager public priceFeedManager;
    RandomnessProvider public randomnessProvider;
    CreditScore public creditScore;

    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address deployer = vm.addr(deployerPrivateKey);
        
        vm.startBroadcast(deployerPrivateKey);
        
        deployAccessManager();
        deployPriceFeedManager();
        deployRandomnessProvider();
        deployCreditScore();
        deploySavingsPool();
        deploySavingsPod();
        deployCertificateNFT();
        
        setupRoles();
        setupPriceFeeds();
        setupTokenSupport();
        
        vm.stopBroadcast();
        
        logDeployedAddresses();
        saveDeploymentInfo();
    }

    function deployAccessManager() internal {
        console.log("Deploying AccessManager...");
        accessManager = new AccessManager(TREASURY);
        console.log("AccessManager deployed at:", address(accessManager));
    }

    function deployPriceFeedManager() internal {
        console.log("Deploying PriceFeedManager...");
        priceFeedManager = new PriceFeedManager();
        console.log("PriceFeedManager deployed at:", address(priceFeedManager));
    }

    function deployRandomnessProvider() internal {
        console.log("Deploying RandomnessProvider...");
        randomnessProvider = new RandomnessProvider(
            VRF_COORDINATOR,
            KEY_HASH,
            SUBSCRIPTION_ID
        );
        console.log("RandomnessProvider deployed at:", address(randomnessProvider));
    }

    function deployCreditScore() internal {
        console.log("Deploying CreditScore...");
        creditScore = new CreditScore();
        console.log("CreditScore deployed at:", address(creditScore));
    }

    function deploySavingsPool() internal {
        console.log("Deploying SavingsPool...");
        savingsPool = new SavingsPool(TREASURY);
        console.log("SavingsPool deployed at:", address(savingsPool));
    }

    function deploySavingsPod() internal {
        console.log("Deploying SavingsPod...");
        savingsPod = new SavingsPod(address(savingsPool));
        console.log("SavingsPod deployed at:", address(savingsPod));
    }

    function deployCertificateNFT() internal {
        console.log("Deploying CertificateNFT...");
        certificateNFT = new CertificateNFT();
        console.log("CertificateNFT deployed at:", address(certificateNFT));
    }

    function setupRoles() internal {
        console.log("Setting up roles...");
        
        accessManager.grantRoleWithDescription(
            accessManager.MINTER_ROLE(),
            address(savingsPool),
            "SavingsPool minting permissions"
        );
        
        accessManager.grantRoleWithDescription(
            accessManager.MINTER_ROLE(),
            address(savingsPod),
            "SavingsPod minting permissions"
        );
        
        accessManager.grantRoleWithDescription(
            accessManager.UPDATER_ROLE(),
            address(savingsPool),
            "SavingsPool update permissions"
        );
        
        accessManager.grantRoleWithDescription(
            accessManager.UPDATER_ROLE(),
            address(savingsPod),
            "SavingsPod update permissions"
        );
        
        certificateNFT.grantRole(certificateNFT.MINTER_ROLE(), address(savingsPool));
        certificateNFT.grantRole(certificateNFT.MINTER_ROLE(), address(savingsPod));
        certificateNFT.grantRole(certificateNFT.UPDATER_ROLE(), address(savingsPool));
        certificateNFT.grantRole(certificateNFT.UPDATER_ROLE(), address(savingsPod));
        
        creditScore.grantRole(creditScore.UPDATER_ROLE(), address(savingsPool));
        creditScore.grantRole(creditScore.UPDATER_ROLE(), address(savingsPod));
        
        randomnessProvider.grantRole(randomnessProvider.REQUESTER_ROLE(), address(savingsPod));
    }

    function setupPriceFeeds() internal {
        console.log("Setting up price feeds...");
        
        if (USDC_PRICE_FEED != address(0)) {
            priceFeedManager.addPriceFeed(
                USDC_SOMNIA,
                USDC_PRICE_FEED,
                3600,
                "USDC/USD Price Feed"
            );
        }
        
        if (WETH_PRICE_FEED != address(0)) {
            priceFeedManager.addPriceFeed(
                WETH_SOMNIA,
                WETH_PRICE_FEED,
                3600,
                "WETH/USD Price Feed"
            );
        }
        
        if (SOM_PRICE_FEED != address(0)) {
            priceFeedManager.addPriceFeed(
                SOM_SOMNIA,
                SOM_PRICE_FEED,
                3600,
                "SOM/USD Price Feed"
            );
        }
        
        priceFeedManager.setFallbackPrice(USDC_SOMNIA, 1e8);
        priceFeedManager.setFallbackPrice(WETH_SOMNIA, 2500e8);
        priceFeedManager.setFallbackPrice(SOM_SOMNIA, 1e8);
    }

    function setupTokenSupport() internal {
        console.log("Setting up supported tokens...");
        
        savingsPool.addSupportedToken(USDC_SOMNIA, 500);
        savingsPool.addSupportedToken(WETH_SOMNIA, 400);
        savingsPool.addSupportedToken(SOM_SOMNIA, 600);
    }

    function logDeployedAddresses() internal view {
        console.log("\n=== DEPLOYMENT COMPLETE ===");
        console.log("Network: Somnia Testnet");
        console.log("Deployer:", msg.sender);
        console.log("Treasury:", TREASURY);
        console.log("\n=== CONTRACT ADDRESSES ===");
        console.log("AccessManager:", address(accessManager));
        console.log("SavingsPool:", address(savingsPool));
        console.log("SavingsPod:", address(savingsPod));
        console.log("CertificateNFT:", address(certificateNFT));
        console.log("PriceFeedManager:", address(priceFeedManager));
        console.log("RandomnessProvider:", address(randomnessProvider));
        console.log("CreditScore:", address(creditScore));
        console.log("\n=== TOKEN ADDRESSES ===");
        console.log("USDC:", USDC_SOMNIA);
        console.log("WETH:", WETH_SOMNIA);
        console.log("SOM:", SOM_SOMNIA);
        console.log("\n=== ORACLE ADDRESSES ===");
        console.log("VRF Coordinator:", VRF_COORDINATOR);
        console.log("USDC Price Feed:", USDC_PRICE_FEED);
        console.log("WETH Price Feed:", WETH_PRICE_FEED);
        console.log("SOM Price Feed:", SOM_PRICE_FEED);
    }

    function saveDeploymentInfo() internal {
        string memory json = string(
            abi.encodePacked(
                '{\n',
                '  "network": "somnia-testnet",\n',
                '  "deployer": "', vm.toString(msg.sender), '",\n',
                '  "treasury": "', vm.toString(TREASURY), '",\n',
                '  "contracts": {\n',
                '    "AccessManager": "', vm.toString(address(accessManager)), '",\n',
                '    "SavingsPool": "', vm.toString(address(savingsPool)), '",\n',
                '    "SavingsPod": "', vm.toString(address(savingsPod)), '",\n',
                '    "CertificateNFT": "', vm.toString(address(certificateNFT)), '",\n',
                '    "PriceFeedManager": "', vm.toString(address(priceFeedManager)), '",\n',
                '    "RandomnessProvider": "', vm.toString(address(randomnessProvider)), '",\n',
                '    "CreditScore": "', vm.toString(address(creditScore)), '"\n',
                '  },\n',
                '  "tokens": {\n',
                '    "USDC": "', vm.toString(USDC_SOMNIA), '",\n',
                '    "WETH": "', vm.toString(WETH_SOMNIA), '",\n',
                '    "SOM": "', vm.toString(SOM_SOMNIA), '"\n',
                '  }\n',
                '}'
            )
        );
        
        vm.writeFile("deployment.json", json);
        console.log("\nDeployment info saved to deployment.json");
    }

    function deployForTesting() external {
        vm.startBroadcast();
        
        deployAccessManager();
        deployPriceFeedManager();
        deployRandomnessProvider();
        deployCreditScore();
        deploySavingsPool();
        deploySavingsPod();
        deployCertificateNFT();
        
        setupRoles();
        setupPriceFeeds();
        setupTokenSupport();
        
        vm.stopBroadcast();
    }
}
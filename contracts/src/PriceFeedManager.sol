// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";

interface AggregatorV3Interface {
    function decimals() external view returns (uint8);
    function description() external view returns (string memory);
    function version() external view returns (uint256);
    function latestRoundData() external view returns (
        uint80 roundId,
        int256 price,
        uint256 startedAt,
        uint256 updatedAt,
        uint80 answeredInRound
    );
}

contract PriceFeedManager is AccessControl, Pausable {
    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");
    bytes32 public constant UPDATER_ROLE = keccak256("UPDATER_ROLE");

    struct PriceFeed {
        AggregatorV3Interface feed;
        uint8 decimals;
        uint256 heartbeat;
        bool isActive;
        string description;
    }

    mapping(address => PriceFeed) public priceFeeds;
    mapping(address => int256) public fallbackPrices;
    address[] public supportedTokens;

    uint256 public constant STALE_PRICE_THRESHOLD = 3600;
    uint256 public constant PRICE_DEVIATION_THRESHOLD = 1000;
    uint256 public constant BASIS_POINTS = 10000;

    event PriceFeedAdded(address indexed token, address indexed feed, string description);
    event PriceFeedUpdated(address indexed token, address indexed oldFeed, address indexed newFeed);
    event PriceFeedRemoved(address indexed token);
    event FallbackPriceSet(address indexed token, int256 price);
    event PriceAlert(address indexed token, int256 currentPrice, int256 previousPrice, uint256 deviation);

    constructor() {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(ADMIN_ROLE, msg.sender);
        _grantRole(UPDATER_ROLE, msg.sender);
    }

    function addPriceFeed(
        address token,
        address feedAddress,
        uint256 heartbeat,
        string memory description
    ) external onlyRole(ADMIN_ROLE) {
        require(token != address(0), "Invalid token address");
        require(feedAddress != address(0), "Invalid feed address");
        require(!priceFeeds[token].isActive, "Feed already exists");

        AggregatorV3Interface feed = AggregatorV3Interface(feedAddress);
        
        priceFeeds[token] = PriceFeed({
            feed: feed,
            decimals: feed.decimals(),
            heartbeat: heartbeat,
            isActive: true,
            description: description
        });

        supportedTokens.push(token);
        emit PriceFeedAdded(token, feedAddress, description);
    }

    function updatePriceFeed(
        address token,
        address newFeedAddress
    ) external onlyRole(ADMIN_ROLE) {
        require(priceFeeds[token].isActive, "Feed does not exist");
        
        address oldFeed = address(priceFeeds[token].feed);
        AggregatorV3Interface newFeed = AggregatorV3Interface(newFeedAddress);
        
        priceFeeds[token].feed = newFeed;
        priceFeeds[token].decimals = newFeed.decimals();

        emit PriceFeedUpdated(token, oldFeed, newFeedAddress);
    }

    function removePriceFeed(address token) external onlyRole(ADMIN_ROLE) {
        require(priceFeeds[token].isActive, "Feed does not exist");
        
        priceFeeds[token].isActive = false;
        
        for (uint256 i = 0; i < supportedTokens.length; i++) {
            if (supportedTokens[i] == token) {
                supportedTokens[i] = supportedTokens[supportedTokens.length - 1];
                supportedTokens.pop();
                break;
            }
        }

        emit PriceFeedRemoved(token);
    }

    function setFallbackPrice(address token, int256 price) external onlyRole(UPDATER_ROLE) {
        require(price > 0, "Price must be positive");
        fallbackPrices[token] = price;
        emit FallbackPriceSet(token, price);
    }

    function getLatestPrice(address token) external view returns (int256 price, uint256 updatedAt) {
        require(priceFeeds[token].isActive, "Price feed not available");
        
        PriceFeed memory feed = priceFeeds[token];
        
        try feed.feed.latestRoundData() returns (
            uint80 roundId,
            int256 feedPrice,
            uint256 startedAt,
            uint256 timestamp,
            uint80 answeredInRound
        ) {
            if (_isPriceStale(timestamp, feed.heartbeat)) {
                return _getFallbackPrice(token);
            }
            
            if (feedPrice <= 0) {
                return _getFallbackPrice(token);
            }
            
            return (feedPrice, timestamp);
        } catch {
            return _getFallbackPrice(token);
        }
    }

    function getPrice(address token) external view returns (int256) {
        (int256 price, ) = this.getLatestPrice(token);
        return price;
    }

    function getPriceWithDecimals(address token) external view returns (int256 price, uint8 decimals) {
        (price, ) = this.getLatestPrice(token);
        decimals = priceFeeds[token].decimals;
    }

    function convertToUSD(address token, uint256 amount) external view returns (uint256) {
        (int256 price, uint8 decimals) = this.getPriceWithDecimals(token);
        require(price > 0, "Invalid price");
        
        return (amount * uint256(price)) / (10 ** decimals);
    }

    function convertFromUSD(address token, uint256 usdAmount) external view returns (uint256) {
        (int256 price, uint8 decimals) = this.getPriceWithDecimals(token);
        require(price > 0, "Invalid price");
        
        return (usdAmount * (10 ** decimals)) / uint256(price);
    }

    function getPriceDeviation(address token) external view returns (uint256) {
        (int256 currentPrice, ) = this.getLatestPrice(token);
        int256 fallbackPrice = fallbackPrices[token];
        
        if (fallbackPrice <= 0) return 0;
        
        int256 deviation = currentPrice > fallbackPrice 
            ? currentPrice - fallbackPrice 
            : fallbackPrice - currentPrice;
            
        return (uint256(deviation) * BASIS_POINTS) / uint256(fallbackPrice);
    }

    function isPriceStale(address token) external view returns (bool) {
        (, uint256 updatedAt) = this.getLatestPrice(token);
        return _isPriceStale(updatedAt, priceFeeds[token].heartbeat);
    }

    function getSupportedTokens() external view returns (address[] memory) {
        return supportedTokens;
    }

    function getPriceFeedInfo(address token) external view returns (
        address feedAddress,
        uint8 decimals,
        uint256 heartbeat,
        bool isActive,
        string memory description
    ) {
        PriceFeed memory feed = priceFeeds[token];
        return (
            address(feed.feed),
            feed.decimals,
            feed.heartbeat,
            feed.isActive,
            feed.description
        );
    }

    function _isPriceStale(uint256 updatedAt, uint256 heartbeat) internal view returns (bool) {
        uint256 maxAge = heartbeat > 0 ? heartbeat : STALE_PRICE_THRESHOLD;
        return (block.timestamp - updatedAt) > maxAge;
    }

    function _getFallbackPrice(address token) internal view returns (int256, uint256) {
        int256 fallbackPrice = fallbackPrices[token];
        require(fallbackPrice > 0, "No fallback price available");
        return (fallbackPrice, block.timestamp);
    }

    function batchGetPrices(address[] calldata tokens) external view returns (int256[] memory prices) {
        prices = new int256[](tokens.length);
        for (uint256 i = 0; i < tokens.length; i++) {
            (prices[i], ) = this.getLatestPrice(tokens[i]);
        }
    }

    function batchConvertToUSD(
        address[] calldata tokens,
        uint256[] calldata amounts
    ) external view returns (uint256[] memory usdValues) {
        require(tokens.length == amounts.length, "Arrays length mismatch");
        
        usdValues = new uint256[](tokens.length);
        for (uint256 i = 0; i < tokens.length; i++) {
            usdValues[i] = this.convertToUSD(tokens[i], amounts[i]);
        }
    }

    function pause() external onlyRole(ADMIN_ROLE) {
        _pause();
    }

    function unpause() external onlyRole(ADMIN_ROLE) {
        _unpause();
    }
}
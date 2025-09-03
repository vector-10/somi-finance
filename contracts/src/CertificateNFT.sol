// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/Strings.sol";
import "@openzeppelin/contracts/utils/Base64.sol";

contract CertificateNFT is ERC721, ERC721URIStorage, AccessControl {
    using Strings for uint256;

    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");
    bytes32 public constant UPDATER_ROLE = keccak256("UPDATER_ROLE");

    struct Certificate {
        address owner;
        address token;
        uint256 depositAmount;
        uint256 currentBalance;
        uint256 interestEarned;
        uint256 apyRate;
        uint256 createdAt;
        uint256 lastUpdated;
        bool isPodMember;
        uint256 podId;
        string tier;
        uint256 streakDays;
    }

    mapping(uint256 => Certificate) public certificates;
    mapping(address => uint256[]) public userCertificates;
    uint256 private _tokenIdCounter;

    event CertificateMinted(uint256 indexed tokenId, address indexed owner, address indexed token, uint256 amount);
    event CertificateUpdated(uint256 indexed tokenId, uint256 newBalance, uint256 interestEarned);

    constructor() ERC721("Somi Finance Certificate", "SFCERT") {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(MINTER_ROLE, msg.sender);
        _grantRole(UPDATER_ROLE, msg.sender);
    }

    function mintCertificate(
        address to,
        address token,
        uint256 depositAmount,
        uint256 apyRate,
        bool isPodMember,
        uint256 podId
    ) external onlyRole(MINTER_ROLE) returns (uint256) {
        uint256 tokenId = _tokenIdCounter++;
        
        certificates[tokenId] = Certificate({
            owner: to,
            token: token,
            depositAmount: depositAmount,
            currentBalance: depositAmount,
            interestEarned: 0,
            apyRate: apyRate,
            createdAt: block.timestamp,
            lastUpdated: block.timestamp,
            isPodMember: isPodMember,
            podId: podId,
            tier: _calculateTier(depositAmount),
            streakDays: 0
        });

        userCertificates[to].push(tokenId);
        _safeMint(to, tokenId);
        _setTokenURI(tokenId, generateTokenURI(tokenId));

        emit CertificateMinted(tokenId, to, token, depositAmount);
        return tokenId;
    }

    function updateCertificate(
        uint256 tokenId,
        uint256 newBalance,
        uint256 interestEarned,
        uint256 newApyRate
    ) external onlyRole(UPDATER_ROLE) {
        require(_ownerOf(tokenId) != address(0), "Token does not exist");
        
        Certificate storage cert = certificates[tokenId];
        cert.currentBalance = newBalance;
        cert.interestEarned = interestEarned;
        cert.apyRate = newApyRate;
        cert.lastUpdated = block.timestamp;
        cert.tier = _calculateTier(newBalance);
        cert.streakDays = _calculateStreakDays(cert.createdAt);

        _setTokenURI(tokenId, generateTokenURI(tokenId));
        emit CertificateUpdated(tokenId, newBalance, interestEarned);
    }

    function generateTokenURI(uint256 tokenId) public view returns (string memory) {
        require(_ownerOf(tokenId) != address(0), "Token does not exist");
        
        Certificate memory cert = certificates[tokenId];
        
        string memory svg = generateSVG(tokenId);
        string memory json = Base64.encode(
            bytes(
                string(
                    abi.encodePacked(
                        '{"name": "Somi Finance Certificate #',
                        tokenId.toString(),
                        '", "description": "Dynamic savings certificate", "image": "data:image/svg+xml;base64,',
                        Base64.encode(bytes(svg)),
                        '", "attributes": [',
                        '{"trait_type": "Balance", "value": "',
                        (cert.currentBalance / 1e18).toString(),
                        '"},',
                        '{"trait_type": "Interest Earned", "value": "',
                        (cert.interestEarned / 1e18).toString(),
                        '"},',
                        '{"trait_type": "APY", "value": "',
                        cert.apyRate.toString(),
                        '"},',
                        '{"trait_type": "Tier", "value": "',
                        cert.tier,
                        '"},',
                        '{"trait_type": "Pod Member", "value": "',
                        cert.isPodMember ? "Yes" : "No",
                        '"},',
                        '{"trait_type": "Streak Days", "value": "',
                        cert.streakDays.toString(),
                        '"}]}'
                    )
                )
            )
        );

        return string(abi.encodePacked("data:application/json;base64,", json));
    }

    function generateSVG(uint256 tokenId) public view returns (string memory) {
        Certificate memory cert = certificates[tokenId];
        
        string memory tierColor = _getTierColor(cert.tier);
        string memory balanceStr = (cert.currentBalance / 1e18).toString();
        string memory interestStr = (cert.interestEarned / 1e18).toString();
        
        return string(
            abi.encodePacked(
                '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 600">',
                '<defs><linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">',
                '<stop offset="0%" style="stop-color:', tierColor, ';stop-opacity:1" />',
                '<stop offset="100%" style="stop-color:#1a1a2e;stop-opacity:1" /></linearGradient></defs>',
                '<rect width="400" height="600" fill="url(#grad)"/>',
                '<text x="200" y="80" text-anchor="middle" fill="white" font-size="24" font-weight="bold">SOMI FINANCE</text>',
                '<text x="200" y="120" text-anchor="middle" fill="white" font-size="16">Savings Certificate</text>',
                '<text x="200" y="180" text-anchor="middle" fill="white" font-size="14">#', tokenId.toString(), '</text>',
                '<text x="50" y="250" fill="white" font-size="12">Balance:</text>',
                '<text x="350" y="250" text-anchor="end" fill="white" font-size="12">', balanceStr, '</text>',
                '<text x="50" y="280" fill="white" font-size="12">Interest Earned:</text>',
                '<text x="350" y="280" text-anchor="end" fill="white" font-size="12">', interestStr, '</text>',
                '<text x="50" y="310" fill="white" font-size="12">APY Rate:</text>',
                '<text x="350" y="310" text-anchor="end" fill="white" font-size="12">', cert.apyRate.toString(), '%</text>',
                '<text x="50" y="340" fill="white" font-size="12">Tier:</text>',
                '<text x="350" y="340" text-anchor="end" fill="white" font-size="12">', cert.tier, '</text>',
                cert.isPodMember ? '<text x="200" y="400" text-anchor="middle" fill="#FFD700" font-size="14">POD MEMBER</text>' : '',
                '<text x="200" y="500" text-anchor="middle" fill="white" font-size="10">Streak: ', cert.streakDays.toString(), ' days</text>',
                '</svg>'
            )
        );
    }

    function _calculateTier(uint256 amount) internal pure returns (string memory) {
        if (amount >= 10000e18) return "Diamond";
        if (amount >= 5000e18) return "Gold";
        if (amount >= 1000e18) return "Silver";
        return "Bronze";
    }

    function _getTierColor(string memory tier) internal pure returns (string memory) {
        if (keccak256(bytes(tier)) == keccak256(bytes("Diamond"))) return "#B9F2FF";
        if (keccak256(bytes(tier)) == keccak256(bytes("Gold"))) return "#FFD700";
        if (keccak256(bytes(tier)) == keccak256(bytes("Silver"))) return "#C0C0C0";
        return "#CD7F32";
    }

    function _calculateStreakDays(uint256 createdAt) internal view returns (uint256) {
        return (block.timestamp - createdAt) / 86400;
    }

    function getUserCertificates(address user) external view returns (uint256[] memory) {
        return userCertificates[user];
    }

    function getCertificate(uint256 tokenId) external view returns (Certificate memory) {
        return certificates[tokenId];
    }

    function tokenURI(uint256 tokenId) public view override(ERC721, ERC721URIStorage) returns (string memory) {
        return super.tokenURI(tokenId);
    }

    function supportsInterface(bytes4 interfaceId) public view override(ERC721, ERC721URIStorage, AccessControl) returns (bool) {
        return super.supportsInterface(interfaceId);
    }

    function _burn(uint256 tokenId) internal override(ERC721, ERC721URIStorage) {
    super._burn(tokenId);
}
}
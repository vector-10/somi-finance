// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

contract AccessManager is AccessControl, ReentrancyGuard {
    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");
    bytes32 public constant OPERATOR_ROLE = keccak256("OPERATOR_ROLE");
    bytes32 public constant EMERGENCY_ROLE = keccak256("EMERGENCY_ROLE");
    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");
    bytes32 public constant UPDATER_ROLE = keccak256("UPDATER_ROLE");
    bytes32 public constant PAUSER_ROLE = keccak256("PAUSER_ROLE");

    struct RoleData {
        string description;
        bool isActive;
        uint256 memberCount;
        uint256 createdAt;
    }

    mapping(bytes32 => RoleData) public roleInfo;
    mapping(address => bytes32[]) public userRoles;
    mapping(bytes32 => address[]) public roleMembers;
    
    address public treasury;
    bool public systemPaused;
    
    event RoleGrantedWithDescription(bytes32 indexed role, address indexed account, string description);
    event RoleRevokedFromUser(bytes32 indexed role, address indexed account);
    event SystemPauseToggled(bool isPaused, address indexed admin);
    event TreasuryUpdated(address indexed oldTreasury, address indexed newTreasury);
    event EmergencyAction(address indexed executor, string action, bytes data);

    constructor(address _treasury) {
        require(_treasury != address(0), "Invalid treasury address");
        
        treasury = _treasury;
        
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(ADMIN_ROLE, msg.sender);
        _grantRole(EMERGENCY_ROLE, msg.sender);
        
        _initializeRoles();
    }

    function _initializeRoles() internal {
        roleInfo[ADMIN_ROLE] = RoleData({
            description: "System administrator with full access",
            isActive: true,
            memberCount: 1,
            createdAt: block.timestamp
        });
        
        roleInfo[OPERATOR_ROLE] = RoleData({
            description: "Operational permissions for core functions",
            isActive: true,
            memberCount: 0,
            createdAt: block.timestamp
        });
        
        roleInfo[EMERGENCY_ROLE] = RoleData({
            description: "Emergency response and system pause authority",
            isActive: true,
            memberCount: 1,
            createdAt: block.timestamp
        });
        
        roleInfo[MINTER_ROLE] = RoleData({
            description: "NFT minting permissions",
            isActive: true,
            memberCount: 0,
            createdAt: block.timestamp
        });
        
        roleInfo[UPDATER_ROLE] = RoleData({
            description: "Data update permissions",
            isActive: true,
            memberCount: 0,
            createdAt: block.timestamp
        });
        
        roleInfo[PAUSER_ROLE] = RoleData({
            description: "Contract pause/unpause permissions",
            isActive: true,
            memberCount: 0,
            createdAt: block.timestamp
        });
    }

    function grantRoleWithDescription(
        bytes32 role,
        address account,
        string calldata description
    ) external onlyRole(getRoleAdmin(role)) {
        require(roleInfo[role].isActive, "Role is not active");
        
        if (!hasRole(role, account)) {
            _grantRole(role, account);
            userRoles[account].push(role);
            roleMembers[role].push(account);
            roleInfo[role].memberCount++;
        }
        
        emit RoleGrantedWithDescription(role, account, description);
    }

    function revokeRoleFromUser(bytes32 role, address account) external onlyRole(getRoleAdmin(role)) {
        if (hasRole(role, account)) {
            _revokeRole(role, account);
            
            _removeFromUserRoles(account, role);
            _removeFromRoleMembers(role, account);
            
            roleInfo[role].memberCount--;
        }
        
        emit RoleRevokedFromUser(role, account);
    }

    function bulkGrantRole(
        bytes32 role,
        address[] calldata accounts
    ) external onlyRole(getRoleAdmin(role)) {
        require(roleInfo[role].isActive, "Role is not active");
        
        for (uint256 i = 0; i < accounts.length; i++) {
            if (!hasRole(role, accounts[i])) {
                _grantRole(role, accounts[i]);
                userRoles[accounts[i]].push(role);
                roleMembers[role].push(accounts[i]);
                roleInfo[role].memberCount++;
            }
        }
    }

    function bulkRevokeRole(
        bytes32 role,
        address[] calldata accounts
    ) external onlyRole(getRoleAdmin(role)) {
        for (uint256 i = 0; i < accounts.length; i++) {
            if (hasRole(role, accounts[i])) {
                _revokeRole(role, accounts[i]);
                _removeFromUserRoles(accounts[i], role);
                _removeFromRoleMembers(role, accounts[i]);
                roleInfo[role].memberCount--;
            }
        }
    }

    function toggleSystemPause() external onlyRole(EMERGENCY_ROLE) {
        systemPaused = !systemPaused;
        emit SystemPauseToggled(systemPaused, msg.sender);
    }

    function executeEmergencyAction(
        address target,
        bytes calldata data,
        string calldata description
    ) external onlyRole(EMERGENCY_ROLE) nonReentrant {
        require(target != address(0), "Invalid target");
        
        (bool success, bytes memory result) = target.call(data);
        require(success, "Emergency action failed");
        
        emit EmergencyAction(msg.sender, description, result);
    }

    function updateTreasury(address newTreasury) external onlyRole(ADMIN_ROLE) {
        require(newTreasury != address(0), "Invalid treasury address");
        
        address oldTreasury = treasury;
        treasury = newTreasury;
        
        emit TreasuryUpdated(oldTreasury, newTreasury);
    }

    function deactivateRole(bytes32 role) external onlyRole(DEFAULT_ADMIN_ROLE) {
        require(role != DEFAULT_ADMIN_ROLE, "Cannot deactivate admin role");
        roleInfo[role].isActive = false;
    }

    function reactivateRole(bytes32 role) external onlyRole(DEFAULT_ADMIN_ROLE) {
        roleInfo[role].isActive = true;
    }

    function _removeFromUserRoles(address account, bytes32 role) internal {
        bytes32[] storage roles = userRoles[account];
        for (uint256 i = 0; i < roles.length; i++) {
            if (roles[i] == role) {
                roles[i] = roles[roles.length - 1];
                roles.pop();
                break;
            }
        }
    }

    function _removeFromRoleMembers(bytes32 role, address account) internal {
        address[] storage members = roleMembers[role];
        for (uint256 i = 0; i < members.length; i++) {
            if (members[i] == account) {
                members[i] = members[members.length - 1];
                members.pop();
                break;
            }
        }
    }

    function getUserRoles(address account) external view returns (bytes32[] memory) {
        return userRoles[account];
    }

    function getRoleMembers(bytes32 role) external view returns (address[] memory) {
        return roleMembers[role];
    }

    function getRoleInfo(bytes32 role) external view returns (RoleData memory) {
        return roleInfo[role];
    }

    function hasAnyRole(address account, bytes32[] calldata roles) external view returns (bool) {
        for (uint256 i = 0; i < roles.length; i++) {
            if (hasRole(roles[i], account)) {
                return true;
            }
        }
        return false;
    }

    function isAdmin(address account) external view returns (bool) {
        return hasRole(ADMIN_ROLE, account) || hasRole(DEFAULT_ADMIN_ROLE, account);
    }

    function canPause(address account) external view returns (bool) {
        return hasRole(PAUSER_ROLE, account) || hasRole(EMERGENCY_ROLE, account) || hasRole(ADMIN_ROLE, account);
    }

    function canMint(address account) external view returns (bool) {
        return hasRole(MINTER_ROLE, account) || hasRole(ADMIN_ROLE, account);
    }

    function canUpdate(address account) external view returns (bool) {
        return hasRole(UPDATER_ROLE, account) || hasRole(OPERATOR_ROLE, account) || hasRole(ADMIN_ROLE, account);
    }

    modifier whenNotSystemPaused() {
        require(!systemPaused, "System is paused");
        _;
    }

    modifier onlyAdmin() {
        require(hasRole(ADMIN_ROLE, msg.sender) || hasRole(DEFAULT_ADMIN_ROLE, msg.sender), "Not an admin");
        _;
    }

    modifier onlyOperator() {
        require(hasRole(OPERATOR_ROLE, msg.sender) || hasRole(ADMIN_ROLE, msg.sender), "Not an operator");
        _;
    }

    modifier onlyEmergency() {
        require(hasRole(EMERGENCY_ROLE, msg.sender), "Not emergency role");
        _;
    }
}
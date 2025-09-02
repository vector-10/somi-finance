// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";


contract SavingsPod is ReentrancyGuard, Pausable, AccessControl {
    using SafeERC20 for IERC20;

    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");
    bytes32 public constant EMERGENCY_ROLE = keccak256("EMERGENCY_ROLE");

    uint256 public constant MAX_POD_MEMBERS = 20;
    uint256 public constant MIN_POD_DEPOSIT = 100e6; 
    uint256 public constant BASE_APY_BOOST = 50; 
    uint256 public constant MAX_APY_BOOST = 500; 
    uint256 public constant BASIS_POINTS = 10000;


    struct Pod {
        uint256 id;                    // Unique pod identifier
        string name;                   // Pod display name
        address leader;                // Pod creator/leader
        address[] members;             // Array of pod members
        mapping(address => bool) isMember; // Quick member lookup
        mapping(address => uint256) memberDeposits; // Individual member deposits
        uint256 totalDeposits;         // Total pod deposits
        address depositToken;          // Token used for deposits (USDC, WETH, SOM)
        uint256 createdAt;            // Pod creation timestamp
        uint256 apyBoost;             // Current APY boost (basis points)
        bool isActive;                // Pod status
        bool isPrivate;               // Whether pod requires invitation
        uint256 minimumDeposit;       // Minimum deposit to join this pod
    }
    
    /// @dev Pod invitation structure
    struct Invitation {
        uint256 podId;                // Pod being invited to
        address inviter;              // Who sent the invitation
        address invitee;              // Who is being invited
        uint256 expiresAt;           // Invitation expiration timestamp
        bool isUsed;                 // Whether invitation was used
    }


    address public savingsPool;
    
    uint256 public nextPodId = 1;
    
    mapping(uint256 => Pod) public pods;
    mapping(address => uint256[]) public userPods;
    mapping(bytes32 => Invitation) public invitations;
    mapping(address => uint256[]) public pendingInvitations;
    

    uint256[] public activePodIds;
    

    mapping(uint256 => bool) public isPodActive;
    

    uint256[] public topPods;
    uint256 public constant LEADERBOARD_SIZE = 10;


    event PodCreated(
        uint256 indexed podId,
        address indexed leader,
        string name,
        address indexed token,
        bool isPrivate,
        uint256 minimumDeposit
    );

    event MemberJoined(
        uint256 indexed podId,
        address indexed member,
        uint256 depositAmount,
        uint256 newPodTotal
    );
    

    event MemberLeft(
        uint256 indexed podId,
        address indexed member,
        uint256 withdrawnAmount,
        uint256 newPodTotal
    );
    
    event APYBoostUpdated(
        uint256 indexed podId,
        uint256 oldBoost,
        uint256 newBoost,
        uint256 totalMembers,
        uint256 totalDeposits
    );
    

    event InvitationSent(
        uint256 indexed podId,
        address indexed inviter,
        address indexed invitee,
        uint256 expiresAt
    );
    
    event InvitationAccepted(
        uint256 indexed podId,
        address indexed invitee,
        address indexed inviter
    );
    

    event PodDissolved(
        uint256 indexed podId,
        address indexed leader,
        uint256 finalTotal,
        uint256 memberCount
    );


    modifier onlyPodMember(uint256 podId) {
        require(pods[podId].isMember[msg.sender], "Not a pod member");
        _;
    }
    

    modifier onlyPodLeader(uint256 podId) {
        require(pods[podId].leader == msg.sender, "Not the pod leader");
        _;
    }
    
    modifier podExists(uint256 podId) {
        require(podId > 0 && podId < nextPodId, "Pod does not exist");
        require(pods[podId].isActive, "Pod is not active");
        _;
    }
    
    /// @dev Ensures valid deposit amount
    modifier validDeposit(uint256 amount) {
        require(amount >= MIN_POD_DEPOSIT, "Deposit below minimum");
        _;
    }

    // ============ CONSTRUCTOR ============
    
    /**
     * @dev Initializes the SavingsPod contract
     * @param _savingsPool Address of the main SavingsPool contract
     */
    constructor(address _savingsPool) {
        require(_savingsPool != address(0), "SavingsPool cannot be zero address");
        
        savingsPool = _savingsPool;
        
        // Set up roles
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(ADMIN_ROLE, msg.sender);
        _grantRole(EMERGENCY_ROLE, msg.sender);
    }

    // ============ POD CREATION & MANAGEMENT ============
    
    /**
     * @dev Creates a new savings pod
     * @param name Display name for the pod
     * @param token Address of the deposit token (USDC, WETH, SOM)
     * @param isPrivate Whether the pod requires invitations to join
     * @param minimumDeposit Minimum deposit required to join this pod
     * @param initialDeposit Initial deposit amount from pod creator
     */
    function createPod(
        string memory name,
        address token,
        bool isPrivate,
        uint256 minimumDeposit,
        uint256 initialDeposit
    ) 
        external 
        nonReentrant 
        whenNotPaused 
        validDeposit(initialDeposit)
    {
        require(bytes(name).length > 0 && bytes(name).length <= 50, "Invalid pod name");
        require(token != address(0), "Invalid token address");
        require(minimumDeposit >= MIN_POD_DEPOSIT, "Minimum deposit too low");
        require(initialDeposit >= minimumDeposit, "Initial deposit below minimum");
        
        uint256 podId = nextPodId++;
        
        // Initialize pod
        Pod storage newPod = pods[podId];
        newPod.id = podId;
        newPod.name = name;
        newPod.leader = msg.sender;
        newPod.depositToken = token;
        newPod.createdAt = block.timestamp;
        newPod.isActive = true;
        newPod.isPrivate = isPrivate;
        newPod.minimumDeposit = minimumDeposit;
        
        // Add creator as first member
        newPod.members.push(msg.sender);
        newPod.isMember[msg.sender] = true;
        newPod.memberDeposits[msg.sender] = initialDeposit;
        newPod.totalDeposits = initialDeposit;
        
        // Transfer initial deposit from user
        IERC20(token).safeTransferFrom(msg.sender, address(this), initialDeposit);
        
        // Add to user's pod list
        userPods[msg.sender].push(podId);
        
        // Add to active pods
        activePodIds.push(podId);
        isPodActive[podId] = true;
        
        // Calculate initial APY boost
        _updateAPYBoost(podId);
        
        emit PodCreated(podId, msg.sender, name, token, isPrivate, minimumDeposit);
        emit MemberJoined(podId, msg.sender, initialDeposit, initialDeposit);
    }
    
    /**
     * @dev Join an existing public pod or accept an invitation to private pod
     * @param podId ID of the pod to join
     * @param depositAmount Amount to deposit when joining
     */
    function joinPod(uint256 podId, uint256 depositAmount) 
        external 
        nonReentrant 
        whenNotPaused 
        podExists(podId) 
        validDeposit(depositAmount)
    {
        Pod storage pod = pods[podId];
        
        require(!pod.isMember[msg.sender], "Already a pod member");
        require(pod.members.length < MAX_POD_MEMBERS, "Pod is full");
        require(depositAmount >= pod.minimumDeposit, "Deposit below pod minimum");
        
        // Check if pod is private and user has valid invitation
        if (pod.isPrivate) {
            require(_hasValidInvitation(podId, msg.sender), "No valid invitation");
            _useInvitation(podId, msg.sender);
        }
        
        // Add member to pod
        pod.members.push(msg.sender);
        pod.isMember[msg.sender] = true;
        pod.memberDeposits[msg.sender] = depositAmount;
        pod.totalDeposits += depositAmount;
        
        // Transfer deposit from user
        IERC20(pod.depositToken).safeTransferFrom(msg.sender, address(this), depositAmount);
        
        // Add to user's pod list
        userPods[msg.sender].push(podId);
        
        // Update APY boost for the pod
        _updateAPYBoost(podId);
        
        emit MemberJoined(podId, msg.sender, depositAmount, pod.totalDeposits);
    }
    
    /**
     * @dev Leave a pod and withdraw deposits
     * @param podId ID of the pod to leave
     */
    function leavePod(uint256 podId) 
        external 
        nonReentrant 
        whenNotPaused 
        podExists(podId) 
        onlyPodMember(podId) 
    {
        Pod storage pod = pods[podId];
        uint256 memberDeposit = pod.memberDeposits[msg.sender];
        
        require(memberDeposit > 0, "No deposit to withdraw");
        
        // Remove member from pod
        _removeMember(podId, msg.sender);
        
        // Transfer deposit back to user
        IERC20(pod.depositToken).safeTransfer(msg.sender, memberDeposit);
        
        // If pod becomes empty or only leader remains with others, dissolve it
        if (pod.members.length <= 1) {
            _dissolvePod(podId);
        } else {
            // Update APY boost for remaining members
            _updateAPYBoost(podId);
        }
        
        emit MemberLeft(podId, msg.sender, memberDeposit, pod.totalDeposits);
    }

    // ============ INVITATION SYSTEM ============
    
    /**
     * @dev Send an invitation to join a private pod
     * @param podId ID of the pod to invite to
     * @param invitee Address to invite
     */
    function sendInvitation(uint256 podId, address invitee) 
        external 
        podExists(podId) 
        onlyPodMember(podId)
    {
        Pod storage pod = pods[podId];
        require(pod.isPrivate, "Pod is not private");
        require(!pod.isMember[invitee], "User is already a member");
        require(pod.members.length < MAX_POD_MEMBERS, "Pod is full");
        
        bytes32 inviteHash = keccak256(abi.encodePacked(podId, msg.sender, invitee, block.timestamp));
        uint256 expiresAt = block.timestamp + 7 days; // Invitations expire in 7 days
        
        invitations[inviteHash] = Invitation({
            podId: podId,
            inviter: msg.sender,
            invitee: invitee,
            expiresAt: expiresAt,
            isUsed: false
        });
        
        pendingInvitations[invitee].push(podId);
        
        emit InvitationSent(podId, msg.sender, invitee, expiresAt);
    }
    
    /**
     * @dev Check if user has a valid invitation to a pod
     * @param podId ID of the pod
     * @param user Address to check
     * @return hasInvite Whether user has valid invitation
     */
    function _hasValidInvitation(uint256 podId, address user) internal view returns (bool hasInvite) {
        uint256[] memory userInvites = pendingInvitations[user];
        
        for (uint256 i = 0; i < userInvites.length; i++) {
            if (userInvites[i] == podId) {
                // Find the invitation hash - this is simplified, in production you'd store hashes better
                return true;
            }
        }
        return false;
    }
    
    /**
     * @dev Mark invitation as used
     * @param podId ID of the pod
     * @param user Address that used the invitation
     */
    function _useInvitation(uint256 podId, address user) internal {
        // Remove podId from user's pending invitations
        uint256[] storage userInvites = pendingInvitations[user];
        for (uint256 i = 0; i < userInvites.length; i++) {
            if (userInvites[i] == podId) {
                userInvites[i] = userInvites[userInvites.length - 1];
                userInvites.pop();
                break;
            }
        }
    }

    // ============ APY BOOST CALCULATION ============
    
    /**
     * @dev Calculates and updates APY boost for a pod based on size and deposits
     * @param podId ID of the pod to update
     */
    function _updateAPYBoost(uint256 podId) internal {
        Pod storage pod = pods[podId];
        
        uint256 memberCount = pod.members.length;
        uint256 totalDeposits = pod.totalDeposits;
        
        // APY boost formula: Base boost + (member bonus) + (deposit bonus)
        // Member bonus: 25 basis points per member (up to 10 members)
        // Deposit bonus: 1 basis point per $1000 in deposits (up to 250 basis points)
        
        uint256 memberBonus = memberCount * 25; // 0.25% per member
        if (memberBonus > 250) memberBonus = 250; // Cap at 2.5%
        
        uint256 depositBonus = (totalDeposits / 1000e6) * 1; // 0.01% per $1000
        if (depositBonus > 250) depositBonus = 250; // Cap at 2.5%
        
        uint256 oldBoost = pod.apyBoost;
        uint256 newBoost = BASE_APY_BOOST + memberBonus + depositBonus;
        
        if (newBoost > MAX_APY_BOOST) {
            newBoost = MAX_APY_BOOST;
        }
        
        pod.apyBoost = newBoost;
        
        if (oldBoost != newBoost) {
            emit APYBoostUpdated(podId, oldBoost, newBoost, memberCount, totalDeposits);
        }
    }
    
    /**
     * @dev Get the current APY boost for a specific pod
     * @param podId ID of the pod
     * @return boost APY boost in basis points
     */
    function getPodAPYBoost(uint256 podId) external view returns (uint256 boost) {
        return pods[podId].apyBoost;
    }

    // ============ INTERNAL HELPER FUNCTIONS ============
    
    /**
     * @dev Removes a member from a pod
     * @param podId ID of the pod
     * @param member Address of the member to remove
     */
    function _removeMember(uint256 podId, address member) internal {
        Pod storage pod = pods[podId];
        
        // Remove from members array
        for (uint256 i = 0; i < pod.members.length; i++) {
            if (pod.members[i] == member) {
                pod.members[i] = pod.members[pod.members.length - 1];
                pod.members.pop();
                break;
            }
        }
        
        // Update pod state
        pod.totalDeposits -= pod.memberDeposits[member];
        pod.isMember[member] = false;
        pod.memberDeposits[member] = 0;
        
        // Remove from user's pod list
        uint256[] storage userPodList = userPods[member];
        for (uint256 i = 0; i < userPodList.length; i++) {
            if (userPodList[i] == podId) {
                userPodList[i] = userPodList[userPodList.length - 1];
                userPodList.pop();
                break;
            }
        }
    }
    
    /**
     * @dev Dissolves a pod and removes it from active lists
     * @param podId ID of the pod to dissolve
     */
    function _dissolvePod(uint256 podId) internal {
        Pod storage pod = pods[podId];
        
        // Transfer remaining funds to leader (if any)
        if (pod.totalDeposits > 0) {
            IERC20(pod.depositToken).safeTransfer(pod.leader, pod.totalDeposits);
        }
        
        // Remove from active pods
        for (uint256 i = 0; i < activePodIds.length; i++) {
            if (activePodIds[i] == podId) {
                activePodIds[i] = activePodIds[activePodIds.length - 1];
                activePodIds.pop();
                break;
            }
        }
        
        pod.isActive = false;
        isPodActive[podId] = false;
        
        emit PodDissolved(podId, pod.leader, pod.totalDeposits, pod.members.length);
    }


    function getPod(uint256 podId) external view returns (
        uint256 id,
        string memory name,
        address leader,
        address[] memory members,
        uint256 totalDeposits,
        address depositToken,
        uint256 createdAt,
        uint256 apyBoost,
        bool isActive,
        bool isPrivate,
        uint256 minimumDeposit
    ) {
        Pod storage pod = pods[podId];
        return (
            pod.id,
            pod.name,
            pod.leader,
            pod.members,
            pod.totalDeposits,
            pod.depositToken,
            pod.createdAt,
            pod.apyBoost,
            pod.isActive,
            pod.isPrivate,
            pod.minimumDeposit
        );
    }
    
    /**
     * @dev Get user's pod memberships
     * @param user Address of the user
     * @return podIds Array of pod IDs user is member of
     */
    function getUserPods(address user) external view returns (uint256[] memory podIds) {
        return userPods[user];
    }
    
    /**
     * @dev Get all active pod IDs
     * @return podIds Array of active pod IDs
     */
    function getActivePods() external view returns (uint256[] memory podIds) {
        return activePodIds;
    }
    
    /**
     * @dev Get user's pending invitations
     * @param user Address of the user
     * @return podIds Array of pod IDs user is invited to
     */
    function getPendingInvitations(address user) external view returns (uint256[] memory podIds) {
        return pendingInvitations[user];
    }

    // ============ ADMIN FUNCTIONS ============
    
    /**
     * @dev Update the savings pool contract address
     * @param newSavingsPool New savings pool address
     */
    function updateSavingsPool(address newSavingsPool) external onlyRole(ADMIN_ROLE) {
        require(newSavingsPool != address(0), "Invalid address");
        savingsPool = newSavingsPool;
    }
    
    /**
     * @dev Emergency pause all pod operations
     */
    function pause() external onlyRole(EMERGENCY_ROLE) {
        _pause();
    }
    
    /**
     * @dev Unpause pod operations
     */
    function unpause() external onlyRole(EMERGENCY_ROLE) {
        _unpause();
    }
    
    /**
     * @dev Emergency function to recover stuck tokens
     * @param token Address of the token to recover
     * @param amount Amount to recover
     */
    function emergencyRecover(address token, uint256 amount) 
        external 
        onlyRole(DEFAULT_ADMIN_ROLE) 
    {
        IERC20(token).safeTransfer(msg.sender, amount);
    }
}
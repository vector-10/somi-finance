// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Ownable} from "openzeppelin-contracts/access/Ownable.sol";
import {Pausable} from "openzeppelin-contracts/utils/Pausable.sol";
import {ReentrancyGuard} from "openzeppelin-contracts/utils/ReentrancyGuard.sol";
import {SavingsReceipt1155} from "./SavingsReceipt1155.sol";
import {InterestCalculator} from "./InterestCalculator.sol";


contract PodsVault is Ownable, Pausable, ReentrancyGuard {
    using InterestCalculator for uint256;


    uint48 private constant MAX_CUSTOM = 150 days;
    uint48 private constant SIX_MONTHS = 180 days;
    uint48 private constant ONE_YEAR   = 365 days;
    uint48 private constant TWO_YEARS  = 730 days;


    uint16 private constant APY_FLEX    = 1200; 
    uint16 private constant APY_CUSTOM  = 1500; 
    uint16 private constant APY_6M      = 2000; 
    uint16 private constant APY_1Y      = 2500; 
    uint16 private constant APY_2Y      = 5000; 

    uint32 private constant MIN_MEMBERS_TO_ACTIVATE = 3;

    enum PlanType { FLEX, CUSTOM_DAYS, FIXED_6M, FIXED_1Y, FIXED_2Y }

    uint256 public nextPodId;
    uint256 private _nonce; 

    struct Pod {
        address creator;
        string  name;
        string  description;
        bool    isPublic;

        uint8   planType;           
        uint16  aprBps;            
        uint48  term;               
        uint128 contributionAmount; 

        bool    activated;
        bool    cancelled;
        uint48  startTime;          
        uint48  maturityTime;      

        uint32  membersJoined;    
        uint32  activeMembers;      
        uint128 totalDeposited;     
    }

    struct Member {
        bool    joined;
        bool    closed;             
        uint48  joinedAt;
        uint256 receiptId;
    }

    mapping(uint256 => Pod) public pods;                                
    mapping(uint256 => mapping(address => Member)) public member;       
    mapping(uint256 => address[]) public podMembers;                    

    uint256[] public publicPodIds;                                      
    mapping(uint256 => uint256) public publicIndex;                     

    SavingsReceipt1155 public receipt;
    address public treasury; 

    event TreasurySet(address indexed newTreasury);

    event PodCreated(
        uint256 indexed podId,
        address indexed creator,
        bool    isPublic,
        uint8   planType,
        uint16  aprBps,
        uint48  term,
        uint128 contributionAmount,
        string  name
    );

    event PodVisibilityChanged(uint256 indexed podId, bool isPublic);
    event PodMetadataUpdated(uint256 indexed podId, string name, string description);

    event MemberJoined(uint256 indexed podId, address indexed user, uint256 receiptId);

    event PodActivated(uint256 indexed podId, uint48 startTime, uint48 maturityTime);

    event MemberLeft(
        uint256 indexed podId,
        address indexed user,
        uint256 principal,
        uint256 interest,
        bool    matured
    );

    event PodCancelled(uint256 indexed podId);

    constructor(address _receipt, address _treasury) {
        require(_receipt != address(0) && _treasury != address(0), "ZERO_ADDR");
        receipt = SavingsReceipt1155(_receipt);
        treasury = _treasury;
    }

    receive() external payable {}

    function setTreasury(address t) external onlyOwner {
        require(t != address(0), "ZERO_ADDR");
        treasury = t;
        emit TreasurySet(t);
    }

    function pause() external onlyOwner { _pause(); }
    function unpause() external onlyOwner { _unpause(); }

    function createPod(
        string calldata name,
        string calldata description,
        bool isPublic,
        uint128 contributionAmount,
        uint8 planType,       
        uint48 customDays    
    )
        external
        whenNotPaused
        returns (uint256 podId)
    {
        require(contributionAmount > 0, "NO_AMOUNT");
        (uint48 term, uint16 aprBps) = _deriveTermsAndApr(planType, customDays);

        podId = ++nextPodId;

        Pod storage p = pods[podId];
        p.creator = msg.sender;
        p.name = name;
        p.description = description;
        p.isPublic = isPublic;

        p.planType = planType;
        p.aprBps = aprBps;
        p.term = term;
        p.contributionAmount = contributionAmount;

        if (isPublic) {
            publicPodIds.push(podId);
            publicIndex[podId] = publicPodIds.length; 
        }

        emit PodCreated(podId, msg.sender, isPublic, planType, aprBps, term, contributionAmount, name);
    }

    function setPodVisibility(uint256 podId, bool isPublic_) external {
        Pod storage p = pods[podId];
        require(p.creator == msg.sender, "NOT_CREATOR");
        require(!p.activated && !p.cancelled, "LOCKED");

        if (p.isPublic == isPublic_) {
            emit PodVisibilityChanged(podId, isPublic_);
            return;
        }

        p.isPublic = isPublic_;
        if (isPublic_) {

            publicPodIds.push(podId);
            publicIndex[podId] = publicPodIds.length;
        } else {

            uint256 idx1 = publicIndex[podId];
            if (idx1 != 0) {
                uint256 idx = idx1 - 1;
                uint256 lastId = publicPodIds[publicPodIds.length - 1];
                publicPodIds[idx] = lastId;
                publicIndex[lastId] = idx + 1;
                publicPodIds.pop();
                publicIndex[podId] = 0;
            }
        }
        emit PodVisibilityChanged(podId, isPublic_);
    }

    function updatePodMetadata(uint256 podId, string calldata name, string calldata description) external {
        Pod storage p = pods[podId];
        require(p.creator == msg.sender, "NOT_CREATOR");
        require(!p.activated && !p.cancelled, "LOCKED");
        p.name = name;
        p.description = description;
        emit PodMetadataUpdated(podId, name, description);
    }

    function cancelPod(uint256 podId) external {
        Pod storage p = pods[podId];
        require(p.creator == msg.sender, "NOT_CREATOR");
        require(!p.activated && !p.cancelled, "LOCKED");
        p.cancelled = true;
        emit PodCancelled(podId);
    }


    function joinPod(uint256 podId) external payable whenNotPaused nonReentrant {
        Pod storage p = pods[podId];
        require(!p.cancelled, "CANCELLED");
        require(!p.activated, "ALREADY_ACTIVE"); 
        require(msg.value == p.contributionAmount, "AMOUNT_MISMATCH");

        Member storage m = member[podId][msg.sender];
        require(!m.joined && !m.closed, "ALREADY_MEMBER");

        m.joined = true;
        m.joinedAt = uint48(block.timestamp);
        uint256 rid = _mintReceipt(podId, msg.sender);
        p.membersJoined += 1;
        p.activeMembers += 1;
        p.totalDeposited += p.contributionAmount;

        podMembers[podId].push(msg.sender);

        emit MemberJoined(podId, msg.sender, rid);


        if (p.membersJoined >= MIN_MEMBERS_TO_ACTIVATE) {
            _activate(podId, p);
        }
    }


    function leavePod(uint256 podId) external whenNotPaused nonReentrant {
        Pod storage p = pods[podId];
        Member storage m = member[podId][msg.sender];
        require(m.joined && !m.closed, "NO_POSITION");

        uint256 principal = p.contributionAmount;
        uint256 interest;
        bool matured;

        if (!p.activated || p.cancelled) {
            m.closed = true;
            if (p.activeMembers > 0) p.activeMembers -= 1;

            (bool ok, ) = msg.sender.call{value: principal}("");
            require(ok, "REFUND_FAIL");

            receipt.upgradeTier(m.receiptId, SavingsReceipt1155.Tier.Gold);

            emit MemberLeft(podId, msg.sender, principal, 0, false);
            return;
        }

        (interest, matured) = _computeInterestForMember(p);

        if (_isFixed(p.planType) && !matured) {
            interest = 0;
        }

        m.closed = true;
        if (p.activeMembers > 0) p.activeMembers -= 1;

        (bool ok1, ) = msg.sender.call{value: principal}("");
        require(ok1, "PRINCIPAL_SEND_FAIL");

        if (interest > 0) {
            (bool ok2, ) = treasury.call(abi.encodeWithSignature("payOut(address,uint256)", msg.sender, interest));
            require(ok2, "TREASURY_CALL_FAIL");
        }

        receipt.upgradeTier(m.receiptId, SavingsReceipt1155.Tier.Gold);

        emit MemberLeft(podId, msg.sender, principal, interest, matured);
    }


    function getPodDetails(uint256 podId)
        external
        view
        returns (
            address creator,
            string memory name,
            string memory description,
            bool isPublic,
            uint8 planType,
            uint16 aprBps,
            uint48 term,
            uint128 contributionAmount,
            bool activated,
            uint48 startTime,
            uint48 maturityTime,
            bool cancelled,
            uint32 membersJoined,
            uint32 activeMembers,
            uint128 totalDeposited
        )
    {
        Pod storage p = pods[podId];
        creator = p.creator;
        name = p.name;
        description = p.description;
        isPublic = p.isPublic;
        planType = p.planType;
        aprBps = p.aprBps;
        term = p.term;
        contributionAmount = p.contributionAmount;
        activated = p.activated;
        startTime = p.startTime;
        maturityTime = p.maturityTime;
        cancelled = p.cancelled;
        membersJoined = p.membersJoined;
        activeMembers = p.activeMembers;
        totalDeposited = p.totalDeposited;
    }


    function getPublicPods(uint256 cursor, uint256 size)
        external
        view
        returns (
            uint256[] memory ids,
            string[] memory names,
            uint8[] memory planTypes,
            uint16[] memory aprs,
            uint128[] memory contributions,
            uint32[] memory joinedCounts,
            bool[] memory activatedFlags,
            uint256 nextCursor
        )
    {
        uint256 len = publicPodIds.length;
        if (cursor >= len) {
            return (new uint256[](0), new string[](0), new uint8[](0), new uint16[](0), new uint128[](0), new uint32[](0), new bool[](0), cursor);
        }

        uint256 end = cursor + size;
        if (end > len) end = len;
        uint256 n = end - cursor;

        ids = new uint256[](n);
        names = new string[](n);
        planTypes = new uint8[](n);
        aprs = new uint16[](n);
        contributions = new uint128[](n);
        joinedCounts = new uint32[](n);
        activatedFlags = new bool[](n);

        for (uint256 i = 0; i < n; i++) {
            uint256 podId = publicPodIds[cursor + i];
            Pod storage p = pods[podId];
            ids[i] = podId;
            names[i] = p.name;
            planTypes[i] = p.planType;
            aprs[i] = p.aprBps;
            contributions[i] = p.contributionAmount;
            joinedCounts[i] = p.membersJoined;
            activatedFlags[i] = p.activated;
        }

        nextCursor = end;
    }

    function getPodMemberCount(uint256 podId) external view returns (uint32 membersJoined, uint32 activeMembers) {
        Pod storage p = pods[podId];
        return (p.membersJoined, p.activeMembers);
    }


    function previewMemberInterest(uint256 podId, address user) external view returns (uint256) {
        Pod storage p = pods[podId];
        Member storage m = member[podId][user];
        if (!m.joined || m.closed || !p.activated) return 0;

        (uint256 interest, bool matured) = _computeInterestForMember(p);
        if (_isFixed(p.planType) && !matured) return 0;
        return interest;
    }


    function checkpoint(uint256 podId) external {
        Pod storage p = pods[podId];
        require(p.activated && !p.cancelled, "BAD_STATE");
        require(p.term > 0, "NO_TERM"); 
        require(block.timestamp >= p.startTime + (p.term / 2), "NOT_HALF");

        address[] storage members = podMembers[podId];
        for (uint256 i = 0; i < members.length; i++) {
            Member storage m = member[podId][members[i]];
            if (m.joined && !m.closed) {
                receipt.upgradeTier(m.receiptId, SavingsReceipt1155.Tier.Silver);
            }
        }
    }


    function _mintReceipt(uint256 podId, address user) private returns (uint256 rid) {

        rid = uint256(keccak256(abi.encodePacked(address(this), user, podId, block.timestamp, ++_nonce)));
        member[podId][user].receiptId = rid;
        receipt.mint(user, rid, SavingsReceipt1155.Tier.Bronze);
    }

    function _activate(uint256 podId, Pod storage p) private {
        p.activated = true;
        p.startTime = uint48(block.timestamp);
        if (p.term > 0) {
            p.maturityTime = uint48(uint256(p.startTime) + uint256(p.term));
        }
        emit PodActivated(podId, p.startTime, p.maturityTime);
    }

    function _deriveTermsAndApr(uint8 planType, uint48 customDays)
        internal
        pure
        returns (uint48 term, uint16 aprBps)
    {
        if (planType == uint8(PlanType.FLEX)) {
            term = 0;
            aprBps = APY_FLEX;
        } else if (planType == uint8(PlanType.CUSTOM_DAYS)) {
            require(customDays >= 1 && customDays <= MAX_CUSTOM / 1 days, "BAD_CUSTOM");
            term = customDays * 1 days;
            aprBps = APY_CUSTOM;
        } else if (planType == uint8(PlanType.FIXED_6M)) {
            term = SIX_MONTHS;
            aprBps = APY_6M;
        } else if (planType == uint8(PlanType.FIXED_1Y)) {
            term = ONE_YEAR;
            aprBps = APY_1Y;
        } else if (planType == uint8(PlanType.FIXED_2Y)) {
            term = TWO_YEARS;
            aprBps = APY_2Y;
        } else {
            revert("BAD_PLAN");
        }
    }

    function _isFixed(uint8 planType) internal pure returns (bool) {
        return (
            planType == uint8(PlanType.FIXED_6M) ||
            planType == uint8(PlanType.FIXED_1Y) ||
            planType == uint8(PlanType.FIXED_2Y)
        );
    }

    function _computeInterestForMember(Pod storage p) internal view returns (uint256 interest, bool matured) {
        if (p.planType == uint8(PlanType.FLEX)) {
            uint256 elapsed = block.timestamp - p.startTime;
            interest = uint256(p.contributionAmount).simple(APY_FLEX, elapsed);
            matured = false;
        } else if (p.planType == uint8(PlanType.CUSTOM_DAYS)) {
            uint256 elapsed = block.timestamp - p.startTime;
            if (elapsed > p.term) { elapsed = p.term; matured = true; } else { matured = false; }
            interest = uint256(p.contributionAmount).simple(APY_CUSTOM, elapsed);
        } else {
            matured = (p.term > 0 && block.timestamp >= p.startTime + p.term);
            if (matured) {
                interest = uint256(p.contributionAmount).simple(p.aprBps, p.term);
            } else {
                interest = 0;
            }
        }
    }
}
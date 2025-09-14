// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Ownable} from "openzeppelin-contracts/access/Ownable.sol";
import {Pausable} from "openzeppelin-contracts/utils/Pausable.sol";
import {ReentrancyGuard} from "openzeppelin-contracts/utils/ReentrancyGuard.sol";
import {SavingsReceipt1155} from "./SavingsReceipt1155.sol";
import {InterestCalculator} from "./InterestCalculator.sol";

/// @title PodsVault (group SavingsPods)
/// @notice Fixed one-time deposits per member; penalty redistribution; early-fill APR bonus; native STT
contract PodsVault is Ownable, Pausable, ReentrancyGuard {
    using InterestCalculator for uint256;

    uint256 public nextPodId;
    uint256 private _nonce; // unique receipt IDs

    struct Pod {
        // config
        uint48 term;
        uint48 startDeadline;
        uint16 aprBps;
        uint16 bonusAprBps;
        uint16 penaltyBps;
        uint32 minMembers;
        uint32 maxMembers;
        bool   allowEarlyExit;
        uint128 depositPerMember;

        // lifecycle
        bool   activated;
        bool   cancelled;
        bool   bonusApplied;
        uint48 startTime;
        uint48 maturityTime;

        // accounting
        uint32 membersJoined;
        uint32 activeMembers;    // remaining non-exited, non-claimed
        uint128 totalDeposited;
        uint128 penaltyPool;     // penalties accumulated
    }

    struct Member {
        bool joined;
        bool claimed;
        bool exited;
        uint256 receiptId;
    }

    mapping(uint256 => Pod) public pods;                         // podId => Pod
    mapping(uint256 => mapping(address => Member)) public member;// podId => user => Member
    mapping(uint256 => address[]) public podMembers;

    SavingsReceipt1155 public receipt;
    address public treasury; // MockTreasury

    event PodCreated(uint256 indexed podId);
    event Joined(uint256 indexed podId, address indexed user, uint256 amount, uint256 receiptId);
    event Activated(uint256 indexed podId, uint48 startTime, uint48 maturityTime, uint16 aprBpsEffective);
    event EarlyExit(uint256 indexed podId, address indexed user, uint256 refund, uint256 penalty);
    event Claimed(uint256 indexed podId, address indexed user, uint256 principal, uint256 interest, uint256 penaltyShare);
    event Cancelled(uint256 indexed podId);

    constructor(address _receipt, address _treasury) {
        receipt = SavingsReceipt1155(_receipt);
        treasury = _treasury;
    }

    receive() external payable {}

    // --- Admin ---
    struct CreateArgs {
        uint48 term;
        uint48 startDeadline;
        uint16 aprBps;
        uint16 bonusAprBps;
        uint16 penaltyBps;
        uint32 minMembers;
        uint32 maxMembers;
        bool   allowEarlyExit;
        uint128 depositPerMember;
    }

    function createPod(CreateArgs calldata a) external whenNotPaused returns (uint256 id) {
        require(a.minMembers > 0 && a.minMembers <= a.maxMembers, "BAD_THRESHOLDS");
        require(a.depositPerMember > 0, "NO_AMOUNT");
        require(a.startDeadline > block.timestamp, "PAST_DEADLINE");

        id = ++nextPodId;
        Pod storage p = pods[id];
        p.term = a.term;
        p.startDeadline = a.startDeadline;
        p.aprBps = a.aprBps;
        p.bonusAprBps = a.bonusAprBps;
        p.penaltyBps = a.penaltyBps;
        p.minMembers = a.minMembers;
        p.maxMembers = a.maxMembers;
        p.allowEarlyExit = a.allowEarlyExit;
        p.depositPerMember = a.depositPerMember;

        emit PodCreated(id);
    }

    function setTreasury(address t) external onlyOwner { treasury = t; }
    function pause() external onlyOwner { _pause(); }
    function unpause() external onlyOwner { _unpause(); }

    // --- User ---
    function joinPod(uint256 podId) external payable whenNotPaused nonReentrant {
        Pod storage p = pods[podId];
        require(!p.cancelled, "CANCELLED");
        require(!p.activated, "ALREADY_ACTIVE");
        require(block.timestamp <= p.startDeadline, "DEADLINE_PASSED");
        require(p.membersJoined < p.maxMembers, "POD_FULL");
        require(msg.value == p.depositPerMember, "AMOUNT_MISMATCH");

        Member storage m = member[podId][msg.sender];
        require(!m.joined, "ALREADY_JOINED");

        m.joined = true;
        p.membersJoined += 1;
        p.activeMembers  += 1;
        p.totalDeposited += p.depositPerMember;

        uint256 rid = uint256(keccak256(abi.encodePacked(address(this), msg.sender, podId, block.timestamp, ++_nonce)));
        m.receiptId = rid;
        receipt.mint(msg.sender, rid, SavingsReceipt1155.Tier.Bronze);
        podMembers[podId].push(msg.sender);

        emit Joined(podId, msg.sender, msg.value, rid);

        if (!p.activated && p.membersJoined >= p.minMembers) {
            _activate(podId, p);
        }
    }

    function activatePod(uint256 podId) external whenNotPaused {
        Pod storage p = pods[podId];
        require(!p.cancelled && !p.activated, "BAD_STATE");
        require(p.membersJoined >= p.minMembers, "THRESHOLD_NOT_MET");
        _activate(podId, p);
    }

    function _activate(uint256 podId, Pod storage p) internal {
        p.activated = true;
        p.startTime = uint48(block.timestamp);
        p.maturityTime = uint48(block.timestamp + p.term);

        if (block.timestamp < p.startDeadline && !p.bonusApplied && p.bonusAprBps > 0) {
            p.aprBps = uint16(uint256(p.aprBps) + p.bonusAprBps);
            p.bonusApplied = true;
        }
        emit Activated(podId, p.startTime, p.maturityTime, p.aprBps);
    }

    function earlyExit(uint256 podId) external nonReentrant whenNotPaused {
        Pod storage p = pods[podId];
        Member storage m = member[podId][msg.sender];
        require(p.allowEarlyExit, "NOT_ALLOWED");
        require(p.activated && !p.cancelled, "BAD_STATE");
        require(m.joined && !m.claimed && !m.exited, "NO_POSITION");
        require(block.timestamp < p.maturityTime, "ALREADY_MATURED");

        uint256 principal = p.depositPerMember;
        uint256 penalty   = (principal * p.penaltyBps) / 10_000;
        uint256 refund    = principal - penalty;

        m.exited = true;
        p.activeMembers -= 1;
        p.penaltyPool   += uint128(penalty);

        (bool ok, ) = msg.sender.call{value: refund}("");
        require(ok, "REFUND_FAIL");

        emit EarlyExit(podId, msg.sender, refund, penalty);
    }

    function claim(uint256 podId) external nonReentrant {
        Pod storage p = pods[podId];
        Member storage m = member[podId][msg.sender];
        require(p.activated && !p.cancelled, "BAD_STATE");
        require(block.timestamp >= p.maturityTime, "NOT_MATURED");
        require(m.joined && !m.claimed && !m.exited, "NO_POSITION");
        require(p.activeMembers > 0, "NO_ACTIVE");

        m.claimed = true;

        // principal + fair share of penalty pool
        uint256 principal = p.depositPerMember;
        uint256 share;
        if (p.activeMembers == 1) {
            // last claimant gets all remaining penalties (no dust)
            share = p.penaltyPool;
        } else {
            share = uint256(p.penaltyPool) / p.activeMembers;
        }

        // interest for full term (paid from Treasury)
        uint256 interest = principal.simple(p.aprBps, p.term);

        // pay principal + penalty share from vault
        uint256 toSend = principal + share;
        (bool ok1, ) = msg.sender.call{value: toSend}("");
        require(ok1, "PRINCIPAL_SEND_FAIL");

        // decrease pool & active count AFTER computing share
        if (share > 0) {
            p.penaltyPool = uint128(uint256(p.penaltyPool) - share);
        }
        p.activeMembers -= 1;

        // pay interest from Treasury
        (bool ok2, ) = treasury.call(abi.encodeWithSignature("payOut(address,uint256)", msg.sender, interest));
        require(ok2, "TREASURY_CALL_FAIL");

        // upgrade receipt to Gold
        receipt.upgradeTier(m.receiptId, SavingsReceipt1155.Tier.Gold);

        emit Claimed(podId, msg.sender, principal, interest, share);
    }

    function cancelPod(uint256 podId) external {
        Pod storage p = pods[podId];
        require(!p.activated && !p.cancelled, "BAD_STATE");
        require(block.timestamp > p.startDeadline, "NOT_PAST_DEADLINE");
        require(p.membersJoined < p.minMembers, "THRESHOLD_MET");
        p.cancelled = true;
        emit Cancelled(podId);
    }

    function refundCancelled(uint256 podId) external nonReentrant {
        Pod storage p = pods[podId];
        Member storage m = member[podId][msg.sender];
        require(p.cancelled && !p.activated, "NOT_CANCELLED");
        require(m.joined && !m.claimed && !m.exited, "NO_POSITION");
        m.claimed = true;

        (bool ok, ) = msg.sender.call{value: p.depositPerMember}("");
        require(ok, "REFUND_FAIL");
    }
}

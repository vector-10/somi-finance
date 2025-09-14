// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Ownable} from "openzeppelin-contracts/access/Ownable.sol";
import {Pausable} from "openzeppelin-contracts/utils/Pausable.sol";
import {ReentrancyGuard} from "openzeppelin-contracts/utils/ReentrancyGuard.sol";
import {SavingsReceipt1155} from "./SavingsReceipt1155.sol";
import {InterestCalculator} from "./InterestCalculator.sol";

/// @title SavingsPool (Solo plans)
/// @notice Solo savings in native STT; principal stays here; interest from Treasury
contract SavingsPool is Ownable, Pausable, ReentrancyGuard {
    using InterestCalculator for uint256;

    struct Plan { uint48 term; uint16 aprBps; bool active; }
    struct Position { uint128 amount; uint48 start; bool claimed; uint256 receiptId; }

    uint256 public nextPlanId;
    mapping(uint256 => Plan) public plans;                         // planId => Plan
    mapping(address => mapping(uint256 => Position)) public pos;   // user => planId => Position

    SavingsReceipt1155 public receipt;
    address public treasury; // MockTreasury
    uint256 private _nonce;  // for unique receiptIds

    event PlanCreated(uint256 indexed planId, uint48 term, uint16 aprBps);
    event PlanStatus(uint256 indexed planId, bool active);
    event Deposited(address indexed user, uint256 indexed planId, uint256 amount, uint256 receiptId);
    event Claimed(address indexed user, uint256 indexed planId, uint256 principal, uint256 interest);

    constructor(address _receipt, address _treasury) {
        receipt = SavingsReceipt1155(_receipt);
        treasury = _treasury;
    }

    receive() external payable {} 

    // --- Admin ---
    function createPlan(uint48 term, uint16 aprBps) external onlyOwner returns (uint256 id) {
        id = nextPlanId++;
        plans[id] = Plan(term, aprBps, true);
        emit PlanCreated(id, term, aprBps);
    }

    function setPlanActive(uint256 planId, bool active) external onlyOwner {
        plans[planId].active = active;
        emit PlanStatus(planId, active);
    }

    function setTreasury(address t) external onlyOwner { treasury = t; }
    function pause() external onlyOwner { _pause(); }
    function unpause() external onlyOwner { _unpause(); }

    // --- User ---
    /// @notice Deposit native STT into a plan (one active position per user/plan)
    function deposit(uint256 planId) external payable whenNotPaused nonReentrant {
        Plan memory p = plans[planId];
        require(p.active, "PLAN_INACTIVE");
        require(msg.value > 0, "NO_AMOUNT");
        Position storage position = pos[msg.sender][planId];
        require(position.amount == 0 || position.claimed, "ALREADY_ACTIVE");

        // unique receipt id per deposit across contracts
        uint256 rid = uint256(keccak256(abi.encodePacked(address(this), msg.sender, planId, block.timestamp, ++_nonce)));
        position.amount    = uint128(msg.value);
        position.start     = uint48(block.timestamp);
        position.claimed   = false;
        position.receiptId = rid;

        receipt.mint(msg.sender, rid, SavingsReceipt1155.Tier.Bronze);
        emit Deposited(msg.sender, planId, msg.value, rid);
    }

    /// @notice Preview interest as of now (capped at full term)
    function previewInterest(address user, uint256 planId) external view returns (uint256) {
        Position memory position = pos[user][planId];
        if (position.amount == 0 || position.claimed) return 0;
        Plan memory p = plans[planId];
        uint256 elapsed = block.timestamp - position.start;
        if (elapsed > p.term) elapsed = p.term;
        return uint256(position.amount).simple(p.aprBps, elapsed);
    }

    /// @notice Claim principal (from this contract) and interest (from Treasury) at maturity
    function claim(uint256 planId) external nonReentrant {
        Position storage position = pos[msg.sender][planId];
        require(position.amount > 0 && !position.claimed, "NO_POSITION");
        Plan memory p = plans[planId];
        require(block.timestamp >= position.start + p.term, "NOT_MATURED");

        uint256 principal = position.amount;
        uint256 interest  = uint256(position.amount).simple(p.aprBps, p.term);
        position.claimed  = true;

        // Upgrade to Gold
        receipt.upgradeTier(position.receiptId, SavingsReceipt1155.Tier.Gold);

        // principal from pool
        (bool ok1, ) = msg.sender.call{value: principal}("");
        require(ok1, "PRINCIPAL_SEND_FAIL");

        // interest from treasury
        (bool ok2, ) = treasury.call(abi.encodeWithSignature("payOut(address,uint256)", msg.sender, interest));
        require(ok2, "TREASURY_CALL_FAIL");

        emit Claimed(msg.sender, planId, principal, interest);
    }

    /// @notice Optional: upgrade to Silver after half the term (visual milestone)
    function upgradeToSilver(uint256 planId) external {
        Position memory position = pos[msg.sender][planId];
        require(position.amount > 0 && !position.claimed, "NO_POSITION");
        Plan memory p = plans[planId];
        require(block.timestamp >= position.start + p.term / 2, "NOT_HALF");
        receipt.upgradeTier(position.receiptId, SavingsReceipt1155.Tier.Silver);
    }
}

// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Ownable} from "openzeppelin-contracts/access/Ownable.sol";
import {Pausable} from "openzeppelin-contracts/utils/Pausable.sol";
import {ReentrancyGuard} from "openzeppelin-contracts/utils/ReentrancyGuard.sol";
import {SavingsReceipt1155} from "./SavingsReceipt1155.sol";
import {InterestCalculator} from "./InterestCalculator.sol";


contract SavingsPool is Ownable, Pausable, ReentrancyGuard {
    using InterestCalculator for uint256;

    uint48 private constant SIX_MONTHS = 180 days;
    uint48 private constant ONE_YEAR   = 365 days;
    uint48 private constant TWO_YEARS  = 730 days;
    uint48 private constant MAX_CUSTOM = 150 days;

    uint16 private constant APY_FLEX    = 1000;
    uint16 private constant APY_CUSTOM  = 1200;
    uint16 private constant APY_6M      = 1800; 
    uint16 private constant APY_1Y      = 2000; 
    uint16 private constant APY_2Y      = 3000; 

    enum PlanType { FLEX, CUSTOM_DAYS, FIXED_6M, FIXED_1Y, FIXED_2Y }

    struct Position {
        address owner;
        uint128 principal;
        uint48  start;     
        uint48  term;      
        uint16  aprBps;  
        uint8   planType;  
        bool    closed;
        uint256 receiptId;  
    }

    uint256 public nextPositionId;
    mapping(uint256 => Position) public positions;             
    mapping(address => uint256[]) private _userPositions;      

    mapping(uint8 => bool) public planActive; 

    SavingsReceipt1155 public receipt;
    address public treasury; 
    event TreasurySet(address indexed newTreasury);

    event PositionOpened(
        address indexed user,
        uint256 indexed positionId,
        uint8   planType,
        uint256 amount,
        uint48  term,
        uint16  aprBps,
        uint256 receiptId
    );

    event PositionClosed(
        address indexed user,
        uint256 indexed positionId,
        uint256 principal,
        uint256 interest,
        bool    matured
    );


    constructor(address _receipt, address _treasury) {
        require(_receipt != address(0) && _treasury != address(0), "ZERO_ADDR");
        receipt = SavingsReceipt1155(_receipt);
        treasury = _treasury;

 
        planActive[uint8(PlanType.FLEX)]       = true;
        planActive[uint8(PlanType.CUSTOM_DAYS)] = true;
        planActive[uint8(PlanType.FIXED_6M)]   = true;
        planActive[uint8(PlanType.FIXED_1Y)]   = true;
        planActive[uint8(PlanType.FIXED_2Y)]   = true;
    }

    receive() external payable {}

    function setTreasury(address t) external onlyOwner {
        require(t != address(0), "ZERO_ADDR");
        treasury = t;
        emit TreasurySet(t);
    }

    function setPlanActive(uint8 planType, bool active) external onlyOwner {
        require(planType <= uint8(PlanType.FIXED_2Y), "BAD_PLAN");
        planActive[planType] = active;
    }

    function pause() external onlyOwner { _pause(); }
    function unpause() external onlyOwner { _unpause(); }

    function deposit(uint8 planType, uint48 customDays)
        external
        payable
        whenNotPaused
        nonReentrant
        returns (uint256 positionId)
    {
        require(planType <= uint8(PlanType.FIXED_2Y), "BAD_PLAN");
        require(planActive[planType], "PLAN_INACTIVE");
        require(msg.value > 0, "NO_AMOUNT");

        (uint48 term, uint16 aprBps) = _deriveTermsAndApr(planType, customDays);

        positionId = ++nextPositionId;

        positions[positionId] = Position({
            owner:     msg.sender,
            principal: uint128(msg.value),
            start:     uint48(block.timestamp),
            term:      term,
            aprBps:    aprBps,
            planType:  planType,
            closed:    false,
            receiptId: positionId
        });

        _userPositions[msg.sender].push(positionId);

        receipt.mint(msg.sender, positionId, SavingsReceipt1155.Tier.Bronze);

        emit PositionOpened(msg.sender, positionId, planType, msg.value, term, aprBps, positionId);
    }


    function closePosition(uint256 positionId) external nonReentrant {
        Position storage p = positions[positionId];
        require(p.owner == msg.sender, "NOT_OWNER");
        require(!p.closed, "ALREADY_CLOSED");

        (uint256 interest, bool matured) = _computeInterestState(p);


        p.closed = true;


        (bool ok1, ) = msg.sender.call{value: p.principal}("");
        require(ok1, "PRINCIPAL_SEND_FAIL");


        if (interest > 0) {
            (bool ok2, ) = treasury.call(abi.encodeWithSignature("payOut(address,uint256)", msg.sender, interest));
            require(ok2, "TREASURY_CALL_FAIL");
        }

        receipt.upgradeTier(p.receiptId, SavingsReceipt1155.Tier.Gold);

        emit PositionClosed(msg.sender, positionId, p.principal, interest, matured);
    }


    function previewInterest(uint256 positionId) external view returns (uint256) {
        Position memory p = positions[positionId];
        require(p.owner != address(0), "NO_POSITION");
        (uint256 interest, ) = _computeInterestStateView(p);
        return interest;
    }


    function getUserPositionsPaginated(address user, uint256 cursor, uint256 size)
        external
        view
        returns (PositionView[] memory items, uint256 nextCursor)
    {
         uint256[] storage list = _userPositions[user];
        uint256 len = list.length;
        if (cursor >= len) {
            return (new PositionView[](0), cursor);  
        }

        uint256 end = cursor + size;
        if (end > len) end = len;
        uint256 n = end - cursor;

        items = new PositionView[](n);
        for (uint256 i = 0; i < n; i++) {
            uint256 id = list[cursor + i];
            Position storage p = positions[id];
            items[i] = PositionView({
                id: id,
                planType: p.planType,
                principal: p.principal,
                start: p.start,
                term: p.term,
                aprBps: p.aprBps,
                closed: p.closed,
                receiptId: p.receiptId
            });
        }
        nextCursor = end;
    }


    function checkpoint(uint256 positionId) external {
        Position storage p = positions[positionId];
        require(p.owner != address(0), "NO_POSITION");
        require(!p.closed, "CLOSED");
        require(p.term > 0, "NO_TERM"); 
        require(block.timestamp >= p.start + (p.term / 2), "NOT_HALF");
        receipt.upgradeTier(p.receiptId, SavingsReceipt1155.Tier.Silver);
    }

    struct PositionView {
        uint256 id;
        uint8   planType;
        uint128 principal;
        uint48  start;
        uint48  term;
        uint16  aprBps;
        bool    closed;
        uint256 receiptId;
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

    function _computeInterestState(Position storage p) internal view returns (uint256 interest, bool matured) {
        if (p.planType == uint8(PlanType.FLEX)) {
            uint256 elapsed = block.timestamp - p.start;
            interest = uint256(p.principal).simple(APY_FLEX, elapsed);
            matured = false;
        } else if (p.planType == uint8(PlanType.CUSTOM_DAYS)) {
            uint256 elapsed = block.timestamp - p.start;
            if (elapsed > p.term) { elapsed = p.term; matured = true; } else { matured = false; }
            interest = uint256(p.principal).simple(APY_CUSTOM, elapsed);
        } else {

            matured = (block.timestamp >= p.start + p.term);
            if (matured) {
                interest = uint256(p.principal).simple(p.aprBps, p.term);
            } else {
                interest = 0;
            }
        }
    }

    function _computeInterestStateView(Position memory p) internal view returns (uint256 interest, bool matured) {
        if (p.planType == uint8(PlanType.FLEX)) {
            uint256 elapsed = block.timestamp - p.start;
            interest = uint256(p.principal).simple(APY_FLEX, elapsed);
            matured = false;
        } else if (p.planType == uint8(PlanType.CUSTOM_DAYS)) {
            uint256 elapsed = block.timestamp - p.start;
            if (elapsed > p.term) { elapsed = p.term; matured = true; } else { matured = false; }
            interest = uint256(p.principal).simple(APY_CUSTOM, elapsed);
        } else {
            matured = (block.timestamp >= p.start + p.term);
            if (matured) {
                interest = uint256(p.principal).simple(p.aprBps, p.term);
            } else {
                interest = 0;
            }
        }
    }
}

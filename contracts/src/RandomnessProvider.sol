// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

interface VRFCoordinatorV2Interface {
    function requestRandomWords(
        bytes32 keyHash,
        uint64 subId,
        uint16 minimumRequestConfirmations,
        uint32 callbackGasLimit,
        uint32 numWords
    ) external returns (uint256 requestId);
}

interface VRFConsumerBaseV2Interface {
    function rawFulfillRandomWords(uint256 requestId, uint256[] memory randomWords) external;
}

contract RandomnessProvider is AccessControl, ReentrancyGuard, VRFConsumerBaseV2Interface {
    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");
    bytes32 public constant REQUESTER_ROLE = keccak256("REQUESTER_ROLE");

    VRFCoordinatorV2Interface public immutable vrfCoordinator;
    bytes32 public keyHash;
    uint64 public subscriptionId;
    uint16 public requestConfirmations = 3;
    uint32 public callbackGasLimit = 2500000;

    enum RequestType {
        POD_MATCHING,
        LOTTERY_WINNER,
        NFT_TRAITS,
        GENERAL_RANDOM
    }

    struct RandomRequest {
        address requester;
        RequestType requestType;
        uint256 timestamp;
        bool fulfilled;
        uint256[] randomWords;
        bytes extraData;
    }

    mapping(uint256 => RandomRequest) public requests;
    mapping(address => uint256[]) public userRequests;
    uint256[] public pendingRequests;

    event RandomnessRequested(
        uint256 indexed requestId,
        address indexed requester,
        RequestType indexed requestType,
        uint32 numWords
    );
    
    event RandomnessFulfilled(
        uint256 indexed requestId,
        address indexed requester,
        uint256[] randomWords
    );

    event PodMatchingComplete(
        uint256 indexed requestId,
        address[] participants,
        uint256[] podAssignments
    );

    constructor(
        address _vrfCoordinator,
        bytes32 _keyHash,
        uint64 _subscriptionId
    ) {
        vrfCoordinator = VRFCoordinatorV2Interface(_vrfCoordinator);
        keyHash = _keyHash;
        subscriptionId = _subscriptionId;
        
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(ADMIN_ROLE, msg.sender);
        _grantRole(REQUESTER_ROLE, msg.sender);
    }

    function requestPodMatching(
        address[] calldata participants,
        uint256 maxPodSize
    ) external onlyRole(REQUESTER_ROLE) returns (uint256 requestId) {
        require(participants.length > 1, "Need at least 2 participants");
        require(maxPodSize > 1, "Pod size must be > 1");

        bytes memory extraData = abi.encode(participants, maxPodSize);
        
        requestId = vrfCoordinator.requestRandomWords(
            keyHash,
            subscriptionId,
            requestConfirmations,
            callbackGasLimit,
            1
        );

        requests[requestId] = RandomRequest({
            requester: msg.sender,
            requestType: RequestType.POD_MATCHING,
            timestamp: block.timestamp,
            fulfilled: false,
            randomWords: new uint256[](0),
            extraData: extraData
        });

        userRequests[msg.sender].push(requestId);
        pendingRequests.push(requestId);

        emit RandomnessRequested(requestId, msg.sender, RequestType.POD_MATCHING, 1);
        return requestId;
    }

    function requestLotteryWinner(
        address[] calldata participants
    ) external onlyRole(REQUESTER_ROLE) returns (uint256 requestId) {
        require(participants.length > 0, "No participants");

        bytes memory extraData = abi.encode(participants);
        
        requestId = vrfCoordinator.requestRandomWords(
            keyHash,
            subscriptionId,
            requestConfirmations,
            callbackGasLimit,
            1
        );

        requests[requestId] = RandomRequest({
            requester: msg.sender,
            requestType: RequestType.LOTTERY_WINNER,
            timestamp: block.timestamp,
            fulfilled: false,
            randomWords: new uint256[](0),
            extraData: extraData
        });

        userRequests[msg.sender].push(requestId);
        pendingRequests.push(requestId);

        emit RandomnessRequested(requestId, msg.sender, RequestType.LOTTERY_WINNER, 1);
        return requestId;
    }

    function requestNFTTraits(
        uint256 tokenId,
        uint32 numTraits
    ) external onlyRole(REQUESTER_ROLE) returns (uint256 requestId) {
        require(numTraits > 0 && numTraits <= 10, "Invalid trait count");

        bytes memory extraData = abi.encode(tokenId, numTraits);
        
        requestId = vrfCoordinator.requestRandomWords(
            keyHash,
            subscriptionId,
            requestConfirmations,
            callbackGasLimit,
            numTraits
        );

        requests[requestId] = RandomRequest({
            requester: msg.sender,
            requestType: RequestType.NFT_TRAITS,
            timestamp: block.timestamp,
            fulfilled: false,
            randomWords: new uint256[](0),
            extraData: extraData
        });

        userRequests[msg.sender].push(requestId);
        pendingRequests.push(requestId);

        emit RandomnessRequested(requestId, msg.sender, RequestType.NFT_TRAITS, numTraits);
        return requestId;
    }

    function requestGeneralRandom(
        uint32 numWords,
        bytes calldata extraData
    ) external onlyRole(REQUESTER_ROLE) returns (uint256 requestId) {
        require(numWords > 0 && numWords <= 100, "Invalid word count");
        
        requestId = vrfCoordinator.requestRandomWords(
            keyHash,
            subscriptionId,
            requestConfirmations,
            callbackGasLimit,
            numWords
        );

        requests[requestId] = RandomRequest({
            requester: msg.sender,
            requestType: RequestType.GENERAL_RANDOM,
            timestamp: block.timestamp,
            fulfilled: false,
            randomWords: new uint256[](0),
            extraData: extraData
        });

        userRequests[msg.sender].push(requestId);
        pendingRequests.push(requestId);

        emit RandomnessRequested(requestId, msg.sender, RequestType.GENERAL_RANDOM, numWords);
        return requestId;
    }

    function rawFulfillRandomWords(uint256 requestId, uint256[] memory randomWords) external override {
        require(msg.sender == address(vrfCoordinator), "Only VRF Coordinator");
        require(requests[requestId].requester != address(0), "Request not found");
        require(!requests[requestId].fulfilled, "Request already fulfilled");

        requests[requestId].randomWords = randomWords;
        requests[requestId].fulfilled = true;

        _removePendingRequest(requestId);
        _processRandomness(requestId, randomWords);

        emit RandomnessFulfilled(requestId, requests[requestId].requester, randomWords);
    }

    function _processRandomness(uint256 requestId, uint256[] memory randomWords) internal {
        RandomRequest memory request = requests[requestId];
        
        if (request.requestType == RequestType.POD_MATCHING) {
            _processPodMatching(requestId, randomWords[0]);
        }
    }

    function _processPodMatching(uint256 requestId, uint256 randomWord) internal {
        RandomRequest memory request = requests[requestId];
        (address[] memory participants, uint256 maxPodSize) = abi.decode(request.extraData, (address[], uint256));
        
        uint256[] memory podAssignments = new uint256[](participants.length);
        uint256[] memory shuffledIndices = _shuffle(participants.length, randomWord);
        
        uint256 currentPod = 0;
        uint256 membersInCurrentPod = 0;
        
        for (uint256 i = 0; i < participants.length; i++) {
            if (membersInCurrentPod >= maxPodSize) {
                currentPod++;
                membersInCurrentPod = 0;
            }
            
            podAssignments[shuffledIndices[i]] = currentPod;
            membersInCurrentPod++;
        }
        
        emit PodMatchingComplete(requestId, participants, podAssignments);
    }

    function _shuffle(uint256 length, uint256 seed) internal pure returns (uint256[] memory) {
        uint256[] memory indices = new uint256[](length);
        for (uint256 i = 0; i < length; i++) {
            indices[i] = i;
        }
        
        for (uint256 i = length - 1; i > 0; i--) {
            uint256 j = uint256(keccak256(abi.encode(seed, i))) % (i + 1);
            (indices[i], indices[j]) = (indices[j], indices[i]);
        }
        
        return indices;
    }

    function _removePendingRequest(uint256 requestId) internal {
        for (uint256 i = 0; i < pendingRequests.length; i++) {
            if (pendingRequests[i] == requestId) {
                pendingRequests[i] = pendingRequests[pendingRequests.length - 1];
                pendingRequests.pop();
                break;
            }
        }
    }

    function getRandomWords(uint256 requestId) external view returns (uint256[] memory) {
        require(requests[requestId].fulfilled, "Request not fulfilled");
        return requests[requestId].randomWords;
    }

    function getRequestStatus(uint256 requestId) external view returns (
        address requester,
        RequestType requestType,
        uint256 timestamp,
        bool fulfilled,
        uint256[] memory randomWords
    ) {
        RandomRequest memory request = requests[requestId];
        return (
            request.requester,
            request.requestType,
            request.timestamp,
            request.fulfilled,
            request.randomWords
        );
    }

    function getUserRequests(address user) external view returns (uint256[] memory) {
        return userRequests[user];
    }

    function getPendingRequests() external view returns (uint256[] memory) {
        return pendingRequests;
    }

    function updateVRFConfig(
        bytes32 _keyHash,
        uint64 _subscriptionId,
        uint16 _requestConfirmations,
        uint32 _callbackGasLimit
    ) external onlyRole(ADMIN_ROLE) {
        keyHash = _keyHash;
        subscriptionId = _subscriptionId;
        requestConfirmations = _requestConfirmations;
        callbackGasLimit = _callbackGasLimit;
    }

    function emergencyCancel(uint256 requestId) external onlyRole(ADMIN_ROLE) {
        require(!requests[requestId].fulfilled, "Request already fulfilled");
        _removePendingRequest(requestId);
        delete requests[requestId];
    }
}
// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract BountyManager {
    error BountyDoesNotExist();
    error BountyHasExpired();
    error OnlyBountyOwner();
    error BountyIdEmpty();
    error ExpirationDateInPast();
    error BountyIdAlreadyExists();
    error ZeroAddressNotAllowed();
    error BountyHasNoValueLeft();
    error InvalidCurrency();
    error BountyHashAlreadyExists();
    error AnswerIdAlreadyExists();
    error AnswerIdDoesNotExist();

    event BountyCreated(
        bytes indexed bountyId,
        address indexed owner,
        uint256 expirationDate
    );
    event BountyExpired(bytes indexed bountyId, address indexed owner);
    // event BountyClosed(bytes indexed bountyId, address indexed owner);
    event BountyPaidOut(
        bytes indexed bountyId,
        address indexed recipient,
        uint256 amount
    );

    enum Currency {
        WLD,
        USDC
    }

    struct BountyData {
        bytes bountyId;
        address owner;
        Currency currency;
        uint256 perProofValue;
        uint256 totalValueLeft;
        uint256 expirationDate;
        bool isActive;
    }

    struct AnswerData {
        bytes answerId;
        address answerer;
    }

    mapping(address => bytes[]) public bountyOwnerToBounties;
    mapping(bytes => BountyData) public bountiesToBountyData;
    mapping(bytes => bytes) public dataHashToBountyId;
    mapping(bytes => AnswerData[]) public bountyIdToAnswers;
    address public usdc;

    // THIS IS NOT PRODUCTION READY, WE USED THIS AS A FORM OF ONCHAIN INDEXING
    // SO WE DONT HAVE TO INDEX EVENTS OR USE A DB FOR THIS HACKATHON
    bytes[] public openBountyIds;

    modifier onlyBountyOwner(bytes memory bountyId) {
        if (bountiesToBountyData[bountyId].owner != msg.sender)
            revert OnlyBountyOwner();
        _;
    }

    modifier bountyExists(bytes memory bountyId) {
        if (bountiesToBountyData[bountyId].owner == address(0))
            revert BountyDoesNotExist();
        _;
    }

    constructor(address _usdc) {
        usdc = _usdc;
    }

    function createBounty(
        bytes memory bountyId,
        address bountyOwner,
        Currency currency,
        uint256 perProofValue,
        uint256 totalValueLeft,
        uint256 expirationDate,
        bytes memory dataHash
    ) external {
        if (bountyId.length == 0) revert BountyIdEmpty();
        if (bountyOwner == address(0)) revert ZeroAddressNotAllowed();
        if (expirationDate <= block.timestamp) revert ExpirationDateInPast();
        if (bountiesToBountyData[bountyId].owner != address(0))
            revert BountyIdAlreadyExists();
        if (dataHashToBountyId[dataHash].length > 0)
            revert BountyHashAlreadyExists();

        BountyData memory newBounty = BountyData({
            bountyId: bountyId,
            owner: bountyOwner,
            currency: currency,
            perProofValue: perProofValue,
            totalValueLeft: totalValueLeft,
            expirationDate: expirationDate,
            isActive: true
        });

        bountyOwnerToBounties[bountyOwner].push(bountyId);
        bountiesToBountyData[bountyId] = newBounty;
        dataHashToBountyId[dataHash] = bountyId;

        openBountyIds.push(bountyId);

        emit BountyCreated(bountyId, bountyOwner, expirationDate);
    }

    function answerBounty(
        bytes memory bountyId,
        bytes memory answerId,
        address answerer
    ) external {
        if (bountiesToBountyData[bountyId].owner == address(0)) revert BountyDoesNotExist();
        if (bountiesToBountyData[bountyId].expirationDate < block.timestamp) revert BountyHasExpired();

        for (uint256 i = 0; i < bountyIdToAnswers[bountyId].length; i++) {
            if (keccak256(bountyIdToAnswers[bountyId][i].answerId) == keccak256(answerId)) {
                revert AnswerIdAlreadyExists();
            }
        }

        bountyIdToAnswers[bountyId].push(AnswerData({answerId: answerId, answerer: answerer}));
    }

    function payoutBounty(
        bytes memory bountyId,
        bytes memory answerId
    ) public bountyExists(bountyId) onlyBountyOwner(bountyId) {
        BountyData storage bounty = bountiesToBountyData[bountyId];
        if (bounty.totalValueLeft < bounty.perProofValue) revert BountyHasNoValueLeft();
        if (bounty.expirationDate < block.timestamp) revert BountyHasExpired();

        address recipient;
        for (uint256 i = 0; i < bountyIdToAnswers[bountyId].length; i++) {
            if (keccak256(bountyIdToAnswers[bountyId][i].answerId) == keccak256(answerId)) {
                recipient = bountyIdToAnswers[bountyId][i].answerer;
                break;
            }
        }

        if (recipient == address(0)) revert AnswerIdDoesNotExist();

        bounty.totalValueLeft -= bounty.perProofValue;

        if (bounty.currency == Currency.WLD) {
            payable(recipient).transfer(bounty.perProofValue);
        } else if (bounty.currency == Currency.USDC) {
            IERC20(usdc).transfer(recipient, bounty.perProofValue);
        } else {
            revert InvalidCurrency();
        }

        emit BountyPaidOut(bountyId, recipient, bounty.perProofValue);
    }

    function payoutBountyBatch(
        bytes[] memory bountyIds,
        bytes[] memory answerIds
    ) external {
        for (uint256 i = 0; i < bountyIds.length; i++) {
            payoutBounty(bountyIds[i], answerIds[i]);
        }
    }

    // function closeBounty(
    //     bytes memory bountyId
    // ) public bountyExists(bountyId) onlyBountyOwner(bountyId) {
    //     bountiesToBountyData[bountyId].isActive = false;

    //     _removeFromOpenBounties(bountyId);

    //     emit BountyClosed(bountyId, msg.sender);
    // }

    function _removeFromOpenBounties(bytes memory bountyId) internal {
        for (uint256 i = 0; i < openBountyIds.length; i++) {
            if (keccak256(openBountyIds[i]) == keccak256(bountyId)) {
                openBountyIds[i] = openBountyIds[openBountyIds.length - 1];
                openBountyIds.pop();
                break;
            }
        }
    }

    function getBountiesByOwner(
        address owner
    ) public view returns (bytes[] memory) {
        return bountyOwnerToBounties[owner];
    }

    function getAllOpenBounties() public view returns (bytes[] memory) {
        return openBountyIds;
    }

    function getBountyData(
        bytes memory bountyId
    ) public view bountyExists(bountyId) returns (BountyData memory) {
        return bountiesToBountyData[bountyId];
    }

    function isBountyExpired(bytes memory bountyId) public view returns (bool) {
        return block.timestamp >= bountiesToBountyData[bountyId].expirationDate;
    }

    function getOpenBountyCount() public view returns (uint256) {
        return openBountyIds.length;
    }

    function getBountyCountByOwner(
        address owner
    ) public view returns (uint256) {
        return bountyOwnerToBounties[owner].length;
    }

    function getAnswersByBountyId(
        bytes memory bountyId
    ) public view returns (AnswerData[] memory) {
        return bountyIdToAnswers[bountyId];
    }

    function getBountyIdByDataHash(
        bytes memory dataHash
    ) public view returns (bytes memory) {
        return dataHashToBountyId[dataHash];
    }

    function cleanupExpiredBounties(bytes[] memory bountyIds) external {
        for (uint256 i = 0; i < bountyIds.length; i++) {
            bytes memory bountyId = bountyIds[i];
            BountyData storage bounty = bountiesToBountyData[bountyId];

            if (bounty.isActive && isBountyExpired(bountyId)) {
                bounty.isActive = false;
                _removeFromOpenBounties(bountyId);
                emit BountyExpired(bountyId, bounty.owner);
            }
        }
    }

    receive() external payable {}
}

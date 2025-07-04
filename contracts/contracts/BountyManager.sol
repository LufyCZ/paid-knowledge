// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

contract BountyManager {
    error BountyDoesNotExist();
    error OnlyBountyOwner();
    error BountyIdEmpty();
    error ExpirationDateInPast();
    error BountyIdAlreadyExists();

    struct BountyData {
        bytes bountyId;
        address owner;
        uint256 expirationDate;
        bool isActive;
    }

    mapping(address => bytes[]) public bountyOwnerToBounties;
    mapping(bytes => BountyData) public bountiesToBountyData;

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

    function createBounty(
        bytes memory bountyId,
        uint256 expirationDate
    ) public {
        if (bountyId.length == 0) revert BountyIdEmpty();
        if (expirationDate <= block.timestamp) revert ExpirationDateInPast();
        if (bountiesToBountyData[bountyId].owner != address(0))
            revert BountyIdAlreadyExists();

        BountyData memory newBounty = BountyData({
            bountyId: bountyId,
            owner: msg.sender,
            expirationDate: expirationDate,
            isActive: true
        });

        bountyOwnerToBounties[msg.sender].push(bountyId);
        bountiesToBountyData[bountyId] = newBounty;

        openBountyIds.push(bountyId);
    }

    function closeBounty(
        bytes memory bountyId
    )
        public
        bountyExists(bountyId)
        onlyBountyOwner(bountyId)
    {
        bountiesToBountyData[bountyId].isActive = false;

        // removeFromBounties(bountyId);
    }
}

// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

contract BountyManager {
    error BountyDoesNotExist();
    error BountyHasExpired();
    error OnlyBountyOwner();
    error BountyIdEmpty();
    error ExpirationDateInPast();
    error BountyIdAlreadyExists();

    event BountyCreated(
        bytes indexed bountyId,
        address indexed owner,
        uint256 expirationDate
    );
    event BountyExpired(bytes indexed bountyId, address indexed owner);
    event BountyClosed(bytes indexed bountyId, address indexed owner);

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

        emit BountyCreated(bountyId, msg.sender, expirationDate);
    }

    function closeBounty(
        bytes memory bountyId
    )
        public
        bountyExists(bountyId)
        onlyBountyOwner(bountyId)
    {
        bountiesToBountyData[bountyId].isActive = false;

        _removeFromOpenBounties(bountyId);

        emit BountyClosed(bountyId, msg.sender);
    }

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
}

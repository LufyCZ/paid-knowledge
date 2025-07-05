import { expect } from "chai";
import { network } from "hardhat";
import type { BountyManager } from "../types/ethers-contracts/BountyManager.js";
import { BountyManager__factory } from "../types/ethers-contracts/factories/BountyManager__factory.js";

const { ethers: ethersInstance } = await network.connect();

describe("BountyManager", function () {
    let bountyManager: BountyManager;
    let owner: any;
    let user1: any;
    let user2: any;
    let user3: any;

    async function getFutureTimestamp(secondsFromNow: number = 3600): Promise<number> {
        const currentBlock = await ethersInstance.provider.getBlock("latest");
        return currentBlock!.timestamp + secondsFromNow;
    }

    beforeEach(async function () {
        [owner, user1, user2, user3] = await ethersInstance.getSigners();

        bountyManager = await new BountyManager__factory(owner).deploy();
    });

    describe("Deployment", function () {
        it("Should deploy successfully", async function () {
            expect(bountyManager.target).to.be.properAddress;
        });
    });

    describe("createBounty", function () {
        const bountyId = ethersInstance.toUtf8Bytes("test-bounty-1");
        let futureTimestamp: number;

        beforeEach(async function () {
            futureTimestamp = await getFutureTimestamp();
        });

        it("Should create a bounty successfully", async function () {
            await expect(bountyManager.connect(user1).createBounty(bountyId, futureTimestamp))
                .to.emit(bountyManager, "BountyCreated");

            const bountyData = await bountyManager.bountiesToBountyData(bountyId);
            expect(bountyData.bountyId).to.equal(ethersInstance.hexlify(bountyId));
            expect(bountyData.owner).to.equal(user1.address);
            expect(bountyData.expirationDate).to.equal(futureTimestamp);
            expect(bountyData.isActive).to.be.true;
        });

        it("Should add bounty to owner's bounty list", async function () {
            await bountyManager.connect(user1).createBounty(bountyId, futureTimestamp);

            const userBounty = await bountyManager.bountyOwnerToBounties(user1.address, 0);
            expect(userBounty).to.equal(ethersInstance.hexlify(bountyId));
        });

        it("Should add bounty to open bounties list", async function () {
            await bountyManager.connect(user1).createBounty(bountyId, futureTimestamp);

            const openBounties = await bountyManager.openBountyIds(0);
            expect(openBounties).to.equal(ethersInstance.hexlify(bountyId));
        });

        it("Should revert when bountyId is empty", async function () {
            const emptyBountyId = ethersInstance.toUtf8Bytes("");

            await expect(
                bountyManager.connect(user1).createBounty(emptyBountyId, futureTimestamp)
            ).to.be.revertedWithCustomError(bountyManager, "BountyIdEmpty");
        });

        it("Should revert when expiration date is in the past", async function () {
            const currentBlock = await ethersInstance.provider.getBlock("latest");
            const pastTimestamp = currentBlock!.timestamp - 3600;

            await expect(
                bountyManager.connect(user1).createBounty(bountyId, pastTimestamp)
            ).to.be.revertedWithCustomError(bountyManager, "ExpirationDateInPast");
        });

        it("Should revert when expiration date is current timestamp", async function () {
            const currentBlock = await ethersInstance.provider.getBlock("latest");
            const currentTimestamp = currentBlock!.timestamp;

            await expect(
                bountyManager.connect(user1).createBounty(bountyId, currentTimestamp)
            ).to.be.revertedWithCustomError(bountyManager, "ExpirationDateInPast");
        });

        it("Should revert when bountyId already exists", async function () {
            await bountyManager.connect(user1).createBounty(bountyId, futureTimestamp);

            await expect(
                bountyManager.connect(user2).createBounty(bountyId, futureTimestamp + 3600)
            ).to.be.revertedWithCustomError(bountyManager, "BountyIdAlreadyExists");
        });

        it("Should allow multiple bounties from same owner", async function () {
            const bountyId2 = ethersInstance.toUtf8Bytes("test-bounty-2");
            const futureTimestamp2 = await getFutureTimestamp(7200);

            await bountyManager.connect(user1).createBounty(bountyId, futureTimestamp);
            await bountyManager.connect(user1).createBounty(bountyId2, futureTimestamp2);

            const userBounty1 = await bountyManager.bountyOwnerToBounties(user1.address, 0);
            const userBounty2 = await bountyManager.bountyOwnerToBounties(user1.address, 1);
            expect(userBounty1).to.equal(ethersInstance.hexlify(bountyId));
            expect(userBounty2).to.equal(ethersInstance.hexlify(bountyId2));
        });

        it("Should allow multiple bounties from different owners", async function () {
            const bountyId2 = ethersInstance.toUtf8Bytes("test-bounty-2");
            const futureTimestamp2 = await getFutureTimestamp(7200);

            await bountyManager.connect(user1).createBounty(bountyId, futureTimestamp);
            await bountyManager.connect(user2).createBounty(bountyId2, futureTimestamp2);

            const user1Bounty = await bountyManager.bountyOwnerToBounties(user1.address, 0);
            const user2Bounty = await bountyManager.bountyOwnerToBounties(user2.address, 0);
            expect(user1Bounty).to.equal(ethersInstance.hexlify(bountyId));
            expect(user2Bounty).to.equal(ethersInstance.hexlify(bountyId2));
        });
    });

    describe("closeBounty", function () {
        const bountyId = ethersInstance.toUtf8Bytes("test-bounty-1");
        let futureTimestamp: number;

        beforeEach(async function () {
            futureTimestamp = await getFutureTimestamp();
            await bountyManager.connect(user1).createBounty(bountyId, futureTimestamp);
        });

        it("Should close bounty successfully", async function () {
            await expect(bountyManager.connect(user1).closeBounty(bountyId))
                .to.emit(bountyManager, "BountyClosed");

            const bountyData = await bountyManager.bountiesToBountyData(bountyId);
            expect(bountyData.isActive).to.be.false;
        });

        it("Should remove bounty from open bounties list", async function () {
            await bountyManager.connect(user1).closeBounty(bountyId);

            expect(bountyManager.openBountyIds(0)).to.be.reverted;
        });

        it("Should revert when called by non-owner", async function () {
            await expect(
                bountyManager.connect(user2).closeBounty(bountyId)
            ).to.be.revertedWithCustomError(bountyManager, "OnlyBountyOwner");
        });

        it("Should revert when bounty does not exist", async function () {
            const nonExistentBountyId = ethersInstance.toUtf8Bytes("non-existent");

            await expect(
                bountyManager.connect(user1).closeBounty(nonExistentBountyId)
            ).to.be.revertedWithCustomError(bountyManager, "BountyDoesNotExist");
        });

        it("Should allow closing multiple bounties", async function () {
            const bountyId2 = ethersInstance.toUtf8Bytes("test-bounty-2");
            const futureTimestamp2 = await getFutureTimestamp(7200);
            await bountyManager.connect(user1).createBounty(bountyId2, futureTimestamp2);

            await bountyManager.connect(user1).closeBounty(bountyId);
            await bountyManager.connect(user1).closeBounty(bountyId2);

            const bountyData1 = await bountyManager.bountiesToBountyData(bountyId);
            const bountyData2 = await bountyManager.bountiesToBountyData(bountyId2);

            expect(bountyData1.isActive).to.be.false;
            expect(bountyData2.isActive).to.be.false;
        });

        it("Should handle closing bounty from middle of open bounties list", async function () {
            const bountyId2 = ethersInstance.toUtf8Bytes("test-bounty-2");
            const bountyId3 = ethersInstance.toUtf8Bytes("test-bounty-3");
            const futureTimestamp2 = await getFutureTimestamp(7200);
            const futureTimestamp3 = await getFutureTimestamp(10800);

            await bountyManager.connect(user1).createBounty(bountyId2, futureTimestamp2);
            await bountyManager.connect(user2).createBounty(bountyId3, futureTimestamp3);

            await bountyManager.connect(user1).closeBounty(bountyId2);

            const openBounty1 = await bountyManager.openBountyIds(0);
            const openBounty2 = await bountyManager.openBountyIds(1);

            expect(openBounty1).to.equal(ethersInstance.hexlify(bountyId));
            expect(openBounty2).to.equal(ethersInstance.hexlify(bountyId3));
        });
    });

    describe("Data integrity", function () {
        const bountyId = ethersInstance.toUtf8Bytes("test-bounty-1");
        let futureTimestamp: number;

        beforeEach(async function () {
            futureTimestamp = await getFutureTimestamp();
        });

        it("Should maintain correct bounty count for owner", async function () {
            const bountyId2 = ethersInstance.toUtf8Bytes("test-bounty-2");
            const bountyId3 = ethersInstance.toUtf8Bytes("test-bounty-3");
            const futureTimestamp2 = await getFutureTimestamp(7200);
            const futureTimestamp3 = await getFutureTimestamp(10800);

            await bountyManager.connect(user1).createBounty(bountyId, futureTimestamp);
            await bountyManager.connect(user1).createBounty(bountyId2, futureTimestamp2);
            await bountyManager.connect(user1).createBounty(bountyId3, futureTimestamp3);

            const userBounty1 = await bountyManager.bountyOwnerToBounties(user1.address, 0);
            const userBounty2 = await bountyManager.bountyOwnerToBounties(user1.address, 1);
            const userBounty3 = await bountyManager.bountyOwnerToBounties(user1.address, 2);
            expect(userBounty1).to.equal(ethersInstance.hexlify(bountyId));
            expect(userBounty2).to.equal(ethersInstance.hexlify(bountyId2));
            expect(userBounty3).to.equal(ethersInstance.hexlify(bountyId3));

            await bountyManager.connect(user1).closeBounty(bountyId2);

            const userBounty1After = await bountyManager.bountyOwnerToBounties(user1.address, 0);
            const userBounty2After = await bountyManager.bountyOwnerToBounties(user1.address, 1);
            const userBounty3After = await bountyManager.bountyOwnerToBounties(user1.address, 2);
            expect(userBounty1After).to.equal(ethersInstance.hexlify(bountyId));
            expect(userBounty2After).to.equal(ethersInstance.hexlify(bountyId2));
            expect(userBounty3After).to.equal(ethersInstance.hexlify(bountyId3));
        });

        it("Should maintain correct open bounty count", async function () {
            const bountyId2 = ethersInstance.toUtf8Bytes("test-bounty-2");
            const bountyId3 = ethersInstance.toUtf8Bytes("test-bounty-3");
            const futureTimestamp2 = await getFutureTimestamp(7200);
            const futureTimestamp3 = await getFutureTimestamp(10800);

            await bountyManager.connect(user1).createBounty(bountyId, futureTimestamp);
            await bountyManager.connect(user1).createBounty(bountyId2, futureTimestamp2);
            await bountyManager.connect(user1).createBounty(bountyId3, futureTimestamp3);

            let openBounty1 = await bountyManager.openBountyIds(0);
            let openBounty2 = await bountyManager.openBountyIds(1);
            let openBounty3 = await bountyManager.openBountyIds(2);

            expect(openBounty1).to.equal(ethersInstance.hexlify(bountyId));
            expect(openBounty2).to.equal(ethersInstance.hexlify(bountyId2));
            expect(openBounty3).to.equal(ethersInstance.hexlify(bountyId3));

            await bountyManager.connect(user1).closeBounty(bountyId2);

            openBounty1 = await bountyManager.openBountyIds(0);
            openBounty2 = await bountyManager.openBountyIds(1);

            expect(openBounty1).to.equal(ethersInstance.hexlify(bountyId));
            expect(openBounty2).to.equal(ethersInstance.hexlify(bountyId3));

            expect(bountyManager.openBountyIds(2)).to.be.reverted;
        });
    });

    describe("Edge cases", function () {
        it("Should handle very long bounty IDs", async function () {
            const longBountyId = ethersInstance.toUtf8Bytes("a".repeat(1000));
            const futureTimestamp = await getFutureTimestamp();

            await expect(
                bountyManager.connect(user1).createBounty(longBountyId, futureTimestamp)
            ).to.emit(bountyManager, "BountyCreated");
        });

        it("Should handle bounty IDs with special characters", async function () {
            const specialBountyId = ethersInstance.toUtf8Bytes("bounty-!@#$%^&*()_+-=[]{}|;':\",./<>?");
            const futureTimestamp = await getFutureTimestamp();

            await expect(
                bountyManager.connect(user1).createBounty(specialBountyId, futureTimestamp)
            ).to.emit(bountyManager, "BountyCreated");
        });

        it("Should handle maximum expiration date", async function () {
            const bountyId = ethersInstance.toUtf8Bytes("test-bounty");
            const maxTimestamp = ethersInstance.MaxUint256;

            await expect(
                bountyManager.connect(user1).createBounty(bountyId, maxTimestamp)
            ).to.emit(bountyManager, "BountyCreated");
        });
    });

    describe("getBountiesByOwner", function () {
        const bountyId1 = ethersInstance.toUtf8Bytes("test-bounty-1");
        const bountyId2 = ethersInstance.toUtf8Bytes("test-bounty-2");
        const bountyId3 = ethersInstance.toUtf8Bytes("test-bounty-3");
        let futureTimestamp: number;

        beforeEach(async function () {
            futureTimestamp = await getFutureTimestamp();
        });

        it("Should return empty array for user with no bounties", async function () {
            const bounties = await bountyManager.getBountiesByOwner(user1.address);
            expect(bounties).to.have.length(0);
        });

        it("Should return all bounties for owner", async function () {
            const futureTimestamp2 = await getFutureTimestamp(7200);
            const futureTimestamp3 = await getFutureTimestamp(10800);

            await bountyManager.connect(user1).createBounty(bountyId1, futureTimestamp);
            await bountyManager.connect(user1).createBounty(bountyId2, futureTimestamp2);
            await bountyManager.connect(user1).createBounty(bountyId3, futureTimestamp3);

            const bounties = await bountyManager.getBountiesByOwner(user1.address);
            expect(bounties).to.have.length(3);
            expect(bounties[0]).to.equal(ethersInstance.hexlify(bountyId1));
            expect(bounties[1]).to.equal(ethersInstance.hexlify(bountyId2));
            expect(bounties[2]).to.equal(ethersInstance.hexlify(bountyId3));
        });

        it("Should return bounties even after they are closed", async function () {
            const futureTimestamp2 = await getFutureTimestamp(7200);

            await bountyManager.connect(user1).createBounty(bountyId1, futureTimestamp);
            await bountyManager.connect(user1).createBounty(bountyId2, futureTimestamp2);

            await bountyManager.connect(user1).closeBounty(bountyId1);

            const bounties = await bountyManager.getBountiesByOwner(user1.address);
            expect(bounties).to.have.length(2);
            expect(bounties[0]).to.equal(ethersInstance.hexlify(bountyId1));
            expect(bounties[1]).to.equal(ethersInstance.hexlify(bountyId2));
        });
    });

    describe("getAllOpenBounties", function () {
        const bountyId1 = ethersInstance.toUtf8Bytes("test-bounty-1");
        const bountyId2 = ethersInstance.toUtf8Bytes("test-bounty-2");
        const bountyId3 = ethersInstance.toUtf8Bytes("test-bounty-3");
        let futureTimestamp: number;

        beforeEach(async function () {
            futureTimestamp = await getFutureTimestamp();
        });

        it("Should return empty array when no open bounties", async function () {
            const openBounties = await bountyManager.getAllOpenBounties();
            expect(openBounties).to.have.length(0);
        });

        it("Should return all open bounties", async function () {
            const futureTimestamp2 = await getFutureTimestamp(7200);
            const futureTimestamp3 = await getFutureTimestamp(10800);

            await bountyManager.connect(user1).createBounty(bountyId1, futureTimestamp);
            await bountyManager.connect(user2).createBounty(bountyId2, futureTimestamp2);
            await bountyManager.connect(user3).createBounty(bountyId3, futureTimestamp3);

            const openBounties = await bountyManager.getAllOpenBounties();
            expect(openBounties).to.have.length(3);
            expect(openBounties).to.include(ethersInstance.hexlify(bountyId1));
            expect(openBounties).to.include(ethersInstance.hexlify(bountyId2));
            expect(openBounties).to.include(ethersInstance.hexlify(bountyId3));
        });

        it("Should not return closed bounties", async function () {
            const futureTimestamp2 = await getFutureTimestamp(7200);

            await bountyManager.connect(user1).createBounty(bountyId1, futureTimestamp);
            await bountyManager.connect(user2).createBounty(bountyId2, futureTimestamp2);

            await bountyManager.connect(user1).closeBounty(bountyId1);

            const openBounties = await bountyManager.getAllOpenBounties();
            expect(openBounties).to.have.length(1);
            expect(openBounties[0]).to.equal(ethersInstance.hexlify(bountyId2));
        });
    });

    describe("getBountyData", function () {
        const bountyId = ethersInstance.toUtf8Bytes("test-bounty-1");
        let futureTimestamp: number;

        beforeEach(async function () {
            futureTimestamp = await getFutureTimestamp();
        });

        it("Should return correct bounty data", async function () {
            await bountyManager.connect(user1).createBounty(bountyId, futureTimestamp);

            const bountyData = await bountyManager.getBountyData(bountyId);
            expect(bountyData.bountyId).to.equal(ethersInstance.hexlify(bountyId));
            expect(bountyData.owner).to.equal(user1.address);
            expect(bountyData.expirationDate).to.equal(futureTimestamp);
            expect(bountyData.isActive).to.be.true;
        });

        it("Should revert when bounty does not exist", async function () {
            const nonExistentBountyId = ethersInstance.toUtf8Bytes("non-existent");

            await expect(
                bountyManager.getBountyData(nonExistentBountyId)
            ).to.be.revertedWithCustomError(bountyManager, "BountyDoesNotExist");
        });

        it("Should return updated data after bounty is closed", async function () {
            await bountyManager.connect(user1).createBounty(bountyId, futureTimestamp);
            await bountyManager.connect(user1).closeBounty(bountyId);

            const bountyData = await bountyManager.getBountyData(bountyId);
            expect(bountyData.isActive).to.be.false;
        });
    });

    describe("isBountyExpired", function () {
        const bountyId = ethersInstance.toUtf8Bytes("test-bounty-1");

        it("Should return true for non-existent bounty", async function () {
            const nonExistentBountyId = ethersInstance.toUtf8Bytes("non-existent");
            const isExpired = await bountyManager.isBountyExpired(nonExistentBountyId);
            expect(isExpired).to.be.true;
        });

        it("Should return false for active bounty", async function () {
            const currentBlock = await ethersInstance.provider.getBlock("latest");
            const futureTimestamp = currentBlock!.timestamp + 3600;
            await bountyManager.connect(user1).createBounty(bountyId, futureTimestamp);

            const isExpired = await bountyManager.isBountyExpired(bountyId);
            expect(isExpired).to.be.false;
        });

        it("Should return true for expired bounty", async function () {
            const currentBlock = await ethersInstance.provider.getBlock("latest");
            const shortFutureTimestamp = currentBlock!.timestamp + 30;

            await bountyManager.connect(user1).createBounty(bountyId, shortFutureTimestamp);

            await ethersInstance.provider.send("evm_increaseTime", [35]);
            await ethersInstance.provider.send("evm_mine", []);

            const isExpired = await bountyManager.isBountyExpired(bountyId);
            expect(isExpired).to.be.true;
        });
    });

    describe("getOpenBountyCount", function () {
        const bountyId1 = ethersInstance.toUtf8Bytes("test-bounty-1");
        const bountyId2 = ethersInstance.toUtf8Bytes("test-bounty-2");
        let futureTimestamp: number;

        beforeEach(async function () {
            futureTimestamp = await getFutureTimestamp();
        });

        it("Should return 0 when no open bounties", async function () {
            const count = await bountyManager.getOpenBountyCount();
            expect(count).to.equal(0);
        });

        it("Should return correct count of open bounties", async function () {
            const futureTimestamp2 = await getFutureTimestamp(7200);

            await bountyManager.connect(user1).createBounty(bountyId1, futureTimestamp);
            await bountyManager.connect(user2).createBounty(bountyId2, futureTimestamp2);

            const count = await bountyManager.getOpenBountyCount();
            expect(count).to.equal(2);
        });

        it("Should update count when bounties are closed", async function () {
            const futureTimestamp2 = await getFutureTimestamp(7200);

            await bountyManager.connect(user1).createBounty(bountyId1, futureTimestamp);
            await bountyManager.connect(user2).createBounty(bountyId2, futureTimestamp2);

            await bountyManager.connect(user1).closeBounty(bountyId1);

            const count = await bountyManager.getOpenBountyCount();
            expect(count).to.equal(1);
        });
    });

    describe("getBountyCountByOwner", function () {
        const bountyId1 = ethersInstance.toUtf8Bytes("test-bounty-1");
        const bountyId2 = ethersInstance.toUtf8Bytes("test-bounty-2");
        let futureTimestamp: number;

        beforeEach(async function () {
            futureTimestamp = await getFutureTimestamp();
        });

        it("Should return 0 for user with no bounties", async function () {
            const count = await bountyManager.getBountyCountByOwner(user1.address);
            expect(count).to.equal(0);
        });

        it("Should return correct count for owner", async function () {
            const futureTimestamp2 = await getFutureTimestamp(7200);

            await bountyManager.connect(user1).createBounty(bountyId1, futureTimestamp);
            await bountyManager.connect(user1).createBounty(bountyId2, futureTimestamp2);

            const count = await bountyManager.getBountyCountByOwner(user1.address);
            expect(count).to.equal(2);
        });

        it("Should not change count when bounties are closed", async function () {
            const futureTimestamp2 = await getFutureTimestamp(7200);

            await bountyManager.connect(user1).createBounty(bountyId1, futureTimestamp);
            await bountyManager.connect(user1).createBounty(bountyId2, futureTimestamp2);

            await bountyManager.connect(user1).closeBounty(bountyId1);

            const count = await bountyManager.getBountyCountByOwner(user1.address);
            expect(count).to.equal(2);
        });
    });

    describe("cleanupExpiredBounties", function () {
        const bountyId1 = ethersInstance.toUtf8Bytes("test-bounty-1");
        const bountyId2 = ethersInstance.toUtf8Bytes("test-bounty-2");
        const bountyId3 = ethersInstance.toUtf8Bytes("test-bounty-3");

        it("Should cleanup expired bounties and emit events", async function () {
            const currentBlock = await ethersInstance.provider.getBlock("latest");
            const futureTimestamp = currentBlock!.timestamp + 3600;
            const shortFutureTimestamp = currentBlock!.timestamp + 30;

            await bountyManager.connect(user1).createBounty(bountyId1, shortFutureTimestamp);
            await bountyManager.connect(user2).createBounty(bountyId2, shortFutureTimestamp);
            await bountyManager.connect(user3).createBounty(bountyId3, futureTimestamp);

            await ethersInstance.provider.send("evm_increaseTime", [35]);
            await ethersInstance.provider.send("evm_mine", []);

            await expect(
                bountyManager.cleanupExpiredBounties([bountyId1, bountyId2, bountyId3])
            ).to.emit(bountyManager, "BountyExpired");

            const bountyData1 = await bountyManager.bountiesToBountyData(bountyId1);
            const bountyData2 = await bountyManager.bountiesToBountyData(bountyId2);
            const bountyData3 = await bountyManager.bountiesToBountyData(bountyId3);

            expect(bountyData1.isActive).to.be.false;
            expect(bountyData2.isActive).to.be.false;
            expect(bountyData3.isActive).to.be.true;
        });

        it("Should remove expired bounties from open bounties list", async function () {
            const currentBlock = await ethersInstance.provider.getBlock("latest");
            const futureTimestamp = currentBlock!.timestamp + 3600;
            const shortFutureTimestamp = currentBlock!.timestamp + 30;

            await bountyManager.connect(user1).createBounty(bountyId1, shortFutureTimestamp);
            await bountyManager.connect(user2).createBounty(bountyId2, futureTimestamp);

            await ethersInstance.provider.send("evm_increaseTime", [35]);
            await ethersInstance.provider.send("evm_mine", []);

            await bountyManager.cleanupExpiredBounties([bountyId1, bountyId2]);

            const openBounties = await bountyManager.getAllOpenBounties();
            expect(openBounties).to.have.length(1);
            expect(openBounties[0]).to.equal(ethersInstance.hexlify(bountyId2));
        });

        it("Should not affect non-expired bounties", async function () {
            const futureTimestamp1 = await getFutureTimestamp();
            const futureTimestamp2 = await getFutureTimestamp(7200);

            await bountyManager.connect(user1).createBounty(bountyId1, futureTimestamp1);
            await bountyManager.connect(user2).createBounty(bountyId2, futureTimestamp2);

            await bountyManager.cleanupExpiredBounties([bountyId1, bountyId2]);

            const bountyData1 = await bountyManager.bountiesToBountyData(bountyId1);
            const bountyData2 = await bountyManager.bountiesToBountyData(bountyId2);

            expect(bountyData1.isActive).to.be.true;
            expect(bountyData2.isActive).to.be.true;
        });

        it("Should not affect already closed bounties", async function () {
            const currentBlock = await ethersInstance.provider.getBlock("latest");
            const shortFutureTimestamp = currentBlock!.timestamp + 30;

            await bountyManager.connect(user1).createBounty(bountyId1, shortFutureTimestamp);
            await bountyManager.connect(user1).closeBounty(bountyId1);

            await ethersInstance.provider.send("evm_increaseTime", [35]);
            await ethersInstance.provider.send("evm_mine", []);

            await bountyManager.cleanupExpiredBounties([bountyId1]);

            const bountyData = await bountyManager.bountiesToBountyData(bountyId1);
            expect(bountyData.isActive).to.be.false;
        });

        it("Should handle empty array", async function () {
            expect(
                bountyManager.cleanupExpiredBounties([])
            ).to.not.be.reverted;
        });
    });
}); 
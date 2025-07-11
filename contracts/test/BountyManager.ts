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
    let mockUSDC: any;
    let mockWLD: any;

    async function getFutureTimestamp(secondsFromNow: number = 3600): Promise<number> {
        const currentBlock = await ethersInstance.provider.getBlock("latest");
        return currentBlock!.timestamp + secondsFromNow;
    }

    function getDataHash(bountyId: Uint8Array): Uint8Array {
        return ethersInstance.toUtf8Bytes(ethersInstance.keccak256(bountyId));
    }

    beforeEach(async function () {
        [owner, user1, user2, user3] = await ethersInstance.getSigners();

        const MockUSDC = await ethersInstance.getContractFactory("MockERC20");
        mockUSDC = await MockUSDC.deploy("Mock USDC", "USDC");

        const MockWLD = await ethersInstance.getContractFactory("MockERC20");
        mockWLD = await MockWLD.deploy("Mock WLD", "WLD");

        bountyManager = await new BountyManager__factory(owner).deploy(mockUSDC.target, mockWLD.target);
    });

    describe("Deployment", function () {
        it("Should deploy successfully", async function () {
            expect(bountyManager.target).to.be.properAddress;
        });

        it("Should set USDC address correctly", async function () {
            const usdcAddress = await bountyManager.usdc();
            expect(usdcAddress).to.equal(mockUSDC.target);
        });

        it("Should set WLD address correctly", async function () {
            const wldAddress = await bountyManager.wld();
            expect(wldAddress).to.equal(mockWLD.target);
        });
    });

    describe("createBounty", function () {
        const bountyId = ethersInstance.toUtf8Bytes("test-bounty-1");
        let futureTimestamp: number;

        beforeEach(async function () {
            futureTimestamp = await getFutureTimestamp();
        });

        it("Should create a bounty successfully with WLD currency", async function () {
            await expect(bountyManager.connect(user1).createBounty(bountyId, user1.address, 0, ethersInstance.parseEther("0.1"), ethersInstance.parseEther("1"), futureTimestamp, getDataHash(bountyId)))
                .to.emit(bountyManager, "BountyCreated");

            const bountyData = await bountyManager.bountiesToBountyData(bountyId);
            expect(bountyData.bountyId).to.equal(ethersInstance.hexlify(bountyId));
            expect(bountyData.owner).to.equal(user1.address);
            expect(bountyData.currency).to.equal(0); // WLD
            expect(bountyData.perProofValue).to.equal(ethersInstance.parseEther("0.1"));
            expect(bountyData.totalValueLeft).to.equal(ethersInstance.parseEther("1"));
            expect(bountyData.expirationDate).to.equal(futureTimestamp);
            expect(bountyData.isActive).to.be.true;
        });

        it("Should create a bounty successfully with USDC currency", async function () {
            await expect(bountyManager.connect(user1).createBounty(bountyId, user1.address, 1, 1000000, 10000000, futureTimestamp, getDataHash(bountyId)))
                .to.emit(bountyManager, "BountyCreated");

            const bountyData = await bountyManager.bountiesToBountyData(bountyId);
            expect(bountyData.bountyId).to.equal(ethersInstance.hexlify(bountyId));
            expect(bountyData.owner).to.equal(user1.address);
            expect(bountyData.currency).to.equal(1); // USDC
            expect(bountyData.perProofValue).to.equal(1000000);
            expect(bountyData.totalValueLeft).to.equal(10000000);
            expect(bountyData.expirationDate).to.equal(futureTimestamp);
            expect(bountyData.isActive).to.be.true;
        });

        it("Should create a bounty successfully with different bountyOwner", async function () {
            await expect(bountyManager.connect(user1).createBounty(bountyId, user2.address, 0, ethersInstance.parseEther("0.1"), ethersInstance.parseEther("1"), futureTimestamp, getDataHash(bountyId)))
                .to.emit(bountyManager, "BountyCreated");

            const bountyData = await bountyManager.bountiesToBountyData(bountyId);
            expect(bountyData.bountyId).to.equal(ethersInstance.hexlify(bountyId));
            expect(bountyData.owner).to.equal(user2.address);
            expect(bountyData.expirationDate).to.equal(futureTimestamp);
            expect(bountyData.isActive).to.be.true;
        });

        it("Should add bounty to specified owner's bounty list", async function () {
            await bountyManager.connect(user1).createBounty(bountyId, user2.address, 0, ethersInstance.parseEther("0.1"), ethersInstance.parseEther("1"), futureTimestamp, getDataHash(bountyId));

            const userBounty = await bountyManager.bountyOwnerToBounties(user2.address, 0);
            expect(userBounty).to.equal(ethersInstance.hexlify(bountyId));
        });

        it("Should not add bounty to msg.sender's bounty list when bountyOwner is different", async function () {
            await bountyManager.connect(user1).createBounty(bountyId, user2.address, 0, ethersInstance.parseEther("0.1"), ethersInstance.parseEther("1"), futureTimestamp, getDataHash(bountyId));

            const userBounties = await bountyManager.getBountiesByOwner(user1.address);
            expect(userBounties).to.have.length(0);
        });

        it("Should add bounty to open bounties list", async function () {
            await bountyManager.connect(user1).createBounty(bountyId, user2.address, 0, ethersInstance.parseEther("0.1"), ethersInstance.parseEther("1"), futureTimestamp, getDataHash(bountyId));

            const openBounties = await bountyManager.openBountyIds(0);
            expect(openBounties).to.equal(ethersInstance.hexlify(bountyId));
        });

        it("Should revert when bountyId is empty", async function () {
            const emptyBountyId = ethersInstance.toUtf8Bytes("");

            await expect(
                bountyManager.connect(user1).createBounty(emptyBountyId, user1.address, 0, ethersInstance.parseEther("0.1"), ethersInstance.parseEther("1"), futureTimestamp, getDataHash(emptyBountyId))
            ).to.be.revertedWithCustomError(bountyManager, "BountyIdEmpty");
        });

        it("Should revert when expiration date is in the past", async function () {
            const currentBlock = await ethersInstance.provider.getBlock("latest");
            const pastTimestamp = currentBlock!.timestamp - 3600;

            await expect(
                bountyManager.connect(user1).createBounty(bountyId, user1.address, 0, ethersInstance.parseEther("0.1"), ethersInstance.parseEther("1"), pastTimestamp, getDataHash(bountyId))
            ).to.be.revertedWithCustomError(bountyManager, "ExpirationDateInPast");
        });

        it("Should revert when expiration date is current timestamp", async function () {
            const currentBlock = await ethersInstance.provider.getBlock("latest");
            const currentTimestamp = currentBlock!.timestamp;

            await expect(
                bountyManager.connect(user1).createBounty(bountyId, user1.address, 0, ethersInstance.parseEther("0.1"), ethersInstance.parseEther("1"), currentTimestamp, getDataHash(bountyId))
            ).to.be.revertedWithCustomError(bountyManager, "ExpirationDateInPast");
        });

        it("Should revert when bountyId already exists", async function () {
            await bountyManager.connect(user1).createBounty(bountyId, user1.address, 0, ethersInstance.parseEther("0.1"), ethersInstance.parseEther("1"), futureTimestamp, getDataHash(bountyId));

            await expect(
                bountyManager.connect(user2).createBounty(bountyId, user2.address, 0, ethersInstance.parseEther("0.2"), ethersInstance.parseEther("2"), futureTimestamp + 3600, getDataHash(bountyId))
            ).to.be.revertedWithCustomError(bountyManager, "BountyIdAlreadyExists");
        });

        it("Should allow multiple bounties from same owner", async function () {
            const bountyId2 = ethersInstance.toUtf8Bytes("test-bounty-2");
            const futureTimestamp2 = await getFutureTimestamp(7200);

            await bountyManager.connect(user1).createBounty(bountyId, user1.address, 0, ethersInstance.parseEther("0.1"), ethersInstance.parseEther("1"), futureTimestamp, getDataHash(bountyId));
            await bountyManager.connect(user1).createBounty(bountyId2, user1.address, 1, 1000000, 10000000, futureTimestamp2, getDataHash(bountyId2));

            const userBounty1 = await bountyManager.bountyOwnerToBounties(user1.address, 0);
            const userBounty2 = await bountyManager.bountyOwnerToBounties(user1.address, 1);
            expect(userBounty1).to.equal(ethersInstance.hexlify(bountyId));
            expect(userBounty2).to.equal(ethersInstance.hexlify(bountyId2));
        });

        it("Should allow multiple bounties from different owners", async function () {
            const bountyId2 = ethersInstance.toUtf8Bytes("test-bounty-2");
            const futureTimestamp2 = await getFutureTimestamp(7200);

            await bountyManager.connect(user1).createBounty(bountyId, user1.address, 0, ethersInstance.parseEther("0.1"), ethersInstance.parseEther("1"), futureTimestamp, getDataHash(bountyId));
            await bountyManager.connect(user2).createBounty(bountyId2, user2.address, 1, 1000000, 10000000, futureTimestamp2, getDataHash(bountyId2));

            const user1Bounty = await bountyManager.bountyOwnerToBounties(user1.address, 0);
            const user2Bounty = await bountyManager.bountyOwnerToBounties(user2.address, 0);
            expect(user1Bounty).to.equal(ethersInstance.hexlify(bountyId));
            expect(user2Bounty).to.equal(ethersInstance.hexlify(bountyId2));
        });

        it("Should revert when bountyOwner is zero address", async function () {
            await expect(
                bountyManager.connect(user1).createBounty(bountyId, ethersInstance.ZeroAddress, 0, ethersInstance.parseEther("0.1"), ethersInstance.parseEther("1"), futureTimestamp, getDataHash(bountyId))
            ).to.be.revertedWithCustomError(bountyManager, "ZeroAddressNotAllowed");
        });

        it("Should revert when dataHash already exists", async function () {
            const bountyId2 = ethersInstance.toUtf8Bytes("test-bounty-2");
            const sameDataHash = getDataHash(bountyId);

            await bountyManager.connect(user1).createBounty(bountyId, user1.address, 0, ethersInstance.parseEther("0.1"), ethersInstance.parseEther("1"), futureTimestamp, sameDataHash);

            await expect(
                bountyManager.connect(user2).createBounty(bountyId2, user2.address, 0, ethersInstance.parseEther("0.2"), ethersInstance.parseEther("2"), futureTimestamp + 3600, sameDataHash)
            ).to.be.revertedWithCustomError(bountyManager, "BountyHashAlreadyExists");
        });
    });

    describe("answerBounty", function () {
        const bountyId = ethersInstance.toUtf8Bytes("test-bounty-1");
        const answerId = ethersInstance.toUtf8Bytes("test-answer-1");
        let futureTimestamp: number;

        beforeEach(async function () {
            futureTimestamp = await getFutureTimestamp();
        });

        it("Should answer bounty successfully", async function () {
            await bountyManager.connect(user1).createBounty(bountyId, user1.address, 0, ethersInstance.parseEther("0.1"), ethersInstance.parseEther("1"), futureTimestamp, getDataHash(bountyId));

            await expect(bountyManager.connect(user2).answerBounty(bountyId, answerId, user2.address))
                .to.not.be.reverted;
        });

        it("Should revert when bounty does not exist", async function () {
            const nonExistentBountyId = ethersInstance.toUtf8Bytes("non-existent");

            await expect(
                bountyManager.connect(user2).answerBounty(nonExistentBountyId, answerId, user2.address)
            ).to.be.revertedWithCustomError(bountyManager, "BountyDoesNotExist");
        });

        it("Should revert when bounty has expired", async function () {
            const currentBlock = await ethersInstance.provider.getBlock("latest");
            const shortFutureTimestamp = currentBlock!.timestamp + 30;

            await bountyManager.connect(user1).createBounty(bountyId, user1.address, 0, ethersInstance.parseEther("0.1"), ethersInstance.parseEther("1"), shortFutureTimestamp, getDataHash(bountyId));

            await ethersInstance.provider.send("evm_increaseTime", [35]);
            await ethersInstance.provider.send("evm_mine", []);

            await expect(
                bountyManager.connect(user2).answerBounty(bountyId, answerId, user2.address)
            ).to.be.revertedWithCustomError(bountyManager, "BountyHasExpired");
        });

        it("Should revert when answerId already exists", async function () {
            await bountyManager.connect(user1).createBounty(bountyId, user1.address, 0, ethersInstance.parseEther("0.1"), ethersInstance.parseEther("1"), futureTimestamp, getDataHash(bountyId));

            await bountyManager.connect(user2).answerBounty(bountyId, answerId, user2.address);

            await expect(
                bountyManager.connect(user3).answerBounty(bountyId, answerId, user3.address)
            ).to.be.revertedWithCustomError(bountyManager, "AnswerIdAlreadyExists");
        });

        it("Should allow multiple different answers to same bounty", async function () {
            const answerId2 = ethersInstance.toUtf8Bytes("test-answer-2");
            const answerId3 = ethersInstance.toUtf8Bytes("test-answer-3");

            await bountyManager.connect(user1).createBounty(bountyId, user1.address, 0, ethersInstance.parseEther("0.1"), ethersInstance.parseEther("1"), futureTimestamp, getDataHash(bountyId));

            await expect(bountyManager.connect(user2).answerBounty(bountyId, answerId, user2.address))
                .to.not.be.reverted;
            await expect(bountyManager.connect(user3).answerBounty(bountyId, answerId2, user3.address))
                .to.not.be.reverted;
            await expect(bountyManager.connect(user1).answerBounty(bountyId, answerId3, user1.address))
                .to.not.be.reverted;
        });
    });

    describe("payoutBounty", function () {
        const bountyId = ethersInstance.toUtf8Bytes("test-bounty-1");
        const answerId = ethersInstance.toUtf8Bytes("test-answer-1");
        let futureTimestamp: number;

        beforeEach(async function () {
            futureTimestamp = await getFutureTimestamp();
        });

        it("Should payout WLD bounty successfully", async function () {
            const perProofValue = ethersInstance.parseEther("0.1");
            const totalValue = ethersInstance.parseEther("1");

            await bountyManager.connect(user1).createBounty(bountyId, user1.address, 0, perProofValue, totalValue, futureTimestamp, getDataHash(bountyId));

            await mockWLD.mint(bountyManager.target, totalValue);

            await bountyManager.connect(user2).answerBounty(bountyId, answerId, user2.address);

            const initialBalance = await mockWLD.balanceOf(user2.address);

            await expect(bountyManager.connect(user1).payoutBounty(bountyId, answerId))
                .to.emit(bountyManager, "BountyPaidOut");

            const finalBalance = await mockWLD.balanceOf(user2.address);
            expect(finalBalance).to.equal(initialBalance + BigInt(perProofValue));

            const bountyData = await bountyManager.bountiesToBountyData(bountyId);
            expect(bountyData.totalValueLeft).to.equal(totalValue - perProofValue);
        });

        it("Should payout USDC bounty successfully", async function () {
            const perProofValue = 1000000; // 1 USDC (6 decimals)
            const totalValue = 10000000; // 10 USDC

            console.log("bountyId", ethersInstance.hexlify(bountyId));

            await bountyManager.connect(user1).createBounty(bountyId, user1.address, 1, perProofValue, totalValue, futureTimestamp, getDataHash(bountyId));

            await mockUSDC.mint(bountyManager.target, totalValue);

            await bountyManager.connect(user2).answerBounty(bountyId, answerId, user2.address);

            const initialBalance = await mockUSDC.balanceOf(user2.address);

            await expect(bountyManager.connect(user1).payoutBounty(bountyId, answerId))
                .to.emit(bountyManager, "BountyPaidOut");

            const finalBalance = await mockUSDC.balanceOf(user2.address);
            expect(finalBalance).to.equal(initialBalance + BigInt(perProofValue));

            const bountyData = await bountyManager.bountiesToBountyData(bountyId);
            expect(bountyData.totalValueLeft).to.equal(totalValue - perProofValue);
        });

        it("Should revert when called by non-owner", async function () {
            await bountyManager.connect(user1).createBounty(bountyId, user1.address, 0, ethersInstance.parseEther("0.1"), ethersInstance.parseEther("1"), futureTimestamp, getDataHash(bountyId));

            await expect(
                bountyManager.connect(user2).payoutBounty(bountyId, user2.address)
            ).to.be.revertedWithCustomError(bountyManager, "OnlyBountyOwner");
        });

        it("Should revert when bounty does not exist", async function () {
            const nonExistentBountyId = ethersInstance.toUtf8Bytes("non-existent");

            await expect(
                bountyManager.connect(user1).payoutBounty(nonExistentBountyId, answerId)
            ).to.be.revertedWithCustomError(bountyManager, "BountyDoesNotExist");
        });

        it("Should revert when answerId does not exist", async function () {
            const nonExistentAnswerId = ethersInstance.toUtf8Bytes("non-existent-answer");

            await bountyManager.connect(user1).createBounty(bountyId, user1.address, 0, ethersInstance.parseEther("0.1"), ethersInstance.parseEther("1"), futureTimestamp, getDataHash(bountyId));

            await expect(
                bountyManager.connect(user1).payoutBounty(bountyId, nonExistentAnswerId)
            ).to.be.revertedWithCustomError(bountyManager, "AnswerIdDoesNotExist");
        });

        it("Should revert when bounty has expired", async function () {
            const currentBlock = await ethersInstance.provider.getBlock("latest");
            const shortFutureTimestamp = currentBlock!.timestamp + 30;

            await bountyManager.connect(user1).createBounty(bountyId, user1.address, 0, ethersInstance.parseEther("0.1"), ethersInstance.parseEther("1"), shortFutureTimestamp, getDataHash(bountyId));

            await bountyManager.connect(user2).answerBounty(bountyId, answerId, user2.address);

            await ethersInstance.provider.send("evm_increaseTime", [35]);
            await ethersInstance.provider.send("evm_mine", []);

            await expect(
                bountyManager.connect(user1).payoutBounty(bountyId, answerId)
            ).to.be.revertedWithCustomError(bountyManager, "BountyHasExpired");
        });

        it("Should revert when bounty has no value left", async function () {
            const perProofValue = ethersInstance.parseEther("0.1");
            const totalValue = ethersInstance.parseEther("0.05");

            await bountyManager.connect(user1).createBounty(bountyId, user1.address, 0, perProofValue, totalValue, futureTimestamp, getDataHash(bountyId));

            await bountyManager.connect(user2).answerBounty(bountyId, answerId, user2.address);

            await expect(
                bountyManager.connect(user1).payoutBounty(bountyId, answerId)
            ).to.be.revertedWithCustomError(bountyManager, "BountyHasNoValueLeft");
        });

        it("Should allow multiple payouts until value is depleted", async function () {
            const perProofValue = ethersInstance.parseEther("0.1");
            const totalValue = ethersInstance.parseEther("0.25");
            const answerId2 = ethersInstance.toUtf8Bytes("test-answer-2");
            const answerId3 = ethersInstance.toUtf8Bytes("test-answer-3");

            await bountyManager.connect(user1).createBounty(bountyId, user1.address, 0, perProofValue, totalValue, futureTimestamp, getDataHash(bountyId));

            await mockWLD.mint(bountyManager.target, totalValue);

            await bountyManager.connect(user2).answerBounty(bountyId, answerId, user2.address);
            await bountyManager.connect(user3).answerBounty(bountyId, answerId2, user3.address);
            await bountyManager.connect(user1).answerBounty(bountyId, answerId3, user1.address);

            await bountyManager.connect(user1).payoutBounty(bountyId, answerId);
            let bountyData = await bountyManager.bountiesToBountyData(bountyId);
            expect(bountyData.totalValueLeft).to.equal(ethersInstance.parseEther("0.15"));

            await bountyManager.connect(user1).payoutBounty(bountyId, answerId2);
            bountyData = await bountyManager.bountiesToBountyData(bountyId);
            expect(bountyData.totalValueLeft).to.equal(ethersInstance.parseEther("0.05"));

            await expect(
                bountyManager.connect(user1).payoutBounty(bountyId, answerId3)
            ).to.be.revertedWithCustomError(bountyManager, "BountyHasNoValueLeft");
        });
    });

    describe("payoutBountyBatch", function () {
        const bountyId1 = ethersInstance.toUtf8Bytes("test-bounty-1");
        const bountyId2 = ethersInstance.toUtf8Bytes("test-bounty-2");
        const answerId1 = ethersInstance.toUtf8Bytes("test-answer-1");
        const answerId2 = ethersInstance.toUtf8Bytes("test-answer-2");
        let futureTimestamp: number;

        beforeEach(async function () {
            futureTimestamp = await getFutureTimestamp();
        });

        it("Should payout multiple bounties successfully", async function () {
            const perProofValue = ethersInstance.parseEther("0.1");
            const totalValue = ethersInstance.parseEther("1");

            await bountyManager.connect(user1).createBounty(bountyId1, user1.address, 0, perProofValue, totalValue, futureTimestamp, getDataHash(bountyId1));
            await bountyManager.connect(user2).createBounty(bountyId2, user1.address, 0, perProofValue, totalValue, futureTimestamp, getDataHash(bountyId2));

            await mockWLD.mint(bountyManager.target, totalValue);
            await mockWLD.mint(bountyManager.target, totalValue);

            await bountyManager.connect(user3).answerBounty(bountyId1, answerId1, user3.address);
            await bountyManager.connect(user2).answerBounty(bountyId2, answerId2, user2.address);

            const initialBalance1 = await mockWLD.balanceOf(user3.address);
            const initialBalance2 = await mockWLD.balanceOf(user2.address);

            await expect(bountyManager.connect(user1).payoutBountyBatch([bountyId1, bountyId2], [answerId1, answerId2]))
                .to.emit(bountyManager, "BountyPaidOut")
                .to.emit(bountyManager, "BountyPaidOut");

            const finalBalance1 = await mockWLD.balanceOf(user3.address);
            const finalBalance2 = await mockWLD.balanceOf(user2.address);

            expect(finalBalance1).to.equal(initialBalance1 + perProofValue);
            expect(finalBalance2).to.equal(initialBalance2 + perProofValue);
        });

        it("Should revert when arrays have different lengths", async function () {
            await bountyManager.connect(user1).createBounty(bountyId1, user1.address, 0, ethersInstance.parseEther("0.1"), ethersInstance.parseEther("1"), futureTimestamp, getDataHash(bountyId1));

            expect(
                bountyManager.connect(user1).payoutBountyBatch([bountyId1], [answerId1, answerId2])
            ).to.be.reverted;
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

            await bountyManager.connect(user1).createBounty(bountyId, user1.address, 0, ethersInstance.parseEther("0.1"), ethersInstance.parseEther("1"), futureTimestamp, getDataHash(bountyId));
            await bountyManager.connect(user1).createBounty(bountyId2, user1.address, 1, 1000000, 10000000, futureTimestamp2, getDataHash(bountyId2));
            await bountyManager.connect(user1).createBounty(bountyId3, user1.address, 0, ethersInstance.parseEther("0.2"), ethersInstance.parseEther("2"), futureTimestamp3, getDataHash(bountyId3));

            const userBounty1 = await bountyManager.bountyOwnerToBounties(user1.address, 0);
            const userBounty2 = await bountyManager.bountyOwnerToBounties(user1.address, 1);
            const userBounty3 = await bountyManager.bountyOwnerToBounties(user1.address, 2);
            expect(userBounty1).to.equal(ethersInstance.hexlify(bountyId));
            expect(userBounty2).to.equal(ethersInstance.hexlify(bountyId2));
            expect(userBounty3).to.equal(ethersInstance.hexlify(bountyId3));
        });

        it("Should maintain correct open bounty count", async function () {
            const bountyId2 = ethersInstance.toUtf8Bytes("test-bounty-2");
            const bountyId3 = ethersInstance.toUtf8Bytes("test-bounty-3");
            const futureTimestamp2 = await getFutureTimestamp(7200);
            const futureTimestamp3 = await getFutureTimestamp(10800);

            await bountyManager.connect(user1).createBounty(bountyId, user1.address, 0, ethersInstance.parseEther("0.1"), ethersInstance.parseEther("1"), futureTimestamp, getDataHash(bountyId));
            await bountyManager.connect(user1).createBounty(bountyId2, user1.address, 1, 1000000, 10000000, futureTimestamp2, getDataHash(bountyId2));
            await bountyManager.connect(user1).createBounty(bountyId3, user1.address, 0, ethersInstance.parseEther("0.2"), ethersInstance.parseEther("2"), futureTimestamp3, getDataHash(bountyId3));

            let openBounty1 = await bountyManager.openBountyIds(0);
            let openBounty2 = await bountyManager.openBountyIds(1);
            let openBounty3 = await bountyManager.openBountyIds(2);

            expect(openBounty1).to.equal(ethersInstance.hexlify(bountyId));
            expect(openBounty2).to.equal(ethersInstance.hexlify(bountyId2));
            expect(openBounty3).to.equal(ethersInstance.hexlify(bountyId3));
        });
    });

    describe("Edge cases", function () {
        it("Should handle very long bounty IDs", async function () {
            const longBountyId = ethersInstance.toUtf8Bytes("a".repeat(1000));
            const futureTimestamp = await getFutureTimestamp();

            await expect(
                bountyManager.connect(user1).createBounty(longBountyId, user1.address, 0, ethersInstance.parseEther("0.1"), ethersInstance.parseEther("1"), futureTimestamp, getDataHash(longBountyId))
            ).to.emit(bountyManager, "BountyCreated");
        });

        it("Should handle bounty IDs with special characters", async function () {
            const specialBountyId = ethersInstance.toUtf8Bytes("bounty-!@#$%^&*()_+-=[]{}|;':\",./<>?");
            const futureTimestamp = await getFutureTimestamp();

            await expect(
                bountyManager.connect(user1).createBounty(specialBountyId, user1.address, 0, ethersInstance.parseEther("0.1"), ethersInstance.parseEther("1"), futureTimestamp, getDataHash(specialBountyId))
            ).to.emit(bountyManager, "BountyCreated");
        });

        it("Should handle maximum expiration date", async function () {
            const bountyId = ethersInstance.toUtf8Bytes("test-bounty");
            const maxTimestamp = ethersInstance.MaxUint256;

            await expect(
                bountyManager.connect(user1).createBounty(bountyId, user1.address, 0, ethersInstance.parseEther("0.1"), ethersInstance.parseEther("1"), maxTimestamp, getDataHash(bountyId))
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

            await bountyManager.connect(user1).createBounty(bountyId1, user1.address, 0, ethersInstance.parseEther("0.1"), ethersInstance.parseEther("1"), futureTimestamp, getDataHash(bountyId1));
            await bountyManager.connect(user1).createBounty(bountyId2, user1.address, 1, 1000000, 10000000, futureTimestamp2, getDataHash(bountyId2));
            await bountyManager.connect(user1).createBounty(bountyId3, user1.address, 0, ethersInstance.parseEther("0.2"), ethersInstance.parseEther("2"), futureTimestamp3, getDataHash(bountyId3));

            const bounties = await bountyManager.getBountiesByOwner(user1.address);
            expect(bounties).to.have.length(3);
            expect(bounties[0]).to.equal(ethersInstance.hexlify(bountyId1));
            expect(bounties[1]).to.equal(ethersInstance.hexlify(bountyId2));
            expect(bounties[2]).to.equal(ethersInstance.hexlify(bountyId3));
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

            await bountyManager.connect(user1).createBounty(bountyId1, user1.address, 0, ethersInstance.parseEther("0.1"), ethersInstance.parseEther("1"), futureTimestamp, getDataHash(bountyId1));
            await bountyManager.connect(user2).createBounty(bountyId2, user2.address, 1, 1000000, 10000000, futureTimestamp2, getDataHash(bountyId2));
            await bountyManager.connect(user3).createBounty(bountyId3, user3.address, 0, ethersInstance.parseEther("0.2"), ethersInstance.parseEther("2"), futureTimestamp3, getDataHash(bountyId3));

            const openBounties = await bountyManager.getAllOpenBounties();
            expect(openBounties).to.have.length(3);
            expect(openBounties).to.include(ethersInstance.hexlify(bountyId1));
            expect(openBounties).to.include(ethersInstance.hexlify(bountyId2));
            expect(openBounties).to.include(ethersInstance.hexlify(bountyId3));
        });
    });

    describe("getBountyData", function () {
        const bountyId = ethersInstance.toUtf8Bytes("test-bounty-1");
        let futureTimestamp: number;

        beforeEach(async function () {
            futureTimestamp = await getFutureTimestamp();
        });

        it("Should return correct bounty data", async function () {
            await bountyManager.connect(user1).createBounty(bountyId, user1.address, 0, ethersInstance.parseEther("0.1"), ethersInstance.parseEther("1"), futureTimestamp, getDataHash(bountyId));

            const bountyData = await bountyManager.getBountyData(bountyId);
            expect(bountyData.bountyId).to.equal(ethersInstance.hexlify(bountyId));
            expect(bountyData.owner).to.equal(user1.address);
            expect(bountyData.currency).to.equal(0);
            expect(bountyData.perProofValue).to.equal(ethersInstance.parseEther("0.1"));
            expect(bountyData.totalValueLeft).to.equal(ethersInstance.parseEther("1"));
            expect(bountyData.expirationDate).to.equal(futureTimestamp);
            expect(bountyData.isActive).to.be.true;
        });

        it("Should revert when bounty does not exist", async function () {
            const nonExistentBountyId = ethersInstance.toUtf8Bytes("non-existent");

            await expect(
                bountyManager.getBountyData(nonExistentBountyId)
            ).to.be.revertedWithCustomError(bountyManager, "BountyDoesNotExist");
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
            await bountyManager.connect(user1).createBounty(bountyId, user1.address, 0, ethersInstance.parseEther("0.1"), ethersInstance.parseEther("1"), futureTimestamp, getDataHash(bountyId));

            const isExpired = await bountyManager.isBountyExpired(bountyId);
            expect(isExpired).to.be.false;
        });

        it("Should return true for expired bounty", async function () {
            const currentBlock = await ethersInstance.provider.getBlock("latest");
            const shortFutureTimestamp = currentBlock!.timestamp + 30;

            await bountyManager.connect(user1).createBounty(bountyId, user1.address, 0, ethersInstance.parseEther("0.1"), ethersInstance.parseEther("1"), shortFutureTimestamp, getDataHash(bountyId));

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

            await bountyManager.connect(user1).createBounty(bountyId1, user1.address, 0, ethersInstance.parseEther("0.1"), ethersInstance.parseEther("1"), futureTimestamp, getDataHash(bountyId1));
            await bountyManager.connect(user2).createBounty(bountyId2, user2.address, 1, 1000000, 10000000, futureTimestamp2, getDataHash(bountyId2));

            const count = await bountyManager.getOpenBountyCount();
            expect(count).to.equal(2);
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

            await bountyManager.connect(user1).createBounty(bountyId1, user1.address, 0, ethersInstance.parseEther("0.1"), ethersInstance.parseEther("1"), futureTimestamp, getDataHash(bountyId1));
            await bountyManager.connect(user1).createBounty(bountyId2, user1.address, 1, 1000000, 10000000, futureTimestamp2, getDataHash(bountyId2));

            const count = await bountyManager.getBountyCountByOwner(user1.address);
            expect(count).to.equal(2);
        });
    });

    describe("getAnswersByBountyId", function () {
        const bountyId = ethersInstance.toUtf8Bytes("test-bounty-1");
        const answerId1 = ethersInstance.toUtf8Bytes("test-answer-1");
        const answerId2 = ethersInstance.toUtf8Bytes("test-answer-2");
        const answerId3 = ethersInstance.toUtf8Bytes("test-answer-3");
        let futureTimestamp: number;

        beforeEach(async function () {
            futureTimestamp = await getFutureTimestamp();
        });

        it("Should return empty array for bounty with no answers", async function () {
            await bountyManager.connect(user1).createBounty(bountyId, user1.address, 0, ethersInstance.parseEther("0.1"), ethersInstance.parseEther("1"), futureTimestamp, getDataHash(bountyId));

            const answers = await bountyManager.getAnswersByBountyId(bountyId);
            expect(answers).to.have.length(0);
        });

        it("Should return all answers for bounty", async function () {
            await bountyManager.connect(user1).createBounty(bountyId, user1.address, 0, ethersInstance.parseEther("0.1"), ethersInstance.parseEther("1"), futureTimestamp, getDataHash(bountyId));

            await bountyManager.connect(user2).answerBounty(bountyId, answerId1, user2.address);
            await bountyManager.connect(user3).answerBounty(bountyId, answerId2, user3.address);
            await bountyManager.connect(user1).answerBounty(bountyId, answerId3, user1.address);

            const answers = await bountyManager.getAnswersByBountyId(bountyId);
            expect(answers).to.have.length(3);
            expect(answers[0].answerId).to.equal(ethersInstance.hexlify(answerId1));
            expect(answers[0].answerer).to.equal(user2.address);
            expect(answers[1].answerId).to.equal(ethersInstance.hexlify(answerId2));
            expect(answers[1].answerer).to.equal(user3.address);
            expect(answers[2].answerId).to.equal(ethersInstance.hexlify(answerId3));
            expect(answers[2].answerer).to.equal(user1.address);
        });

        it("Should return empty array for non-existent bounty", async function () {
            const nonExistentBountyId = ethersInstance.toUtf8Bytes("non-existent");

            const answers = await bountyManager.getAnswersByBountyId(nonExistentBountyId);
            expect(answers).to.have.length(0);
        });

        it("Should maintain answer order", async function () {
            await bountyManager.connect(user1).createBounty(bountyId, user1.address, 0, ethersInstance.parseEther("0.1"), ethersInstance.parseEther("1"), futureTimestamp, getDataHash(bountyId));

            await bountyManager.connect(user2).answerBounty(bountyId, answerId1, user2.address);
            await bountyManager.connect(user3).answerBounty(bountyId, answerId2, user3.address);

            const answers = await bountyManager.getAnswersByBountyId(bountyId);
            expect(answers).to.have.length(2);
            expect(answers[0].answerId).to.equal(ethersInstance.hexlify(answerId1));
            expect(answers[1].answerId).to.equal(ethersInstance.hexlify(answerId2));
        });
    });

    describe("getBountyIdByDataHash", function () {
        const bountyId = ethersInstance.toUtf8Bytes("test-bounty-1");
        const bountyId2 = ethersInstance.toUtf8Bytes("test-bounty-2");
        let futureTimestamp: number;

        beforeEach(async function () {
            futureTimestamp = await getFutureTimestamp();
        });

        it("Should return correct bounty ID for existing data hash", async function () {
            const dataHash = getDataHash(bountyId);
            await bountyManager.connect(user1).createBounty(bountyId, user1.address, 0, ethersInstance.parseEther("0.1"), ethersInstance.parseEther("1"), futureTimestamp, dataHash);

            const returnedBountyId = await bountyManager.getBountyIdByDataHash(dataHash);
            expect(returnedBountyId).to.equal(ethersInstance.hexlify(bountyId));
        });

        it("Should return empty bytes for non-existent data hash", async function () {
            const nonExistentDataHash = ethersInstance.toUtf8Bytes("non-existent-hash");

            const returnedBountyId = await bountyManager.getBountyIdByDataHash(nonExistentDataHash);
            expect(returnedBountyId).to.equal("0x");
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

            await bountyManager.connect(user1).createBounty(bountyId1, user1.address, 0, ethersInstance.parseEther("0.1"), ethersInstance.parseEther("1"), shortFutureTimestamp, getDataHash(bountyId1));
            await bountyManager.connect(user2).createBounty(bountyId2, user2.address, 1, 1000000, 10000000, shortFutureTimestamp, getDataHash(bountyId2));
            await bountyManager.connect(user3).createBounty(bountyId3, user3.address, 0, ethersInstance.parseEther("0.2"), ethersInstance.parseEther("2"), futureTimestamp, getDataHash(bountyId3));

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

            await bountyManager.connect(user1).createBounty(bountyId1, user1.address, 0, ethersInstance.parseEther("0.1"), ethersInstance.parseEther("1"), shortFutureTimestamp, getDataHash(bountyId1));
            await bountyManager.connect(user2).createBounty(bountyId2, user2.address, 1, 1000000, 10000000, futureTimestamp, getDataHash(bountyId2));

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

            await bountyManager.connect(user1).createBounty(bountyId1, user1.address, 0, ethersInstance.parseEther("0.1"), ethersInstance.parseEther("1"), futureTimestamp1, getDataHash(bountyId1));
            await bountyManager.connect(user2).createBounty(bountyId2, user2.address, 1, 1000000, 10000000, futureTimestamp2, getDataHash(bountyId2));

            await bountyManager.cleanupExpiredBounties([bountyId1, bountyId2]);

            const bountyData1 = await bountyManager.bountiesToBountyData(bountyId1);
            const bountyData2 = await bountyManager.bountiesToBountyData(bountyId2);

            expect(bountyData1.isActive).to.be.true;
            expect(bountyData2.isActive).to.be.true;
        });

        it("Should handle empty array", async function () {
            expect(
                bountyManager.cleanupExpiredBounties([])
            ).to.not.be.reverted;
        });
    });
}); 
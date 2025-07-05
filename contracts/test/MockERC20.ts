import { expect } from "chai";
import { network } from "hardhat";

const { ethers: ethersInstance } = await network.connect();

describe("MockERC20", function () {
    let mockToken: any;
    let owner: any;
    let user1: any;
    let user2: any;

    beforeEach(async function () {
        [owner, user1, user2] = await ethersInstance.getSigners();
        const MockToken = await ethersInstance.getContractFactory("MockERC20");
        mockToken = await MockToken.deploy("Mock USDC", "USDC");
    });

    it("Should deploy successfully", async function () {
        expect(await mockToken.name()).to.equal("Mock USDC");
        expect(await mockToken.symbol()).to.equal("USDC");
    });

    it("Should mint tokens to an address", async function () {
        await mockToken.mint(user1.address, 1000);
        expect(await mockToken.balanceOf(user1.address)).to.equal(1000);
    });

    it("Should transfer tokens between addresses", async function () {
        await mockToken.mint(user1.address, 1000);
        await mockToken.connect(user1).transfer(user2.address, 400);
        expect(await mockToken.balanceOf(user1.address)).to.equal(600);
        expect(await mockToken.balanceOf(user2.address)).to.equal(400);
    });

    it("Should fail to transfer more than balance", async function () {
        await mockToken.mint(user1.address, 100);
        await expect(
            mockToken.connect(user1).transfer(user2.address, 200)
        ).to.be.revertedWithCustomError(mockToken, "ERC20InsufficientBalance");
    });
}); 
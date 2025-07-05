import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

export default buildModule("FullDeploymentModule", (m) => {
    const mockUSDC = m.contract("MockERC20", ["USD Coin", "USDC"]);
    const bountyManager = m.contract("BountyManager", [mockUSDC]);

    m.call(mockUSDC, "mint", [process.env.WORLDCOIN_ADDRESS!, 1000000n * 10n ** 6n]); // 1M USDC (6 decimals)

    return { mockUSDC, bountyManager };
}); 
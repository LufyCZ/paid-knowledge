import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

export default buildModule("FullDeploymentModule", (m) => {
    // TEST
    // const mockUSDC = m.contract("MockERC20", ["USD Coin", "USDC"]);
    // const mockWLD = m.contract("MockERC20", ["Worldcoin", "WLD"]);
    // const bountyManager = m.contract("BountyManager", [mockUSDC, mockWLD]);

    // m.call(mockUSDC, "mint", [process.env.WORLDCOIN_ADDRESS!, 1000000n * 10n ** 6n]); // 1M USDC (6 decimals)
    // m.call(mockWLD, "mint", [process.env.WORLDCOIN_ADDRESS!, 1000000n * 10n ** 18n]); // 1M WLD (18 decimals)

    // return { mockUSDC, mockWLD, bountyManager };

    // PROD
    const bountyManager = m.contract("BountyManager", ['0x79A02482A880bCE3F13e09Da970dC34db4CD24d1', '0x2cFc85d8E48F8EAB294be644d9E25C3030863003']);

    return { bountyManager };
}); 
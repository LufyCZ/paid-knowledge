import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: [
    "@mysten/walrus",
    "@mysten/walrus-wasm",
    "@worldcoin/minikit-js",
    "@noble/curves",
    "@noble/secp256k1",
    "viem",
  ],
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
        crypto: false,
      };
    }

    // Handle ESM modules
    config.externals = config.externals || [];
    if (isServer) {
      config.externals.push({
        "@worldcoin/minikit-js": "commonjs @worldcoin/minikit-js",
        "@noble/curves": "commonjs @noble/curves",
        "@noble/secp256k1": "commonjs @noble/secp256k1",
        viem: "commonjs viem",
      });
    }

    return config;
  },
  turbopack: {
    resolveExtensions: [".ts", ".tsx", ".js", ".jsx", ".mjs", ".cjs", ".json"],
  }
};

export default nextConfig;

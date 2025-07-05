import { getFullnodeUrl, SuiClient } from "@mysten/sui/client";
import { Signer } from "@mysten/sui/cryptography";
import { Ed25519Keypair } from "@mysten/sui/keypairs/ed25519";
import { WalrusClient } from "@mysten/walrus";

const suiClient = new SuiClient({
  url: getFullnodeUrl("testnet"),
});

export const walrusClient = new WalrusClient({
  network: "testnet",
  suiClient,
});

// Function to create signer only when needed (server-side)
export function createWalrusSigner(): Signer {
  const pkey = process.env.WALRUS_SIGNER_ED25519_PRIVATE_KEY;
  if (!pkey) {
    console.error(
      "WALRUS_SIGNER_ED25519_PRIVATE_KEY environment variable is not set"
    );
    console.error("Please set this variable with a valid Ed25519 private key");
    console.error(
      "You can generate one using: npx @mysten/sui keytool generate ed25519"
    );
    throw new Error("WALRUS_SIGNER_ED25519_PRIVATE_KEY is not set");
  }

  try {
    // For development, create a dummy signer if the real key is not available
    if (pkey === "dummy" || pkey === "test") {
      console.warn(
        "Using dummy private key for development - this should not be used in production"
      );
      return new Ed25519Keypair();
    }

    // Try different private key formats
    let keypair: Ed25519Keypair;

    if (pkey.startsWith("suiprivkey")) {
      // Sui format private key
      keypair = Ed25519Keypair.fromSecretKey(pkey);
    } else if (pkey.length === 64 && /^[0-9a-fA-F]+$/.test(pkey)) {
      // Hex format (64 characters)
      const bytes = new Uint8Array(32);
      for (let i = 0; i < 32; i++) {
        bytes[i] = parseInt(pkey.substr(i * 2, 2), 16);
      }
      keypair = Ed25519Keypair.fromSecretKey(bytes);
    } else if (pkey.length === 44) {
      // Base64 format (44 characters)
      try {
        const decoded = Buffer.from(pkey, "base64");
        if (decoded.length === 32) {
          keypair = Ed25519Keypair.fromSecretKey(decoded);
        } else {
          throw new Error(
            `Base64 decoded to ${decoded.length} bytes, expected 32`
          );
        }
      } catch (decodeError) {
        throw new Error(`Invalid base64 private key: ${decodeError}`);
      }
    } else {
      // Try as-is (might be in another format)
      keypair = Ed25519Keypair.fromSecretKey(pkey);
    }

    return keypair;
  } catch (error) {
    console.error("Failed to create Walrus signer:", error);
    console.error("Private key format:", typeof pkey, "length:", pkey?.length);
    console.error("The private key should be in one of these formats:");
    console.error('- Sui private key format (starts with "suiprivkey")');
    console.error("- 32-byte hex string (64 characters)");
    console.error("- Base64 encoded 32 bytes (44 characters)");

    // For development, fall back to a dummy signer
    if (process.env.NODE_ENV === "development") {
      console.warn("Falling back to dummy signer for development");
      return new Ed25519Keypair();
    } else {
      throw new Error(
        "WALRUS_SIGNER_ED25519_PRIVATE_KEY must be a valid Ed25519 private key"
      );
    }
  }
}

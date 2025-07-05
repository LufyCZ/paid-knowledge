// Test file to generate a valid Ed25519 keypair for Walrus
import { Ed25519Keypair } from "@mysten/sui/keypairs/ed25519";

// Generate a new keypair
const keypair = new Ed25519Keypair();

// Get the private key in different formats
const privateKeyBytes = keypair.getSecretKey();
const privateKeyHex = Buffer.from(privateKeyBytes).toString("hex");
const privateKeyBase64 = Buffer.from(privateKeyBytes).toString("base64");

console.log("Generated Ed25519 Keypair:");
console.log("Private Key (hex):", privateKeyHex);
console.log("Private Key (base64):", privateKeyBase64);
console.log("Private Key (bytes length):", privateKeyBytes.length);
console.log("Public Key:", keypair.getPublicKey().toSuiAddress());

// Test different ways to recreate the keypair
console.log("\nTesting reconstruction:");

try {
  const test1 = Ed25519Keypair.fromSecretKey(privateKeyBytes);
  console.log("✓ From bytes works");
} catch (e) {
  console.log("✗ From bytes failed:", e.message);
}

try {
  const test2 = Ed25519Keypair.fromSecretKey(privateKeyHex);
  console.log("✓ From hex string works");
} catch (e) {
  console.log("✗ From hex string failed:", e.message);
}

try {
  const test3 = Ed25519Keypair.fromSecretKey(privateKeyBase64);
  console.log("✓ From base64 string works");
} catch (e) {
  console.log("✗ From base64 string failed:", e.message);
}

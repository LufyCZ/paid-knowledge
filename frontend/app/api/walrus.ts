import { getFullnodeUrl, SuiClient } from '@mysten/sui/client';
import { Signer } from '@mysten/sui/cryptography'
import { Ed25519Keypair } from '@mysten/sui/keypairs/ed25519';
import { WalrusClient } from '@mysten/walrus';

const suiClient = new SuiClient({
  url: getFullnodeUrl('testnet'),
});

export const walrusClient = new WalrusClient({
  network: 'testnet',
  suiClient,
});

const pkey = process.env.WALRUS_SIGNER_ED25519_PRIVATE_KEY
if (!pkey) {
  throw new Error('WALRUS_SIGNER_ED25519_PRIVATE_KEY is not set');
}

export const walrusSigner: Signer = Ed25519Keypair.fromSecretKey(pkey)
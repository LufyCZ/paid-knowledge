import { hashQuestion, questionSchema } from '@/lib/questions';
import z from 'zod';
import { bountyManagerAbi, bountyManagerAddress, client } from '@/lib/viem';
import { Address, maxUint256, parseUnits, toHex } from 'viem';
import { publicProcedure } from '../trpc';

const appId = process.env.NEXT_PUBLIC_WORLDCOIN_APP_ID;
const apiKey = process.env.WORLDCOIN_DEV_PORTAL_API_KEY;

if (!appId || !apiKey) {
  throw new Error("Missing Worldcoin configuration");
}

const tokenMap = {
  'WLD': 0,
  'USDCE': 1
}

async function getPayment(transactionId: string): Promise<{ inputToken: string, inputTokenAmount: string, fromWalletAddress: Address, recipientAddress: Address, reference: string, transactionStatus: 'pending' | 'success' | 'failed' }> {
  return fetch(
    `https://developer.worldcoin.org/api/v2/minikit/transaction/${transactionId}?app_id=${appId}`,
    {
      method: "GET",
      headers: {
        Authorization: `Bearer ${apiKey}`,
      },
    }
  ).then(res => res.json());
}

const TOKEN_DECIMALS = {
  WLD: 18,
  USDC: 6,
} as const;

export const questionCreate = publicProcedure
  .input(z.object({
    transactionId: z.string(),
    question: questionSchema,
  }))
  .mutation(async ({ ctx, input }) => {
    try {
      console.dir(input, { depth: null });

      // Check the payment transaction
      const payment = await getPayment(input.transactionId);
      const formHash = hashQuestion(input.question)

      console.log(formHash)

      if (!payment) {
        throw new Error("Payment not found");
      }

      console.log(payment)

      if (payment.reference !== formHash) {
        throw new Error("Payment reference does not match the question hash");
      }

      // Check if the question already exists
      const existingQuestion = await client.readContract({
        address: bountyManagerAddress,
        abi: bountyManagerAbi,
        functionName: 'dataHashToBountyId',
        args: [toHex(formHash)],
      }).catch(() => null);

      if (existingQuestion !== "0x") {
        throw new Error("Question already exists");

      }

      // Write the whole question to walrus
      const file = new TextEncoder().encode(JSON.stringify(input));
      const blob = await ctx.walrusClient.writeBlob({
        blob: file,
        deletable: false,
        epochs: 10,
        signer: ctx.walrusSigner,
      })

      const paymentToken = tokenMap[payment.inputToken as keyof typeof tokenMap];
      if (!paymentToken) {
        throw new Error("Unsupported payment token");
      }
      const amountPerAnswer = parseUnits((`${input.question.reward?.amount || 0}`), TOKEN_DECIMALS[input.question.reward?.currency || 'WLD']);

      // Write the question to WorldChain
      const txHash = await client.writeContract({
        address: bountyManagerAddress,
        abi: bountyManagerAbi,
        functionName: 'createBounty',
        args: [toHex(blob.blobId), payment.fromWalletAddress, paymentToken, amountPerAnswer, BigInt(payment.inputTokenAmount), maxUint256, toHex(formHash)],
      })

      return {
        txHash,
        blobId: blob.blobId,
      }
    } catch (error) {
      console.error("Error creating question:", error);
      throw new Error(`Failed to create question: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  })

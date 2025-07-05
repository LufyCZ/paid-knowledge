import { fetchRequestHandler } from '@trpc/server/adapters/fetch';
import { appRouter } from '..';
import { createContext, publicProcedure } from '../trpc';
import { hashQuestion, questionSchema } from '@/lib/questions';
import z from 'zod';
import { MiniAppPaymentSuccessPayload } from '@worldcoin/minikit-js'
import { bountyManagerAbi, bountyManagerAddress, client } from '@/lib/viem';
import { Hex, maxUint256 } from 'viem';

function handler(req: Request) {
  return fetchRequestHandler({
    endpoint: '/api/questions/create',
    req,
    router: appRouter,
    createContext
  });
}

const appId = process.env.NEXT_PUBLIC_WORLDCOIN_APP_ID;
const apiKey = process.env.WORLDCOIN_DEV_PORTAL_API_KEY;

if (!appId || !apiKey) {
  throw new Error("Missing Worldcoin configuration");
}

function getPayment(transactionId: string): Promise<MiniAppPaymentSuccessPayload> {
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

export const questionCreate = publicProcedure
  .input(z.object({
    transactionId: z.string(),
    question: questionSchema,
  }))
  .mutation(async ({ ctx, input }) => {
    // Check the payment transaction
    const payment = await getPayment(input.transactionId);
    const formHash = hashQuestion(input.question)

    if (!payment) {
      throw new Error("Payment not found");
    }

    if (payment.status !== "success") {
      throw new Error("Payment not successful");
    }

    if (payment.reference !== formHash) {
      throw new Error("Payment reference does not match the question hash");
    }

    // Check if the question already exists
    // TODO: az bude kontrakt :D

    // Write the whole question to walrus
    const file = new TextEncoder().encode(JSON.stringify(input));
    const blob = await ctx.walrusClient.writeBlob({
      blob: file,
      deletable: false,
      epochs: 10,
      signer: ctx.walrusSigner,
    })

    // Write the question to WorldChain
    const txHash = await client.writeContract({
      address: bountyManagerAddress,
      abi: bountyManagerAbi,
      functionName: 'createBounty',
      args: [Buffer.from(blob.blobId, 'utf-8').toString("hex") as Hex, maxUint256],
    })

    return {
      txHash,
      blobId: blob.blobId,
    }
  })

export { handler as GET, handler as POST };
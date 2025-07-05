import { fetchRequestHandler } from '@trpc/server/adapters/fetch';
import { appRouter } from '../..';
import { createContext, publicProcedure } from '../../trpc';
import z from 'zod';
import { answerSchema } from '@/lib/answers';
import { bountyManagerAbi, bountyManagerAddress, client } from '@/lib/viem';
import { Address, fromHex, Hex, toHex } from 'viem';

function handler(req: Request) {
  return fetchRequestHandler({
    endpoint: '/api/questions/answers/create',
    req,
    router: appRouter,
    createContext
  });
}

export const answerCreate = publicProcedure.input(z.object({ answer: answerSchema })).query(async ({ ctx, input }) => {
  // Check if the user has already answered this question
  const blobIds = await client.readContract({
    address: bountyManagerAddress,
    abi: bountyManagerAbi,
    functionName: 'bountyIdToAnswers',
    args: [toHex(input.answer.questionId), BigInt()],
  }).then((result) => result.map((id) => fromHex(id, 'string')))

  const file = new TextEncoder().encode(JSON.stringify(input.answer));
  const blob = await ctx.walrusClient.writeBlob({
    blob: file,
    deletable: false,
    epochs: 10,
    signer: ctx.walrusSigner,
  })

  // Add the blob id to the question's answers onchain, including the payment
  await client.writeContract({
    address: bountyManagerAddress,
    abi: bountyManagerAbi,
    functionName: 'answerBounty',
    args: [
      toHex(input.answer.questionId),
      toHex(blob.blobId),
      input.answer.answererAddress as Address,
    ],
  })

  return blob
})


export { handler as POST };
import { fetchRequestHandler } from '@trpc/server/adapters/fetch';
import { appRouter } from '..';
import { createContext, publicProcedure } from '../trpc';
import z from 'zod';
import { questionSchema } from '@/lib/questions';
import { bountyManagerAbi, bountyManagerAddress, client } from '@/lib/viem';
import { fromHex } from 'viem';

function handler(req: Request) {
  return fetchRequestHandler({
    endpoint: '/api/questions/get',
    req,
    router: appRouter,
    createContext
  });
}

export const questionsGet = publicProcedure.query(async ({ ctx }) => {
  // Read blob ids from the contract
  const blobIds = await client.readContract({
    address: bountyManagerAddress,
    abi: bountyManagerAbi,
    functionName: 'getAllOpenBounties',
  }).then((result) => result.map((id) => fromHex(id, 'string')))

  const questions = await Promise.allSettled(
    blobIds.map(async (blobId) => {
      const blob = await ctx.walrusClient.readBlob({
        blobId,
      });
      const text = new TextDecoder().decode(blob);
      return questionSchema.parse(JSON.parse(text));
    }))


  const successfulQuestions = questions
    .filter((result): result is PromiseFulfilledResult<z.infer<typeof questionSchema>> => result.status === 'fulfilled')
    .map(result => result.value);

  return successfulQuestions;
})


export { handler as GET };
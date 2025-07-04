import { fetchRequestHandler } from '@trpc/server/adapters/fetch';
import { appRouter } from '../..';
import { createContext, publicProcedure } from '../../trpc';
import z from 'zod';
import { answerSchema } from '@/lib/answers';
import { bountyManagerAbi, bountyManagerAddress, client } from '@/lib/viem';
import { fromHex, toHex } from 'viem';

function handler(req: Request) {
  return fetchRequestHandler({
    endpoint: '/api/questions/answers/get',
    req,
    router: appRouter,
    createContext
  });
}

export const answersGet = publicProcedure.input(z.object({ questionId: z.string() })).query(async ({ ctx, input }) => {
  // Read the question's answers' blob ids from the contract
  const answerBlobIds = await client.readContract({
    address: bountyManagerAddress,
    abi: bountyManagerAbi,
    functionName: 'getAnswersByBountyId',
    args: [toHex(input.questionId)],
  }).then((result) => result.map((r) => fromHex(r.answerId, 'string')))

  const answers = await Promise.allSettled(
    answerBlobIds.map(async (blobId) => {
      const blob = await ctx.walrusClient.readBlob({
        blobId,
      });
      const text = new TextDecoder().decode(blob);
      return answerSchema.parse(JSON.parse(text));
    }))


  const successfulQuestions = answers
    .filter((result): result is PromiseFulfilledResult<z.infer<typeof answerSchema>> => result.status === 'fulfilled')
    .map(result => result.value);

  return successfulQuestions;
})


export { handler as GET };
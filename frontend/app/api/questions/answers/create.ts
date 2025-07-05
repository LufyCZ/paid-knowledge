import { fetchRequestHandler } from '@trpc/server/adapters/fetch';
import { appRouter } from '../..';
import { createContext, publicProcedure } from '../../trpc';
import z from 'zod';
import { answerSchema } from '@/lib/answers';

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
  // TODO: az bude kontrakt :D
  if (false) {
    throw new Error("You have already answered this question");
  }

  // Check if the contract has enough funds to pay for the answer
  // TODO: az bude kontrakt :D
  if (false) {
    throw new Error("Not enough funds to pay for the answer");
  }

  const file = new TextEncoder().encode(JSON.stringify(input.answer));
  const blob = await ctx.walrusClient.writeBlob({
    blob: file,
    deletable: false,
    epochs: 10,
    signer: ctx.walrusSigner,
  })

  // Add the blob id to the question's answers onchain, including the payment
  // TODO: az bude kontrakt a auth nejak :D

  return blob
})


export { handler as POST };
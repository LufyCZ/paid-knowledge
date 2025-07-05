import { fetchRequestHandler } from '@trpc/server/adapters/fetch';
import { appRouter } from '..';
import { createContext, publicProcedure } from '../trpc';
import z from 'zod';
import { questionSchema } from '@/lib/questions';

function handler(req: Request) {
  return fetchRequestHandler({
    endpoint: '/api/questions/get_one',
    req,
    router: appRouter,
    createContext
  });
}

export const questionGet = publicProcedure.input(z.string()).query(async ({ ctx, input }) => {
  const blob = await ctx.walrusClient.readBlob({
    blobId: input,
  });

  const text = new TextDecoder().decode(blob);
  return questionSchema.parse(JSON.parse(text));
})


export { handler as GET };
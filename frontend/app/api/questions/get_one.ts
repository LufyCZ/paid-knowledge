import { publicProcedure } from '../trpc';
import z from 'zod';
import { questionSchema } from '@/lib/questions';

export const questionGet = publicProcedure.input(z.string()).query(async ({ ctx, input }) => {
  const blob = await ctx.walrusClient.readBlob({
    blobId: input,
  });

  const text = new TextDecoder().decode(blob);
  return questionSchema.parse(JSON.parse(text));
})


import z from 'zod';
import { publicProcedure, router } from './trpc';
import { questionSchema } from '@/lib/questions';

export const appRouter = router({
  question: {
    create: publicProcedure
      .input(questionSchema)
      .mutation(async ({ ctx, input }) => {
        // Check the payment transaction

        // Write the whole question to walrus
        const file = new TextEncoder().encode(JSON.stringify(input));
        const blob = await ctx.walrusClient.writeBlob({
          blob: file,
          deletable: false,
          epochs: 1,
          signer: ctx.walrusSigner,
        })

        // Write the question to WorldChain

        return blob
      }),
    get: publicProcedure.input(z.string()).query(async ({ ctx, input }) => {
      const blob = await ctx.walrusClient.readBlob({
        blobId: input,
      });

      const text = new TextDecoder().decode(blob);
      return questionSchema.parse(JSON.parse(text));
    })
  },
});

export type AppRouter = typeof appRouter;
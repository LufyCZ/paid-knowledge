import { publicProcedure } from '../../trpc';
import z from 'zod';
import { answerSchema } from '@/lib/answers';
import { bountyManagerAbi, bountyManagerAddress, client } from '@/lib/viem';
import { Address, fromHex, toHex } from 'viem';

export const answerCreate = publicProcedure.input(z.object({ answer: answerSchema })).query(async ({ ctx, input }) => {
  // Check if the user has already answered this question
  const answers = await client.readContract({
    address: bountyManagerAddress,
    abi: bountyManagerAbi,
    functionName: 'getAnswersByBountyId',
    args: [toHex(input.answer.questionId)],
  }).then((result) => result.map((r) => ({ answerId: fromHex(r.answerId, 'string'), answerer: r.answerer })))

  if (answers.some((a) => a.answerer.toLowerCase() === input.answer.answererAddress.toLowerCase())) {
    throw new Error('You have already answered this question');
  }

  // Upload the answer to Walrus
  const file = new TextEncoder().encode(JSON.stringify(input.answer));
  const blob = await ctx.walrusClient.writeBlob({
    blob: file,
    deletable: false,
    epochs: 10,
    signer: ctx.walrusSigner,
  })

  // Add the blob id to the question's answers onchain
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

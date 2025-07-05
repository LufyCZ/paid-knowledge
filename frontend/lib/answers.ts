import z from "zod";

export const textAnswerEntrySchema = z.object({
  formEntryId: z.string(),
  text: z.string(),
})

export const numberAnswerEntrySchema = z.object({
  formEntryId: z.string(),
  number: z.number(),
})

export const imageAnswerEntrySchema = z.object({
  formEntryId: z.string(),
  imageBlobId: z.string(),
})

export const answerEntrySchema = z.union([
  textAnswerEntrySchema,
  numberAnswerEntrySchema,
  imageAnswerEntrySchema,
]);

export const answerSchema = z.object({
  questionId: z.string(),
  answererAddress: z.string(),
  entries: z.array(answerEntrySchema),
})
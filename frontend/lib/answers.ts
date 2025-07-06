import z from "zod";

export const textAnswerEntrySchema = z.object({
  formEntryId: z.string(),
  data: z.string(),
})

export const numberAnswerEntrySchema = z.object({
  formEntryId: z.string(),
  data: z.number(),
})

export const imageAnswerEntrySchema = z.object({
  formEntryId: z.string(),
  data: z.string(),
})

export const checkboxAnswerEntrySchema = z.object({
  formEntryId: z.string(),
  data: z.boolean(),
})


export const answerEntrySchema = z.union([
  textAnswerEntrySchema,
  numberAnswerEntrySchema,
  imageAnswerEntrySchema,
  checkboxAnswerEntrySchema,
]);

export const answerSchema = z.object({
  questionId: z.string(),
  answererAddress: z.string(),
  entries: z.array(answerEntrySchema),
})
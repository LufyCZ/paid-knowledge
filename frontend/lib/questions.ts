import z from "zod";
import { formSchema } from "./forms";
import { hash } from "crypto";

export const questionSchema = z.object({
  title: z.string(),
  description: z.string().optional(),
  form: formSchema,
  reward: z.object({
    amount: z.string().describe("The amount of the reward that the user will receive for answering the question"),
    currency: z.union([z.literal("USDC"), z.literal("WLD")]).describe("The currency of the reward"),
  }).optional()
})

export function hashQuestion(question: z.infer<typeof questionSchema>): string {
  const json = JSON.stringify(question);
  return hash("sha3-512", json)
}
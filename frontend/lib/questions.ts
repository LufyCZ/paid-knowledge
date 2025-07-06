import z from "zod";
import { formSchema } from "./forms";
import { createHash } from "crypto-browserify";

export const questionSchema = z.object({
  title: z.string(),
  description: z.string().optional(),
  form: formSchema,
  type: z.enum(["Survey", 'Form']),
  verificationLevel: z.enum(["none", "device", "orb"]),
  endDate: z.string(),
  reward: z.object({
    amount: z.number().describe("The amount of the reward that the user will receive for answering the question"),
    currency: z.union([z.literal("USDC"), z.literal("WLD")]).describe("The currency of the reward"),
  }).optional()
})

export function hashQuestion(question: z.infer<typeof questionSchema>): string {
  const json = JSON.stringify(questionSchema.parse(question));
  return createHash("rmd160").update(json).digest("hex").slice(0, 32)
}
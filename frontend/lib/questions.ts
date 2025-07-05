import z from "zod";
import { formSchema } from "./forms";

export const questionSchema = z.object({
  title: z.string(),
  description: z.string().optional(),
  form: formSchema,
  reward: z.object({
    amount: z.string().describe("The amount of the reward that the user will receive for answering the question"),
    currency: z.string(),
    paymentTx: z.string()
  }).optional()
})
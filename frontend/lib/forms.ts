import * as z from "zod";
import { useTRPCClient } from "./trpc";

export interface CreateFormData {
  name: string;
  description: string;
  startDate: string;
  endDate: string;
  visibility: "Public" | "Private";
  rewardPerQuestion: number;
  rewardToken: "USDC" | "WLD";
  userEligibility?: "Orb" | "Device" | "All";
  questions: {
    id: number;
    title: string;
    description: string;
    type: string;
    options?: string[];
  }[];
  // Optional payment data for funded forms
  paymentData?: {
    amount: number;
    transactionId: string;
    maxQuestions: number;
  };
}

export async function createBountyForm(formData: CreateFormData) {
  const client = useTRPCClient();
  try {
    // Map CreateFormData to questionSchema
    const question = {
      title: formData.name,
      description: formData.description,
      form: formData.questions.map(q => {
        if (q.type === "Short Text" || q.type === "Long Text") {
          return {
            type: "text" as const,
            id: String(q.id),
            label: q.title,
          };
        } else if (q.type === "Number") {
          return {
            type: "number" as const,
            id: String(q.id),
            label: q.title,
          };
        } else if (q.type === "Image") {
          return {
            type: "image" as const,
            id: String(q.id),
            label: q.title,
            min: 1,
            max: 1,
          };
        } else {
          // Default to text for unknown types
          return {
            type: "text" as const,
            id: String(q.id),
            label: q.title,
          };
        }
      }),
      reward: {
        amount: String(formData.rewardPerQuestion),
        currency: formData.rewardToken,
      },
    };
    const transactionId = formData.paymentData?.transactionId || "";
    const result = await client.questions.create.mutate({ transactionId, question });
    return { success: true, data: result };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : "Unknown error occurred" };
  }
}

export async function getBountyForms() {
  const client = useTRPCClient();
  try {
    const data = await client.questions.get.query();
    return { success: true, data };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : "Unknown error occurred" };
  }
}

export async function getBountyForm(id: string) {
  const client = useTRPCClient();
  try {
    const data = await client.questions.get_one.query(id);
    return { success: true, data };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : "Unknown error occurred" };
  }
}

export const textFormEntrySchema = z.object({
  type: z.literal("text"),
  id: z.string(),
  label: z.string(),
  min: z.number().optional(),
  max: z.number().optional(),
  placeholder: z.string().optional(),
  required: z.boolean().optional(),
});

export const numberFormEntrySchema = z.object({
  type: z.literal("number"),
  id: z.string(),
  label: z.string(),
  placeholder: z.string().optional(),
  required: z.boolean().optional(),
  min: z.number().optional(),
  max: z.number().optional(),
  integer: z.boolean().optional(),
});

export const imageFormEntrySchema = z.object({
  type: z.literal("image"),
  id: z.string(),
  label: z.string(),
  min: z.number(),
  max: z.number(),
});

export const formEntrySchema = z.discriminatedUnion("type", [
  textFormEntrySchema,
  numberFormEntrySchema,
  imageFormEntrySchema,
]);

export const formSchema = z.array(formEntrySchema);

// Form submission types
export interface FormSubmissionData {
  formId: string;
  walletAddress?: string;
  answers: {
    questionId: string;
    answerText?: string;
    answerOptions?: string[];
    fileUrl?: string;
  }[];
}

export async function submitFormResponse(submissionData: FormSubmissionData) {
  const client = useTRPCClient();
  try {
    // Map FormSubmissionData to answerSchema
    const answer = {
      questionId: submissionData.formId,
      answererAddress: submissionData.walletAddress || "",
      entries: submissionData.answers.map(a => {
        if (a.answerText !== undefined) {
          return { formEntryId: a.questionId, text: a.answerText };
        } else if (a.answerOptions !== undefined) {
          return { formEntryId: a.questionId, text: a.answerOptions.join(", ") };
        } else if (a.fileUrl !== undefined) {
          return { formEntryId: a.questionId, imageBlobId: a.fileUrl };
        }
        return { formEntryId: a.questionId, text: "" };
      })
    };
    const result = await client.questions.answers.create.query({ answer });
    return { success: true, data: result };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : "Unknown error occurred" };
  }
}

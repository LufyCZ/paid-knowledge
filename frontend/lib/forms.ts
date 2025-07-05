import * as z from "zod";
import { supabase } from "./supabase";

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
  try {
    // 1. Create the bounty form
    const { data: form, error: formError } = await supabase
      .from("bounty_forms")
      .insert({
        name: formData.name,
        description: formData.description,
        start_date: formData.startDate,
        end_date: formData.endDate,
        visibility: formData.visibility,
        reward_per_question: formData.rewardPerQuestion,
        reward_token: formData.rewardToken,
        user_eligibility: formData.userEligibility || "All",
        status: formData.paymentData ? "active" : "draft", // Active if funded, draft otherwise
      })
      .select()
      .single();

    if (formError) {
      console.error("Error creating form:", formError);
      throw new Error("Failed to create form");
    }

    // 2. Create the questions
    const questionsToInsert = formData.questions.map((question, index) => ({
      form_id: form.id,
      title: question.title,
      description: question.description,
      type: question.type,
      options: question.options || null,
      order_index: index,
    }));

    const { data: questions, error: questionsError } = await supabase
      .from("form_questions")
      .insert(questionsToInsert)
      .select();

    if (questionsError) {
      console.error("Error creating questions:", questionsError);
      // Rollback: delete the form if questions failed
      await supabase.from("bounty_forms").delete().eq("id", form.id);
      throw new Error("Failed to create questions");
    }

    // 3. If payment data provided, store payment reference
    if (formData.paymentData) {
      const { error: paymentError } = await supabase
        .from("payment_references")
        .insert({
          reference_id: formData.paymentData.transactionId,
          transaction_id: formData.paymentData.transactionId,
          status: "confirmed",
          form_id: form.id,
          metadata: {
            amount: formData.paymentData.amount,
            maxQuestions: formData.paymentData.maxQuestions,
            purpose: "form_funding",
          },
          confirmed_at: new Date().toISOString(),
        });

      if (paymentError) {
        console.error("Error storing payment reference:", paymentError);
        // Don't fail form creation, just log the error
      }
    }

    return {
      form,
      questions,
      success: true,
    };
  } catch (error) {
    console.error("Error in createBountyForm:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error occurred",
    };
  }
}

export async function getBountyForms(limit = 10, offset = 0) {
  try {
    const { data, error } = await supabase
      .from("bounty_forms")
      .select(
        `
        *,
        form_questions (
          id,
          title,
          type,
          order_index
        )
      `
      )
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      console.error("Error fetching forms:", error);
      throw new Error("Failed to fetch forms");
    }

    return {
      data,
      success: true,
    };
  } catch (error) {
    console.error("Error in getBountyForms:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error occurred",
    };
  }
}

export async function getBountyForm(id: string) {
  try {
    const { data, error } = await supabase
      .from("bounty_forms")
      .select(
        `
        *,
        form_questions (
          id,
          title,
          description,
          type,
          options,
          order_index
        )
      `
      )
      .eq("id", id)
      .single();

    if (error) {
      console.error("Error fetching form:", error);
      throw new Error("Failed to fetch form");
    }

    return {
      data,
      success: true,
    };
  } catch (error) {
    console.error("Error in getBountyForm:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error occurred",
    };
  }
}

export async function updateFormStatus(
  id: string,
  status: "draft" | "active" | "completed" | "cancelled"
) {
  try {
    const { data, error } = await supabase
      .from("bounty_forms")
      .update({
        status,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select()
      .single();

    if (error) {
      console.error("Error updating form status:", error);
      throw new Error("Failed to update form status");
    }

    return {
      data,
      success: true,
    };
  } catch (error) {
    console.error("Error in updateFormStatus:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error occurred",
    };
  }
}
export const textFormEntrySchema = z.object({
  type: z.literal("text"),
  id: z.string(),
  label: z.string(),
  min: z.number().optional(),
  max: z.number().optional(),
  placeholder: z.string().optional(),
  required: z.boolean(),
});

export const numberFormEntrySchema = z.object({
  type: z.literal("number"),
  id: z.string(),
  label: z.string(),
  placeholder: z.string().optional(),
  required: z.boolean(),
  min: z.number().optional(),
  max: z.number().optional(),
  integer: z.boolean(),
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

export type FormEntryType = z.infer<typeof formEntrySchema>['type']

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
  try {
    // 1. Get form details to calculate reward
    const formResult = await getBountyForm(submissionData.formId);
    if (!formResult.success || !formResult.data) {
      throw new Error("Form not found");
    }

    const form = formResult.data;
    const totalReward =
      form.reward_per_question * submissionData.answers.length;

    // 2. Create form response
    const { data: response, error: responseError } = await supabase
      .from("form_responses")
      .insert({
        form_id: submissionData.formId,
        wallet_address: submissionData.walletAddress,
        total_reward: totalReward,
        reward_token: form.reward_token,
        status: "pending",
      })
      .select()
      .single();

    if (responseError) {
      console.error("Error creating response:", responseError);
      throw new Error("Failed to create form response");
    }

    // 3. Insert answers
    const answersToInsert = submissionData.answers.map((answer) => ({
      response_id: response.id,
      question_id: answer.questionId,
      answer_text: answer.answerText || null,
      answer_options: answer.answerOptions || null,
      file_url: answer.fileUrl || null,
    }));

    const { error: answersError } = await supabase
      .from("question_answers")
      .insert(answersToInsert);

    if (answersError) {
      console.error("Error inserting answers:", answersError);
      throw new Error("Failed to save answers");
    }

    return {
      data: {
        responseId: response.id,
        totalReward,
        rewardToken: form.reward_token,
      },
      success: true,
    };
  } catch (error) {
    console.error("Error in submitFormResponse:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error occurred",
    };
  }
}

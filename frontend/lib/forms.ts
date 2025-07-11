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
  creatorWalletAddress?: string; // Add creator wallet address
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
    function toTitleCase(str: string) {
      return str.replace(
        /\w\S*/g,
        (txt) => txt.charAt(0).toUpperCase() + txt.substring(1).toLowerCase()
      );
    }

    const { data: form, error: formError } = await supabase
      .from("bounty_forms")
      .insert({
        name: toTitleCase(formData.name),
        description: formData.description,
        start_date: formData.startDate,
        end_date: formData.endDate,
        visibility: formData.visibility,
        reward_per_question: formData.rewardPerQuestion,
        reward_token: formData.rewardToken,
        user_eligibility: formData.userEligibility || "All",
        creator_id: formData.creatorWalletAddress?.toLowerCase() || null,
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
  try {
    // 1. Check if user has already submitted to this form
    const { data: existingSubmission, error: checkError } = await supabase
      .from("form_responses")
      .select("id")
      .eq("form_id", submissionData.formId)
      .eq("wallet_address", submissionData.walletAddress)
      .single();

    if (checkError && checkError.code !== "PGRST116") {
      // PGRST116 is "not found" error, which is what we want
      console.error("Error checking existing submission:", checkError);
      throw new Error("Failed to check existing submissions");
    }

    if (existingSubmission) {
      throw new Error("You have already submitted a response to this quest");
    }

    // 2. Get form details to calculate reward
    const formResult = await getBountyForm(submissionData.formId);
    if (!formResult.success || !formResult.data) {
      throw new Error("Form not found");
    }

    const form = formResult.data;
    const totalReward = form.reward_per_question; // Use the stored value directly as total reward

    // 3. Create form response
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

    // 4. Insert answers
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

// Get forms created by a specific user (by wallet address)
export async function getUserCreatedForms(
  walletAddress: string,
  limit = 10,
  offset = 0
) {
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
      .eq("creator_id", walletAddress.toLowerCase())
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      console.error("Error fetching user created forms:", error);
      throw new Error("Failed to fetch user created forms");
    }

    return {
      data,
      success: true,
    };
  } catch (error) {
    console.error("Error in getUserCreatedForms:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error occurred",
    };
  }
}

// Get responses for a specific form (for form creators to manage)
export async function getFormResponses(
  formId: string,
  status?: "pending" | "approved" | "rejected" | "paid"
) {
  try {
    let query = supabase
      .from("form_responses")
      .select(
        `
        *,
        question_answers (
          id,
          question_id,
          answer_text,
          answer_options,
          file_url,
          form_questions!inner (
            title,
            type,
            order_index
          )
        )
      `
      )
      .eq("form_id", formId)
      .order("submitted_at", { ascending: false });

    if (status) {
      query = query.eq("status", status);
    }

    const { data, error } = await query;

    if (error) {
      console.error("Error fetching form responses:", error);
      throw new Error("Failed to fetch form responses");
    }

    return {
      data,
      success: true,
    };
  } catch (error) {
    console.error("Error in getFormResponses:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error occurred",
    };
  }
}

// Update response status (approve/reject)
export async function updateResponseStatus(
  responseId: string,
  status: "approved" | "rejected" | "paid",
  walletAddress?: string
) {
  try {
    // First verify that the user owns the form this response belongs to
    if (walletAddress) {
      const { data: response, error: responseError } = await supabase
        .from("form_responses")
        .select(
          `
          form_id,
          bounty_forms!inner (
            creator_id
          )
        `
        )
        .eq("id", responseId)
        .single();

      if (responseError) {
        throw new Error("Response not found");
      }

      if (
        (response as any).bounty_forms.creator_id !==
        walletAddress.toLowerCase()
      ) {
        throw new Error(
          "Unauthorized: You can only manage responses to your own forms"
        );
      }
    }

    const { data, error } = await supabase
      .from("form_responses")
      .update({
        status,
        updated_at: new Date().toISOString(),
      })
      .eq("id", responseId)
      .select()
      .single();

    if (error) {
      console.error("Error updating response status:", error);
      throw new Error("Failed to update response status");
    }

    return {
      data,
      success: true,
    };
  } catch (error) {
    console.error("Error in updateResponseStatus:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error occurred",
    };
  }
}

// Bulk approve multiple responses
export async function bulkApproveResponses(
  responseIds: string[],
  walletAddress?: string
) {
  try {
    // Verify ownership for all responses if wallet address provided
    if (walletAddress) {
      const { data: responses, error: responseError } = await supabase
        .from("form_responses")
        .select(
          `
          id,
          bounty_forms!inner (
            creator_id
          )
        `
        )
        .in("id", responseIds);

      if (responseError) {
        throw new Error("Failed to verify response ownership");
      }

      const unauthorizedResponses = responses.filter(
        (response) =>
          (response as any).bounty_forms.creator_id !==
          walletAddress.toLowerCase()
      );

      if (unauthorizedResponses.length > 0) {
        throw new Error(
          "Unauthorized: You can only manage responses to your own forms"
        );
      }
    }

    const { data, error } = await supabase
      .from("form_responses")
      .update({
        status: "approved",
        updated_at: new Date().toISOString(),
      })
      .in("id", responseIds)
      .select();

    if (error) {
      console.error("Error bulk approving responses:", error);
      throw new Error("Failed to bulk approve responses");
    }

    return {
      data,
      success: true,
    };
  } catch (error) {
    console.error("Error in bulkApproveResponses:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error occurred",
    };
  }
}

// Get remaining balance for quest payouts
export async function getQuestRemainingBalance(questId: string) {
  try {
    // 1. Get total amount deposited for this quest
    const { data: payments, error: paymentsError } = await supabase
      .from("payment_references")
      .select("metadata")
      .eq("form_id", questId)
      .eq("status", "confirmed");

    if (paymentsError) {
      throw new Error(paymentsError.message);
    }

    let totalDeposited = 0;
    let rewardToken = "USDC";

    // Calculate total deposited amount
    if (payments && payments.length > 0) {
      totalDeposited = payments.reduce((sum, payment) => {
        if (payment.metadata && payment.metadata.amount) {
          return sum + parseFloat(payment.metadata.amount);
        }
        return sum;
      }, 0);
    }

    // 2. Get quest details for reward info
    const { data: quest, error: questError } = await supabase
      .from("bounty_forms")
      .select("reward_per_question, reward_token")
      .eq("id", questId)
      .single();

    if (questError) {
      throw new Error(questError.message);
    }

    if (quest) {
      rewardToken = quest.reward_token;
    }

    // 3. Get total amount already paid out (approved responses)
    const { data: responses, error: responsesError } = await supabase
      .from("form_responses")
      .select("total_reward")
      .eq("form_id", questId)
      .in("status", ["approved", "paid"]);

    if (responsesError) {
      throw new Error(responsesError.message);
    }

    let totalPaidOut = 0;
    if (responses && responses.length > 0) {
      totalPaidOut = responses.reduce((sum, response) => {
        return sum + (response.total_reward || 0);
      }, 0);
    }

    const remainingBalance = totalDeposited - totalPaidOut;

    return {
      success: true,
      data: {
        totalDeposited,
        totalPaidOut,
        remainingBalance,
        rewardToken,
      },
    };
  } catch (error) {
    console.error("Error getting quest balance:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error occurred",
    };
  }
}

// Get user's quest submission history
export async function getUserSubmissionHistory(
  walletAddress: string,
  limit = 20,
  offset = 0
) {
  try {
    const { data, error } = await supabase
      .from("form_responses")
      .select(
        `
        id,
        total_reward,
        reward_token,
        status,
        submitted_at,
        bounty_forms (
          id,
          name,
          description,
          reward_per_question,
          reward_token
        )
      `
      )
      .eq("wallet_address", walletAddress)
      .order("submitted_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      console.error("Error fetching user submission history:", error);
      throw new Error("Failed to fetch submission history");
    }

    return {
      data: data || [],
      success: true,
    };
  } catch (error) {
    console.error("Error in getUserSubmissionHistory:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error occurred",
    };
  }
}

// Check if user has already submitted to a specific form
export async function hasUserSubmittedToForm(
  walletAddress: string,
  formId: string
) {
  try {
    const { data, error } = await supabase
      .from("form_responses")
      .select("id")
      .eq("form_id", formId)
      .eq("wallet_address", walletAddress)
      .single();

    if (error && error.code !== "PGRST116") {
      // PGRST116 is "not found" error
      console.error("Error checking submission status:", error);
      throw new Error("Failed to check submission status");
    }

    return {
      data: {
        hasSubmitted: !!data,
        submissionId: data?.id || null,
      },
      success: true,
    };
  } catch (error) {
    console.error("Error in hasUserSubmittedToForm:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error occurred",
    };
  }
}

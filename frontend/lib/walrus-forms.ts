import * as z from "zod";
import { WalrusStorage } from "./walrus-storage";

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
    title: string;
    description: string;
    type: string;
    options?: string[];
  }[];
  paymentData?: {
    transactionId: string;
    amount: number;
    maxQuestions: number;
  };
}

export interface BountyForm {
  id: string;
  name: string;
  description: string;
  start_date: string;
  end_date: string;
  visibility: "Public" | "Private";
  reward_per_question: number;
  reward_token: "USDC" | "WLD";
  creator_id?: string;
  created_at: string;
  updated_at: string;
  status: "draft" | "active" | "completed" | "cancelled";
  user_eligibility: "Orb" | "Device" | "All";
  featured: boolean;
}

export interface FormQuestion {
  id: string;
  form_id: string;
  title: string;
  description?: string;
  type: string;
  options?: string[];
  order_index: number;
  created_at: string;
  updated_at: string;
}

export interface FormResponse {
  id: string;
  form_id: string;
  wallet_address?: string;
  submitted_at: string;
  total_reward: number;
  reward_token: "USDC" | "WLD";
  status: "pending" | "approved" | "rejected" | "paid";
}

export interface QuestionAnswer {
  id: string;
  response_id: string;
  question_id: string;
  answer_text?: string;
  answer_options?: string[];
  file_url?: string;
  created_at: string;
}

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

export async function createBountyForm(formData: CreateFormData) {
  try {
    // 1. Create the bounty form
    const formToSave: BountyForm = {
      id: "", // Will be set by WalrusStorage
      name: formData.name,
      description: formData.description,
      start_date: formData.startDate,
      end_date: formData.endDate,
      visibility: formData.visibility,
      reward_per_question: formData.rewardPerQuestion,
      reward_token: formData.rewardToken,
      user_eligibility: formData.userEligibility || "All",
      status: formData.paymentData ? "active" : "draft",
      featured: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const formResult = await WalrusStorage.saveRecord(
      "bounty_form",
      formToSave,
      {
        metadata: {
          visibility: formData.visibility,
          status: formToSave.status,
          reward_token: formData.rewardToken,
          user_eligibility: formData.userEligibility || "All",
          featured: false,
        },
      }
    );

    if (!formResult.success || !formResult.id) {
      throw new Error(formResult.error || "Failed to create form");
    }

    const formId = formResult.id;

    // 2. Create the questions
    const questionResults = [];
    for (let index = 0; index < formData.questions.length; index++) {
      const question = formData.questions[index];
      const questionToSave: FormQuestion = {
        id: "", // Will be set by WalrusStorage
        form_id: formId,
        title: question.title,
        description: question.description,
        type: question.type,
        options: question.options || undefined,
        order_index: index,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      const questionResult = await WalrusStorage.saveRecord(
        "form_question",
        questionToSave,
        {
          parent_id: formId,
          metadata: {
            form_id: formId,
            type: question.type,
            order_index: index,
          },
        }
      );

      questionResults.push(questionResult);
    }

    const failedQuestions = questionResults.filter((r) => !r.success);
    if (failedQuestions.length > 0) {
      console.warn(`${failedQuestions.length} questions failed to save`);
    }

    // 3. If payment data provided, store payment reference
    if (formData.paymentData) {
      const paymentData = {
        reference_id: formData.paymentData.transactionId,
        transaction_id: formData.paymentData.transactionId,
        status: "confirmed",
        form_id: formId,
        metadata: {
          amount: formData.paymentData.amount,
          maxQuestions: formData.paymentData.maxQuestions,
          purpose: "form_funding",
        },
        confirmed_at: new Date().toISOString(),
      };

      await WalrusStorage.saveRecord("payment_reference", paymentData, {
        parent_id: formId,
        metadata: {
          form_id: formId,
          status: "confirmed",
          purpose: "form_funding",
        },
      });
    }

    return {
      data: {
        formId,
        blobId: formResult.blobId,
        questionsCount: questionResults.length,
        successfulQuestions: questionResults.filter((r) => r.success).length,
      },
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
    const result = await WalrusStorage.queryRecords({
      type: "bounty_form",
      limit,
      offset,
    });

    if (!result.success) {
      throw new Error(result.error || "Failed to fetch forms");
    }

    // Get questions for each form
    const formsWithQuestions = await Promise.all(
      (result.data || []).map(async (formRecord) => {
        const questionsResult = await WalrusStorage.queryRecords({
          type: "form_question",
          parent_id: formRecord.id,
        });

        return {
          ...formRecord.data,
          id: formRecord.id,
          form_questions: questionsResult.success
            ? (questionsResult.data || []).map((q) => ({ ...q.data, id: q.id }))
            : [],
        };
      })
    );

    return {
      data: formsWithQuestions,
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
    const formResult = await WalrusStorage.getRecord(id);
    if (!formResult.success || !formResult.data) {
      throw new Error("Form not found");
    }

    // Get questions for this form
    const questionsResult = await WalrusStorage.queryRecords({
      type: "form_question",
      parent_id: id,
    });

    const form = {
      ...formResult.data.data,
      id: formResult.data.id,
      form_questions: questionsResult.success
        ? (questionsResult.data || [])
            .map((q) => ({ ...q.data, id: q.id }))
            .sort((a, b) => a.order_index - b.order_index)
        : [],
    };

    return {
      data: form,
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
    const result = await WalrusStorage.updateRecord(
      id,
      { status, updated_at: new Date().toISOString() },
      { status }
    );

    if (!result.success) {
      throw new Error("Failed to update form status");
    }

    return {
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
    const responseData: FormResponse = {
      id: "", // Will be set by WalrusStorage
      form_id: submissionData.formId,
      wallet_address: submissionData.walletAddress,
      total_reward: totalReward,
      reward_token: form.reward_token,
      status: "pending",
      submitted_at: new Date().toISOString(),
    };

    const responseResult = await WalrusStorage.saveRecord(
      "form_response",
      responseData,
      {
        parent_id: submissionData.formId,
        metadata: {
          form_id: submissionData.formId,
          wallet_address: submissionData.walletAddress,
          status: "pending",
          total_reward: totalReward,
        },
      }
    );

    if (!responseResult.success || !responseResult.id) {
      throw new Error(responseResult.error || "Failed to create form response");
    }

    const responseId = responseResult.id;

    // 3. Insert answers
    const answerResults = [];
    for (const answer of submissionData.answers) {
      const answerData: QuestionAnswer = {
        id: "", // Will be set by WalrusStorage
        response_id: responseId,
        question_id: answer.questionId,
        answer_text: answer.answerText,
        answer_options: answer.answerOptions,
        file_url: answer.fileUrl,
        created_at: new Date().toISOString(),
      };

      const answerResult = await WalrusStorage.saveRecord(
        "question_answer",
        answerData,
        {
          parent_id: responseId,
          metadata: {
            response_id: responseId,
            question_id: answer.questionId,
            answer_type: answer.answerText
              ? "text"
              : answer.answerOptions
              ? "options"
              : "file",
          },
        }
      );

      answerResults.push(answerResult);
    }

    const failedAnswers = answerResults.filter((r) => !r.success);
    if (failedAnswers.length > 0) {
      console.warn(`${failedAnswers.length} answers failed to save`);
    }

    return {
      data: {
        responseId,
        totalReward,
        rewardToken: form.reward_token,
        blobId: responseResult.blobId,
        answersCount: answerResults.length,
        successfulAnswers: answerResults.filter((r) => r.success).length,
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

export async function getFormResponses(formId: string) {
  try {
    const result = await WalrusStorage.queryRecords({
      type: "form_response",
      parent_id: formId,
    });

    if (!result.success) {
      throw new Error(result.error || "Failed to fetch responses");
    }

    // Get answers for each response
    const responsesWithAnswers = await Promise.all(
      (result.data || []).map(async (responseRecord) => {
        const answersResult = await WalrusStorage.queryRecords({
          type: "question_answer",
          parent_id: responseRecord.id,
        });

        return {
          ...responseRecord.data,
          id: responseRecord.id,
          question_answers: answersResult.success
            ? (answersResult.data || []).map((a) => ({ ...a.data, id: a.id }))
            : [],
        };
      })
    );

    return {
      data: responsesWithAnswers,
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

import { supabase } from "./supabase";

export interface CreateFormData {
  name: string;
  description: string;
  startDate: string;
  endDate: string;
  visibility: "Public" | "Private";
  rewardPerQuestion: number;
  rewardToken: "USDC" | "WLD";
  questions: {
    id: number;
    title: string;
    description: string;
    type: string;
    options?: string[];
  }[];
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
        status: "draft",
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
import * as z from 'zod'

export const textFormEntrySchema = z.object({
  type: z.literal('text'),
  id: z.string(),
  label: z.string(),
  min: z.number().optional(),
  max: z.number().optional(),
  placeholder: z.string().optional(),
  required: z.boolean().optional(),
})

export const numberFormEntrySchema = z.object({
  type: z.literal('number'),
  id: z.string(),
  label: z.string(),
  placeholder: z.string().optional(),
  required: z.boolean().optional(),
  min: z.number().optional(),
  max: z.number().optional(),
  integer: z.boolean().optional(),
})

export const imageFormEntrySchema = z.object({
  type: z.literal('image'),
  id: z.string(),
  label: z.string(),
  min: z.number(),
  max: z.number(),
})

export const formEntrySchema = z.discriminatedUnion('type', [textFormEntrySchema, numberFormEntrySchema, imageFormEntrySchema])
export const formSchema = z.array(formEntrySchema)

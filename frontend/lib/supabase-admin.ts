import { createClient } from "@supabase/supabase-js";
import { Database } from "./supabase";

// Server-side admin client with service role key
// This bypasses Row Level Security and should only be used in secure server environments
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export const supabaseAdmin = createClient<Database>(
  supabaseUrl,
  supabaseServiceKey,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
);

// Admin-only operations
export class AdminService {
  // Get all forms with full details (bypasses RLS)
  static async getAllForms() {
    try {
      const { data, error } = await supabaseAdmin
        .from("bounty_forms")
        .select(
          `
          *,
          form_questions (
            id,
            title,
            type,
            order_index,
            options
          )
        `
        )
        .order("created_at", { ascending: false });

      if (error) throw error;
      return { data, success: true };
    } catch (error) {
      console.error("Admin: Error fetching all forms:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  // Get form statistics
  static async getFormStats() {
    try {
      const { data: forms, error: formsError } = await supabaseAdmin
        .from("bounty_forms")
        .select("status");

      const { data: responses, error: responsesError } = await supabaseAdmin
        .from("form_responses")
        .select("status, total_reward, reward_token");

      if (formsError) throw formsError;
      if (responsesError) throw responsesError;

      const stats = {
        totalForms: forms?.length || 0,
        draftForms: forms?.filter((f) => f.status === "draft").length || 0,
        activeForms: forms?.filter((f) => f.status === "active").length || 0,
        completedForms:
          forms?.filter((f) => f.status === "completed").length || 0,
        totalResponses: responses?.length || 0,
        pendingResponses:
          responses?.filter((r) => r.status === "pending").length || 0,
        totalRewardsPaid:
          responses
            ?.filter((r) => r.status === "paid")
            .reduce((sum, r) => sum + r.total_reward, 0) || 0,
      };

      return { data: stats, success: true };
    } catch (error) {
      console.error("Admin: Error fetching stats:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  // Bulk update form status
  static async bulkUpdateFormStatus(
    formIds: string[],
    status: "draft" | "active" | "completed" | "cancelled"
  ) {
    try {
      const { data, error } = await supabaseAdmin
        .from("bounty_forms")
        .update({
          status,
          updated_at: new Date().toISOString(),
        })
        .in("id", formIds)
        .select();

      if (error) throw error;
      return { data, success: true };
    } catch (error) {
      console.error("Admin: Error bulk updating forms:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  // Delete form and all related data
  static async deleteForm(formId: string) {
    try {
      // Supabase will handle cascading deletes due to foreign key constraints
      const { error } = await supabaseAdmin
        .from("bounty_forms")
        .delete()
        .eq("id", formId);

      if (error) throw error;
      return { success: true };
    } catch (error) {
      console.error("Admin: Error deleting form:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  // Get all responses for a form (admin view)
  static async getFormResponses(formId: string) {
    try {
      const { data, error } = await supabaseAdmin
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

      if (error) throw error;
      return { data, success: true };
    } catch (error) {
      console.error("Admin: Error fetching form responses:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  // Approve/reject responses
  static async updateResponseStatus(
    responseId: string,
    status: "approved" | "rejected" | "paid"
  ) {
    try {
      const { data, error } = await supabaseAdmin
        .from("form_responses")
        .update({ status })
        .eq("id", responseId)
        .select()
        .single();

      if (error) throw error;
      return { data, success: true };
    } catch (error) {
      console.error("Admin: Error updating response status:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  // Bulk approve responses
  static async bulkApproveResponses(responseIds: string[]) {
    try {
      const { data, error } = await supabaseAdmin
        .from("form_responses")
        .update({ status: "approved" })
        .in("id", responseIds)
        .select();

      if (error) throw error;
      return { data, success: true };
    } catch (error) {
      console.error("Admin: Error bulk approving responses:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  // Get user activity (responses by wallet/user)
  static async getUserActivity(walletAddress?: string, userId?: string) {
    try {
      let query = supabaseAdmin
        .from("form_responses")
        .select(
          `
          *,
          bounty_forms (
            name,
            reward_token
          )
        `
        )
        .order("submitted_at", { ascending: false });

      if (walletAddress) {
        query = query.eq("wallet_address", walletAddress);
      } else if (userId) {
        query = query.eq("user_id", userId);
      }

      const { data, error } = await query;

      if (error) throw error;
      return { data, success: true };
    } catch (error) {
      console.error("Admin: Error fetching user activity:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  // Export form data to JSON
  static async exportFormData(formId: string) {
    try {
      const { data: form, error: formError } = await supabaseAdmin
        .from("bounty_forms")
        .select(
          `
          *,
          form_questions (*),
          form_responses (
            *,
            question_answers (
              *,
              form_questions (title, type)
            )
          )
        `
        )
        .eq("id", formId)
        .single();

      if (formError) throw formError;

      return {
        data: form,
        success: true,
        exportedAt: new Date().toISOString(),
      };
    } catch (error) {
      console.error("Admin: Error exporting form data:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }
}

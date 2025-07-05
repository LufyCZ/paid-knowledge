// Admin service for Walrus storage - replaces supabase-admin.ts

import { WalrusStorage } from "./walrus-storage";
import * as WalrusForms from "./walrus-forms";
import * as WalrusUsers from "./walrus-users";

export class AdminService {
  // Get all forms with full details
  static async getAllForms() {
    try {
      const result = await WalrusStorage.queryRecords({
        type: "bounty_form",
        limit: 1000, // Admin can see all forms
      });

      if (!result.success) {
        throw new Error(result.error || "Failed to fetch forms");
      }

      const forms =
        result.data?.map((record) => ({
          ...record.data,
          id: record.id,
        })) || [];

      return {
        success: true,
        data: forms,
      };
    } catch (error) {
      return {
        success: false,
        error:
          error instanceof Error ? error.message : "Unknown error occurred",
      };
    }
  }

  // Get all users with verification details
  static async getAllUsers() {
    try {
      const result = await WalrusStorage.queryRecords({
        type: "user_profile",
        limit: 1000, // Admin can see all users
      });

      if (!result.success) {
        throw new Error(result.error || "Failed to fetch users");
      }

      const users =
        result.data?.map((record) => ({
          ...record.data,
          id: record.id,
        })) || [];

      return {
        success: true,
        data: users,
      };
    } catch (error) {
      return {
        success: false,
        error:
          error instanceof Error ? error.message : "Unknown error occurred",
      };
    }
  }

  // Get all form responses for a specific form
  static async getFormResponses(formId: string) {
    try {
      return await WalrusForms.getFormResponses(formId);
    } catch (error) {
      return {
        success: false,
        error:
          error instanceof Error ? error.message : "Unknown error occurred",
      };
    }
  }

  // Update form status (admin override)
  static async updateFormStatus(
    formId: string,
    status: "draft" | "active" | "completed" | "cancelled"
  ) {
    try {
      return await WalrusForms.updateFormStatus(formId, status);
    } catch (error) {
      return {
        success: false,
        error:
          error instanceof Error ? error.message : "Unknown error occurred",
      };
    }
  }

  // Delete a form (admin override)
  static async deleteForm(formId: string) {
    try {
      const result = await WalrusStorage.deleteRecord(formId);

      if (!result.success) {
        throw new Error(result.error || "Failed to delete form");
      }

      return {
        success: true,
      };
    } catch (error) {
      return {
        success: false,
        error:
          error instanceof Error ? error.message : "Unknown error occurred",
      };
    }
  }

  // Update user verification level (admin override)
  static async updateUserVerification(
    walletAddress: string,
    verificationLevel: "None" | "Device" | "Orb"
  ) {
    try {
      const result = await WalrusUsers.updateUserProfile(walletAddress, {
        verification_level: verificationLevel,
        device_verified_at:
          verificationLevel === "Device" ? new Date().toISOString() : undefined,
        orb_verified_at:
          verificationLevel === "Orb" ? new Date().toISOString() : undefined,
        updated_at: new Date().toISOString(),
      });

      return result;
    } catch (error) {
      return {
        success: false,
        error:
          error instanceof Error ? error.message : "Unknown error occurred",
      };
    }
  }

  // Get analytics data
  static async getAnalytics() {
    try {
      const [formsResult, usersResult, responsesResult] = await Promise.all([
        WalrusStorage.queryRecords({ type: "bounty_form", limit: 1000 }),
        WalrusStorage.queryRecords({ type: "user_profile", limit: 1000 }),
        WalrusStorage.queryRecords({ type: "form_response", limit: 1000 }),
      ]);

      const forms = formsResult.data || [];
      const users = usersResult.data || [];
      const responses = responsesResult.data || [];

      const analytics = {
        totalForms: forms.length,
        activeForms: forms.filter((f) => f.data.status === "active").length,
        totalUsers: users.length,
        verifiedUsers: users.filter((u) => u.data.verification_level !== "None")
          .length,
        totalResponses: responses.length,
        totalRewardsPaid: responses.reduce(
          (sum, r) => sum + (r.data.total_reward || 0),
          0
        ),
      };

      return {
        success: true,
        data: analytics,
      };
    } catch (error) {
      return {
        success: false,
        error:
          error instanceof Error ? error.message : "Unknown error occurred",
      };
    }
  }

  // Get verification logs
  static async getVerificationLogs() {
    try {
      const result = await WalrusStorage.queryRecords({
        type: "verification_log",
        limit: 1000,
      });

      if (!result.success) {
        throw new Error(result.error || "Failed to fetch verification logs");
      }

      const logs =
        result.data?.map((record) => ({
          ...record.data,
          id: record.id,
        })) || [];

      return {
        success: true,
        data: logs,
      };
    } catch (error) {
      return {
        success: false,
        error:
          error instanceof Error ? error.message : "Unknown error occurred",
      };
    }
  }

  // Feature/unfeature a form (admin override)
  static async toggleFormFeature(formId: string, featured: boolean) {
    try {
      // First get the existing form
      const formResult = await WalrusForms.getBountyForm(formId);

      if (!formResult.success || !formResult.data) {
        throw new Error("Form not found");
      }

      const existingForm = formResult.data;

      // Update the form with new featured status
      const result = await WalrusStorage.updateRecord(
        formId,
        { ...existingForm, featured, updated_at: new Date().toISOString() },
        {
          metadata: {
            ...existingForm,
            featured,
          },
        }
      );

      return result;
    } catch (error) {
      return {
        success: false,
        error:
          error instanceof Error ? error.message : "Unknown error occurred",
      };
    }
  }
}

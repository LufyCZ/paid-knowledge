"use client";
import { useState, useEffect } from "react";
import { AdminService } from "../lib/supabase-admin";

// Hook for admin form management
export const useAdminForms = () => {
  const [forms, setForms] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchForms = async () => {
    setLoading(true);
    setError(null);

    const result = await AdminService.getAllForms();

    if (result.success) {
      setForms(result.data || []);
    } else {
      setError(result.error || "Failed to fetch forms");
    }

    setLoading(false);
  };

  const updateFormStatus = async (
    formIds: string[],
    status: "draft" | "active" | "completed" | "cancelled"
  ) => {
    setLoading(true);
    setError(null);

    const result = await AdminService.bulkUpdateFormStatus(formIds, status);

    if (result.success) {
      // Refresh the forms list
      await fetchForms();
    } else {
      setError(result.error || "Failed to update form status");
    }

    setLoading(false);
    return result;
  };

  const deleteForm = async (formId: string) => {
    setLoading(true);
    setError(null);

    const result = await AdminService.deleteForm(formId);

    if (result.success) {
      // Remove from local state
      setForms((prev) => prev.filter((form) => form.id !== formId));
    } else {
      setError(result.error || "Failed to delete form");
    }

    setLoading(false);
    return result;
  };

  useEffect(() => {
    fetchForms();
  }, []);

  return {
    forms,
    loading,
    error,
    refetch: fetchForms,
    updateFormStatus,
    deleteForm,
  };
};

// Hook for admin dashboard stats
export function useAdminStats() {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = async () => {
    setLoading(true);
    setError(null);

    const result = await AdminService.getFormStats();

    if (result.success) {
      setStats(result.data);
    } else {
      setError(result.error || "Failed to fetch stats");
    }

    setLoading(false);
  };

  useEffect(() => {
    fetchStats();
  }, []);

  return {
    stats,
    loading,
    error,
    refetch: fetchStats,
  };
}

// Hook for managing form responses
export function useAdminResponses(formId: string) {
  const [responses, setResponses] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchResponses = async () => {
    if (!formId) return;

    setLoading(true);
    setError(null);

    const result = await AdminService.getFormResponses(formId);

    if (result.success) {
      setResponses(result.data || []);
    } else {
      setError(result.error || "Failed to fetch responses");
    }

    setLoading(false);
  };

  const updateResponseStatus = async (
    responseId: string,
    status: "approved" | "rejected" | "paid"
  ) => {
    setLoading(true);
    setError(null);

    const result = await AdminService.updateResponseStatus(responseId, status);

    if (result.success) {
      // Update local state
      setResponses((prev) =>
        prev.map((response) =>
          response.id === responseId ? { ...response, status } : response
        )
      );
    } else {
      setError(result.error || "Failed to update response status");
    }

    setLoading(false);
    return result;
  };

  const bulkApproveResponses = async (responseIds: string[]) => {
    setLoading(true);
    setError(null);

    const result = await AdminService.bulkApproveResponses(responseIds);

    if (result.success) {
      // Update local state
      setResponses((prev) =>
        prev.map((response) =>
          responseIds.includes(response.id)
            ? { ...response, status: "approved" }
            : response
        )
      );
    } else {
      setError(result.error || "Failed to bulk approve responses");
    }

    setLoading(false);
    return result;
  };

  useEffect(() => {
    fetchResponses();
  }, [formId]);

  return {
    responses,
    loading,
    error,
    refetch: fetchResponses,
    updateResponseStatus,
    bulkApproveResponses,
  };
}

// Hook for user activity tracking
export function useUserActivity(walletAddress?: string, userId?: string) {
  const [activity, setActivity] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchActivity = async () => {
    if (!walletAddress && !userId) return;

    setLoading(true);
    setError(null);

    const result = await AdminService.getUserActivity(walletAddress, userId);

    if (result.success) {
      setActivity(result.data || []);
    } else {
      setError(result.error || "Failed to fetch user activity");
    }

    setLoading(false);
  };

  useEffect(() => {
    fetchActivity();
  }, [walletAddress, userId]);

  return {
    activity,
    loading,
    error,
    refetch: fetchActivity,
  };
}

// Hook for exporting form data
export function useFormExport() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const exportForm = async (formId: string) => {
    setLoading(true);
    setError(null);

    const result = await AdminService.exportFormData(formId);

    if (result.success) {
      // Create and download JSON file
      const dataStr = JSON.stringify(result.data, null, 2);
      const dataUri =
        "data:application/json;charset=utf-8," + encodeURIComponent(dataStr);

      const exportFileDefaultName = `form-${formId}-export-${
        new Date().toISOString().split("T")[0]
      }.json`;

      const linkElement = document.createElement("a");
      linkElement.setAttribute("href", dataUri);
      linkElement.setAttribute("download", exportFileDefaultName);
      linkElement.click();
    } else {
      setError(result.error || "Failed to export form data");
    }

    setLoading(false);
    return result;
  };

  return {
    exportForm,
    loading,
    error,
  };
}

// Generic admin action hook
export function useAdminAction() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const executeAction = async <T>(
    action: () => Promise<{ success: boolean; data?: T; error?: string }>
  ) => {
    setLoading(true);
    setError(null);

    const result = await action();

    if (!result.success) {
      setError(result.error || "Action failed");
    }

    setLoading(false);
    return result;
  };

  return {
    executeAction,
    loading,
    error,
    clearError: () => setError(null),
  };
}

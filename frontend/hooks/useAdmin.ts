"use client";
import { useState, useEffect, useCallback } from "react";
import { AdminService } from "../lib/supabase-admin";
import { useRetry } from "./useRetry";

// Hook for admin form management
export const useAdminForms = () => {
  const [forms, setForms] = useState<any[]>([]);

  const fetchForms = useCallback(async () => {
    const result = await AdminService.getAllForms();

    if (result.success) {
      setForms(result.data || []);
    } else {
      throw new Error(result.error || "Failed to fetch forms");
    }
  }, []);

  // Use retry mechanism for fetching forms
  const {
    execute: executeFetchForms,
    isLoading: loading,
    error,
    retryCount,
    canRetry,
    retry,
  } = useRetry(fetchForms, {
    maxRetries: 3,
    initialDelay: 1000,
    shouldRetry: (error, attempt) => {
      return (
        attempt < 3 &&
        (error?.message?.includes("fetch") ||
          error?.message?.includes("network") ||
          error?.message?.includes("timeout") ||
          error?.message?.includes("Failed to fetch"))
      );
    },
  });

  const [operationLoading, setOperationLoading] = useState(false);
  const [operationError, setOperationError] = useState<string | null>(null);

  const updateFormStatus = async (
    formIds: string[],
    status: "draft" | "active" | "completed" | "cancelled"
  ) => {
    setOperationLoading(true);
    setOperationError(null);

    const result = await AdminService.bulkUpdateFormStatus(formIds, status);

    if (result.success) {
      // Refresh the forms list
      await executeFetchForms();
    } else {
      setOperationError(result.error || "Failed to update form status");
    }

    setOperationLoading(false);
    return result;
  };

  const deleteForm = async (formId: string) => {
    setOperationLoading(true);
    setOperationError(null);

    const result = await AdminService.deleteForm(formId);

    if (result.success) {
      // Remove from local state
      setForms((prev) => prev.filter((form) => form.id !== formId));
    } else {
      setOperationError(result.error || "Failed to delete form");
    }

    setOperationLoading(false);
    return result;
  };

  useEffect(() => {
    executeFetchForms().catch(console.error);
  }, [executeFetchForms]);

  return {
    forms,
    loading,
    error: error || operationError,
    retryCount,
    canRetry,
    operationLoading,
    refetch: executeFetchForms,
    retry,
    updateFormStatus,
    deleteForm,
  };
};

// Hook for admin dashboard stats
export function useAdminStats() {
  const [stats, setStats] = useState<any>(null);

  const fetchStats = async () => {
    const result = await AdminService.getFormStats();

    if (result.success) {
      setStats(result.data);
    } else {
      throw new Error(result.error || "Failed to fetch stats");
    }
  };

  // Use retry mechanism for fetching stats
  const {
    execute: executeFetchStats,
    isLoading: loading,
    error,
    retryCount,
    canRetry,
    retry,
  } = useRetry(fetchStats, {
    maxRetries: 3,
    initialDelay: 1000,
    shouldRetry: (error, attempt) => {
      return (
        attempt < 3 &&
        (error?.message?.includes("fetch") ||
          error?.message?.includes("network") ||
          error?.message?.includes("timeout") ||
          error?.message?.includes("Failed to fetch"))
      );
    },
  });

  useEffect(() => {
    executeFetchStats().catch(console.error);
  }, [executeFetchStats]);

  return {
    stats,
    loading,
    error,
    retryCount,
    canRetry,
    refetch: executeFetchStats,
    retry,
  };
}

// Hook for managing form responses
export function useAdminResponses(formId: string) {
  const [responses, setResponses] = useState<any[]>([]);
  const [operationLoading, setOperationLoading] = useState(false);
  const [operationError, setOperationError] = useState<string | null>(null);

  const fetchResponses = async () => {
    if (!formId) return;

    const result = await AdminService.getFormResponses(formId);

    if (result.success) {
      setResponses(result.data || []);
    } else {
      throw new Error(result.error || "Failed to fetch responses");
    }
  };

  // Use retry mechanism for fetching responses
  const {
    execute: executeFetchResponses,
    isLoading: loading,
    error,
    retryCount,
    canRetry,
    retry,
  } = useRetry(fetchResponses, {
    maxRetries: 3,
    initialDelay: 1000,
    shouldRetry: (error, attempt) => {
      return (
        attempt < 3 &&
        (error?.message?.includes("fetch") ||
          error?.message?.includes("network") ||
          error?.message?.includes("timeout") ||
          error?.message?.includes("Failed to fetch"))
      );
    },
  });

  const updateResponseStatus = async (
    responseId: string,
    status: "approved" | "rejected" | "paid"
  ) => {
    setOperationLoading(true);
    setOperationError(null);

    const result = await AdminService.updateResponseStatus(responseId, status);

    if (result.success) {
      // Update local state
      setResponses((prev) =>
        prev.map((response) =>
          response.id === responseId ? { ...response, status } : response
        )
      );
    } else {
      setOperationError(result.error || "Failed to update response status");
    }

    setOperationLoading(false);
    return result;
  };

  const bulkApproveResponses = async (responseIds: string[]) => {
    setOperationLoading(true);
    setOperationError(null);

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
      setOperationError(result.error || "Failed to bulk approve responses");
    }

    setOperationLoading(false);
    return result;
  };

  useEffect(() => {
    if (formId) {
      executeFetchResponses().catch(console.error);
    }
  }, [formId, executeFetchResponses]);

  return {
    responses,
    loading,
    error: error || operationError,
    retryCount,
    canRetry,
    operationLoading,
    refetch: executeFetchResponses,
    retry,
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

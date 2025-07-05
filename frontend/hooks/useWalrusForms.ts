import { useState, useEffect } from "react";
import { BountyForm } from "@/lib/walrus-forms";

export interface FormData {
  name: string;
  description: string;
  startDate: string;
  endDate: string;
  visibility: "Public" | "Private";
  rewardPerQuestion: number;
  rewardToken: "USDC" | "WLD";
  userEligibility: "Orb" | "Device" | "All";
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

export function useWalrusForms() {
  const [forms, setForms] = useState<BountyForm[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchForms = async (limit = 10, offset = 0) => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch(
        `/api/forms?limit=${limit}&offset=${offset}`
      );
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to fetch forms");
      }

      setForms(data.forms);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setIsLoading(false);
    }
  };

  const createForm = async (formData: FormData) => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch("/api/forms", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to create form");
      }

      // Refresh forms list
      await fetchForms();

      return { success: true, data };
    } catch (err) {
      const error = err instanceof Error ? err.message : "Unknown error";
      setError(error);
      return { success: false, error };
    } finally {
      setIsLoading(false);
    }
  };

  const getForm = async (id: string) => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch(`/api/forms/${id}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to fetch form");
      }

      return { success: true, data: data.form };
    } catch (err) {
      const error = err instanceof Error ? err.message : "Unknown error";
      setError(error);
      return { success: false, error };
    } finally {
      setIsLoading(false);
    }
  };

  const updateFormStatus = async (
    id: string,
    status: "draft" | "active" | "completed" | "cancelled"
  ) => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch(`/api/forms/${id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to update form status");
      }

      // Refresh forms list
      await fetchForms();

      return { success: true };
    } catch (err) {
      const error = err instanceof Error ? err.message : "Unknown error";
      setError(error);
      return { success: false, error };
    } finally {
      setIsLoading(false);
    }
  };

  const submitResponse = async (
    formId: string,
    answers: any[],
    walletAddress?: string
  ) => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch(`/api/forms/${formId}/responses`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          answers,
          walletAddress,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to submit response");
      }

      return { success: true, data };
    } catch (err) {
      const error = err instanceof Error ? err.message : "Unknown error";
      setError(error);
      return { success: false, error };
    } finally {
      setIsLoading(false);
    }
  };

  const getFormResponses = async (formId: string) => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch(`/api/forms/${formId}/responses`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to fetch responses");
      }

      return { success: true, data: data.responses };
    } catch (err) {
      const error = err instanceof Error ? err.message : "Unknown error";
      setError(error);
      return { success: false, error };
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchForms();
  }, []);

  return {
    forms,
    isLoading,
    error,
    fetchForms,
    createForm,
    getForm,
    updateFormStatus,
    submitResponse,
    getFormResponses,
    clearError: () => setError(null),
  };
}

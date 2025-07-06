import { useState, useEffect, useCallback } from "react";
import {
  getUserCreatedForms,
  getFormResponses,
  updateResponseStatus,
  bulkApproveResponses,
} from "@/lib/forms";
import { BountyForm } from "@/lib/supabase";
import { useRetry } from "./useRetry";

export interface UserQuest extends BountyForm {
  form_questions: Array<{
    id: string;
    title: string;
    type: string;
    order_index: number;
  }>;
  responseStats?: {
    total: number;
    pending: number;
    approved: number;
    rejected: number;
  };
}

export interface QuestResponse {
  id: string;
  wallet_address: string;
  submitted_at: string;
  total_reward: number;
  reward_token: string;
  status: "pending" | "approved" | "rejected" | "paid";
  question_answers: Array<{
    id: string;
    question_id: string;
    answer_text?: string;
    answer_options?: string[];
    file_url?: string;
    form_questions: {
      title: string;
      type: string;
      order_index: number;
    };
  }>;
}

// Hook for managing user's created quests
export function useUserQuests(walletAddress: string | null) {
  const [quests, setQuests] = useState<UserQuest[]>([]);

  const fetchQuests = useCallback(async () => {
    if (!walletAddress) return;

    const result = await getUserCreatedForms(walletAddress);

    if (result.success && result.data) {
      // For each quest, get response statistics
      const questsWithStats = await Promise.all(
        result.data.map(async (quest) => {
          const responsesResult = await getFormResponses(quest.id);

          let responseStats = {
            total: 0,
            pending: 0,
            approved: 0,
            rejected: 0,
          };

          if (responsesResult.success && responsesResult.data) {
            responseStats.total = responsesResult.data.length;
            responseStats.pending = responsesResult.data.filter(
              (r) => r.status === "pending"
            ).length;
            responseStats.approved = responsesResult.data.filter(
              (r) => r.status === "approved"
            ).length;
            responseStats.rejected = responsesResult.data.filter(
              (r) => r.status === "rejected"
            ).length;
          }

          return {
            ...quest,
            responseStats,
          };
        })
      );

      setQuests(questsWithStats);
    } else {
      throw new Error(result.error || "Failed to fetch quests");
    }
  }, [walletAddress]);

  // Use retry mechanism for fetching quests
  const {
    execute: executeFetchQuests,
    isLoading: loading,
    error,
    retryCount,
    canRetry,
    retry,
  } = useRetry(fetchQuests, {
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
    if (walletAddress) {
      executeFetchQuests().catch(console.error);
    }
  }, [walletAddress, executeFetchQuests]);

  return {
    quests,
    loading,
    error,
    retryCount,
    canRetry,
    refreshQuests: executeFetchQuests,
    retry,
  };
}

// Hook for managing responses to a specific quest
export function useQuestResponses(
  questId: string,
  walletAddress: string | null
) {
  const [responses, setResponses] = useState<QuestResponse[]>([]);
  const [updatingResponse, setUpdatingResponse] = useState<string | null>(null);
  const [operationError, setOperationError] = useState<string | null>(null);
  const [operationLoading, setOperationLoading] = useState(false);

  const fetchResponses = useCallback(async () => {
    if (!questId) return;

    const result = await getFormResponses(questId);

    if (result.success && result.data) {
      setResponses(result.data as QuestResponse[]);
    } else {
      throw new Error(result.error || "Failed to fetch responses");
    }
  }, [questId]);

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

  const approveResponse = async (responseId: string) => {
    if (!walletAddress) {
      setOperationError("Wallet address required");
      return;
    }

    setUpdatingResponse(responseId);
    setOperationError(null);

    try {
      const result = await updateResponseStatus(
        responseId,
        "approved",
        walletAddress
      );

      if (result.success) {
        // Update local state
        setResponses((prev) =>
          prev.map((response) =>
            response.id === responseId
              ? { ...response, status: "approved" as const }
              : response
          )
        );
      } else {
        setOperationError(result.error || "Failed to approve response");
      }
    } catch (err) {
      setOperationError(
        err instanceof Error ? err.message : "Failed to approve response"
      );
    } finally {
      setUpdatingResponse(null);
    }
  };

  const rejectResponse = async (responseId: string) => {
    if (!walletAddress) {
      setOperationError("Wallet address required");
      return;
    }

    setUpdatingResponse(responseId);
    setOperationError(null);

    try {
      const result = await updateResponseStatus(
        responseId,
        "rejected",
        walletAddress
      );

      if (result.success) {
        // Update local state
        setResponses((prev) =>
          prev.map((response) =>
            response.id === responseId
              ? { ...response, status: "rejected" as const }
              : response
          )
        );
      } else {
        setOperationError(result.error || "Failed to reject response");
      }
    } catch (err) {
      setOperationError(
        err instanceof Error ? err.message : "Failed to reject response"
      );
    } finally {
      setUpdatingResponse(null);
    }
  };

  const bulkApprove = async (responseIds: string[]) => {
    if (!walletAddress) {
      setOperationError("Wallet address required");
      return;
    }

    setOperationLoading(true);
    setOperationError(null);

    try {
      const result = await bulkApproveResponses(responseIds, walletAddress);

      if (result.success) {
        // Update local state
        setResponses((prev) =>
          prev.map((response) =>
            responseIds.includes(response.id)
              ? { ...response, status: "approved" as const }
              : response
          )
        );
      } else {
        setOperationError(result.error || "Failed to bulk approve responses");
      }
    } catch (err) {
      setOperationError(
        err instanceof Error ? err.message : "Failed to bulk approve responses"
      );
    } finally {
      setOperationLoading(false);
    }
  };

  useEffect(() => {
    if (questId) {
      executeFetchResponses().catch(console.error);
    }
  }, [questId, executeFetchResponses]);

  return {
    responses,
    loading,
    error: error || operationError,
    retryCount,
    canRetry,
    updatingResponse,
    operationLoading,
    refreshResponses: executeFetchResponses,
    retry,
    approveResponse,
    rejectResponse,
    bulkApprove,
  };
}

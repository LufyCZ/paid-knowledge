import { useState, useEffect } from "react";
import {
  getUserCreatedForms,
  getFormResponses,
  updateResponseStatus,
  bulkApproveResponses,
} from "@/lib/forms";
import { BountyForm } from "@/lib/supabase";

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
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchQuests = async () => {
    if (!walletAddress) return;

    setLoading(true);
    setError(null);

    try {
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
        setError(result.error || "Failed to fetch quests");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch quests");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQuests();
  }, [walletAddress]);

  return {
    quests,
    loading,
    error,
    refreshQuests: fetchQuests,
  };
}

// Hook for managing responses to a specific quest
export function useQuestResponses(
  questId: string,
  walletAddress: string | null
) {
  const [responses, setResponses] = useState<QuestResponse[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [updatingResponse, setUpdatingResponse] = useState<string | null>(null);

  const fetchResponses = async () => {
    if (!questId) return;

    setLoading(true);
    setError(null);

    try {
      const result = await getFormResponses(questId);

      if (result.success && result.data) {
        setResponses(result.data as QuestResponse[]);
      } else {
        setError(result.error || "Failed to fetch responses");
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to fetch responses"
      );
    } finally {
      setLoading(false);
    }
  };

  const approveResponse = async (responseId: string) => {
    if (!walletAddress) {
      setError("Wallet address required");
      return;
    }

    setUpdatingResponse(responseId);
    setError(null);

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
        setError(result.error || "Failed to approve response");
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to approve response"
      );
    } finally {
      setUpdatingResponse(null);
    }
  };

  const rejectResponse = async (responseId: string) => {
    if (!walletAddress) {
      setError("Wallet address required");
      return;
    }

    setUpdatingResponse(responseId);
    setError(null);

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
        setError(result.error || "Failed to reject response");
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to reject response"
      );
    } finally {
      setUpdatingResponse(null);
    }
  };

  const bulkApprove = async (responseIds: string[]) => {
    if (!walletAddress) {
      setError("Wallet address required");
      return;
    }

    setLoading(true);
    setError(null);

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
        setError(result.error || "Failed to bulk approve responses");
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to bulk approve responses"
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchResponses();
  }, [questId]);

  return {
    responses,
    loading,
    error,
    updatingResponse,
    refreshResponses: fetchResponses,
    approveResponse,
    rejectResponse,
    bulkApprove,
  };
}

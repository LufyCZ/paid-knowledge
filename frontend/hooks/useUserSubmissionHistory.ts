import { useState, useEffect, useCallback } from "react";
import { getUserSubmissionHistory } from "@/lib/forms";
import { useRetry } from "./useRetry";

export interface UserSubmission {
  id: string;
  total_reward: number;
  reward_token: string;
  status: "pending" | "approved" | "rejected" | "paid";
  submitted_at: string;
  bounty_forms: {
    id: string;
    name: string;
    description: string;
    reward_per_question: number;
    reward_token: string;
  } | null;
}

export function useUserSubmissionHistory(walletAddress: string | null) {
  const [submissions, setSubmissions] = useState<UserSubmission[]>([]);

  const fetchSubmissions = useCallback(async () => {
    if (!walletAddress) return;

    const result = await getUserSubmissionHistory(walletAddress);

    if (result.success && result.data) {
      setSubmissions(result.data as unknown as UserSubmission[]);
    } else {
      throw new Error(result.error || "Failed to fetch submission history");
    }
  }, [walletAddress]);

  // Use retry mechanism for fetching submissions
  const {
    execute: executeFetchSubmissions,
    isLoading: loading,
    error,
    retryCount,
    canRetry,
    retry,
  } = useRetry(fetchSubmissions, {
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
      executeFetchSubmissions().catch(console.error);
    }
  }, [walletAddress, executeFetchSubmissions]);

  return {
    submissions,
    loading,
    error,
    retryCount,
    canRetry,
    refreshSubmissions: executeFetchSubmissions,
    retry,
  };
}

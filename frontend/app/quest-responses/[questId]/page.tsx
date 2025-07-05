"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useWallet } from "@/hooks/useWallet";
import { useQuestResponses } from "@/hooks/useUserQuests";
import { useDataRefresh } from "@/hooks/useDataRefresh";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function QuestResponsesPage() {
  const params = useParams();
  const router = useRouter();
  const { address } = useWallet();
  const questId = params.questId as string;

  const [questName, setQuestName] = useState<string>("");
  const {
    responses,
    loading,
    error,
    updatingResponse,
    refreshResponses,
    approveResponse,
    rejectResponse,
  } = useQuestResponses(questId, address);

  // Add data refresh on navigation events
  useDataRefresh({
    refreshFn: refreshResponses,
    dependencies: [address, questId],
  });

  // Get quest name from URL params if available
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const name = urlParams.get("name");
    if (name) {
      setQuestName(decodeURIComponent(name));
    } else {
      setQuestName("Quest Responses");
    }
  }, []);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return (
          <span className="px-2 py-1 text-xs font-medium bg-yellow-100 text-yellow-800 rounded-full">
            Pending
          </span>
        );
      case "approved":
        return (
          <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">
            Approved
          </span>
        );
      case "rejected":
        return (
          <span className="px-2 py-1 text-xs font-medium bg-red-100 text-red-800 rounded-full">
            Rejected
          </span>
        );
      case "paid":
        return (
          <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">
            Paid
          </span>
        );
      default:
        return (
          <span className="px-2 py-1 text-xs font-medium bg-gray-100 text-gray-800 rounded-full">
            {status}
          </span>
        );
    }
  };

  const handleApprove = async (responseId: string) => {
    await approveResponse(responseId);
  };

  const handleReject = async (responseId: string) => {
    await rejectResponse(responseId);
  };

  if (!address) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="text-center p-8 bg-white rounded-xl shadow-lg max-w-md w-full">
          <h1 className="text-xl font-bold text-gray-900 mb-4">
            Access Denied
          </h1>
          <p className="text-gray-600 mb-6">
            Please connect your wallet to view quest responses
          </p>
          <Link href="/account">
            <Button>Go to Account</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-4 md:py-8 pb-20 md:pb-28">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center space-x-3 mb-4">
            <button
              onClick={() => router.back()}
              className="w-10 h-10 flex items-center justify-center rounded-lg bg-white border border-gray-200 hover:bg-gray-50 transition-colors"
            >
              ←
            </button>
            <div>
              <h1 className="text-xl md:text-2xl font-bold text-gray-900">
                Quest Responses
              </h1>
              <p className="text-sm text-gray-600">{questName}</p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="bg-white rounded-xl shadow-sm border">
          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-2 text-gray-600">Loading responses...</p>
            </div>
          ) : error ? (
            <div className="p-6">
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <p className="text-red-700">{error}</p>
              </div>
            </div>
          ) : !responses || responses.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-gray-400 text-4xl mb-4">📝</div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No responses yet
              </h3>
              <p className="text-gray-600">
                This quest hasn't received any submissions yet.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {responses.map((response) => (
                <div key={response.id} className="p-4 md:p-6">
                  {/* Response Header */}
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between mb-4 gap-3">
                    <div className="flex-1">
                      <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-3 mb-2 gap-2">
                        <span className="font-mono text-sm text-gray-600 break-all">
                          {response.wallet_address.slice(0, 6)}...
                          {response.wallet_address.slice(-4)}
                        </span>
                        {getStatusBadge(response.status)}
                      </div>
                      <p className="text-sm text-gray-500">
                        Submitted{" "}
                        {new Date(response.submitted_at).toLocaleDateString()}
                      </p>
                      <p className="text-sm font-medium text-gray-900">
                        Reward: {response.total_reward} {response.reward_token}
                      </p>
                    </div>

                    {/* Action Buttons */}
                    {response.status === "pending" && (
                      <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleReject(response.id)}
                          disabled={!!updatingResponse}
                          className="text-red-600 border-red-300 hover:bg-red-50 w-full sm:w-auto"
                        >
                          Reject
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => handleApprove(response.id)}
                          disabled={!!updatingResponse}
                          className="bg-green-600 hover:bg-green-700 w-full sm:w-auto"
                        >
                          Approve
                        </Button>
                      </div>
                    )}
                  </div>

                  {/* Answers */}
                  <div className="space-y-3">
                    <h4 className="font-medium text-gray-900">Answers:</h4>
                    {response.question_answers
                      .sort(
                        (a, b) =>
                          a.form_questions.order_index -
                          b.form_questions.order_index
                      )
                      .map((answer) => (
                        <div
                          key={answer.id}
                          className="bg-gray-50 p-3 md:p-4 rounded-lg"
                        >
                          <h5 className="font-medium text-gray-900 mb-2">
                            {answer.form_questions.title}
                          </h5>
                          {answer.answer_text && (
                            <p className="text-gray-700 text-sm md:text-base break-words">
                              {answer.answer_text}
                            </p>
                          )}
                          {answer.answer_options &&
                            answer.answer_options.length > 0 && (
                              <div className="space-y-1">
                                {answer.answer_options.map((option, index) => (
                                  <div
                                    key={index}
                                    className="text-gray-700 text-sm md:text-base"
                                  >
                                    • {option}
                                  </div>
                                ))}
                              </div>
                            )}
                          {answer.file_url && (
                            <div className="mt-2">
                              <a
                                href={answer.file_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-600 hover:text-blue-800 text-sm underline inline-flex items-center"
                              >
                                📎 View attachment
                              </a>
                            </div>
                          )}
                        </div>
                      ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

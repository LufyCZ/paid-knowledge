"use client";

import { useState } from "react";
import { useUserQuests, useQuestResponses } from "@/hooks/useUserQuests";
import { Button } from "@/components/ui/button";

interface QuestManagementProps {
  walletAddress: string | null;
}

interface QuestResponsesModalProps {
  questId: string;
  questName: string;
  walletAddress: string | null;
  isOpen: boolean;
  onClose: () => void;
}

// Component to show responses for a specific quest
function QuestResponsesModal({
  questId,
  questName,
  walletAddress,
  isOpen,
  onClose,
}: QuestResponsesModalProps) {
  const {
    responses,
    loading,
    error,
    updatingResponse,
    approveResponse,
    rejectResponse,
  } = useQuestResponses(questId, walletAddress);
  const [selectedResponses, setSelectedResponses] = useState<string[]>([]);

  if (!isOpen) return null;

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

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl w-full max-w-6xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">
              Quest Responses
            </h2>
            <p className="text-sm text-gray-600">{questName}</p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100"
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-80px)]">
          {loading && (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-2 text-gray-600">Loading responses...</p>
            </div>
          )}

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
              <p className="text-red-700">{error}</p>
            </div>
          )}

          {responses.length === 0 && !loading && (
            <div className="text-center py-8">
              <div className="text-gray-400 text-4xl mb-4">📝</div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No responses yet
              </h3>
              <p className="text-gray-600">
                This quest hasn't received any submissions yet.
              </p>
            </div>
          )}

          {responses.length > 0 && (
            <div className="space-y-4">
              {responses.map((response) => (
                <div
                  key={response.id}
                  className="border border-gray-200 rounded-xl p-4 hover:bg-gray-50"
                >
                  {/* Response Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <div className="flex items-center space-x-3 mb-2">
                        <span className="font-mono text-sm text-gray-600">
                          {response.wallet_address.slice(0, 8)}...
                          {response.wallet_address.slice(-6)}
                        </span>
                        {getStatusBadge(response.status)}
                      </div>
                      <p className="text-sm text-gray-500">
                        Submitted{" "}
                        {new Date(response.submitted_at).toLocaleDateString()}{" "}
                        at{" "}
                        {new Date(response.submitted_at).toLocaleTimeString()}
                      </p>
                      <p className="text-sm font-medium text-gray-900">
                        Reward: {response.total_reward} {response.reward_token}
                      </p>
                    </div>

                    {response.status === "pending" && (
                      <div className="flex space-x-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleReject(response.id)}
                          disabled={updatingResponse === response.id}
                          className="text-red-600 border-red-300 hover:bg-red-50"
                        >
                          {updatingResponse === response.id ? "..." : "Reject"}
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => handleApprove(response.id)}
                          disabled={updatingResponse === response.id}
                          className="bg-green-600 hover:bg-green-700"
                        >
                          {updatingResponse === response.id ? "..." : "Approve"}
                        </Button>
                      </div>
                    )}
                  </div>

                  {/* Answers */}
                  <div className="space-y-3">
                    {response.question_answers
                      .sort(
                        (a, b) =>
                          a.form_questions.order_index -
                          b.form_questions.order_index
                      )
                      .map((answer) => (
                        <div
                          key={answer.id}
                          className="bg-white p-3 rounded-lg border border-gray-100"
                        >
                          <h4 className="font-medium text-gray-900 mb-2">
                            {answer.form_questions.title}
                          </h4>
                          {answer.answer_text && (
                            <p className="text-gray-700">
                              {answer.answer_text}
                            </p>
                          )}
                          {answer.answer_options && (
                            <div className="space-y-1">
                              {answer.answer_options.map((option, index) => (
                                <div key={index} className="text-gray-700">
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
                                className="text-blue-600 hover:text-blue-800 text-sm underline"
                              >
                                View attached file
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

// Main quest management component
export function QuestManagement({ walletAddress }: QuestManagementProps) {
  const { quests, loading, error, refreshQuests } =
    useUserQuests(walletAddress);
  const [selectedQuest, setSelectedQuest] = useState<{
    id: string;
    name: string;
  } | null>(null);

  if (!walletAddress) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-600">Connect your wallet to view your quests</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
        <p className="mt-2 text-gray-600">Loading your quests...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-red-700">{error}</p>
        <Button
          onClick={refreshQuests}
          size="sm"
          variant="outline"
          className="mt-2"
        >
          Try Again
        </Button>
      </div>
    );
  }

  if (quests.length === 0) {
    return (
      <div className="text-center py-8">
        <div className="text-gray-400 text-4xl mb-4">🏆</div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          No quests created yet
        </h3>
        <p className="text-gray-600 mb-4">
          You haven't created any quests yet. Start by creating your first
          quest!
        </p>
        <Button onClick={() => (window.location.href = "/form-builder")}>
          Create Your First Quest
        </Button>
      </div>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-100 text-green-800";
      case "draft":
        return "bg-yellow-100 text-yellow-800";
      case "completed":
        return "bg-blue-100 text-blue-800";
      case "cancelled":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="space-y-4">
      {quests.map((quest) => (
        <div
          key={quest.id}
          className="border border-gray-200 rounded-xl p-4 hover:bg-gray-50 transition-colors"
        >
          <div className="flex items-start justify-between mb-3">
            <div className="flex-1">
              <div className="flex items-center space-x-3 mb-2">
                <h3 className="font-semibold text-gray-900">{quest.name}</h3>
                <span
                  className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(
                    quest.status
                  )}`}
                >
                  {quest.status}
                </span>
              </div>
              {quest.description && (
                <p className="text-sm text-gray-600 mb-2">
                  {quest.description}
                </p>
              )}
              <div className="flex items-center space-x-4 text-sm text-gray-500">
                <span>📝 {quest.form_questions.length} questions</span>
                <span>
                  💰 {quest.reward_per_question} {quest.reward_token}
                </span>
                <span>
                  📅 Ends {new Date(quest.end_date).toLocaleDateString()}
                </span>
              </div>
            </div>
          </div>

          {/* Response Statistics */}
          {quest.responseStats && (
            <div className="mb-3">
              <div className="grid grid-cols-4 gap-3">
                <div className="text-center p-2 bg-gray-50 rounded-lg">
                  <div className="text-lg font-semibold text-gray-900">
                    {quest.responseStats.total}
                  </div>
                  <div className="text-xs text-gray-600">Total</div>
                </div>
                <div className="text-center p-2 bg-yellow-50 rounded-lg">
                  <div className="text-lg font-semibold text-yellow-700">
                    {quest.responseStats.pending}
                  </div>
                  <div className="text-xs text-yellow-600">Pending</div>
                </div>
                <div className="text-center p-2 bg-green-50 rounded-lg">
                  <div className="text-lg font-semibold text-green-700">
                    {quest.responseStats.approved}
                  </div>
                  <div className="text-xs text-green-600">Approved</div>
                </div>
                <div className="text-center p-2 bg-red-50 rounded-lg">
                  <div className="text-lg font-semibold text-red-700">
                    {quest.responseStats.rejected}
                  </div>
                  <div className="text-xs text-red-600">Rejected</div>
                </div>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center justify-between pt-3 border-t border-gray-100">
            <div className="text-xs text-gray-500">
              Created {new Date(quest.created_at).toLocaleDateString()}
            </div>
            <div className="flex space-x-2">
              {quest.responseStats && quest.responseStats.total > 0 && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() =>
                    setSelectedQuest({ id: quest.id, name: quest.name })
                  }
                >
                  View Responses ({quest.responseStats.total})
                </Button>
              )}
              {quest.status === "active" && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => window.open(`/form/${quest.id}`, "_blank")}
                >
                  View Quest
                </Button>
              )}
            </div>
          </div>
        </div>
      ))}

      {/* Response Modal */}
      {selectedQuest && (
        <QuestResponsesModal
          questId={selectedQuest.id}
          questName={selectedQuest.name}
          walletAddress={walletAddress}
          isOpen={true}
          onClose={() => setSelectedQuest(null)}
        />
      )}
    </div>
  );
}

"use client";

import { useState } from "react";
import { useUserQuests } from "@/hooks/useUserQuests";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";

interface QuestManagementProps {
  walletAddress: string | null;
}

// Main quest management component
export function QuestManagement({ walletAddress }: QuestManagementProps) {
  const { quests, loading, error, refreshQuests } =
    useUserQuests(walletAddress);
  const router = useRouter();

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
          variant="outline"
          size="sm"
          className="mt-2"
        >
          Try Again
        </Button>
      </div>
    );
  }

  if (!quests || quests.length === 0) {
    return (
      <div className="text-center py-8">
        <div className="text-gray-400 text-4xl mb-4">🏆</div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          No quests created yet
        </h3>
        <p className="text-gray-600 mb-4">
          Start creating bounty quests to engage your community and reward
          participants.
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
        return "bg-gray-100 text-gray-800";
      case "completed":
        return "bg-blue-100 text-blue-800";
      case "cancelled":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const handleViewResponses = (questId: string, questName: string) => {
    router.push(
      `/quest-responses/${questId}?name=${encodeURIComponent(questName)}`
    );
  };

  return (
    <div className="space-y-4">
      {quests.map((quest) => (
        <div
          key={quest.id}
          className="border border-gray-200 rounded-xl p-4 hover:bg-gray-50 transition-colors"
        >
          {/* Quest Header */}
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between mb-3 gap-3">
            <div className="flex-1 min-w-0">
              <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-3 mb-2 gap-2">
                <h3 className="font-semibold text-gray-900 truncate">
                  {quest.name}
                </h3>
              </div>
              {quest.description && (
                <p
                  className="text-sm text-gray-600 mb-2"
                  style={{
                    display: "-webkit-box",
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: "vertical",
                    overflow: "hidden",
                  }}
                >
                  {quest.description}
                </p>
              )}
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-gray-500">
                <span>📝 {quest.form_questions.length} questions</span>
                <span>
                  💰 {quest.reward_per_question} {quest.reward_token}
                </span>
                {quest.balanceInfo &&
                  quest.balanceInfo.remainingBalance > 0 && (
                    <span className="text-green-600 font-medium">
                      🔋 {quest.balanceInfo.remainingBalance.toFixed(2)}{" "}
                      {quest.balanceInfo.rewardToken} remaining
                    </span>
                  )}
                {quest.balanceInfo &&
                  quest.balanceInfo.remainingBalance <= 0 &&
                  quest.balanceInfo.totalDeposited > 0 && (
                    <span className="text-red-600 font-medium">
                      ⚠️ No funds remaining
                    </span>
                  )}
                <span className="hidden sm:inline">
                  📅 Ends {new Date(quest.end_date).toLocaleDateString()}
                </span>
              </div>
              <div className="sm:hidden mt-1">
                <span className="text-sm text-gray-500">
                  📅 Ends {new Date(quest.end_date).toLocaleDateString()}
                </span>
              </div>
            </div>
          </div>

          {/* Response Stats */}
          {quest.responseStats && (
            <div className="mb-3">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
                <div className="text-center p-2 bg-gray-50 rounded-lg">
                  <div className="text-base sm:text-lg font-semibold text-gray-900">
                    {quest.responseStats.total}
                  </div>
                  <div className="text-xs text-gray-600">Total</div>
                </div>
                <div className="text-center p-2 bg-yellow-50 rounded-lg">
                  <div className="text-base sm:text-lg font-semibold text-yellow-700">
                    {quest.responseStats.pending}
                  </div>
                  <div className="text-xs text-yellow-600">Pending</div>
                </div>
                <div className="text-center p-2 bg-green-50 rounded-lg">
                  <div className="text-base sm:text-lg font-semibold text-green-700">
                    {quest.responseStats.approved}
                  </div>
                  <div className="text-xs text-green-600">Approved</div>
                </div>
                <div className="text-center p-2 bg-red-50 rounded-lg">
                  <div className="text-base sm:text-lg font-semibold text-red-700">
                    {quest.responseStats.rejected}
                  </div>
                  <div className="text-xs text-red-600">Rejected</div>
                </div>
              </div>
            </div>
          )}

          {/* Balance Information */}
          {quest.balanceInfo && quest.balanceInfo.totalDeposited > 0 && (
            <div className="mb-3">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <h4 className="text-sm font-medium text-blue-900 mb-2">
                  💰 Payment Balance
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-sm">
                  <div>
                    <span className="text-blue-700">Deposited:</span>
                    <span className="ml-1 font-semibold text-blue-900">
                      {quest.balanceInfo.totalDeposited.toFixed(2)}{" "}
                      {quest.balanceInfo.rewardToken}
                    </span>
                  </div>
                  <div>
                    <span className="text-blue-700">Paid out:</span>
                    <span className="ml-1 font-semibold text-blue-900">
                      {quest.balanceInfo.totalPaidOut.toFixed(2)}{" "}
                      {quest.balanceInfo.rewardToken}
                    </span>
                  </div>
                  <div>
                    <span className="text-blue-700">Remaining:</span>
                    <span
                      className={`ml-1 font-semibold ${
                        quest.balanceInfo.remainingBalance > 0
                          ? "text-green-600"
                          : "text-red-600"
                      }`}
                    >
                      {quest.balanceInfo.remainingBalance.toFixed(2)}{" "}
                      {quest.balanceInfo.rewardToken}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pt-3 border-t border-gray-100 gap-3">
            <div className="text-xs text-gray-500">
              Created {new Date(quest.created_at).toLocaleDateString()}
            </div>
            <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
              {quest.responseStats && quest.responseStats.total > 0 && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleViewResponses(quest.id, quest.name)}
                  className="w-full sm:w-auto"
                >
                  View Responses ({quest.responseStats.total})
                </Button>
              )}
              <Button
                size="sm"
                variant="outline"
                onClick={() => window.open(`/form/${quest.id}`, "_blank")}
                className="w-full sm:w-auto"
              >
                View Quest
              </Button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

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
  const [statusFilter, setStatusFilter] = useState<string>("all");
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
    dependencies: [], // Remove dependencies to prevent infinite loops
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

  // Filter responses based on status
  const filteredResponses =
    responses?.filter((response) => {
      if (statusFilter === "all") return true;
      return response.status === statusFilter;
    }) || [];

  // Export functions
  const exportToCSV = () => {
    if (!responses || responses.length === 0) return;

    const headers = [
      "Response ID",
      "Wallet Address",
      "Status",
      "Submitted At",
      "Total Reward",
      "Reward Token",
      "Answers",
    ];

    const csvData = responses.map((response) => [
      response.id,
      response.wallet_address,
      response.status,
      new Date(response.submitted_at).toISOString(),
      response.total_reward,
      response.reward_token,
      response.question_answers
        .sort(
          (a, b) => a.form_questions.order_index - b.form_questions.order_index
        )
        .map((answer) => {
          let answerText = answer.form_questions.title + ": ";
          if (answer.answer_text) {
            answerText += answer.answer_text;
          } else if (
            answer.answer_options &&
            answer.answer_options.length > 0
          ) {
            answerText += answer.answer_options.join(", ");
          } else if (answer.file_url) {
            answerText += "File: " + answer.file_url;
          }
          return answerText;
        })
        .join(" | "),
    ]);

    const csvContent = [headers, ...csvData]
      .map((row) =>
        row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(",")
      )
      .join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute(
      "download",
      `quest-responses-${questId}-${new Date().toISOString().split("T")[0]}.csv`
    );
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const exportToJSON = () => {
    if (!responses || responses.length === 0) return;

    const exportData = {
      questId,
      questName,
      exportedAt: new Date().toISOString(),
      totalResponses: responses.length,
      responses: responses.map((response) => ({
        id: response.id,
        walletAddress: response.wallet_address,
        status: response.status,
        submittedAt: response.submitted_at,
        totalReward: response.total_reward,
        rewardToken: response.reward_token,
        answers: response.question_answers
          .sort(
            (a, b) =>
              a.form_questions.order_index - b.form_questions.order_index
          )
          .map((answer) => ({
            questionId: answer.question_id,
            questionTitle: answer.form_questions.title,
            questionType: answer.form_questions.type,
            orderIndex: answer.form_questions.order_index,
            answerText: answer.answer_text,
            answerOptions: answer.answer_options,
            fileUrl: answer.file_url,
          })),
      })),
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], {
      type: "application/json",
    });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute(
      "download",
      `quest-responses-${questId}-${
        new Date().toISOString().split("T")[0]
      }.json`
    );
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

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
            <div className="flex-1">
              <h1 className="text-xl md:text-2xl font-bold text-gray-900">
                Quest Responses
              </h1>
              <p className="text-sm text-gray-600">{questName}</p>
            </div>
          </div>

          {/* Filters and Export Controls */}
          <div className="bg-white rounded-xl shadow-sm border p-4 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              {/* Status Filter */}
              <div className="flex items-center space-x-2">
                <label className="text-sm font-medium text-gray-700">
                  Filter by status:
                </label>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="all">All Status</option>
                  <option value="pending">Pending</option>
                  <option value="approved">Approved</option>
                  <option value="rejected">Rejected</option>
                  <option value="paid">Paid</option>
                </select>
              </div>

              {/* Export Buttons */}
              <div className="flex space-x-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={exportToCSV}
                  disabled={!responses || responses.length === 0}
                  className="text-xs"
                >
                  📊 Export CSV
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={exportToJSON}
                  disabled={!responses || responses.length === 0}
                  className="text-xs"
                >
                  📄 Export JSON
                </Button>
              </div>
            </div>

            {/* Response Count */}
            <div className="text-sm text-gray-600">
              Showing {filteredResponses.length} of {responses?.length || 0}{" "}
              responses
              {statusFilter !== "all" && ` (${statusFilter})`}
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="space-y-4">
          {loading ? (
            <div className="bg-white rounded-xl shadow-sm border text-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-2 text-gray-600">Loading responses...</p>
            </div>
          ) : error ? (
            <div className="bg-white rounded-xl shadow-sm border p-6">
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <p className="text-red-700">{error}</p>
              </div>
            </div>
          ) : !responses || responses.length === 0 ? (
            <div className="bg-white rounded-xl shadow-sm border text-center py-12">
              <div className="text-gray-400 text-4xl mb-4">📝</div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No responses yet
              </h3>
              <p className="text-gray-600">
                This quest hasn't received any submissions yet.
              </p>
            </div>
          ) : filteredResponses.length === 0 ? (
            <div className="bg-white rounded-xl shadow-sm border text-center py-12">
              <div className="text-gray-400 text-4xl mb-4">🔍</div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No responses match filter
              </h3>
              <p className="text-gray-600">
                Try changing the status filter to see more responses.
              </p>
            </div>
          ) : (
            filteredResponses.map((response) => (
              <div
                key={response.id}
                className="bg-white rounded-xl shadow-sm border hover:shadow-md transition-shadow"
              >
                <div className="p-4 md:p-6">
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
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

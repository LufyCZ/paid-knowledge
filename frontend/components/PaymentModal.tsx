"use client";

import { useState } from "react";
import { useWorldPay } from "../hooks/useWorldPay";
import { Button } from "./ui/button";

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPaymentSuccess: (paymentData: {
    amount: number;
    token: "USDC" | "WLD";
    transactionId: string;
    maxQuestions: number;
    rewardPerQuestion: number;
  }) => void;
  formName: string;
}

export function PaymentModal({
  isOpen,
  onClose,
  onPaymentSuccess,
  formName,
}: PaymentModalProps) {
  const [numQuestions, setNumQuestions] = useState<number | null>(null);
  const [customQuestions, setCustomQuestions] = useState("");
  const [isCustom, setIsCustom] = useState(false);
  const [rewardPerQuestion, setRewardPerQuestion] = useState("");
  const [rewardToken, setRewardToken] = useState<"USDC" | "WLD">("USDC");

  const { payUSDC, payWLD, isLoading, error, clearError } = useWorldPay();

  // Preset question amounts
  const presetQuestions = [
    { label: "10 Questions", value: 10 },
    { label: "25 Questions", value: 25 },
    { label: "50 Questions", value: 50 },
  ];

  const finalQuestions = isCustom
    ? parseFloat(customQuestions) || 0
    : numQuestions || 0;
  const rewardPerQuestionNum = parseFloat(rewardPerQuestion) || 0;
  const totalAmount = finalQuestions * rewardPerQuestionNum;

  const handlePresetSelect = (questions: number) => {
    setNumQuestions(questions);
    setIsCustom(false);
    setCustomQuestions("");
    clearError();
  };

  const handleCustomSelect = () => {
    setIsCustom(true);
    setNumQuestions(null);
    clearError();
  };

  const handlePayment = async () => {
    if (finalQuestions <= 0 || rewardPerQuestionNum <= 0) {
      return;
    }

    try {
      const paymentFunction = rewardToken === "USDC" ? payUSDC : payWLD;

      const result = await paymentFunction(
        // TODO: Replace with your contract/treasury address
        "0xF0C7Db5AceA62029058b0E4E0B79F2Bac18686C4",
        totalAmount.toString(),
        `Funding for bounty form: ${formName}`
      );

      if (result.status === "success" && result.transactionId) {
        onPaymentSuccess({
          amount: totalAmount,
          token: rewardToken,
          transactionId: result.transactionId,
          maxQuestions: finalQuestions,
          rewardPerQuestion: rewardPerQuestionNum,
        });
      } else {
        console.error("Payment failed:", result.errorMessage);
      }
    } catch (err) {
      console.error("Payment error:", err);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl">
        {/* Header */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-semibold text-gray-900">
              Fund Your Bounty Form
            </h3>
            <button
              onClick={onClose}
              className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 transition-colors"
            >
              ✕
            </button>
          </div>
          <p className="text-gray-600 text-sm mt-2">
            Set rewards and fund your form to make it active
          </p>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Token Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Reward Token
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => setRewardToken("USDC")}
                className={`p-3 rounded-lg border-2 transition-all ${
                  rewardToken === "USDC"
                    ? "border-blue-500 bg-blue-50 text-blue-700"
                    : "border-gray-200 hover:border-gray-300"
                }`}
              >
                <div className="font-medium">USDC</div>
              </button>

              <button
                onClick={() => setRewardToken("WLD")}
                className={`p-3 rounded-lg border-2 transition-all ${
                  rewardToken === "WLD"
                    ? "border-blue-500 bg-blue-50 text-blue-700"
                    : "border-gray-200 hover:border-gray-300"
                }`}
              >
                <div className="font-medium">WLD</div>
              </button>
            </div>
          </div>

          {/* Reward per Question */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Reward per Question *
            </label>
            <input
              type="number"
              placeholder="0.00"
              value={rewardPerQuestion}
              onChange={(e) => setRewardPerQuestion(e.target.value)}
              step="0.01"
              min="0"
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors"
            />
            <p className="text-xs text-gray-500 mt-1">
              Amount each participant will receive per question answered
            </p>
          </div>

          {/* Number of Questions Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              How many questions do you want to fund?
            </label>

            {/* Preset Questions */}
            <div className="grid grid-cols-1 gap-3 mb-4">
              {presetQuestions.map((preset) => (
                <button
                  key={preset.value}
                  onClick={() => handlePresetSelect(preset.value)}
                  className={`p-4 rounded-lg border-2 transition-all text-left ${
                    numQuestions === preset.value && !isCustom
                      ? "border-blue-500 bg-blue-50"
                      : "border-gray-200 hover:border-blue-300"
                  }`}
                >
                  <div className="flex justify-between items-center">
                    <span className="font-medium">{preset.label}</span>
                    {rewardPerQuestionNum > 0 && (
                      <span className="text-sm text-gray-600">
                        {(preset.value * rewardPerQuestionNum).toFixed(2)}{" "}
                        {rewardToken}
                      </span>
                    )}
                  </div>
                </button>
              ))}
            </div>

            {/* Custom Questions */}
            <button
              onClick={handleCustomSelect}
              className={`w-full p-4 rounded-lg border-2 transition-all mb-3 ${
                isCustom
                  ? "border-blue-500 bg-blue-50"
                  : "border-gray-200 hover:border-blue-300"
              }`}
            >
              <span className="font-medium">Custom Amount</span>
            </button>

            {isCustom && (
              <input
                type="number"
                placeholder="Enter number of questions"
                value={customQuestions}
                onChange={(e) => setCustomQuestions(e.target.value)}
                min="1"
                step="1"
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors"
              />
            )}
          </div>

          {/* Payment Summary */}
          {finalQuestions > 0 && rewardPerQuestionNum > 0 && (
            <div className="bg-blue-50 rounded-lg p-4">
              <h4 className="font-medium text-blue-900 mb-2">
                Payment Summary
              </h4>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-blue-700">Questions to fund:</span>
                  <span className="font-medium text-blue-900">
                    {finalQuestions}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-blue-700">Reward per question:</span>
                  <span className="font-medium text-blue-900">
                    {rewardPerQuestionNum} {rewardToken}
                  </span>
                </div>
                <div className="flex justify-between border-t border-blue-200 pt-1 mt-2">
                  <span className="text-blue-700 font-medium">
                    Total Payment:
                  </span>
                  <span className="font-semibold text-blue-900">
                    {totalAmount.toFixed(2)} {rewardToken}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Error Display */}
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          {/* Pay Button */}
          <Button
            onClick={handlePayment}
            disabled={
              finalQuestions <= 0 || rewardPerQuestionNum <= 0 || isLoading
            }
            className="w-full"
          >
            {isLoading ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                Processing Payment...
              </>
            ) : (
              <>
                💳 Pay{" "}
                {totalAmount > 0
                  ? `${totalAmount.toFixed(2)} ${rewardToken}`
                  : ""}
              </>
            )}
          </Button>

          <button
            onClick={onClose}
            disabled={isLoading}
            className="w-full py-2 px-4 text-gray-600 hover:text-gray-800 transition-colors"
          >
            Cancel
          </button>

          <div className="text-xs text-gray-500 text-center">
            Your payment will be held securely and distributed to form
            participants as rewards.
          </div>
        </div>
      </div>
    </div>
  );
}

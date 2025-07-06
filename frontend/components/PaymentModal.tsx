"use client";

import { useState, useEffect } from "react";
import { useWorldPay } from "../hooks/useWorldPay";
import { Button } from "./ui/button";
import { CONTRACT_ADDRESS } from "@/lib/constants";
import { formEntrySchema } from "@/lib/forms";
import z from "zod";
import { hashQuestion } from "@/lib/questions";

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  formData: {
    name: string;
    description: string;
    startDate: string;
    endDate: string;
    verificationRequired: "orb" | "device" | "none";
  } | null;
  questions: z.infer<typeof formEntrySchema>[];
  onPaymentSuccess: (paymentData: {
    amount: number;
    token: "USDC" | "WLD";
    transactionId: string;
    maxQuestions: number;
    rewardPerQuestion: number;
    bountyData: any;
  }) => void;
  formName: string;
}

export function PaymentModal({
  isOpen,
  onClose,
  onPaymentSuccess,
  formData,
  questions,
  formName,
}: PaymentModalProps) {
  const [numQuestions, setNumQuestions] = useState<number | null>(null);
  const [customQuestions, setCustomQuestions] = useState("");
  const [isCustom, setIsCustom] = useState(false);
  const [rewardPerQuestion, setRewardPerQuestion] = useState("");
  const [rewardToken, setRewardToken] = useState<"USDC" | "WLD">("USDC");
  const [tokenPrice, setTokenPrice] = useState<{ USDC: number; WLD: number }>({
    USDC: 1,
    WLD: 0,
  });
  const [priceLoading, setPriceLoading] = useState(false);

  const { payUSDC, payWLD, isLoading, error, clearError } = useWorldPay();

  // Preset response amounts
  const presetQuestions = [
    { label: "10 Responses", value: 10 },
    { label: "25 Responses", value: 25 },
    { label: "50 Responses", value: 50 },
  ];

  const finalQuestions = isCustom
    ? parseFloat(customQuestions) || 0
    : numQuestions || 0;
  const rewardPerQuestionNum = parseFloat(rewardPerQuestion) || 0;
  const totalAmount = finalQuestions * rewardPerQuestionNum;

  useEffect(() => {
    const fetchTokenPrices = async () => {
      setPriceLoading(true);
      try {
        const response = await fetch("/api/get-onchain-prices");
        const data = await response.json();

        if (data.prices) {
          setTokenPrice({
            USDC: data.prices.USDCE || 1, // USDCE from the API
            WLD: data.prices.WLD || 0,
          });
        }
      } catch (error) {
        console.error("Error fetching token prices:", error);
        // Keep default values on error
      } finally {
        setPriceLoading(false);
      }
    };

    fetchTokenPrices();
  }, []);

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
    if (finalQuestions <= 0 || !formData || rewardPerQuestionNum <= 0) {
      return;
    }

    try {
      const paymentFunction = rewardToken === "USDC" ? payUSDC : payWLD;

      const bountyData = {
        title: formData.name,
        description: formData.description,
        type: "Survey",
        endDate: formData.endDate,
        reward: {
          amount: rewardPerQuestionNum,
          currency: rewardToken,
        },
        verificationLevel: formData.verificationRequired,
        form: questions,
      } as const;

      for (let i = 0; i < 5; i++) {
        console.log(hashQuestion(bountyData));
      }

      const result = await paymentFunction(
        CONTRACT_ADDRESS,
        totalAmount.toString(),
        `Funding for bounty form: ${formName}`,
        hashQuestion(bountyData)
      );

      if (result.status === "success" && result.transactionId) {
        onPaymentSuccess({
          amount: totalAmount,
          token: rewardToken,
          transactionId: result.transactionId,
          maxQuestions: finalQuestions,
          rewardPerQuestion: rewardPerQuestionNum,
          bountyData: {
            transactionId: result.transactionId,
            question: bountyData,
          },
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
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="fixed inset-0" onClick={onClose} aria-hidden="true" />

      <div className="bg-white w-full sm:w-full sm:max-w-md sm:rounded-2xl shadow-2xl relative max-h-screen sm:max-h-[90vh] flex flex-col rounded-t-2xl sm:rounded-t-2xl">
        {/* Header - Fixed */}
        <div className="flex-shrink-0 p-4 sm:p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h3 className="text-lg sm:text-xl font-semibold text-gray-900">
              Fund Your Bounty Form
            </h3>
            <button
              onClick={onClose}
              className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 transition-colors touch-manipulation"
            >
              ✕
            </button>
          </div>
          <p className="text-gray-600 text-sm mt-2">
            Set rewards and fund your form to make it active
          </p>
        </div>

        {/* Content - Scrollable */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6">
          <div className="space-y-6">
            {/* Token Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Reward Token
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => setRewardToken("USDC")}
                  className={`p-3 rounded-lg border-2 transition-all touch-manipulation ${
                    rewardToken === "USDC"
                      ? "border-blue-500 bg-blue-50 text-blue-700"
                      : "border-gray-200 hover:border-gray-300 active:border-blue-300"
                  }`}
                >
                  <div className="font-medium">USDC</div>
                  {priceLoading ? (
                    <div className="text-xs text-gray-500">Loading...</div>
                  ) : (
                    <div className="text-xs text-gray-500">
                      ${tokenPrice.USDC.toFixed(4)}
                    </div>
                  )}
                </button>

                <button
                  onClick={() => setRewardToken("WLD")}
                  className={`p-3 rounded-lg border-2 transition-all touch-manipulation ${
                    rewardToken === "WLD"
                      ? "border-blue-500 bg-blue-50 text-blue-700"
                      : "border-gray-200 hover:border-gray-300 active:border-blue-300"
                  }`}
                >
                  <div className="font-medium">WLD</div>
                  {priceLoading ? (
                    <div className="text-xs text-gray-500">Loading...</div>
                  ) : (
                    <div className="text-xs text-gray-500">
                      ${tokenPrice.WLD.toFixed(4)}
                    </div>
                  )}
                </button>
              </div>
              {/* Show USD equivalent for WLD payments */}
              {rewardToken === "WLD" &&
                rewardPerQuestionNum > 0 &&
                !priceLoading && (
                  <div className="mt-2 p-2 bg-gray-50 rounded-lg">
                    <div className="text-xs text-gray-600">
                      ≈ ${(rewardPerQuestionNum * tokenPrice.WLD).toFixed(4)}{" "}
                      USD per response
                    </div>
                    {finalQuestions > 0 && (
                      <div className="text-xs text-gray-600">
                        Total: ≈ ${(totalAmount * tokenPrice.WLD).toFixed(2)}{" "}
                        USD
                      </div>
                    )}
                  </div>
                )}
            </div>

            {/* Reward per Form Completion */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Reward per Form Completion *
              </label>
              <input
                type="number"
                placeholder="0.00"
                value={rewardPerQuestion}
                onChange={(e) => setRewardPerQuestion(e.target.value)}
                step="0.01"
                min="0"
                className="w-full p-3 text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors"
              />
              <p className="text-xs text-gray-500 mt-1">
                Amount each participant will receive for completing the entire
                form
              </p>
            </div>

            {/* Number of Questions Selection */}
            <div>
              {" "}
              <label className="block text-sm font-medium text-gray-700 mb-3">
                How many form completions do you want to fund?
              </label>{" "}
              {/* Preset Questions */}
              <div className="space-y-3 mb-4">
                {presetQuestions.map((preset) => (
                  <button
                    key={preset.value}
                    onClick={() => handlePresetSelect(preset.value)}
                    className={`w-full p-4 rounded-lg border-2 transition-all text-left touch-manipulation ${
                      numQuestions === preset.value && !isCustom
                        ? "border-blue-500 bg-blue-50"
                        : "border-gray-200 hover:border-blue-300 active:border-blue-300"
                    }`}
                  >
                    <div className="flex justify-between items-center">
                      <span className="font-medium">
                        {preset.label.replace("Questions", "Responses")}
                      </span>
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
                className={`w-full p-4 rounded-lg border-2 transition-all mb-3 touch-manipulation ${
                  isCustom
                    ? "border-blue-500 bg-blue-50"
                    : "border-gray-200 hover:border-blue-300 active:border-blue-300"
                }`}
              >
                <span className="font-medium">Custom Amount</span>
              </button>
              {isCustom && (
                <input
                  type="number"
                  placeholder="Enter number of responses to fund"
                  value={customQuestions}
                  onChange={(e) => setCustomQuestions(e.target.value)}
                  min="1"
                  step="1"
                  className="w-full p-3 text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors"
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
                    <span className="text-blue-700">Responses to fund:</span>
                    <span className="font-medium text-blue-900">
                      {finalQuestions}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-blue-700">Reward per response:</span>
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
          </div>
        </div>

        {/* Footer - Fixed */}
        <div className="flex-shrink-0 p-4 sm:p-6 border-t border-gray-200 space-y-3">
          {/* Pay Button */}
          <Button
            onClick={handlePayment}
            disabled={
              finalQuestions <= 0 || rewardPerQuestionNum <= 0 || isLoading
            }
            className="w-full h-12 text-base touch-manipulation"
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
            className="w-full py-3 px-4 text-gray-600 hover:text-gray-800 transition-colors touch-manipulation"
          >
            Cancel
          </button>

          <div className="text-xs text-gray-500 text-center">
            Your payment will fund participant rewards. You will manually
            distribute rewards to participants who complete your form.
          </div>
        </div>
      </div>
    </div>
  );
}

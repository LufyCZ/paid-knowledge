"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useForm } from "@tanstack/react-form";
import { getBountyForm, submitFormResponse } from "@/lib/forms";
import { useWallet } from "@/hooks/useWallet";
import { useWorldPay } from "@/hooks/useWorldPay";
import { BountyForm, FormQuestion } from "@/lib/supabase";
import { Button } from "@/components/ui/button";

interface FormData {
  [key: string]: string | string[] | number;
}

export default function FormPage() {
  const params = useParams();
  const router = useRouter();
  const formId = params.id as string;

  const [formData, setFormData] = useState<
    (BountyForm & { form_questions: FormQuestion[] }) | null
  >(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  const { isConnected, address, connect } = useWallet();
  const { payUSDC, payWLD } = useWorldPay();

  // TanStack Form
  const form = useForm({
    defaultValues: {} as FormData,
    onSubmit: async ({ value }) => {
      if (!isConnected || !address) {
        setError("Please connect your wallet first");
        return;
      }

      setSubmitting(true);
      setError(null);

      try {
        // Prepare answers
        const answers =
          formData?.form_questions.map((question) => ({
            questionId: question.id,
            answerText:
              typeof value[question.id] === "string"
                ? (value[question.id] as string)
                : undefined,
            answerOptions: Array.isArray(value[question.id])
              ? (value[question.id] as string[])
              : undefined,
          })) || [];

        // Submit form response
        const result = await submitFormResponse({
          formId,
          walletAddress: address,
          answers,
        });

        if (!result.success) {
          throw new Error(result.error || "Failed to submit form");
        }

        // Process payment
        if (result.data && formData) {
          const paymentFunction =
            formData.reward_token === "USDC" ? payUSDC : payWLD;

          await paymentFunction(
            address,
            result.data.totalReward.toString(),
            `Bounty reward for form: ${formData.name}`,
            result.data.responseId
          );
        }

        setSubmitted(true);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to submit form");
      } finally {
        setSubmitting(false);
      }
    },
  });

  useEffect(() => {
    async function loadForm() {
      try {
        const result = await getBountyForm(formId);
        if (!result.success || !result.data) {
          setError("Form not found");
          return;
        }

        // Check if form is active
        if (result.data.status !== "active") {
          setError("This form is not currently active");
          return;
        }

        // Check dates
        const now = new Date();
        const startDate = new Date(result.data.start_date);
        const endDate = new Date(result.data.end_date);

        if (now < startDate) {
          setError("This form is not yet available");
          return;
        }

        if (now > endDate) {
          setError("This form has expired");
          return;
        }

        // Sort questions by order
        const sortedQuestions = [...result.data.form_questions].sort(
          (a, b) => a.order_index - b.order_index
        );

        setFormData({
          ...result.data,
          form_questions: sortedQuestions,
        });
      } catch (err) {
        setError("Failed to load form");
      } finally {
        setLoading(false);
      }
    }

    if (formId) {
      loadForm();
    }
  }, [formId]);

  const renderQuestionField = (question: FormQuestion) => {
    switch (question.type) {
      case "text":
      case "textarea":
        return (
          <form.Field
            key={question.id}
            name={question.id}
            validators={{
              onChange: ({ value }) => {
                if (!value || (typeof value === "string" && value.length < 1)) {
                  return "This field is required";
                }
                return undefined;
              },
            }}
          >
            {(field) => (
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  {question.title}
                  <span className="text-red-500">*</span>
                </label>
                {question.description && (
                  <p className="text-sm text-gray-600">
                    {question.description}
                  </p>
                )}
                {question.type === "textarea" ? (
                  <textarea
                    value={(field.state.value as string) || ""}
                    onChange={(e) => field.handleChange(e.target.value)}
                    onBlur={field.handleBlur}
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter your answer..."
                  />
                ) : (
                  <input
                    type="text"
                    value={(field.state.value as string) || ""}
                    onChange={(e) => field.handleChange(e.target.value)}
                    onBlur={field.handleBlur}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter your answer..."
                  />
                )}
                {field.state.meta.errors && (
                  <p className="text-red-500 text-sm">
                    {field.state.meta.errors[0]}
                  </p>
                )}
              </div>
            )}
          </form.Field>
        );

      case "number":
        return (
          <form.Field
            key={question.id}
            name={question.id}
            validators={{
              onChange: ({ value }) => {
                if (!value) return "This field is required";
                const num = parseFloat(value.toString());
                if (isNaN(num)) return "Please enter a valid number";
                return undefined;
              },
            }}
          >
            {(field) => (
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  {question.title}
                  <span className="text-red-500">*</span>
                </label>
                {question.description && (
                  <p className="text-sm text-gray-600">
                    {question.description}
                  </p>
                )}
                <input
                  type="number"
                  value={(field.state.value as string) || ""}
                  onChange={(e) => field.handleChange(e.target.value)}
                  onBlur={field.handleBlur}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter a number..."
                />
                {field.state.meta.errors && (
                  <p className="text-red-500 text-sm">
                    {field.state.meta.errors[0]}
                  </p>
                )}
              </div>
            )}
          </form.Field>
        );

      case "single-choice":
        return (
          <form.Field
            key={question.id}
            name={question.id}
            validators={{
              onChange: ({ value }) => {
                if (!value) return "Please select an option";
                return undefined;
              },
            }}
          >
            {(field) => (
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  {question.title}
                  <span className="text-red-500">*</span>
                </label>
                {question.description && (
                  <p className="text-sm text-gray-600">
                    {question.description}
                  </p>
                )}
                <div className="space-y-2">
                  {question.options?.map((option, index) => (
                    <label key={index} className="flex items-center space-x-2">
                      <input
                        type="radio"
                        name={question.id}
                        value={option}
                        checked={field.state.value === option}
                        onChange={() => field.handleChange(option)}
                        className="text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-sm text-gray-700">{option}</span>
                    </label>
                  ))}
                </div>
                {field.state.meta.errors && (
                  <p className="text-red-500 text-sm">
                    {field.state.meta.errors[0]}
                  </p>
                )}
              </div>
            )}
          </form.Field>
        );

      case "multiple-choice":
        return (
          <form.Field
            key={question.id}
            name={question.id}
            validators={{
              onChange: ({ value }) => {
                if (!value || (Array.isArray(value) && value.length === 0)) {
                  return "Please select at least one option";
                }
                return undefined;
              },
            }}
          >
            {(field) => (
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  {question.title}
                  <span className="text-red-500">*</span>
                </label>
                {question.description && (
                  <p className="text-sm text-gray-600">
                    {question.description}
                  </p>
                )}
                <div className="space-y-2">
                  {question.options?.map((option, index) => (
                    <label key={index} className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        value={option}
                        checked={
                          Array.isArray(field.state.value) &&
                          (field.state.value as string[]).includes(option)
                        }
                        onChange={(e) => {
                          const currentValue = Array.isArray(field.state.value)
                            ? (field.state.value as string[])
                            : [];
                          if (e.target.checked) {
                            field.handleChange([...currentValue, option]);
                          } else {
                            field.handleChange(
                              currentValue.filter((v) => v !== option)
                            );
                          }
                        }}
                        className="text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-sm text-gray-700">{option}</span>
                    </label>
                  ))}
                </div>
                {field.state.meta.errors && (
                  <p className="text-red-500 text-sm">
                    {field.state.meta.errors[0]}
                  </p>
                )}
              </div>
            )}
          </form.Field>
        );

      default:
        return (
          <div
            key={question.id}
            className="p-4 bg-yellow-50 border border-yellow-200 rounded"
          >
            <p className="text-yellow-800">
              Unsupported question type: {question.type}
            </p>
          </div>
        );
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading form...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center p-6 bg-white rounded-lg shadow-lg max-w-md">
          <div className="text-red-500 text-4xl mb-4">⚠️</div>
          <h1 className="text-xl font-bold text-gray-900 mb-2">Error</h1>
          <p className="text-gray-600 mb-4">{error}</p>
          <Button onClick={() => router.push("/")} variant="outline">
            Go Home
          </Button>
        </div>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center p-6 bg-white rounded-lg shadow-lg max-w-md">
          <div className="text-green-500 text-4xl mb-4">✅</div>
          <h1 className="text-xl font-bold text-gray-900 mb-2">
            Form Submitted!
          </h1>
          <p className="text-gray-600 mb-4">
            Thank you for your submission. Your reward has been processed.
          </p>
          <Button onClick={() => router.push("/")} variant="outline">
            Go Home
          </Button>
        </div>
      </div>
    );
  }

  if (!formData) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Form Header */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            {formData.name}
          </h1>
          {formData.description && (
            <p className="text-gray-600 mb-4">{formData.description}</p>
          )}

          <div className="flex items-center justify-between text-sm text-gray-500">
            <div className="flex items-center space-x-4">
              <span>
                💰 Reward: {formData.reward_per_question}{" "}
                {formData.reward_token} per question
              </span>
              <span>📊 {formData.form_questions.length} questions</span>
            </div>
            <div className="text-right">
              <div>
                Total Reward:{" "}
                {formData.reward_per_question * formData.form_questions.length}{" "}
                {formData.reward_token}
              </div>
            </div>
          </div>
        </div>

        {/* Wallet Connection */}
        {!isConnected && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium text-yellow-800">
                  Connect Wallet Required
                </h3>
                <p className="text-sm text-yellow-700">
                  Please connect your World ID wallet to submit this form and
                  receive rewards.
                </p>
              </div>
              <Button onClick={connect} className="ml-4">
                Connect Wallet
              </Button>
            </div>
          </div>
        )}

        {/* Form */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            e.stopPropagation();
            form.handleSubmit();
          }}
          className="bg-white rounded-lg shadow p-6 space-y-6"
        >
          {formData.form_questions.map(renderQuestionField)}

          {/* Submit Button */}
          <div className="pt-6 border-t border-gray-200">
            <Button
              type="submit"
              disabled={!isConnected || submitting || !form.state.canSubmit}
              className="w-full"
            >
              {submitting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Submitting...
                </>
              ) : (
                `Submit Form & Claim ${
                  formData.reward_per_question * formData.form_questions.length
                } ${formData.reward_token} Reward`
              )}
            </Button>

            {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
          </div>
        </form>
      </div>
    </div>
  );
}

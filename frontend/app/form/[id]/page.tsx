"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useForm } from "@tanstack/react-form";
import { getBountyForm, submitFormResponse } from "@/lib/forms";
import { useWallet } from "@/hooks/useWallet";
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
      case "Short Text":
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
                <input
                  type="text"
                  value={(field.state.value as string) || ""}
                  onChange={(e) => field.handleChange(e.target.value)}
                  onBlur={field.handleBlur}
                  className="w-full px-3 py-3 text-base border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  placeholder="Enter your answer..."
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

      case "Long Text":
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
                <textarea
                  value={(field.state.value as string) || ""}
                  onChange={(e) => field.handleChange(e.target.value)}
                  onBlur={field.handleBlur}
                  rows={4}
                  className="w-full px-3 py-3 text-base border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors resize-none"
                  placeholder="Enter your answer..."
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

      case "Yes/No":
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
                <div className="space-y-3">
                  {["Yes", "No"].map((option) => (
                    <label
                      key={option}
                      className="flex items-center space-x-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                    >
                      <input
                        type="radio"
                        name={question.id}
                        value={option}
                        checked={field.state.value === option}
                        onChange={() => field.handleChange(option)}
                        className="w-4 h-4 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-base text-gray-700">{option}</span>
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

      case "Single Choice":
      case "Dropdown":
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
                {question.type === "Dropdown" ? (
                  <select
                    value={(field.state.value as string) || ""}
                    onChange={(e) => field.handleChange(e.target.value)}
                    onBlur={field.handleBlur}
                    className="w-full px-3 py-3 text-base border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  >
                    <option value="">Select an option...</option>
                    {question.options?.map((option, index) => (
                      <option key={index} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                ) : (
                  <div className="space-y-3">
                    {question.options?.map((option, index) => (
                      <label
                        key={index}
                        className="flex items-center space-x-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                      >
                        <input
                          type="radio"
                          name={question.id}
                          value={option}
                          checked={field.state.value === option}
                          onChange={() => field.handleChange(option)}
                          className="w-4 h-4 text-blue-600 focus:ring-blue-500"
                        />
                        <span className="text-base text-gray-700">
                          {option}
                        </span>
                      </label>
                    ))}
                  </div>
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

      case "Multiple Choice":
      case "Checkbox":
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
                <div className="space-y-3">
                  {question.options?.map((option, index) => (
                    <label
                      key={index}
                      className="flex items-center space-x-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                    >
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
                        className="w-4 h-4 text-blue-600 focus:ring-blue-500 rounded"
                      />
                      <span className="text-base text-gray-700">{option}</span>
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

      case "Picture Choice":
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
                <div className="grid grid-cols-2 gap-3">
                  {question.options?.map((option, index) => (
                    <label
                      key={index}
                      className={`relative cursor-pointer border-2 rounded-lg p-3 text-center transition-all ${
                        field.state.value === option
                          ? "border-blue-500 bg-blue-50"
                          : "border-gray-200 hover:border-gray-300"
                      }`}
                    >
                      <input
                        type="radio"
                        name={question.id}
                        value={option}
                        checked={field.state.value === option}
                        onChange={() => field.handleChange(option)}
                        className="sr-only"
                      />
                      <div className="text-2xl mb-2">🖼️</div>
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

      case "Picture Answer":
        return (
          <div
            key={question.id}
            className="p-4 bg-yellow-50 border border-yellow-200 rounded"
          >
            <p className="text-yellow-800 mb-2 font-medium">{question.title}</p>
            <p className="text-yellow-700 text-sm">
              Picture upload functionality not yet implemented. This question
              type will be supported in a future update.
            </p>
          </div>
        );

      case "Video Answer":
        return (
          <div
            key={question.id}
            className="p-4 bg-yellow-50 border border-yellow-200 rounded"
          >
            <p className="text-yellow-800 mb-2 font-medium">{question.title}</p>
            <p className="text-yellow-700 text-sm">
              Video upload functionality not yet implemented. This question type
              will be supported in a future update.
            </p>
          </div>
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
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading form...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="text-center p-6 bg-white rounded-xl shadow-lg max-w-md w-full">
          <div className="text-red-500 text-4xl mb-4">⚠️</div>
          <h1 className="text-xl font-bold text-gray-900 mb-2">Error</h1>
          <p className="text-gray-600 mb-4">{error}</p>
          <Button
            onClick={() => router.push("/")}
            variant="outline"
            className="w-full"
          >
            Go Home
          </Button>
        </div>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="text-center p-6 bg-white rounded-xl shadow-lg max-w-md w-full">
          <div className="text-green-500 text-4xl mb-4">✅</div>
          <h1 className="text-xl font-bold text-gray-900 mb-2">
            Form Submitted Successfully!
          </h1>
          <div className="text-gray-600 mb-4">
            <p className="mb-2">Thank you for your submission!</p>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-3">
              <p className="text-sm text-blue-800">
                <strong>Expected Reward:</strong>{" "}
                {formData?.reward_per_question} {formData?.reward_token}
              </p>
              <p className="text-xs text-blue-600 mt-1">
                Rewards will be distributed by the form creator.
              </p>
            </div>
          </div>
          <Button
            onClick={() => router.push("/")}
            variant="outline"
            className="w-full"
          >
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
    <div className="min-h-screen bg-gray-50 py-4 sm:py-8">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Form Header */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6 mb-4 sm:mb-6">
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">
            {formData.name}
          </h1>
          {formData.description && (
            <p className="text-gray-600 mb-4 text-sm sm:text-base">
              {formData.description}
            </p>
          )}

          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between text-sm text-gray-500 space-y-2 sm:space-y-0">
            <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-4 space-y-1 sm:space-y-0">
              <span className="flex items-center">
                💰 {formData.reward_per_question} {formData.reward_token}
              </span>
              <span className="flex items-center">
                📊 {formData.form_questions.length} questions
              </span>
            </div>
          </div>
        </div>

        {/* Wallet Connection */}
        {!isConnected && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 mb-4 sm:mb-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-3 sm:space-y-0">
              <div>
                <h3 className="font-medium text-yellow-800">
                  Connect Wallet Required
                </h3>
                <p className="text-sm text-yellow-700">
                  Please connect your World ID wallet to submit this form.
                  Rewards will be distributed by the form creator.
                </p>
              </div>
              <Button onClick={connect} className="sm:ml-4 w-full sm:w-auto">
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
          className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6 space-y-6"
        >
          {formData.form_questions.map(renderQuestionField)}

          {/* Submit Button */}
          <div className="pt-6 border-t border-gray-200">
            <Button
              type="submit"
              disabled={!isConnected || submitting || !form.state.canSubmit}
              className="w-full h-12 text-base font-medium"
            >
              {submitting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Submitting...
                </>
              ) : (
                `Submit Form`
              )}
            </Button>

            {error && (
              <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-red-700 text-sm">{error}</p>
              </div>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}

"use client";

import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "@tanstack/react-form";
import { formEntrySchema } from "@/lib/forms";
import { useWallet } from "@/hooks/useWallet";
import { Button } from "@/components/ui/button";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useTRPC } from "@/lib/trpc";
import { z } from "zod";
import { answerEntrySchema } from "@/lib/answers";
import { usePhoto } from "@/hooks/usePhoto";

interface FormData {
  [key: string]: string | string[] | number;
}

export default function FormPage() {
  const params = useParams();
  const router = useRouter();
  const formId = params.id as string;

  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { isConnected, address, connect } = useWallet();

  const trpc = useTRPC();
  const { data: formData, isLoading: loading } = useQuery(
    trpc.questions.get_one.queryOptions(formId)
  );
  const mut = useMutation(trpc.questions.answers.create.mutationOptions());

  const { photo } = usePhoto();

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

      if (!formData) {
        setError("Form data not found");
        setSubmitting(false);
        return;
      }

      try {
        // Prepare answers
        const answers: z.infer<typeof answerEntrySchema>[] = formData.form.map(
          (question) => ({
            formEntryId: question.id,
            data: value[question.id] as any,
          })
        );

        // Submit form response
        await mut.mutateAsync({
          answer: {
            questionId: formId,
            entries: answers,
            answererAddress: address,
          },
        });

        setSubmitted(true);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to submit form");
      } finally {
        setSubmitting(false);
      }
    },
  });

  const renderQuestionField = (question: z.infer<typeof formEntrySchema>) => {
    // Helper function to get validation based on question type and requirements
    const getValidators = () => {
      return {
        onChange: ({ value }: { value: unknown }) => {
          // Check if the field is required and validate accordingly
          const isRequired =
            "required" in question ? question.required !== false : true;
          if (isRequired) {
            if (!value || (typeof value === "string" && value.length < 1)) {
              return "This field is required";
            }
            // For arrays (multiple choice), check if empty
            if (Array.isArray(value) && value.length === 0) {
              return "Please select at least one option";
            }
          }
          return undefined;
        },
      };
    };

    switch (question.type) {
      case "text":
        return (
          <form.Field
            key={question.id}
            name={question.id}
            validators={getValidators()}
          >
            {(field) => (
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  {question.label}
                  {question.required !== false && (
                    <span className="text-red-500">*</span>
                  )}
                </label>
                <input
                  type="text"
                  value={(field.state.value as string) || ""}
                  onChange={(e) => field.handleChange(e.target.value)}
                  onBlur={field.handleBlur}
                  className="w-full px-3 py-3 text-base border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  placeholder={question.placeholder || "Enter your answer..."}
                  minLength={question.min}
                  maxLength={question.max}
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

      case "number":
        return (
          <form.Field
            key={question.id}
            name={question.id}
            validators={getValidators()}
          >
            {(field) => (
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  {question.label}
                  {question.required !== false && (
                    <span className="text-red-500">*</span>
                  )}
                </label>
                <input
                  type="number"
                  value={(field.state.value as number) || ""}
                  onChange={(e) => {
                    const value = e.target.value;
                    if (value === "") {
                      field.handleChange("");
                    } else {
                      const numValue = question.integer
                        ? parseInt(value)
                        : parseFloat(value);
                      field.handleChange(numValue);
                    }
                  }}
                  onBlur={field.handleBlur}
                  className="w-full px-3 py-3 text-base border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  placeholder={question.placeholder || "Enter a number..."}
                  min={question.min}
                  max={question.max}
                  step={question.integer ? 1 : "any"}
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

      case "multiple_choice":
        return (
          <form.Field
            key={question.id}
            name={question.id}
            validators={getValidators()}
          >
            {(field) => (
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  {question.label}
                  {question.required !== false && (
                    <span className="text-red-500">*</span>
                  )}
                </label>
                <div className="space-y-3">
                  {question.options.map((option: string, index: number) => (
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

      case "checkbox":
        return (
          <form.Field
            key={question.id}
            name={question.id}
            validators={{
              onChange: () => {
                // Checkbox validation is typically just boolean
                return undefined;
              },
            }}
          >
            {(field) => (
              <div className="space-y-2">
                <label className="flex items-center space-x-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors">
                  <input
                    type="checkbox"
                    checked={Boolean(field.state.value)}
                    onChange={(e) =>
                      field.handleChange(e.target.checked ? "true" : "")
                    }
                    className="w-4 h-4 text-blue-600 focus:ring-blue-500 rounded"
                  />
                  <span className="text-base text-gray-700">
                    {question.label}
                  </span>
                </label>
                {field.state.meta.errors && (
                  <p className="text-red-500 text-sm">
                    {field.state.meta.errors[0]}
                  </p>
                )}
              </div>
            )}
          </form.Field>
        );

      case "image":
        return (
          <div
            key={question.id}
            className="p-4 bg-yellow-50 border border-yellow-200 rounded"
          >
            <p className="text-yellow-800 mb-2 font-medium">{question.label}</p>
            <p className="text-yellow-700 text-sm">
              {photo?.text()}
              {question.min &&
                question.max &&
                ` Required: ${question.min}-${question.max} images.`}
            </p>
          </div>
        );

      case "photo":
        return (
          <div
            key={question.id}
            className="p-4 bg-blue-50 border border-blue-200 rounded"
          >
            <p className="text-blue-800 mb-2 font-medium">{question.label}</p>
            {question.requirements && (
              <p className="text-blue-700 text-sm mb-2">
                Requirements: {question.requirements}
              </p>
            )}
            {question.location && (
              <p className="text-blue-700 text-sm mb-2">
                Location: {question.location}
              </p>
            )}
            <p className="text-blue-700 text-sm">
              Photo capture functionality not yet implemented. This question
              type will be supported in a future update.
            </p>
          </div>
        );

      default:
        return (
          <div
            key={(question as { id: string }).id}
            className="p-4 bg-yellow-50 border border-yellow-200 rounded"
          >
            <p className="text-yellow-800">
              Unsupported question type: {(question as { type: string }).type}
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
                <strong>Expected Reward:</strong> {formData?.reward?.amount}{" "}
                {formData?.reward?.currency}
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
            {formData.title}
          </h1>
          {formData.description && (
            <p className="text-gray-600 mb-4 text-sm sm:text-base">
              {formData.description}
            </p>
          )}

          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between text-sm text-gray-500 space-y-2 sm:space-y-0">
            <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-4 space-y-1 sm:space-y-0">
              <span className="flex items-center">
                💰 {formData.reward?.amount || 0}{" "}
                {formData?.reward?.currency || "WLD"}
              </span>
              <span className="flex items-center">
                📊 {formData.form.length} questions
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
          {formData.form.map(renderQuestionField)}

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

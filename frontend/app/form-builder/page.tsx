"use client";
import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { formEntrySchema } from "../../lib/forms";
import { useWallet } from "../../hooks/useWallet";
import { PaymentModal } from "../../components/PaymentModal";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { usePhoto } from "@/hooks/usePhoto";
import z from "zod";
import { useMutation } from "@tanstack/react-query";
import { useTRPC } from "@/lib/trpc";
import { questionSchema } from "@/lib/questions";

const QUESTION_TYPES = [
  {
    name: "Short Text",
    icon: "📝",
    description: "Brief text response",
    formType: "text" as const,
    minLength: 1,
    maxLength: 100,
    isPreset: true,
  },
  {
    name: "Long Text",
    icon: "📄",
    description: "Detailed text response",
    formType: "text" as const,
    minLength: 10,
    maxLength: 1000,
    isPreset: true,
  },
  {
    name: "Number",
    icon: "🔢",
    description: "Number response",
    formType: "number" as const,
  },
  {
    name: "Multiple Choice",
    icon: "☑️",
    description: "Pick multiple options",
    formType: "multiple_choice" as const,
  },
  {
    name: "Checkbox",
    icon: "✔️",
    description: "Check box",
    formType: "checkbox" as const,
  },
  {
    name: "Picture Answer",
    icon: "📸",
    description: "Upload an image",
    formType: "image" as const,
  },
];

type Question = z.infer<typeof formEntrySchema>;

type BuilderType = "survey" | "photo" | null;

type PhotoTask = {
  title: string;
  description: string;
  requirements: string;
  location: string | null; // Optional location
};

export default function FormBuilder() {
  const [selectedType, setSelectedType] = useState<BuilderType>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [photoTask, setPhotoTask] = useState<PhotoTask>({
    title: "",
    description: "",
    requirements: "",
    location: null,
  });
  const [showTypeMenu, setShowTypeMenu] = useState(false);
  const [insertIndex, setInsertIndex] = useState<number | undefined>(undefined);
  const [showQuestSetup, setShowQuestSetup] = useState(false);
  const [showPaymentStep, setShowPaymentStep] = useState(false);

  // Note: setPhoto is available but not used in this component
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { setPhoto } = usePhoto();
  // Note: setPhoto is available for future use

  const openTypeMenu = (index?: number) => {
    setInsertIndex(index);
    setShowTypeMenu(true);
  };

  const addQuestion = (questionTypeName: string, index?: number) => {
    const questionType = QUESTION_TYPES.find(
      (t) => t.name === questionTypeName
    );
    if (!questionType) return;

    const baseQuestion = {
      id: crypto.randomUUID(),
      label: "",
    };

    let newQuestion: Question;

    switch (questionType.formType) {
      case "text":
        newQuestion = {
          ...baseQuestion,
          type: "text",
          min: questionType.minLength,
          max: questionType.maxLength,
          placeholder: "",
          required: false,
        };
        break;
      case "number":
        newQuestion = {
          ...baseQuestion,
          type: "number",
          placeholder: "",
          required: false,
          integer: false,
        };
        break;
      case "image":
        newQuestion = {
          ...baseQuestion,
          type: "image",
          min: 1,
          max: 1,
        };
        break;
      case "checkbox":
        newQuestion = {
          ...baseQuestion,
          type: "checkbox",
        };
        break;
      case "multiple_choice":
        newQuestion = {
          ...baseQuestion,
          type: "multiple_choice",
          options: ["Option 1", "Option 2"],
          required: false,
        };
        break;
      default:
        return; // Invalid type
    }

    const updated = [...questions];
    if (index !== undefined) {
      updated.splice(index + 1, 0, newQuestion);
    } else {
      updated.push(newQuestion);
    }
    setQuestions(updated);
    setShowTypeMenu(false);
    setInsertIndex(undefined);
  };

  const deleteQuestion = (id: string) => {
    setQuestions((prev) => prev.filter((q) => q.id !== id));
  };

  const moveQuestion = (fromIndex: number, toIndex: number) => {
    const updated = [...questions];
    const [movedQuestion] = updated.splice(fromIndex, 1);
    updated.splice(toIndex, 0, movedQuestion);
    setQuestions(updated);
  };

  const moveQuestionUp = (index: number) => {
    if (index > 0) {
      moveQuestion(index, index - 1);
    }
  };

  const moveQuestionDown = (index: number) => {
    if (index < questions.length - 1) {
      moveQuestion(index, index + 1);
    }
  };

  const updateQuestion = (
    id: string,
    key: string,
    value: string | number | boolean | string[] | undefined
  ) => {
    setQuestions((prev) =>
      prev.map((q) => (q.id === id ? { ...q, [key]: value } : q))
    );
  };

  const updateOptions = (id: string, newOptions: string[]) => {
    setQuestions((prev) =>
      prev.map((q) => (q.id === id ? { ...q, options: newOptions } : q))
    );
  };

  // If no type is selected, show type selection
  if (!selectedType) {
    return (
      <div className="min-h-screen bg-gray-50">
        {/* Header with back button */}
        <div className="bg-white shadow-sm border-b px-4 py-3">
          <div className="flex items-center">
            <Link href="/">
              <Button
                variant="outline"
                size="sm"
                className="mr-4 flex items-center"
              >
                ← Back
              </Button>
            </Link>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900">
              Quest Type
            </h1>
          </div>
        </div>

        {/* Type Selection */}
        <div className="px-4 py-8 max-w-md mx-auto">
          <div className="space-y-4">
            <div
              onClick={() => setSelectedType("survey")}
              className="bg-white rounded-xl p-6 shadow-sm border hover:shadow-md transition-shadow cursor-pointer hover:border-blue-300"
            >
              <div className="flex items-center space-x-4">
                <div className="text-4xl">📝</div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    Survey
                  </h3>
                  <p className="text-gray-600 text-sm">
                    Create surveys and questionnaires with multiple question
                    types
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-gray-50 rounded-xl p-6 shadow-sm border border-gray-200 opacity-60 cursor-not-allowed relative">
              <div className="flex items-center space-x-4">
                <div className="text-4xl">📸</div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-500">Photo</h3>
                  <p className="text-gray-400 text-sm">
                    Create photo collection tasks and challenges
                  </p>
                </div>
              </div>
              <div className="absolute top-2 right-2 bg-yellow-100 text-yellow-800 text-xs font-medium px-2 py-1 rounded-full">
                Coming Soon
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // If photo type is selected, show photo task builder
  if (selectedType === "photo") {
    return (
      <div className="min-h-screen bg-gray-50 relative">
        {/* Header with back button */}
        <div className="bg-white shadow-sm border-b px-4 py-3 sticky top-0 z-10">
          <div className="flex items-center">
            <Button
              variant="outline"
              size="sm"
              className="mr-4 flex items-center"
              onClick={() => setSelectedType(null)}
            >
              ← Back
            </Button>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900">
              Create Photo Task
            </h1>
          </div>
        </div>

        {/* Photo Task Builder */}
        <div className="px-4 py-6 space-y-6 max-w-2xl mx-auto pb-24">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="space-y-6">
              {/* Title */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Title *
                </label>
                <input
                  type="text"
                  placeholder="Enter photo task title..."
                  value={photoTask.title}
                  onChange={(e) =>
                    setPhotoTask((prev) => ({ ...prev, title: e.target.value }))
                  }
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description *
                </label>
                <textarea
                  placeholder="Describe what kind of photo you want users to take..."
                  value={photoTask.description}
                  onChange={(e) =>
                    setPhotoTask((prev) => ({
                      ...prev,
                      description: e.target.value,
                    }))
                  }
                  rows={4}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors resize-none"
                />
              </div>

              {/* Requirements */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Requirements *
                </label>
                <textarea
                  placeholder="Specify any requirements for the photo (quality, angle, content, etc.)..."
                  value={photoTask.requirements}
                  onChange={(e) =>
                    setPhotoTask((prev) => ({
                      ...prev,
                      requirements: e.target.value,
                    }))
                  }
                  rows={3}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors resize-none"
                />
              </div>

              {/* Location */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Location (Optional)
                </label>
                <input
                  type="text"
                  placeholder="Enter location or leave empty for any location..."
                  value={photoTask.location || ""}
                  onChange={(e) =>
                    setPhotoTask((prev) => ({
                      ...prev,
                      location: e.target.value.trim() || null,
                    }))
                  }
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Users can submit photos from any location if left empty
                </p>
              </div>
            </div>
          </div>

          {/* Photo Task Preview */}
          {photoTask.title && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="font-semibold text-gray-900 mb-4 flex items-center">
                <span className="mr-2">📸</span>
                Photo Task Preview
              </h3>
              <div className="space-y-3">
                <div>
                  <span className="text-sm font-medium text-gray-600">
                    Title:
                  </span>
                  <p className="text-gray-900">{photoTask.title}</p>
                </div>
                {photoTask.description && (
                  <div>
                    <span className="text-sm font-medium text-gray-600">
                      Description:
                    </span>
                    <p className="text-gray-900">{photoTask.description}</p>
                  </div>
                )}
                {photoTask.requirements && (
                  <div>
                    <span className="text-sm font-medium text-gray-600">
                      Requirements:
                    </span>
                    <p className="text-gray-900">{photoTask.requirements}</p>
                  </div>
                )}
                {photoTask.location && (
                  <div>
                    <span className="text-sm font-medium text-gray-600">
                      Location:
                    </span>
                    <p className="text-gray-900">{photoTask.location}</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Fixed Continue Button */}
        {photoTask.title && photoTask.description && photoTask.requirements && (
          <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4 z-20">
            <div className="max-w-2xl mx-auto">
              <button
                onClick={() => setShowQuestSetup(true)}
                className="w-full bg-green-600 hover:bg-green-700 active:bg-green-800 text-white px-6 py-4 rounded-lg font-medium text-lg shadow-lg transition-all duration-150 touch-manipulation"
              >
                Continue to Payment Setup
              </button>
            </div>
          </div>
        )}

        {/* Quest Setup Modal */}
        {showQuestSetup && (
          <PhotoQuestSetupPage
            photoTask={photoTask}
            onBack={() => setShowQuestSetup(false)}
            onContinueToPayment={() => {
              setShowQuestSetup(false);
              setShowPaymentStep(true);
            }}
          />
        )}

        {/* Payment Step */}
        {showPaymentStep && (
          <PhotoPaymentStepPage
            photoTask={photoTask}
            onBack={() => {
              setShowPaymentStep(false);
              setShowQuestSetup(true);
            }}
          />
        )}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 relative">
      {/* Header with back button */}
      <div className="bg-white shadow-sm border-b px-4 py-3 sticky top-0 z-10">
        <div className="flex items-center">
          <Button
            variant="outline"
            size="sm"
            className="mr-4 flex items-center"
            onClick={() => setSelectedType(null)}
          >
            ← Back
          </Button>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">
            Create Quest
          </h1>
        </div>
      </div>

      {/* Main Content */}
      <div className="px-4 py-6 space-y-4 max-w-2xl mx-auto pb-24">
        {questions.map((question, index) => (
          <QuestionCard
            key={question.id}
            question={question}
            index={index}
            totalQuestions={questions.length}
            updateQuestion={updateQuestion}
            updateOptions={updateOptions}
            onAddQuestion={() => openTypeMenu(index)}
            onDeleteQuestion={() => deleteQuestion(question.id)}
            onMoveUp={() => moveQuestionUp(index)}
            onMoveDown={() => moveQuestionDown(index)}
          />
        ))}

        {questions.length === 0 && (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">📝</div>
            <h2 className="text-lg font-semibold text-gray-700 mb-2">
              No questions yet
            </h2>
            <p className="text-gray-500 mb-6">
              Start building your quest by adding your first question
            </p>
          </div>
        )}

        <button
          onClick={() => openTypeMenu()}
          className="w-full bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white px-6 py-4 rounded-lg font-medium text-lg shadow-lg transition-all duration-150 touch-manipulation"
        >
          ➕ Add {questions.length === 0 ? "First" : "New"} Question
        </button>
      </div>

      {/* Fixed Save Button */}
      {questions.length > 0 && (
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4 z-20">
          <div className="max-w-2xl mx-auto">
            <button
              onClick={() => setShowQuestSetup(true)}
              className="w-full bg-green-600 hover:bg-green-700 active:bg-green-800 text-white px-6 py-4 rounded-lg font-medium text-lg shadow-lg transition-all duration-150 touch-manipulation"
            >
              💾 Save Quest ({questions.length} question
              {questions.length !== 1 ? "s" : ""})
            </button>
          </div>
        </div>
      )}

      {/* Question Type Menu Modal */}
      {showTypeMenu && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowTypeMenu(false);
            }
          }}
        >
          <div className="bg-white rounded-2xl w-full sm:max-w-lg max-h-[85vh] overflow-hidden shadow-2xl">
            {/* Menu Header */}
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-semibold text-gray-900">
                  Choose Question Type
                </h3>
                <button
                  onClick={() => setShowTypeMenu(false)}
                  className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 transition-colors"
                >
                  ✕
                </button>
              </div>
              <p className="text-gray-500 text-sm mt-1">
                Select the type of question you want to add
              </p>
            </div>

            {/* Menu Options */}
            <div className="overflow-y-auto max-h-96">
              <div className="p-4 space-y-2">
                {QUESTION_TYPES.map((type) => (
                  <button
                    key={type.name}
                    onClick={() => addQuestion(type.name, insertIndex)}
                    className="w-full text-left p-4 rounded-xl border border-gray-200 hover:border-blue-300 hover:bg-blue-50 transition-all group"
                  >
                    <div className="flex items-start space-x-3">
                      <span className="text-2xl group-hover:scale-110 transition-transform">
                        {type.icon}
                      </span>
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-900 group-hover:text-blue-700">
                          {type.name}
                        </h4>
                        <p className="text-sm text-gray-500 mt-1">
                          {type.description}
                        </p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Quest Setup Modal */}
      {showQuestSetup === true && (
        <QuestSetupPage
          questions={questions}
          onBack={() => setShowQuestSetup(false)}
          onContinueToPayment={(formData: {
            name: string;
            description: string;
            startDate: string;
            endDate: string;
            verificationRequired: "orb" | "device" | "none";
          }) => {
            // Save quest data to localStorage for the payment step
            localStorage.setItem("pendingFormData", JSON.stringify(formData));
            setShowQuestSetup(false);
            setShowPaymentStep(true);
          }}
        />
      )}

      {/* Payment Step */}
      {showPaymentStep && selectedType === "survey" && (
        <PaymentStepPage
          questions={questions}
          onBack={() => {
            setShowPaymentStep(false);
            setShowQuestSetup(true);
          }}
        />
      )}
    </div>
  );
}

function QuestionCard({
  question,
  index,
  totalQuestions,
  updateQuestion,
  updateOptions,
  onAddQuestion,
  onDeleteQuestion,
  onMoveUp,
  onMoveDown,
}: {
  question: Question;
  index: number;
  totalQuestions: number;
  updateQuestion: (
    id: string,
    key: string,
    value: string | number | boolean | string[] | undefined
  ) => void;
  updateOptions: (id: string, newOptions: string[]) => void;
  onAddQuestion: () => void;
  onDeleteQuestion: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
}) {
  const questionType = QUESTION_TYPES.find((t) => t.name === question.type);

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      {/* Question Header */}
      <div className="p-4 border-b border-gray-100 bg-gray-50">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <span className="text-2xl">{questionType?.icon || "📝"}</span>
            <div className="flex-1">
              <span className="text-sm font-medium text-gray-600 uppercase tracking-wide">
                {question.type}
              </span>
              <div className="text-xs text-gray-500 mt-1">
                Question {index + 1} of {totalQuestions}
              </div>
            </div>
          </div>

          {/* Mobile Control Buttons */}
          <div className="flex items-center space-x-2">
            {/* Move Up/Down */}
            <div className="flex flex-col space-y-1">
              <button
                onClick={onMoveUp}
                disabled={index === 0}
                className={`w-10 h-8 flex items-center justify-center rounded-lg text-sm font-bold ${index === 0
                  ? "text-gray-300 cursor-not-allowed bg-gray-100"
                  : "text-gray-600 hover:bg-gray-200 active:bg-gray-300 bg-gray-50"
                  } transition-all duration-150 touch-manipulation`}
              >
                ↑
              </button>
              <button
                onClick={onMoveDown}
                disabled={index === totalQuestions - 1}
                className={`w-10 h-8 flex items-center justify-center rounded-lg text-sm font-bold ${index === totalQuestions - 1
                  ? "text-gray-300 cursor-not-allowed bg-gray-100"
                  : "text-gray-600 hover:bg-gray-200 active:bg-gray-300 bg-gray-50"
                  } transition-all duration-150 touch-manipulation`}
              >
                ↓
              </button>
            </div>

            {/* Delete Button */}
            <button
              onClick={onDeleteQuestion}
              className="w-10 h-10 flex items-center justify-center rounded-lg bg-red-50 text-red-600 hover:bg-red-100 active:bg-red-200 transition-all duration-150 touch-manipulation text-lg"
            >
              🗑️
            </button>
          </div>
        </div>
      </div>

      {/* Question Content */}
      <div className="p-4 space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Question Title *
          </label>
          <input
            type="text"
            placeholder="Enter your question..."
            value={question.label}
            onChange={(e) =>
              updateQuestion(question.id, "label", e.target.value)
            }
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors"
          />
        </div>

        {/* Type-specific configuration */}
        {question.type === "text" && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Placeholder (optional)
              </label>
              <input
                type="text"
                placeholder="Enter placeholder text..."
                value={question.placeholder || ""}
                onChange={(e) =>
                  updateQuestion(question.id, "placeholder", e.target.value)
                }
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Min Length
                </label>
                <input
                  type="number"
                  placeholder="0"
                  value={question.min || ""}
                  onChange={(e) =>
                    updateQuestion(
                      question.id,
                      "min",
                      e.target.value ? parseInt(e.target.value) : undefined
                    )
                  }
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors disabled:bg-gray-100 disabled:cursor-not-allowed"
                  disabled={QUESTION_TYPES.some(
                    (t) =>
                      t.formType === "text" &&
                      t.isPreset &&
                      question.min === t.minLength &&
                      question.max === t.maxLength
                  )}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Max Length
                </label>
                <input
                  type="number"
                  placeholder="100"
                  value={question.max || ""}
                  onChange={(e) =>
                    updateQuestion(
                      question.id,
                      "max",
                      e.target.value ? parseInt(e.target.value) : undefined
                    )
                  }
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors disabled:bg-gray-100 disabled:cursor-not-allowed"
                  disabled={QUESTION_TYPES.some(
                    (t) =>
                      t.formType === "text" &&
                      t.isPreset &&
                      question.min === t.minLength &&
                      question.max === t.maxLength
                  )}
                />
              </div>
            </div>
            {QUESTION_TYPES.some(
              (t) =>
                t.formType === "text" &&
                t.isPreset &&
                question.min === t.minLength &&
                question.max === t.maxLength
            ) && (
                <div className="p-3 bg-blue-50 rounded-lg">
                  <p className="text-sm text-blue-800">
                    Min/Max values are preset for{" "}
                    {
                      QUESTION_TYPES.find(
                        (t) =>
                          t.formType === "text" &&
                          t.isPreset &&
                          question.min === t.minLength &&
                          question.max === t.maxLength
                      )?.name
                    }
                  </p>
                </div>
              )}
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id={`required-${question.id}`}
                checked={question.required || false}
                onChange={(e) =>
                  updateQuestion(question.id, "required", e.target.checked)
                }
                className="w-4 h-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label
                htmlFor={`required-${question.id}`}
                className="text-sm font-medium text-gray-700"
              >
                Required field
              </label>
            </div>
          </div>
        )}

        {question.type === "number" && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Placeholder (optional)
              </label>
              <input
                type="text"
                placeholder="Enter placeholder text..."
                value={question.placeholder || ""}
                onChange={(e) =>
                  updateQuestion(question.id, "placeholder", e.target.value)
                }
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Min Value
                </label>
                <input
                  type="number"
                  placeholder="0"
                  value={question.min || ""}
                  onChange={(e) =>
                    updateQuestion(
                      question.id,
                      "min",
                      e.target.value ? parseInt(e.target.value) : undefined
                    )
                  }
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Max Value
                </label>
                <input
                  type="number"
                  placeholder="100"
                  value={question.max || ""}
                  onChange={(e) =>
                    updateQuestion(
                      question.id,
                      "max",
                      e.target.value ? parseInt(e.target.value) : undefined
                    )
                  }
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors"
                />
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id={`integer-${question.id}`}
                checked={question.integer || false}
                onChange={(e) =>
                  updateQuestion(question.id, "integer", e.target.checked)
                }
                className="w-4 h-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label
                htmlFor={`integer-${question.id}`}
                className="text-sm font-medium text-gray-700"
              >
                Integer only (no decimals)
              </label>
            </div>
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id={`required-${question.id}`}
                checked={question.required || false}
                onChange={(e) =>
                  updateQuestion(question.id, "required", e.target.checked)
                }
                className="w-4 h-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label
                htmlFor={`required-${question.id}`}
                className="text-sm font-medium text-gray-700"
              >
                Required field
              </label>
            </div>
          </div>
        )}

        {question.type === "image" && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Min Images *
                </label>
                <input
                  type="number"
                  placeholder="1"
                  min="1"
                  value={question.min || 1}
                  onChange={(e) =>
                    updateQuestion(
                      question.id,
                      "min",
                      parseInt(e.target.value) || 1
                    )
                  }
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Max Images *
                </label>
                <input
                  type="number"
                  placeholder="1"
                  min="1"
                  value={question.max || 1}
                  onChange={(e) =>
                    updateQuestion(
                      question.id,
                      "max",
                      parseInt(e.target.value) || 1
                    )
                  }
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors"
                />
              </div>
            </div>
            <div className="p-4 bg-blue-50 rounded-lg">
              <div className="flex items-center space-x-2">
                <span className="text-blue-600">📸</span>
                <div>
                  <p className="text-sm font-medium text-blue-800">
                    Image Upload
                  </p>
                  <p className="text-xs text-blue-600">
                    Users will be able to upload{" "}
                    {question.min === question.max
                      ? `${question.min}`
                      : `${question.min}-${question.max}`}{" "}
                    image{(question.max || 1) > 1 ? "s" : ""}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {question.type === "checkbox" && (
          <div className="p-4 bg-green-50 rounded-lg">
            <div className="flex items-center space-x-2">
              <span className="text-green-600">✔️</span>
              <div>
                <p className="text-sm font-medium text-green-800">
                  Simple Checkbox
                </p>
                <p className="text-xs text-green-600">
                  Users can check or uncheck this option
                </p>
              </div>
            </div>
          </div>
        )}

        {question.type === "multiple_choice" && (
          <ChoiceOptionEditor
            options={question.options || []}
            onChange={(opts) => updateOptions(question.id, opts)}
          />
        )}

        {question.type === "multiple_choice" && (
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id={`required-${question.id}`}
              checked={question.required || false}
              onChange={(e) =>
                updateQuestion(question.id, "required", e.target.checked)
              }
              className="w-4 h-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label
              htmlFor={`required-${question.id}`}
              className="text-sm font-medium text-gray-700"
            >
              Required field
            </label>
          </div>
        )}

        <button
          onClick={onAddQuestion}
          className="w-full mt-4 py-4 px-4 border-2 border-dashed border-gray-300 hover:border-blue-400 text-gray-600 hover:text-blue-600 rounded-lg transition-all duration-150 font-medium touch-manipulation active:bg-blue-50"
        >
          ➕ Add Question Below
        </button>
      </div>
    </div>
  );
}

function ChoiceOptionEditor({
  options,
  onChange,
}: {
  options: string[];
  onChange: (opts: string[]) => void;
}) {
  const update = (i: number, value: string) => {
    const newOpts = [...options];
    newOpts[i] = value;
    onChange(newOpts);
  };

  const add = () => onChange([...options, ""]);

  const remove = (i: number) => {
    const newOpts = [...options];
    newOpts.splice(i, 1);
    onChange(newOpts);
  };

  return (
    <div className="space-y-3">
      <label className="block text-sm font-medium text-gray-700">
        Options *
      </label>
      <div className="space-y-3">
        {options.map((opt, i) => (
          <div key={i} className="flex gap-3 items-center">
            <div className="flex-1">
              <input
                type="text"
                value={opt}
                placeholder={`Option ${i + 1}`}
                onChange={(e) => update(i, e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors"
              />
            </div>
            {options.length > 1 && (
              <button
                onClick={() => remove(i)}
                className="flex-shrink-0 w-12 h-12 flex items-center justify-center rounded-lg bg-red-50 text-red-600 hover:bg-red-100 active:bg-red-200 transition-all duration-150 touch-manipulation text-lg"
              >
                🗑️
              </button>
            )}
          </div>
        ))}
      </div>
      <button
        onClick={add}
        className="w-full py-4 px-4 border-2 border-dashed border-gray-300 hover:border-blue-400 text-gray-600 hover:text-blue-600 rounded-lg transition-all duration-150 font-medium touch-manipulation active:bg-blue-50"
      >
        ➕ Add Option
      </button>
    </div>
  );
}

function QuestSetupPage({
  questions,
  onBack,
  onContinueToPayment,
}: {
  questions: Question[];
  onBack: () => void;
  onContinueToPayment: (formData: {
    name: string;
    description: string;
    startDate: string;
    endDate: string;
    verificationRequired: "orb" | "device" | "none";
  }) => void;
}) {
  const [formName, setFormName] = useState("");
  const [description, setDescription] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [verificationRequired, setverificationRequired] = useState<
    "orb" | "device" | "none"
  >("none");
  const [error, setError] = useState<string | null>(null);

  const { isConnected, connect } = useWallet();

  const handleContinueToPayment = () => {
    if (!isConnected) {
      alert("Please connect your wallet first to proceed with payment.");
      return;
    }

    if (!formName || !startDate || !endDate) {
      setError(
        "Please fill in all required fields before proceeding to payment."
      );
      return;
    }

    if (questions.length === 0) {
      setError("Please add at least one question to your quest.");
      return;
    }

    setError(null);
    onContinueToPayment({
      name: formName,
      description,
      startDate,
      endDate,
      verificationRequired,
    });
  };

  return (
    <div className="fixed inset-0 bg-gray-50 z-50 overflow-y-auto">
      {/* Header */}
      <div className="bg-white shadow-sm border-b px-4 py-3 sticky top-0 z-10">
        <div className="flex items-center space-x-3">
          <button
            onClick={onBack}
            className="w-10 h-10 flex items-center justify-center rounded-lg bg-gray-100 hover:bg-gray-200 transition-colors"
          >
            ←
          </button>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">
            Quest Setup
          </h1>
        </div>
      </div>

      {/* Main Content */}
      <div className="px-4 py-6 space-y-6 max-w-2xl mx-auto pb-24">
        {/* Quest Preview */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
          <h3 className="font-semibold text-gray-900 mb-2">Quest Preview</h3>
          <p className="text-sm text-gray-600">
            {questions.length} question
            {questions.length !== 1 ? "s" : ""} created
          </p>
          <div className="mt-3 space-y-2">
            {questions.slice(0, 3).map((q, i) => (
              <div key={q.id} className="text-sm text-gray-500">
                {i + 1}. {q.label || "Untitled Question"} ({q.type})
              </div>
            ))}
            {questions.length > 3 && (
              <div className="text-sm text-gray-400">
                +{questions.length - 3} more questions...
              </div>
            )}
          </div>
        </div>

        {/* Quest Details */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-6">
          <h3 className="text-lg font-semibold text-gray-900">Quest Details</h3>

          {error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-center space-x-2">
                <span className="text-red-600">❌</span>
                <p className="text-sm text-red-700">{error}</p>
              </div>
            </div>
          )}

          {/* Wallet Connection Warning */}
          {!isConnected && (
            <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <span className="text-yellow-600">⚠️</span>
                  <div>
                    <p className="text-sm font-medium text-yellow-800">
                      Wallet Required
                    </p>
                    <p className="text-xs text-yellow-700">
                      Connect your wallet to fund the quest
                    </p>
                  </div>
                </div>
                <button
                  onClick={connect}
                  className="px-3 py-1 bg-yellow-600 text-white text-sm rounded hover:bg-yellow-700 transition-colors"
                >
                  Connect
                </button>
              </div>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Quest Name *
            </label>
            <input
              type="text"
              placeholder="Enter quest name..."
              value={formName}
              onChange={(e) => setFormName(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description
            </label>
            <textarea
              placeholder="Describe your bounty quest..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors resize-none"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Start Date *
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                End Date *
              </label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors"
              />
            </div>
          </div>

          {/* User Eligibility */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Who can participate? *
            </label>
            <select
              value={verificationRequired}
              onChange={(e) =>
                setverificationRequired(
                  e.target.value as "orb" | "device" | "none"
                )
              }
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors"
            >
              <option value="none">All users (Device or Orb verified)</option>
              <option value="device">Device verified only</option>
              <option value="orb">Orb verified only</option>
            </select>
            <p className="text-xs text-gray-500 mt-1">
              {verificationRequired === "none" &&
                "Anyone with World ID (Device or Orb verification) can participate"}
              {verificationRequired === "device" &&
                "Only users with Device-level World ID verification can participate"}
              {verificationRequired === "orb" &&
                "Only users with Orb-level World ID verification can participate"}
            </p>
          </div>

          {/* Quest will be public info */}
          <div className="p-4 bg-blue-50 rounded-lg">
            <div className="flex items-center space-x-2">
              <span className="text-blue-600">🌍</span>
              <div>
                <p className="text-sm font-medium text-blue-800">
                  Public Quest
                </p>
                <p className="text-xs text-blue-600">
                  Your quest will be publicly accessible and anyone can
                  participate to earn rewards
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Fixed Continue Button */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4 z-20">
        <div className="max-w-2xl mx-auto">
          <button
            onClick={handleContinueToPayment}
            disabled={!formName || !startDate || !endDate || !isConnected}
            className="w-full bg-blue-600 hover:bg-blue-700 active:bg-blue-800 disabled:bg-gray-400 disabled:cursor-not-allowed text-white px-6 py-4 rounded-lg font-medium text-lg shadow-lg transition-all duration-150 touch-manipulation flex items-center justify-center space-x-2"
          >
            <span>💳</span>
            <span>Continue to Payment</span>
          </button>
        </div>
      </div>
    </div>
  );
}

function PhotoQuestSetupPage({
  photoTask,
  onBack,
  onContinueToPayment,
}: {
  photoTask: PhotoTask;
  onBack: () => void;
  onContinueToPayment: (formData: {
    name: string;
    description: string;
    startDate: string;
    endDate: string;
    verificationRequired: "Orb" | "Device" | "All";
  }) => void;
}) {
  const [formName, setFormName] = useState("");
  const [description, setDescription] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [verificationRequired, setverificationRequired] = useState<
    "Orb" | "Device" | "All"
  >("All");
  const [error, setError] = useState<string | null>(null);

  const { isConnected, connect } = useWallet();

  const handleContinueToPayment = () => {
    if (!isConnected) {
      alert("Please connect your wallet first to proceed with payment.");
      return;
    }

    if (!formName || !startDate || !endDate) {
      setError(
        "Please fill in all required fields before proceeding to payment."
      );
      return;
    }

    setError(null);

    // Store photo task data for payment step
    localStorage.setItem("pendingPhotoTask", JSON.stringify(photoTask));
    localStorage.setItem(
      "pendingFormData",
      JSON.stringify({
        name: formName,
        description,
        startDate,
        endDate,
        verificationRequired,
      })
    );

    onContinueToPayment({
      name: formName,
      description,
      startDate,
      endDate,
      verificationRequired,
    });
  };

  return (
    <div className="fixed inset-0 bg-gray-50 z-50 overflow-y-auto">
      {/* Header */}
      <div className="bg-white shadow-sm border-b px-4 py-3 sticky top-0 z-10">
        <div className="flex items-center space-x-3">
          <button
            onClick={onBack}
            className="w-10 h-10 flex items-center justify-center rounded-lg bg-gray-100 hover:bg-gray-200 transition-colors"
          >
            ←
          </button>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">
            Photo Quest Setup
          </h1>
        </div>
      </div>

      {/* Main Content */}
      <div className="px-4 py-6 space-y-6 max-w-2xl mx-auto pb-24">
        {/* Photo Task Preview */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
          <h3 className="font-semibold text-gray-900 mb-2 flex items-center">
            <span className="mr-2">📸</span>
            Photo Task Preview
          </h3>
          <div className="space-y-2">
            <div>
              <span className="text-sm font-medium text-gray-600">Title:</span>
              <p className="text-gray-900">{photoTask.title}</p>
            </div>
            <div>
              <span className="text-sm font-medium text-gray-600">
                Description:
              </span>
              <p className="text-gray-900">{photoTask.description}</p>
            </div>
            <div>
              <span className="text-sm font-medium text-gray-600">
                Requirements:
              </span>
              <p className="text-gray-900">{photoTask.requirements}</p>
            </div>
            {photoTask.location && (
              <div>
                <span className="text-sm font-medium text-gray-600">
                  Location:
                </span>
                <p className="text-gray-900">{photoTask.location}</p>
              </div>
            )}
          </div>
        </div>

        {/* Quest Details */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-6">
          <h3 className="text-lg font-semibold text-gray-900">Quest Details</h3>

          {error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-center space-x-2">
                <span className="text-red-600">❌</span>
                <p className="text-sm text-red-700">{error}</p>
              </div>
            </div>
          )}

          {/* Wallet Connection Warning */}
          {!isConnected && (
            <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <span className="text-yellow-600">⚠️</span>
                  <div>
                    <p className="text-sm font-medium text-yellow-800">
                      Wallet Required
                    </p>
                    <p className="text-xs text-yellow-700">
                      Connect your wallet to fund the quest
                    </p>
                  </div>
                </div>
                <Button onClick={connect} size="sm" className="ml-4">
                  Connect Wallet
                </Button>
              </div>
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Quest Name *
              </label>
              <input
                type="text"
                placeholder="Enter a name for your photo quest..."
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Quest Description (optional)
              </label>
              <textarea
                placeholder="Add any additional context for participants..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors resize-none"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Start Date *
                </label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  min={new Date().toISOString().split("T")[0]}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  End Date *
                </label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  min={startDate || new Date().toISOString().split("T")[0]}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                User Eligibility
              </label>
              <select
                value={verificationRequired}
                onChange={(e) =>
                  setverificationRequired(
                    e.target.value as "Orb" | "Device" | "All"
                  )
                }
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors"
              >
                <option value="All">All Users</option>
                <option value="Device">Device Verified Only</option>
                <option value="Orb">Orb Verified Only</option>
              </select>
              <p className="text-xs text-gray-500 mt-1">
                Choose who can participate in your photo quest
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Fixed Continue Button */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4 z-20">
        <div className="max-w-2xl mx-auto">
          <button
            onClick={handleContinueToPayment}
            className="w-full bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white px-6 py-4 rounded-lg font-medium text-lg shadow-lg transition-all duration-150 touch-manipulation"
          >
            Continue to Payment
          </button>
        </div>
      </div>
    </div>
  );
}

// Photo Payment Step Page Component
function PhotoPaymentStepPage({
  photoTask,
  onBack,
}: {
  photoTask: PhotoTask;
  onBack: () => void;
}) {
  const [formData, setFormData] = useState<{
    name: string;
    description: string;
    startDate: string;
    endDate: string;
    verificationRequired: "orb" | "device" | "none";
  } | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPaymentModal, setShowPaymentModal] = useState(true);

  const router = useRouter();

  const trpc = useTRPC();
  const createBountyFormMutation = useMutation(
    trpc.questions.create.mutationOptions()
  );

  // Get quest data from localStorage
  React.useEffect(() => {
    const savedFormData = localStorage.getItem("pendingFormData");
    if (savedFormData) {
      setFormData(JSON.parse(savedFormData));
    }
  }, []);

  const handlePaymentSuccess = async (payment: {
    amount: number;
    token: "USDC" | "WLD";
    transactionId: string;
    maxQuestions: number;
    rewardPerQuestion: number;
    bountyData: {
      transactionId: string;
      question: z.infer<typeof questionSchema>;
    };
  }) => {
    setShowPaymentModal(false);
    setIsLoading(true);
    setError(null);

    if (!formData) {
      setError("Quest data is missing. Please go back and try again.");
      return;
    }

    try {
      // Create photo task form with special structure
      const result = await createBountyFormMutation.mutateAsync(
        payment.bountyData
      );

      // Navigate to success page
      router.push(`/form-success?formId=${result.blobId}&type=photo`);
    } catch (err) {
      console.error("Error creating photo quest:", err);
      setError("Failed to create photo quest. Please try again.");
      setShowPaymentModal(true);
    } finally {
      setIsLoading(false);
    }
  };

  if (!formData) {
    return (
      <div className="fixed inset-0 bg-gray-50 z-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading quest data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-gray-50 z-50 overflow-y-auto">
      {/* Header */}
      <div className="bg-white shadow-sm border-b px-4 py-3 sticky top-0 z-10">
        <div className="flex items-center space-x-3">
          <button
            onClick={onBack}
            className="w-10 h-10 flex items-center justify-center rounded-lg bg-gray-100 hover:bg-gray-200 transition-colors"
          >
            ←
          </button>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">
            Fund Your Photo Quest
          </h1>
        </div>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-[60] flex items-center justify-center">
          <div className="bg-white rounded-lg p-6 max-w-sm w-full mx-4 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Creating Photo Quest...
            </h3>
            <p className="text-gray-600">
              Please wait while we set up your photo task
            </p>
          </div>
        </div>
      )}

      {/* Error State */}
      {error && !showPaymentModal && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg m-4">
          <div className="flex items-center space-x-2">
            <span className="text-red-600">❌</span>
            <div className="flex-1">
              <p className="text-sm text-red-700">{error}</p>
              <button
                onClick={() => setShowPaymentModal(true)}
                className="text-red-600 underline text-sm mt-1 hover:text-red-800"
              >
                Try Payment Again
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Payment Modal */}
      {showPaymentModal && (
        <PaymentModal
          isOpen={showPaymentModal}
          onClose={() => setShowPaymentModal(false)}
          formData={formData}
          questions={[
            {
              id: crypto.randomUUID(),
              label: photoTask.title,
              requirements: photoTask.requirements,
              location: photoTask.location || undefined,
              type: "photo",
            },
          ]}
          onPaymentSuccess={handlePaymentSuccess}
          formName={formData.name}
        />
      )}

      {/* Content */}
      <div className="px-4 py-6 space-y-6 max-w-2xl mx-auto">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Photo Quest Summary
          </h3>

          <div className="space-y-4">
            <div>
              <span className="text-sm font-medium text-gray-600">
                Quest Name:
              </span>
              <p className="text-gray-900">{formData.name}</p>
            </div>

            <div>
              <span className="text-sm font-medium text-gray-600">
                Photo Task:
              </span>
              <p className="text-gray-900">{photoTask.title}</p>
            </div>

            <div>
              <span className="text-sm font-medium text-gray-600">
                Duration:
              </span>
              <p className="text-gray-900">
                {formData.startDate} to {formData.endDate}
              </p>
            </div>

            <div>
              <span className="text-sm font-medium text-gray-600">
                Eligibility:
              </span>
              <p className="text-gray-900">
                {formData.verificationRequired === "none"
                  ? "All Users"
                  : formData.verificationRequired === "device"
                    ? "Device Verified Only"
                    : "Orb Verified Only"}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-start space-x-2">
            <span className="text-blue-600">ℹ️</span>
            <div>
              <p className="text-sm text-blue-800">
                You&apos;ll pay rewards for each photo submission that you
                approve. Set your reward amount and fund your quest to get
                started.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Survey Payment Step Page Component
function PaymentStepPage({
  questions,
  onBack,
}: {
  questions: Question[];
  onBack: () => void;
}) {
  const [formData, setFormData] = useState<{
    name: string;
    description: string;
    startDate: string;
    endDate: string;
    verificationRequired: "orb" | "device" | "none";
  } | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPaymentModal, setShowPaymentModal] = useState(true);

  const router = useRouter();

  const trpc = useTRPC();
  const createBountyFormMutation = useMutation(
    trpc.questions.create.mutationOptions()
  );

  // Get quest data from localStorage
  React.useEffect(() => {
    const savedFormData = localStorage.getItem("pendingFormData");
    if (savedFormData) {
      setFormData(JSON.parse(savedFormData));
    }
  }, []);

  const handlePaymentSuccess = async (payment: {
    amount: number;
    token: "USDC" | "WLD";
    transactionId: string;
    maxQuestions: number;
    rewardPerQuestion: number;
    bountyData: {
      transactionId: string;
      question: z.infer<typeof questionSchema>;
    };
  }) => {
    setShowPaymentModal(false);
    setIsLoading(true);
    setError(null);

    if (!formData) {
      setError("Quest data is missing. Please go back and try again.");
      return;
    }

    try {
      // Convert questions to the format expected by createBountyForm
      const result = await createBountyFormMutation.mutateAsync(
        payment.bountyData
      );

      // Navigate to success page
      router.push(`/form-success?formId=${result.blobId}&type=survey`);
    } catch (err) {
      console.error("Error creating survey quest:", err);
      setError("Failed to create survey quest. Please try again.");
      setShowPaymentModal(true);
    } finally {
      setIsLoading(false);
    }
  };

  if (!formData) {
    return (
      <div className="fixed inset-0 bg-gray-50 z-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading quest data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-gray-50 z-50 overflow-y-auto">
      {/* Header */}
      <div className="bg-white shadow-sm border-b px-4 py-3 sticky top-0 z-10">
        <div className="flex items-center space-x-3">
          <button
            onClick={onBack}
            className="w-10 h-10 flex items-center justify-center rounded-lg bg-gray-100 hover:bg-gray-200 transition-colors"
          >
            ←
          </button>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">
            Fund Your Survey Quest
          </h1>
        </div>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-[60] flex items-center justify-center">
          <div className="bg-white rounded-lg p-6 max-w-sm w-full mx-4 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Creating Survey Quest...
            </h3>
            <p className="text-gray-600">
              Please wait while we set up your survey
            </p>
          </div>
        </div>
      )}

      {/* Error State */}
      {error && !showPaymentModal && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg m-4">
          <div className="flex items-center space-x-2">
            <span className="text-red-600">❌</span>
            <div className="flex-1">
              <p className="text-sm text-red-700">{error}</p>
              <button
                onClick={() => setShowPaymentModal(true)}
                className="text-red-600 underline text-sm mt-1 hover:text-red-800"
              >
                Try Payment Again
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Payment Modal */}
      {showPaymentModal && (
        <PaymentModal
          isOpen={showPaymentModal}
          onClose={() => setShowPaymentModal(false)}
          onPaymentSuccess={handlePaymentSuccess}
          formName={formData.name}
          formData={formData}
          questions={questions}
        />
      )}

      {/* Content */}
      <div className="px-4 py-6 space-y-6 max-w-2xl mx-auto">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Survey Quest Summary
          </h3>

          <div className="space-y-4">
            <div>
              <span className="text-sm font-medium text-gray-600">
                Quest Name:
              </span>
              <p className="text-gray-900">{formData.name}</p>
            </div>

            <div>
              <span className="text-sm font-medium text-gray-600">
                Questions:
              </span>
              <p className="text-gray-900">{questions.length} questions</p>
            </div>

            <div>
              <span className="text-sm font-medium text-gray-600">
                Duration:
              </span>
              <p className="text-gray-900">
                {formData.startDate} to {formData.endDate}
              </p>
            </div>

            <div>
              <span className="text-sm font-medium text-gray-600">
                Eligibility:
              </span>
              <p className="text-gray-900">
                {formData.verificationRequired === "none"
                  ? "All Users"
                  : formData.verificationRequired === "device"
                    ? "Device Verified Only"
                    : "Orb Verified Only"}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-start space-x-2">
            <span className="text-blue-600">ℹ️</span>
            <div>
              <p className="text-sm text-blue-800">
                You&apos;ll pay rewards for each survey response that you
                approve. Set your reward amount and fund your quest to get
                started.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

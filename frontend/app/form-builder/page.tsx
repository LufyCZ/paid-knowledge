"use client";
import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { createBountyForm, CreateFormData } from "../../lib/forms";
import { useWallet } from "../../hooks/useWallet";
import { PaymentModal } from "../../components/PaymentModal";
import { Button } from "@/components/ui/button";
import Link from "next/link";

const QUESTION_TYPES = [
  { name: "Short Text", icon: "📝", description: "Brief text response" },
  { name: "Long Text", icon: "📄", description: "Detailed text response" },
  { name: "Yes/No", icon: "✅", description: "Simple yes or no answer" },
  { name: "Single Choice", icon: "🔘", description: "Pick one option" },
  { name: "Multiple Choice", icon: "☑️", description: "Pick multiple options" },
  { name: "Dropdown", icon: "⬇️", description: "Select from dropdown" },
  { name: "Checkbox", icon: "✔️", description: "Check boxes" },
  { name: "Picture Choice", icon: "🖼️", description: "Choose from images" },
  { name: "Picture Answer", icon: "📸", description: "Upload an image" },
  { name: "Video Answer", icon: "🎥", description: "Record or upload video" },
];

type Question = {
  id: number;
  title: string;
  description: string;
  type: string;
  options?: string[]; // for choice types
};

type BuilderType = "survey" | "photo" | null;

export default function FormBuilder() {
  const [selectedType, setSelectedType] = useState<BuilderType>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [showTypeMenu, setShowTypeMenu] = useState(false);
  const [insertIndex, setInsertIndex] = useState<number | undefined>(undefined);
  const [showQuestSetup, setShowQuestSetup] = useState(false);
  const [showPaymentStep, setShowPaymentStep] = useState(false);

  const openTypeMenu = (index?: number) => {
    setInsertIndex(index);
    setShowTypeMenu(true);
  };

  const addQuestion = (type: string, index?: number) => {
    const newQuestion: Question = {
      id: Date.now(),
      title: "",
      description: "",
      type: type,
    };
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

  const deleteQuestion = (id: number) => {
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

  const updateQuestion = (id: number, key: keyof Question, value: any) => {
    setQuestions((prev) =>
      prev.map((q) => (q.id === id ? { ...q, [key]: value } : q))
    );
  };

  const updateOptions = (id: number, newOptions: string[]) => {
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
              Choose Builder Type
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

            <div className="bg-white rounded-xl p-6 shadow-sm border opacity-60 cursor-not-allowed">
              <div className="flex items-center space-x-4">
                <div className="text-4xl">📸</div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Photo</h3>
                  <p className="text-gray-600 text-sm">
                    Create photo collection tasks and challenges
                  </p>
                  <span className="inline-block bg-gray-100 text-gray-600 text-xs px-2 py-1 rounded-full mt-2">
                    Coming Soon
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
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
            Create Your Bounty Quest
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
            userEligibility: "Orb" | "Device" | "All";
          }) => {
            // Save quest data to localStorage for the payment step
            localStorage.setItem("pendingFormData", JSON.stringify(formData));
            setShowQuestSetup(false);
            setShowPaymentStep(true);
          }}
        />
      )}

      {/* Payment Step */}
      {showPaymentStep && (
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
  updateQuestion: (id: number, key: keyof Question, value: any) => void;
  updateOptions: (id: number, newOptions: string[]) => void;
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
                className={`w-10 h-8 flex items-center justify-center rounded-lg text-sm font-bold ${
                  index === 0
                    ? "text-gray-300 cursor-not-allowed bg-gray-100"
                    : "text-gray-600 hover:bg-gray-200 active:bg-gray-300 bg-gray-50"
                } transition-all duration-150 touch-manipulation`}
              >
                ↑
              </button>
              <button
                onClick={onMoveDown}
                disabled={index === totalQuestions - 1}
                className={`w-10 h-8 flex items-center justify-center rounded-lg text-sm font-bold ${
                  index === totalQuestions - 1
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
            value={question.title}
            onChange={(e) =>
              updateQuestion(question.id, "title", e.target.value)
            }
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Description (optional)
          </label>
          <input
            type="text"
            placeholder="Add helpful context..."
            value={question.description}
            onChange={(e) =>
              updateQuestion(question.id, "description", e.target.value)
            }
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors"
          />
        </div>

        {[
          "Single Choice",
          "Multiple Choice",
          "Dropdown",
          "Checkbox",
          "Picture Choice",
        ].includes(question.type) && (
          <ChoiceOptionEditor
            options={question.options || []}
            onChange={(opts) => updateOptions(question.id, opts)}
          />
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
    userEligibility: "Orb" | "Device" | "All";
  }) => void;
}) {
  const [formName, setFormName] = useState("");
  const [description, setDescription] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [userEligibility, setUserEligibility] = useState<
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
      userEligibility,
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
                {i + 1}. {q.title || "Untitled Question"} ({q.type})
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
              value={userEligibility}
              onChange={(e) =>
                setUserEligibility(e.target.value as "Orb" | "Device" | "All")
              }
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors"
            >
              <option value="All">All users (Device or Orb verified)</option>
              <option value="Device">Device verified only</option>
              <option value="Orb">Orb verified only</option>
            </select>
            <p className="text-xs text-gray-500 mt-1">
              {userEligibility === "All" &&
                "Anyone with World ID (Device or Orb verification) can participate"}
              {userEligibility === "Device" &&
                "Only users with Device-level World ID verification can participate"}
              {userEligibility === "Orb" &&
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
    userEligibility: "Orb" | "Device" | "All";
  } | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPaymentModal, setShowPaymentModal] = useState(true);

  const router = useRouter();
  const { isConnected } = useWallet();

  // Get quest data from localStorage or previous step
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
  }) => {
    setShowPaymentModal(false);
    setIsLoading(true);
    setError(null);

    if (!formData) {
      setError("Quest data is missing. Please go back and try again.");
      return;
    }

    try {
      const createFormData: CreateFormData = {
        name: formData.name,
        description: formData.description,
        startDate: formData.startDate,
        endDate: formData.endDate,
        visibility: "Public", // Always public
        rewardPerQuestion: payment.rewardPerQuestion,
        rewardToken: payment.token,
        userEligibility: formData.userEligibility,
        questions: questions.map((q) => ({
          id: q.id,
          title: q.title,
          description: q.description,
          type: q.type,
          options: q.options,
        })),
        paymentData: {
          amount: payment.amount,
          transactionId: payment.transactionId,
          maxQuestions: payment.maxQuestions,
        },
      };

      const result = await createBountyForm(createFormData);

      if (result.success) {
        console.log("Quest created successfully:", result.form);

        // Clear saved quest data
        localStorage.removeItem("pendingFormData");

        // Redirect directly to success page
        router.push(
          `/form-success?name=${encodeURIComponent(formData.name)}&amount=${
            payment.amount
          }&token=${payment.token}&questions=${payment.maxQuestions}&txId=${
            payment.transactionId
          }`
        );
      } else {
        setError(result.error || "Failed to create quest");
        setShowPaymentModal(true); // Show payment modal again
      }
    } catch (err) {
      console.error("Error creating quest:", err);
      setError("An unexpected error occurred. Please try again.");
      setShowPaymentModal(true); // Show payment modal again
    } finally {
      setIsLoading(false);
    }
  };

  const handlePaymentCancel = () => {
    setShowPaymentModal(false);
    onBack();
  };

  return (
    <div className="fixed inset-0 bg-gray-50 z-50 overflow-y-auto">
      {/* Header */}
      <div className="bg-white shadow-sm border-b px-4 py-3 sticky top-0 z-10">
        <div className="flex items-center space-x-3">
          <button
            onClick={onBack}
            disabled={isLoading}
            className="w-10 h-10 flex items-center justify-center rounded-lg bg-gray-100 hover:bg-gray-200 transition-colors disabled:opacity-50"
          >
            ←
          </button>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">
            Fund Your Quest
          </h1>
        </div>
      </div>

      {/* Main Content */}
      <div className="px-4 py-6 space-y-6 max-w-2xl mx-auto">
        {/* Quest Summary */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Quest Summary
          </h3>

          {formData && (
            <div className="space-y-3">
              <div>
                <span className="text-sm font-medium text-gray-600">
                  Form Name:
                </span>
                <p className="text-gray-900">{formData.name}</p>
              </div>
              {formData.description && (
                <div>
                  <span className="text-sm font-medium text-gray-600">
                    Description:
                  </span>
                  <p className="text-gray-900">{formData.description}</p>
                </div>
              )}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-sm font-medium text-gray-600">
                    Start Date:
                  </span>
                  <p className="text-gray-900">{formData.startDate}</p>
                </div>
                <div>
                  <span className="text-sm font-medium text-gray-600">
                    End Date:
                  </span>
                  <p className="text-gray-900">{formData.endDate}</p>
                </div>
              </div>
              <div>
                <span className="text-sm font-medium text-gray-600">
                  Questions:
                </span>
                <p className="text-gray-900">{questions.length} questions</p>
              </div>
            </div>
          )}
        </div>

        {/* Payment Instructions */}
        <div className="bg-blue-50 rounded-xl border border-blue-200 p-6">
          <div className="flex items-center space-x-3 mb-3">
            <span className="text-2xl">💳</span>
            <h3 className="text-lg font-semibold text-blue-900">
              Payment Required
            </h3>
          </div>
          <p className="text-blue-800 mb-3">
            To activate your form and make it available for participants, you
            need to fund it with rewards.
          </p>
          <ul className="text-sm text-blue-700 space-y-1">
            <li>• Choose how many questions to fund</li>
            <li>• Set reward amount per question</li>
            <li>• Select payment token (USDC or WLD)</li>
            <li>• Complete payment to activate your form</li>
          </ul>
        </div>

        {/* Error Display */}
        {error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center space-x-2">
              <span className="text-red-600">❌</span>
              <p className="text-sm text-red-700">{error}</p>
            </div>
          </div>
        )}

        {/* Loading State */}
        {isLoading && (
          <div className="p-6 bg-white rounded-xl shadow-sm border border-gray-200 text-center">
            <div className="flex items-center justify-center space-x-3">
              <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
              <span className="text-gray-700">Creating your form...</span>
            </div>
          </div>
        )}
      </div>

      {/* Payment Modal */}
      <PaymentModal
        isOpen={showPaymentModal}
        onClose={handlePaymentCancel}
        onPaymentSuccess={handlePaymentSuccess}
        formName={formData?.name || "Your Form"}
      />
    </div>
  );
}

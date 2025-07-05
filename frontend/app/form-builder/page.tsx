"use client";
import React, { useState } from "react";

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

export default function FormBuilder() {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [showTypeMenu, setShowTypeMenu] = useState(false);
  const [insertIndex, setInsertIndex] = useState<number | undefined>(undefined);
  const [showFormSetup, setShowFormSetup] = useState(false);

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

  return (
    <div className="min-h-screen bg-gray-50 relative">
      {/* Header */}
      <div className="bg-white shadow-sm border-b px-4 py-3 sticky top-0 z-10">
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900">
          Create Your Bounty Form
        </h1>
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
              Start building your form by adding your first question
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
              onClick={() => setShowFormSetup(true)}
              className="w-full bg-green-600 hover:bg-green-700 active:bg-green-800 text-white px-6 py-4 rounded-lg font-medium text-lg shadow-lg transition-all duration-150 touch-manipulation"
            >
              💾 Save Form ({questions.length} question
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

      {/* Form Setup Modal */}
      {showFormSetup && (
        <FormSetupPage
          questions={questions}
          onBack={() => setShowFormSetup(false)}
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

function FormSetupPage({
  questions,
  onBack,
}: {
  questions: Question[];
  onBack: () => void;
}) {
  const [formName, setFormName] = useState("");
  const [description, setDescription] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [visibility, setVisibility] = useState<"Public" | "Private">("Public");
  const [rewardPerQuestion, setRewardPerQuestion] = useState("");
  const [rewardToken, setRewardToken] = useState<"USDC" | "WLD">("USDC");

  const handleSave = () => {
    const formData = {
      name: formName,
      description,
      startDate,
      endDate,
      visibility,
      rewardPerQuestion: parseFloat(rewardPerQuestion),
      rewardToken,
      questions,
    };

    console.log("Saving complete form:", formData);
    // TODO: Save to backend/blockchain
    // TODO: Redirect to success page or form list
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
            Form Setup
          </h1>
        </div>
      </div>

      {/* Main Content */}
      <div className="px-4 py-6 space-y-6 max-w-2xl mx-auto pb-24">
        {/* Form Preview */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
          <h3 className="font-semibold text-gray-900 mb-2">Form Preview</h3>
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

        {/* Form Details */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-6">
          <h3 className="text-lg font-semibold text-gray-900">Form Details</h3>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Form Name *
            </label>
            <input
              type="text"
              placeholder="Enter form name..."
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
              placeholder="Describe your bounty form..."
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

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Visibility
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => setVisibility("Public")}
                className={`p-4 rounded-lg border-2 transition-all ${
                  visibility === "Public"
                    ? "border-blue-500 bg-blue-50 text-blue-700"
                    : "border-gray-200 hover:border-gray-300"
                }`}
              >
                <div className="text-center">
                  <div className="text-2xl mb-2">🌍</div>
                  <div className="font-medium">Public</div>
                  <div className="text-xs text-gray-500 mt-1">
                    Anyone can participate
                  </div>
                </div>
              </button>

              <button
                onClick={() => setVisibility("Private")}
                className={`p-4 rounded-lg border-2 transition-all ${
                  visibility === "Private"
                    ? "border-blue-500 bg-blue-50 text-blue-700"
                    : "border-gray-200 hover:border-gray-300"
                }`}
              >
                <div className="text-center">
                  <div className="text-2xl mb-2">🔒</div>
                  <div className="font-medium">Private</div>
                  <div className="text-xs text-gray-500 mt-1">Invite only</div>
                </div>
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Reward per Question
            </label>
            <div className="space-y-3">
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

              <input
                type="number"
                placeholder="0.00"
                value={rewardPerQuestion}
                onChange={(e) => setRewardPerQuestion(e.target.value)}
                step="0.01"
                min="0"
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Fixed Save Button */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4 z-20">
        <div className="max-w-2xl mx-auto">
          <button
            onClick={handleSave}
            disabled={!formName || !startDate || !endDate || !rewardPerQuestion}
            className="w-full bg-green-600 hover:bg-green-700 active:bg-green-800 disabled:bg-gray-400 disabled:cursor-not-allowed text-white px-6 py-4 rounded-lg font-medium text-lg shadow-lg transition-all duration-150 touch-manipulation"
          >
            🚀 Create Bounty Form
          </button>
        </div>
      </div>
    </div>
  );
}

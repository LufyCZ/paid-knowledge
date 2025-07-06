"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useState, Suspense } from "react";
import Link from "next/link";

export default function FormSuccessPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-gray-50 flex items-center justify-center"><div className="text-center"><div className="text-2xl">⏳</div><p className="text-gray-600 mt-2">Loading...</p></div></div>}>
      <FormSuccessContent />
    </Suspense>
  );
}

function FormSuccessContent() {
  const searchParams = useSearchParams();
  const [formData, setFormData] = useState<{
    name: string;
    amount: string;
    token: string;
    questions: string;
    txId: string;
  } | null>(null);

  useEffect(() => {
    const name = searchParams.get("name");
    const amount = searchParams.get("amount");
    const token = searchParams.get("token");
    const questions = searchParams.get("questions");
    const txId = searchParams.get("txId");

    if (name && amount && token && questions && txId) {
      setFormData({ name, amount, token, questions, txId });
    }
  }, [searchParams]);

  if (!formData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-2xl">⏳</div>
          <p className="text-gray-600 mt-2">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
        {/* Success Icon */}
        <div className="text-6xl mb-6">🎉</div>

        {/* Title */}
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          Form Created Successfully!
        </h1>

        <p className="text-gray-600 mb-8">
          Your bounty form is now live and ready for participants
        </p>

        {/* Form Details */}
        <div className="bg-green-50 rounded-xl p-6 mb-8 text-left">
          <h3 className="font-semibold text-green-900 mb-4">Form Details</h3>

          <div className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-green-700">Form Name:</span>
              <span className="font-medium text-green-900 max-w-[60%] text-right break-words">
                {formData.name}
              </span>
            </div>

            <div className="flex justify-between">
              <span className="text-green-700">Funding Amount:</span>
              <span className="font-medium text-green-900">
                {parseFloat(formData.amount).toFixed(2)} {formData.token}
              </span>
            </div>

            <div className="flex justify-between">
              <span className="text-green-700">Questions Funded:</span>
              <span className="font-medium text-green-900">
                {formData.questions} responses
              </span>
            </div>

            <div className="border-t border-green-200 pt-3">
              <div className="flex justify-between">
                <span className="text-green-700">Transaction ID:</span>
                <span className="font-mono text-xs text-green-900 max-w-[60%] text-right break-all">
                  {formData.txId.slice(0, 8)}...{formData.txId.slice(-8)}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Status */}
        <div className="bg-blue-50 rounded-xl p-4 mb-8">
          <div className="flex items-center justify-center space-x-2">
            <span className="text-blue-600">✅</span>
            <div className="text-center">
              <p className="text-sm font-medium text-blue-800">
                Status: Active & Public
              </p>
              <p className="text-xs text-blue-600 mt-1">
                Participants can now discover and complete your form to earn
                rewards
              </p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="space-y-3">
          <Link
            href="/forms"
            className="w-full bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors inline-block"
          >
            🔍 View All Forms
          </Link>

          <Link
            href="/form-builder"
            className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 px-6 py-3 rounded-lg font-medium transition-colors inline-block"
          >
            ➕ Create Another Form
          </Link>

          <Link
            href="/"
            className="w-full text-gray-500 hover:text-gray-700 px-6 py-2 transition-colors inline-block"
          >
            🏠 Back to Home
          </Link>
        </div>

        {/* Additional Info */}
        <div className="mt-8 p-4 bg-gray-50 rounded-lg">
          <p className="text-xs text-gray-600">
            💡 <strong>What happens next?</strong>
          </p>
          <p className="text-xs text-gray-500 mt-1">
            Your form is now discoverable in the public forms list. When
            participants complete it, they'll automatically receive their
            rewards from your funded amount.
          </p>
        </div>
      </div>
    </div>
  );
}

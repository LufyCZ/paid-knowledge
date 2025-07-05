"use client";

import { useState } from "react";
import { useWorldPay } from "@/hooks/useWorldPay";

export function PaymentExample() {
  const {
    isLoading,
    error,
    lastTransaction,
    isReady,
    payUSDC,
    payWLD,
    clearError,
    clearLastTransaction,
  } = useWorldPay();

  const [recipient, setRecipient] = useState(
    "0xF0C7Db5AceA62029058b0E4E0B79F2Bac18686C4"
  );
  const [amount, setAmount] = useState("1");
  const [description, setDescription] = useState("Test payment to Bounty App");

  const handlePayUSDC = async () => {
    try {
      const result = await payUSDC(recipient, amount, description);
      console.log("Payment result:", result);
    } catch (error) {
      console.error("Payment failed:", error);
    }
  };

  const handlePayWLD = async () => {
    try {
      const result = await payWLD(recipient, amount, description);
      console.log("Payment result:", result);
    } catch (error) {
      console.error("Payment failed:", error);
    }
  };

  if (!isReady) {
    return (
      <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
        <p className="text-yellow-800">
          MiniKit is not installed or not ready. Please install World App to use
          payments.
        </p>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-md mx-auto bg-white rounded-xl shadow-lg space-y-4">
      <h2 className="text-xl font-bold text-gray-900">World ID Payment Test</h2>

      <div className="space-y-3">
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Recipient Address
          </label>
          <input
            type="text"
            value={recipient}
            onChange={(e) => setRecipient(e.target.value)}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
            placeholder="0x..."
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">
            Amount
          </label>
          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
            placeholder="1.0"
            step="0.1"
            min="0.1"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">
            Description
          </label>
          <input
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
            placeholder="Payment description"
          />
        </div>
      </div>

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-md">
          <p className="text-red-800 text-sm">{error}</p>
          <button
            onClick={clearError}
            className="mt-1 text-red-600 text-xs underline"
          >
            Clear Error
          </button>
        </div>
      )}

      {lastTransaction && (
        <div
          className={`p-3 border rounded-md ${
            lastTransaction.status === "success"
              ? "bg-green-50 border-green-200"
              : "bg-red-50 border-red-200"
          }`}
        >
          <p
            className={`text-sm font-medium ${
              lastTransaction.status === "success"
                ? "text-green-800"
                : "text-red-800"
            }`}
          >
            Payment {lastTransaction.status}
          </p>
          {lastTransaction.transactionId && (
            <p className="text-xs text-gray-600 mt-1">
              Transaction ID: {lastTransaction.transactionId}
            </p>
          )}
          {lastTransaction.errorMessage && (
            <p className="text-xs text-red-600 mt-1">
              {lastTransaction.errorMessage}
            </p>
          )}
          <button
            onClick={clearLastTransaction}
            className="mt-1 text-xs underline"
          >
            Clear
          </button>
        </div>
      )}

      <div className="space-y-2">
        <button
          onClick={handlePayUSDC}
          disabled={isLoading || !recipient || !amount}
          className="w-full bg-blue-600 text-white py-2 px-4 rounded-md text-sm font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? "Processing..." : "Pay with USDC"}
        </button>

        <button
          onClick={handlePayWLD}
          disabled={isLoading || !recipient || !amount}
          className="w-full bg-green-600 text-white py-2 px-4 rounded-md text-sm font-medium hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? "Processing..." : "Pay with WLD"}
        </button>
      </div>

      <div className="mt-4 p-3 bg-gray-50 rounded-md">
        <p className="text-xs text-gray-600">
          <strong>Note:</strong> This is a test interface. Minimum payment
          amount is $0.1. Make sure the recipient address is whitelisted in the
          Worldcoin Developer Portal.
        </p>
      </div>
    </div>
  );
}

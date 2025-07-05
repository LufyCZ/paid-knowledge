"use client";

import { useWallet } from "../hooks/useWallet";

export default function WalletAuth() {
  const {
    isConnected,
    address,
    worldchainUsername,
    isLoading,
    error,
    isReady,
    connect,
    disconnect,
    reset,
  } = useWallet();

  if (!isReady) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-md">
        <div className="text-center">
          <div className="w-12 h-12 bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center mx-auto mb-4">
            <svg
              className="w-6 h-6 text-gray-400 animate-spin"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              />
            </svg>
          </div>
          <p className="text-gray-600 dark:text-gray-400">Loading wallet...</p>
        </div>
      </div>
    );
  }

  if (isConnected) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-md">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center">
              <svg
                className="w-5 h-5 text-green-600 dark:text-green-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Wallet Connected
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Ready to transact
              </p>
            </div>
          </div>
          <button
            onClick={disconnect}
            className="px-3 py-1 text-sm bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
          >
            Disconnect
          </button>
        </div>

        <div className="space-y-3">
          {worldchainUsername ? (
            <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-3 border border-green-200 dark:border-green-800">
              <div className="flex justify-between items-center">
                <div className="flex items-center space-x-2">
                  <svg
                    className="w-4 h-4 text-green-600 dark:text-green-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  <span className="text-sm font-medium text-green-700 dark:text-green-300">
                    Username:
                  </span>
                </div>
                <span className="text-sm text-green-900 dark:text-green-100 font-semibold">
                  @{worldchainUsername}
                </span>
              </div>
            </div>
          ) : (
            <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-lg p-3 border border-yellow-200 dark:border-yellow-800">
              <div className="text-center">
                <span className="text-sm text-yellow-700 dark:text-yellow-300">
                  No username set in World App
                </span>
              </div>
            </div>
          )}

          <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Address:
              </span>
              <span className="text-sm text-gray-900 dark:text-white font-mono">
                {address}
              </span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-md">
      <div className="text-center">
        <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center mx-auto mb-4">
          <svg
            className="w-6 h-6 text-blue-600 dark:text-blue-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"
            />
          </svg>
        </div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
          Connect Wallet
        </h3>
        <p className="text-gray-600 dark:text-gray-400 mb-4 text-sm">
          Connect your wallet to access platform features and make transactions.
        </p>

        <button
          onClick={connect}
          disabled={isLoading}
          className="w-full px-4 py-2 bg-blue-500 text-white rounded-lg disabled:bg-gray-300 hover:bg-blue-600 transition-colors font-medium"
        >
          {isLoading ? "Connecting..." : "Connect Wallet"}
        </button>

        {error && (
          <div className="mt-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded-lg text-sm">
            Error: {error}
            <button
              onClick={reset}
              className="ml-2 px-2 py-1 bg-red-500 text-white text-xs rounded hover:bg-red-600"
            >
              Retry
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

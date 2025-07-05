"use client";

import dynamic from "next/dynamic";

const WalletAuthComponent = dynamic(() => import("./WalletAuth"), {
  ssr: false,
  loading: () => (
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
  ),
});

export default WalletAuthComponent;

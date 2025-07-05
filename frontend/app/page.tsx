import VerifyWrapper from "../components/VerifyWrapper";
import WalletWrapper from "../components/WalletWrapper";
import Camera from "../components/Camera";
import Location from "../components/Location";
import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-2xl mx-auto text-center">
          {/* Header */}
          <div className="mb-12">
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-6">
              Paid Knowledge Platform
            </h1>
          </div>

          {/* Menu */}
          <div className="mb-8 flex flex-wrap justify-center items-center gap-4">
            <Link
              href="/forms"
              className="inline-block bg-purple-600 hover:bg-purple-700 active:bg-purple-800 text-white px-6 py-4 rounded-lg font-medium text-lg shadow-lg transition-all duration-150 touch-manipulation"
            >
              📝 Browse Forms
            </Link>

            <Link
              href="/form-builder"
              className="inline-block bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white px-6 py-4 rounded-lg font-medium text-lg shadow-lg transition-all duration-150 touch-manipulation"
            >
              ➕ Create New Form
            </Link>

            <Link
              href="/payment-test"
              className="inline-block bg-green-600 hover:bg-green-700 active:bg-green-800 text-white px-6 py-4 rounded-lg font-medium text-lg shadow-lg transition-all duration-150 touch-manipulation"
            >
              🛠️ Payment Test
            </Link>
          </div>

          {/* Authentication Section */}
          <div className="grid md:grid-cols-2 gap-6 mb-8">
            {/* Wallet Connection */}
            <WalletWrapper />

            {/* World ID Verification */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6">
              <div className="mb-4">
                <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center mx-auto mb-3">
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
                      d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2 text-center">
                  World ID Verification
                </h3>
                <p className="text-gray-600 dark:text-gray-400 text-center text-sm">
                  Prove you're a unique human with World ID.
                </p>
              </div>
              <VerifyWrapper />
            </div>
          </div>

          {/* Location Info */}
          <Location />

          {/* Camera Feed */}
          <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-md">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3 text-center">
              Camera Feed
            </h3>
            <Camera />
          </div>
        </div>
      </div>
    </div>
  );
}

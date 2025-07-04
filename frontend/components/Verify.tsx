"use client";

import { VerificationLevel } from "@worldcoin/minikit-js";
import { useWorldId } from "../hooks/useWorldId";

export default function Verify() {
  const { verify, isLoading, isSuccess, error, isReady, reset } = useWorldId({
    action: "test", // Created in dashboard
    signal: "0x12312", // Our custom signal
    verification_level: VerificationLevel.Device, //  Orb or Devices
  });

  return (
    <div className="space-y-4">
      <button
        onClick={verify}
        disabled={!isReady || isLoading}
        className="px-4 py-2 bg-blue-500 text-white rounded disabled:bg-gray-300 hover:bg-blue-600 transition-colors"
      >
        {isLoading
          ? "Verifying..."
          : !isReady
          ? "MiniKit Loading..."
          : "Verify with World ID"}
      </button>

      {error && (
        <div className="p-3 bg-red-100 border border-red-400 text-red-700 rounded">
          Error: {error}
          <button
            onClick={reset}
            className="ml-2 px-2 py-1 bg-red-500 text-white text-sm rounded hover:bg-red-600"
          >
            Retry
          </button>
        </div>
      )}

      {isSuccess && (
        <div className="p-3 bg-green-100 border border-green-400 text-green-700 rounded">
          ✅ Verification successful!
        </div>
      )}
    </div>
  );
}

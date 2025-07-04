"use client";

import dynamic from "next/dynamic";

const VerifyComponent = dynamic(() => import("./Verify"), {
  ssr: false,
  loading: () => (
    <div className="space-y-4">
      <button
        disabled
        className="px-4 py-2 bg-gray-300 text-gray-500 rounded cursor-not-allowed"
      >
        Loading World ID...
      </button>
    </div>
  ),
});

export default VerifyComponent;

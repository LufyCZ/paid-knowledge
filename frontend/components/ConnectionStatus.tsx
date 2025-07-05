"use client";

import { useWallet } from "@/hooks/useWallet";
import { useMiniKit } from "../app/providers";

interface ConnectionStatusProps {
  className?: string;
  showDetails?: boolean;
}

export function ConnectionStatus({
  className = "",
  showDetails = false,
}: ConnectionStatusProps) {
  const { isConnected, address, worldchainUsername } = useWallet();
  const { installed } = useMiniKit();

  if (!isConnected) {
    return (
      <div
        className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-red-100 text-red-800 border border-red-200 ${className}`}
      >
        <span className="w-2 h-2 bg-red-500 rounded-full mr-2"></span>
        Not Connected
      </div>
    );
  }

  return (
    <div
      className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800 border border-green-200 ${className}`}
    >
      <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
      Connected
      {showDetails && worldchainUsername && (
        <span className="ml-2 text-green-700">• {worldchainUsername}</span>
      )}
      {showDetails && address && (
        <span className="ml-2 text-green-600 font-mono text-xs">
          {address.slice(0, 6)}...{address.slice(-4)}
        </span>
      )}
    </div>
  );
}

export default ConnectionStatus;

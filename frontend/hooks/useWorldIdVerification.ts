"use client";

import { useState } from "react";
import { useWallet } from "./useWallet";
import { useWorldId } from "./useWorldId";
import { VerificationLevel } from "@worldcoin/minikit-js";

interface UseWorldIdVerificationProps {
  verificationType: "Device" | "Orb";
  onSuccess?: () => void;
  onError?: (error: string) => void;
}

interface VerificationState {
  isLoading: boolean;
  isSuccess: boolean;
  error: string | null;
}

export const useWorldIdVerification = ({
  verificationType,
  onSuccess,
  onError,
}: UseWorldIdVerificationProps) => {
  const { address } = useWallet();
  const [state, setState] = useState<VerificationState>({
    isLoading: false,
    isSuccess: false,
    error: null,
  });

  const worldId = useWorldId({
    action: verificationType === "Device" ? "verify-device" : "verify-orb",
    verification_level:
      verificationType === "Device"
        ? VerificationLevel.Device
        : VerificationLevel.Orb,
  });

  const verify = async () => {
    if (!address) {
      const error = "Wallet not connected";
      setState({ isLoading: false, isSuccess: false, error });
      onError?.(error);
      return;
    }

    setState({ isLoading: true, isSuccess: false, error: null });

    try {
      // Step 1: Perform World ID verification
      await worldId.verify();

      // Wait for World ID verification to complete
      if (worldId.error) {
        throw new Error(worldId.error);
      }

      if (!worldId.isSuccess) {
        throw new Error("World ID verification failed");
      }

      // Step 2: Submit to backend API
      const response = await fetch("/api/verify-worldid", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          walletAddress: address,
          verificationType,
          worldIdPayload: {
            // In a real implementation, this would contain the actual World ID payload
            // For now, we're using a placeholder since the verification was successful
            verified: true,
            timestamp: new Date().toISOString(),
          },
          actionId:
            verificationType === "Device" ? "verify-device" : "verify-orb",
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Backend verification failed");
      }

      const result = await response.json();
      setState({ isLoading: false, isSuccess: true, error: null });
      onSuccess?.();
      return result;
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Verification failed";
      setState({ isLoading: false, isSuccess: false, error: errorMessage });
      onError?.(errorMessage);
    }
  };

  const reset = () => {
    setState({ isLoading: false, isSuccess: false, error: null });
    worldId.reset();
  };

  return {
    verify,
    reset,
    isLoading: state.isLoading || worldId.isLoading,
    isSuccess: state.isSuccess,
    error: state.error || worldId.error,
    isReady: worldId.isReady,
  };
};

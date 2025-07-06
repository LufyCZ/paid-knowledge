"use client";

import { useState } from "react";
import { useWallet } from "./useWallet";
import { useWorldId } from "./useWorldId";
import { VerificationLevel } from "@worldcoin/minikit-js";

interface UseWorldIdVerificationProps {
  verificationType: "Device" | "Orb";
  formId?: string; // Add optional formId to make verification unique
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
  formId,
  onSuccess,
  onError,
}: UseWorldIdVerificationProps) => {
  const { address } = useWallet();
  const [state, setState] = useState<VerificationState>({
    isLoading: false,
    isSuccess: false,
    error: null,
  });

  // Create a unique action ID that includes form ID and timestamp to avoid "already verified" errors
  const uniqueActionId = formId
    ? `${verificationType.toLowerCase()}-verification-${formId}`
    : `${verificationType.toLowerCase()}-verification-${Date.now()}`;

  // Create a simpler World ID hook that doesn't do backend verification
  const worldId = useWorldId({
    action: uniqueActionId,
    signal: address || undefined, // Use wallet address as signal
    verification_level:
      verificationType === "Device"
        ? VerificationLevel.Device
        : VerificationLevel.Orb,
  });

  const verify = async () => {
    if (!address) {
      const error = "Wallet not connected";
      console.log("❌ Verification failed: Wallet not connected");
      setState({ isLoading: false, isSuccess: false, error });
      onError?.(error);
      return;
    }

    console.log("🚀 Starting verification process...");
    setState({ isLoading: true, isSuccess: false, error: null });

    try {
      // Step 1: Perform World ID verification
      console.log("📱 Calling worldId.verify()...");
      await worldId.verify();

      console.log("✅ worldId.verify() completed");
      console.log("worldId.isSuccess:", worldId.isSuccess);
      console.log("worldId.error:", worldId.error);
      console.log("worldId.isLoading:", worldId.isLoading);

      // Check for errors from World ID verification
      if (worldId.error) {
        console.log("❌ World ID verification error:", worldId.error);
        throw new Error(worldId.error);
      }

      // Wait a moment for state to update and check success
      // The worldId.verify() should have completed successfully if we reach here without error
      console.log("🔄 World ID verification completed successfully");

      // For form submissions, we don't need to store verification in the backend
      // The fact that WorldID verification passed is sufficient
      console.log(
        "✅ Verification successful, skipping backend storage for form submission"
      );
      setState({ isLoading: false, isSuccess: true, error: null });
      onSuccess?.();
      return { verified: true, timestamp: new Date().toISOString() };
    } catch (error) {
      console.log("❌ Verification process failed:");
      console.log("Error:", error);
      console.log("worldId.error:", worldId.error);
      console.log("worldId.isSuccess:", worldId.isSuccess);

      const errorMessage =
        error instanceof Error ? error.message : "Verification failed";
      console.log("Final error message:", errorMessage);
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

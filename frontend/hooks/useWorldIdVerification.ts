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

  // Use fixed action ID: either "device-verification" or "orb-verification"
  const actionId =
    verificationType === "Device" ? "device-verification" : "orb-verification";

  const worldId = useWorldId({
    action: actionId,
    signal: address || undefined,
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
      const worldIdResult = await worldId.verify();

      console.log("✅ worldId.verify() completed");
      console.log("worldId result:", worldIdResult);

      // Check for errors from World ID verification
      if (!worldIdResult.success) {
        console.log("❌ World ID verification error:", worldIdResult.error);
        throw new Error(worldIdResult.error || "World ID verification failed");
      }

      // Step 2: Call backend API to store verification
      console.log("💾 Storing verification in backend...");
      const backendResponse = await fetch("/api/verify-worldid", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          walletAddress: address,
          verificationType,
          worldIdPayload: worldIdResult.payload,
          actionId: actionId,
          signal: address,
        }),
      });

      if (!backendResponse.ok) {
        const errorData = await backendResponse.json();
        console.log("❌ Backend verification error:", errorData);
        throw new Error(errorData.error || "Failed to store verification");
      }

      const backendResult = await backendResponse.json();
      console.log("✅ Backend verification successful:", backendResult);

      setState({ isLoading: false, isSuccess: true, error: null });
      onSuccess?.();
      return {
        verified: true,
        timestamp: new Date().toISOString(),
        profile: backendResult.profile,
      };
    } catch (error) {
      console.log("❌ Verification process failed:");
      console.log("Error:", error);

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

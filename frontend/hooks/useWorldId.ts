"use client";

import { useState } from "react";
import {
  MiniKit,
  VerifyCommandInput,
  VerificationLevel,
  ISuccessResult,
} from "@worldcoin/minikit-js";
import { useMiniKit } from "../app/providers";

interface UseWorldIdOptions {
  action: string;
  signal?: string;
  verification_level?: VerificationLevel;
}

interface VerificationState {
  isLoading: boolean;
  isSuccess: boolean;
  error: string | null;
}

export const useWorldId = (options: UseWorldIdOptions) => {
  const { installed } = useMiniKit();
  const [state, setState] = useState<VerificationState>({
    isLoading: false,
    isSuccess: false,
    error: null,
  });

  const verify = async () => {
    if (!installed || !MiniKit.isInstalled()) {
      console.log("❌ MiniKit not installed or ready");
      setState((prev) => ({
        ...prev,
        error: "MiniKit is not installed or not ready",
      }));
      return;
    }

    console.log("🔄 Starting World ID verification...");
    setState({ isLoading: true, isSuccess: false, error: null });

    try {
      const verifyPayload: VerifyCommandInput = {
        action: options.action,
        signal: options.signal,
        verification_level: options.verification_level ?? VerificationLevel.Orb,
      };

      console.log(
        "📱 Calling MiniKit.commandsAsync.verify with payload:",
        verifyPayload
      );

      // World App will open a drawer prompting the user to confirm the operation
      const { finalPayload } = await MiniKit.commandsAsync.verify(
        verifyPayload
      );

      console.log(
        "📱 MiniKit verification completed with finalPayload:",
        finalPayload
      );

      if (finalPayload.status === "error") {
        console.log("❌ MiniKit verification failed with error status");
        setState({
          isLoading: false,
          isSuccess: false,
          error: "Verification failed in World App",
        });
        return;
      }

      console.log("🔄 Sending proof to backend for verification...");
      // Verify the proof in the backend
      const verifyResponse = await fetch("/api/worldchain/verify", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          payload: finalPayload as ISuccessResult,
          action: options.action,
          signal: options.signal,
        }),
      });

      const verifyResponseJson = await verifyResponse.json();
      console.log("📡 Backend verification response:", verifyResponseJson);

      if (verifyResponseJson.status === 200) {
        console.log("✅ World ID verification fully completed successfully");
        setState({ isLoading: false, isSuccess: true, error: null });
      } else {
        console.log("❌ Backend verification failed:", verifyResponseJson);
        setState({
          isLoading: false,
          isSuccess: false,
          error: "Backend verification failed",
        });
      }
    } catch (error) {
      console.log("❌ World ID verification error:", error);
      setState({
        isLoading: false,
        isSuccess: false,
        error: error instanceof Error ? error.message : "Verification failed",
      });
    }
  };

  const reset = () => {
    setState({ isLoading: false, isSuccess: false, error: null });
  };

  return {
    verify,
    reset,
    isLoading: state.isLoading,
    isSuccess: state.isSuccess,
    error: state.error,
    isReady: installed,
  };
};

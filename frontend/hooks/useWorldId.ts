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
      setState((prev) => ({
        ...prev,
        error: "MiniKit is not installed or not ready",
      }));
      return;
    }

    setState({ isLoading: true, isSuccess: false, error: null });

    try {
      const verifyPayload: VerifyCommandInput = {
        action: options.action,
        signal: options.signal,
        verification_level: options.verification_level ?? VerificationLevel.Orb,
      };

      // World App will open a drawer prompting the user to confirm the operation
      const { finalPayload } = await MiniKit.commandsAsync.verify(
        verifyPayload
      );

      if (finalPayload.status === "error") {
        setState({
          isLoading: false,
          isSuccess: false,
          error: "Verification failed in World App",
        });
        return;
      }

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

      if (verifyResponseJson.status === 200) {
        setState({ isLoading: false, isSuccess: true, error: null });
      } else {
        setState({
          isLoading: false,
          isSuccess: false,
          error: "Backend verification failed",
        });
      }
    } catch (error) {
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

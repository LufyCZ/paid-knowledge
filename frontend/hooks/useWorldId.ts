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

  const verify = async (): Promise<
    | { success: true; payload: ISuccessResult }
    | { success: false; error: string }
  > => {
    if (!installed || !MiniKit.isInstalled()) {
      const error = "MiniKit is not installed or not ready";
      console.log("❌", error);
      return { success: false, error };
    }

    setState({ isLoading: true, isSuccess: false, error: null });

    try {
      const verifyPayload: VerifyCommandInput = {
        action: options.action,
        signal: options.signal,
        verification_level: options.verification_level ?? VerificationLevel.Orb,
      };

      const { finalPayload } = await MiniKit.commandsAsync.verify(
        verifyPayload
      );

      if (finalPayload.status === "error") {
        const error = "Verification failed in World App";
        console.log("❌", error);
        setState({ isLoading: false, isSuccess: false, error });
        return { success: false, error };
      }

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

      if (verifyResponse.ok && verifyResponseJson.status === 200) {
        setState({ isLoading: false, isSuccess: true, error: null });
        return { success: true, payload: finalPayload as ISuccessResult };
      } else {
        const error = "Backend verification failed";
        console.log("❌", error, verifyResponseJson);
        setState({ isLoading: false, isSuccess: false, error });
        return { success: false, error };
      }
    } catch (err) {
      const error =
        err instanceof Error ? err.message : "Unknown verification error";
      console.log("❌", error);
      setState({ isLoading: false, isSuccess: false, error });
      return { success: false, error };
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

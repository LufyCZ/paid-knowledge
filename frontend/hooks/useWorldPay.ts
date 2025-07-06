"use client";

import { useState } from "react";
import {
  MiniKit,
  PayCommandInput,
  Tokens,
  tokenToDecimals,
  MiniAppPaymentSuccessPayload,
} from "@worldcoin/minikit-js";
import { useMiniKit } from "../app/providers";

export interface PaymentRequest {
  to: string; // Recipient address
  amount: string; // Amount in human-readable units (e.g., "1.5" for 1.5 tokens)
  token: Tokens; // Token type (WLD, USDC, etc.)
  description: string; // Payment description
  reference?: string; // Optional reference ID
}

export interface PaymentResult {
  transactionHash?: string;
  transactionId?: string;
  reference?: string;
  status: "success" | "failed" | "cancelled";
  errorMessage?: string;
  payload?: MiniAppPaymentSuccessPayload;
}

interface PaymentState {
  isLoading: boolean;
  error: string | null;
  lastTransaction: PaymentResult | null;
}

export const useWorldPay = () => {
  const { installed } = useMiniKit();

  const [state, setState] = useState<PaymentState>({
    isLoading: false,
    error: null,
    lastTransaction: null,
  });

  const initiatePayment = async (): Promise<string> => {
    try {
      const response = await fetch("/api/initiate-payment", {
        method: "POST",
      });
      const { id } = await response.json();
      return id;
    } catch (error) {
      console.error("Failed to initiate payment:", error);
      throw new Error("Failed to initiate payment");
    }
  };

  const confirmPayment = async (
    payload: MiniAppPaymentSuccessPayload
  ): Promise<boolean> => {
    try {
      const response = await fetch("/api/confirm-payment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ payload }),
      });
      const { success } = await response.json();
      return success;
    } catch (error) {
      console.error("Failed to confirm payment:", error);
      return false;
    }
  };

  const pay = async (
    paymentRequest: PaymentRequest
  ): Promise<PaymentResult> => {
    if (!installed || !MiniKit.isInstalled()) {
      const error = "MiniKit is not installed or not ready";
      setState((prev) => ({ ...prev, error }));
      return { status: "failed", errorMessage: error };
    }

    setState((prev) => ({ ...prev, isLoading: true, error: null }));

    try {
      console.log("Initiating payment:", paymentRequest);

      // Step 1: Initiate payment and get reference ID
      console.log(paymentRequest.reference)
      const reference = paymentRequest.reference || (await initiatePayment());

      // Step 2: Prepare payment payload
      const payloadInput: PayCommandInput = {
        reference,
        to: paymentRequest.to,
        tokens: [
          {
            symbol: paymentRequest.token,
            token_amount: tokenToDecimals(
              parseFloat(paymentRequest.amount),
              paymentRequest.token
            ).toString(),
          },
        ],
        description: paymentRequest.description,
      };

      console.log("Payment payload:", payloadInput);

      // Step 3: Send payment command
      const paymentResponse = await MiniKit.commandsAsync.pay(payloadInput);

      console.log("Payment Response:", paymentResponse);

      if (paymentResponse.finalPayload?.status === "success") {
        const successPayload =
          paymentResponse.finalPayload as MiniAppPaymentSuccessPayload;

        // Step 4: Confirm payment with backend
        const confirmed = await confirmPayment(successPayload);

        const result: PaymentResult = {
          transactionHash: successPayload.transaction_id,
          transactionId: successPayload.transaction_id,
          reference: successPayload.reference,
          status: confirmed ? "success" : "failed",
          payload: successPayload,
          errorMessage: confirmed ? undefined : "Payment confirmation failed",
        };

        setState((prev) => ({
          ...prev,
          isLoading: false,
          lastTransaction: result,
          error: confirmed ? null : "Payment confirmation failed",
        }));

        return result;
      } else {
        const errorMessage =
          (paymentResponse.finalPayload as any)?.error_message ||
          (paymentResponse.finalPayload as any)?.message ||
          "Payment failed";
        const result: PaymentResult = {
          status: "failed",
          errorMessage,
        };

        setState((prev) => ({
          ...prev,
          isLoading: false,
          lastTransaction: result,
          error: errorMessage,
        }));

        return result;
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Payment failed";
      const result: PaymentResult = {
        status: "failed",
        errorMessage,
      };

      setState((prev) => ({
        ...prev,
        isLoading: false,
        lastTransaction: result,
        error: errorMessage,
      }));

      return result;
    }
  };

  // Helper function to pay in USDC (6 decimals)
  const payUSDC = async (
    to: string,
    amount: string | number,
    description: string,
    reference: string
  ): Promise<PaymentResult> => {
    return pay({
      to,
      amount: typeof amount === "number" ? amount.toString() : amount,
      token: Tokens.USDC,
      description,
      reference,
    });
  };

  // Helper function to pay in WLD (18 decimals)
  const payWLD = async (
    to: string,
    amount: string | number,
    description: string,
    reference: string
  ): Promise<PaymentResult> => {
    return pay({
      to,
      amount: typeof amount === "number" ? amount.toString() : amount,
      token: Tokens.WLD,
      description,
      reference,
    });
  };

  // Helper function to pay in ETH (Note: ETH might not be directly supported, check Worldcoin docs)
  const payETH = async (
    to: string,
    amount: string | number,
    description: string,
    reference?: string
  ): Promise<PaymentResult> => {
    // Note: ETH support may be limited on Worldchain, check documentation
    throw new Error(
      "ETH payments may not be supported on Worldchain. Use WLD or USDC instead."
    );
  };

  const clearError = () => {
    setState((prev) => ({ ...prev, error: null }));
  };

  const clearLastTransaction = () => {
    setState((prev) => ({ ...prev, lastTransaction: null }));
  };

  return {
    // State
    isLoading: state.isLoading,
    error: state.error,
    lastTransaction: state.lastTransaction,
    isReady: installed,

    // Methods
    pay,
    payUSDC,
    payWLD,
    payETH,
    initiatePayment,
    confirmPayment,
    clearError,
    clearLastTransaction,
  };
};

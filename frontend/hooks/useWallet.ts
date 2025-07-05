"use client";

import { useState, useEffect } from "react";
import {
  MiniKit,
  RequestPermissionPayload,
  Permission,
} from "@worldcoin/minikit-js";
import { useMiniKit } from "../app/providers";

interface WalletState {
  isConnected: boolean;
  address: string | null;
  worldchainUsername: string | null;
  isLoading: boolean;
  error: string | null;
}

export const useWallet = () => {
  const { installed } = useMiniKit();
  const [isClient, setIsClient] = useState(false);

  // Load initial state from localStorage
  const loadStoredWalletData = () => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("worldchain-wallet");
      if (stored) {
        try {
          return JSON.parse(stored);
        } catch (error) {
          console.error("Failed to parse stored wallet data:", error);
        }
      }
    }
    return {
      isConnected: false,
      address: null,
      worldchainUsername: null,
      isLoading: false,
      error: null,
    };
  };

  const [state, setState] = useState<WalletState>(() => ({
    isConnected: false,
    address: null,
    worldchainUsername: null,
    isLoading: false,
    error: null,
  }));

  // Initialize client-side state
  useEffect(() => {
    setIsClient(true);
    const storedData = loadStoredWalletData();
    setState(storedData);
  }, []);

  // Save wallet data to localStorage
  const saveWalletData = (walletData: Partial<WalletState>) => {
    if (typeof window !== "undefined") {
      const dataToStore = { ...state, ...walletData };
      localStorage.setItem("worldchain-wallet", JSON.stringify(dataToStore));
    }
  };

  const connect = async () => {
    if (!installed || !MiniKit.isInstalled()) {
      setState((prev) => ({
        ...prev,
        error: "MiniKit is not installed or not ready",
      }));
      return;
    }

    setState((prev) => ({ ...prev, isLoading: true, error: null }));

    try {
      // Get wallet address
      const walletResponse = await MiniKit.commandsAsync.walletAuth({
        nonce: Math.random().toString(36).substring(2, 10), // 8 characters minimum
        expirationTime: new Date(Date.now() + 1000 * 60 * 5), // 5 minutes
        statement: "Connect your wallet to access the platform",
      });

      console.log("Wallet Response:", walletResponse);

      if (walletResponse.finalPayload?.status === "success") {
        const address = walletResponse.finalPayload.address;

        // Get username directly from MiniKit after successful wallet auth
        const username = MiniKit.user?.username || null;

        const walletData = {
          isConnected: true,
          address,
          worldchainUsername: username,
          isLoading: false,
          error: null,
        };

        setState(walletData);
        saveWalletData(walletData);
      } else {
        setState((prev) => ({
          ...prev,
          isLoading: false,
          error: "Wallet connection failed",
        }));
      }
    } catch (error) {
      setState((prev) => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : "Connection failed",
      }));
    }
  };

  const disconnect = () => {
    const disconnectedState = {
      isConnected: false,
      address: null,
      worldchainUsername: null,
      isLoading: false,
      error: null,
    };

    setState(disconnectedState);

    // Clear localStorage
    if (typeof window !== "undefined") {
      localStorage.removeItem("worldchain-wallet");
    }
  };

  const reset = () => {
    setState((prev) => ({ ...prev, error: null }));
  };

  // Auto-check connection status when MiniKit is ready
  useEffect(() => {
    if (installed && MiniKit.isInstalled()) {
      // Check if we have stored wallet data and it's still valid
      const stored = loadStoredWalletData();
      if (stored.isConnected && stored.address) {
        // Update state with stored data if not already connected
        if (!state.isConnected) {
          setState(stored);
        }

        // Check if MiniKit has current user data and update username
        const currentUsername = MiniKit.user?.username || null;

        // Store username separately for easy access
        if (currentUsername) {
          localStorage.setItem("world_username", currentUsername);
        }

        if (currentUsername && currentUsername !== stored.worldchainUsername) {
          const updatedData = {
            ...stored,
            worldchainUsername: currentUsername,
          };
          setState(updatedData);
          saveWalletData(updatedData);
        }
      }
    }
  }, [installed]);

  // Periodic check for username updates
  useEffect(() => {
    if (!installed || !state.isConnected) return;

    const checkUsernameInterval = setInterval(() => {
      const currentUsername = MiniKit.user?.username || null;
      if (currentUsername && currentUsername !== state.worldchainUsername) {
        console.log("Username updated:", currentUsername);
        const updatedData = {
          ...state,
          worldchainUsername: currentUsername,
        };
        setState(updatedData);
        saveWalletData(updatedData);
        localStorage.setItem("world_username", currentUsername);
      }
    }, 5000); // Check every 5 seconds

    return () => clearInterval(checkUsernameInterval);
  }, [installed, state.isConnected, state.worldchainUsername]);

  const requestNotificationPermission = async () => {
    const requestPermissionPayload: RequestPermissionPayload = {
      permission: Permission.Notifications,
    };
    const { finalPayload } = await MiniKit.commandsAsync.requestPermission(
      requestPermissionPayload
    );
    if (finalPayload.status === "success") {
      const response = await fetch("/api/notifications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ address: state.address }),
      });
      if (response.ok) {
        const { success } = await response.json();
        if (success) {
          console.log("Notifications enabled");
        }
      }
    }
  };

  return {
    ...state,
    connect,
    disconnect,
    reset,
    requestNotificationPermission,
    isReady: installed,
  };
};

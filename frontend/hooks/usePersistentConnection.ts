"use client";

import { useEffect } from "react";
import { useWallet } from "./useWallet";
import { useMiniKit } from "../app/providers";

/**
 * Hook to ensure persistent wallet connection throughout the app
 * This hook should be used at the app level to maintain connection state
 */
export const usePersistentConnection = () => {
  const { isConnected, connect, isReady } = useWallet();
  const { installed } = useMiniKit();

  useEffect(() => {
    // Only run on client side
    if (typeof window === "undefined") return;

    const checkAndRestoreConnection = async () => {
      // Check if we have stored wallet data but are not currently connected
      const storedWallet = localStorage.getItem("worldchain-wallet");

      if (storedWallet && !isConnected && installed && isReady) {
        try {
          const walletData = JSON.parse(storedWallet);

          // If we have valid stored connection data, attempt to restore
          if (walletData.isConnected && walletData.address) {
            console.log("Attempting to restore wallet connection...");

            // Wait a bit for MiniKit to be fully ready
            setTimeout(async () => {
              try {
                await connect();
              } catch (error) {
                console.log("Auto-reconnection failed:", error);
                // Clear invalid stored data
                localStorage.removeItem("worldchain-wallet");
              }
            }, 1000);
          }
        } catch (error) {
          console.error("Failed to parse stored wallet data:", error);
          // Clear corrupted data
          localStorage.removeItem("worldchain-wallet");
        }
      }
    };

    // Check connection status when the hook mounts and when dependencies change
    checkAndRestoreConnection();
  }, [isConnected, installed, isReady, connect]);

  // Set up periodic connection check to maintain connection
  useEffect(() => {
    if (!isConnected) return;

    const connectionCheckInterval = setInterval(() => {
      // Verify connection is still valid
      const storedWallet = localStorage.getItem("worldchain-wallet");
      if (!storedWallet) {
        console.log("Connection lost - stored data missing");
        // Connection was lost, but we can't force reconnect here without user action
      }
    }, 30000); // Check every 30 seconds

    return () => clearInterval(connectionCheckInterval);
  }, [isConnected]);

  return {
    isConnected,
    isReady,
    installed,
  };
};

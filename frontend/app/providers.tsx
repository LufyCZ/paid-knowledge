"use client";

import {
  QueryClient,
  QueryClientProvider,
  QueryCache,
  isServer,
} from "@tanstack/react-query";
import { MiniKit } from "@worldcoin/minikit-js";
import { createContext, useContext, useEffect, useState } from "react";

function makeQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        gcTime: 1000 * 60 * 60 * 24,
        staleTime: 1000 * 60 * 5,
      },
    },
    queryCache: new QueryCache(),
  });
}

let clientQueryClientSingleton: QueryClient | undefined = undefined;
const getQueryClient = () => {
  if (isServer) return makeQueryClient();

  if (!clientQueryClientSingleton) {
    clientQueryClientSingleton = makeQueryClient();
  }
  return clientQueryClientSingleton;
};

// ---- MiniKit Context ----
const MiniKitContext = createContext<{ installed: boolean }>({
  installed: false,
});
export const useMiniKit = () => useContext(MiniKitContext);

// Connection Manager Component
function ConnectionManager() {
  const { installed } = useMiniKit();

  useEffect(() => {
    if (!installed) return;

    // Auto-restore connection logic
    const checkStoredConnection = () => {
      if (typeof window === "undefined") return;

      const storedWallet = localStorage.getItem("worldchain-wallet");
      if (storedWallet) {
        try {
          const walletData = JSON.parse(storedWallet);
          if (walletData.isConnected && walletData.address) {
            console.log("Found stored wallet connection");
            // The useWallet hook in components will handle the actual reconnection
          }
        } catch (error) {
          console.error("Failed to parse stored wallet:", error);
        }
      }
    };

    // Check after MiniKit is installed
    const timer = setTimeout(checkStoredConnection, 1000);
    return () => clearTimeout(timer);
  }, [installed]);

  return null;
}

// ---- Provider Wrapper ----
export function Providers({ children }: { children: React.ReactNode }) {
  const queryClient = getQueryClient();
  const [installed, setInstalled] = useState(false);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
    MiniKit.install();
    setInstalled(true);

    import("eruda").then((eruda) => {
      eruda.default.init();
    });
  }, []);

  // Don't render MiniKit-dependent components until client-side
  if (!isClient) {
    return (
      <QueryClientProvider client={queryClient}>
        <MiniKitContext.Provider value={{ installed: false }}>
          {children}
        </MiniKitContext.Provider>
      </QueryClientProvider>
    );
  }

  return (
    <QueryClientProvider client={queryClient}>
      <MiniKitContext.Provider value={{ installed }}>
        <ConnectionManager />
        {children}
      </MiniKitContext.Provider>
    </QueryClientProvider>
  );
}

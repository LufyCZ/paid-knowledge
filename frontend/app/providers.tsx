"use client";

import { MiniKit } from "@worldcoin/minikit-js";
import { createContext, useContext, useEffect, useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createTRPCClient, httpBatchLink } from "@trpc/client";
import type { AppRouter } from "./api";
import { TRPCProvider } from "@/lib/trpc";

function makeQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        // With SSR, we usually want to set some default staleTime
        // above 0 to avoid refetching immediately on the client
        staleTime: 60 * 1000,
      },
    },
  });
}
let browserQueryClient: QueryClient | undefined = undefined;
function getQueryClient() {
  if (typeof window === "undefined") {
    // Server: always make a new query client
    return makeQueryClient();
  } else {
    // Browser: make a new query client if we don't already have one
    // This is very important, so we don't re-make a new client if React
    // suspends during the initial render. This may not be needed if we
    // have a suspense boundary BELOW the creation of the query client
    if (!browserQueryClient) browserQueryClient = makeQueryClient();
    return browserQueryClient;
  }
}

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
function getBaseUrl() {
  if (typeof window !== "undefined") return ""; // ✨ browser → relative path

  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;

  return `http://localhost:${process.env.PORT ?? 3000}`; // dev / other hosts
}

export function Providers({ children }: { children: React.ReactNode }) {
  const queryClient = getQueryClient();
  const [trpcClient] = useState(() =>
    createTRPCClient<AppRouter>({
      links: [
        httpBatchLink({
          url: `${getBaseUrl()}/api/trpc`,
        }),
      ],
    })
  );

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
        <TRPCProvider trpcClient={trpcClient} queryClient={queryClient}>
          <MiniKitContext.Provider value={{ installed: false }}>
            {children}
          </MiniKitContext.Provider>
        </TRPCProvider>
      </QueryClientProvider>
    );
  }

  return (
    <QueryClientProvider client={queryClient}>
      <TRPCProvider trpcClient={trpcClient} queryClient={queryClient}>
        <MiniKitContext.Provider value={{ installed }}>
          <ConnectionManager />
          {children}
        </MiniKitContext.Provider>
      </TRPCProvider>
    </QueryClientProvider>
  );
}

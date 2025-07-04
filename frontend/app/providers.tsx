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

// ---- Provider Wrapper ----
export function Providers({ children }: { children: React.ReactNode }) {
  const queryClient = getQueryClient();
  const [installed, setInstalled] = useState(false);

  useEffect(() => {
    MiniKit.install();
    setInstalled(true);

    import("eruda").then((eruda) => {
      eruda.default.init();
    });
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <MiniKitContext.Provider value={{ installed }}>
        {children}
      </MiniKitContext.Provider>
    </QueryClientProvider>
  );
}

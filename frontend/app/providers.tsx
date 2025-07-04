"use client";

import {
  QueryCache,
  QueryClient,
  QueryClientProvider,
  isServer,
} from "@tanstack/react-query";
import { MiniKit } from "@worldcoin/minikit-js";
import { useEffect } from "react";

// @tanstack/react-query

function makeQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        gcTime: 1000 * 60 * 60 * 24, // 24 hours
        staleTime: 1000 * 60 * 5, // 5 minutes
      },
    },
    queryCache: new QueryCache(),
  });
}

let clientQueryClientSingleton: QueryClient | undefined = undefined;
const getQueryClient = () => {
  if (isServer) {
    return makeQueryClient();
  }

  if (!clientQueryClientSingleton) {
    clientQueryClientSingleton = makeQueryClient();
  }

  return clientQueryClientSingleton;
};

export function Providers({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const client = getQueryClient();

  useEffect(() => {
    MiniKit.install();
  }, []);

  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}

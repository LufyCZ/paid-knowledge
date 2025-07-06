"use client";

import { useState, useCallback, useRef, useEffect } from "react";

interface RetryOptions {
  maxRetries?: number;
  initialDelay?: number;
  maxDelay?: number;
  backoffMultiplier?: number;
  shouldRetry?: (error: any, attempt: number) => boolean;
}

interface UseRetryResult<T> {
  execute: () => Promise<T>;
  isLoading: boolean;
  error: string | null;
  retryCount: number;
  canRetry: boolean;
  retry: () => Promise<T>;
}

/**
 * Custom hook for implementing retry logic with exponential backoff
 */
export function useRetry<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {}
): UseRetryResult<T> {
  const {
    maxRetries = 3,
    initialDelay = 1000,
    maxDelay = 10000,
    backoffMultiplier = 2,
    shouldRetry = (error, attempt) => {
      // Retry on network errors, timeouts, and 5xx server errors
      if (
        error?.code === "NETWORK_ERROR" ||
        error?.code === "TIMEOUT" ||
        error?.status >= 500
      ) {
        return attempt < maxRetries;
      }
      return false;
    },
  } = options;

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);

  // Use ref to store the function to avoid dependency issues
  const fnRef = useRef(fn);

  // Update ref when function changes
  useEffect(() => {
    fnRef.current = fn;
  }, [fn]);

  const sleep = (ms: number) =>
    new Promise((resolve) => setTimeout(resolve, ms));

  // Store options in refs to avoid recreating execute function
  const optionsRef = useRef({
    maxRetries,
    initialDelay,
    maxDelay,
    backoffMultiplier,
    shouldRetry,
  });

  // Update options ref when they change
  useEffect(() => {
    optionsRef.current = {
      maxRetries,
      initialDelay,
      maxDelay,
      backoffMultiplier,
      shouldRetry,
    };
  }, [maxRetries, initialDelay, maxDelay, backoffMultiplier, shouldRetry]);

  const execute = useCallback(async (): Promise<T> => {
    const options = optionsRef.current;
    setIsLoading(true);
    setError(null);
    let lastError: any;

    for (let attempt = 0; attempt <= options.maxRetries; attempt++) {
      try {
        setRetryCount(attempt);
        const result = await fnRef.current();
        setIsLoading(false);
        setRetryCount(0);
        return result;
      } catch (err) {
        lastError = err;
        console.error(`Attempt ${attempt + 1} failed:`, err);

        // If this is the last attempt or we shouldn't retry, throw the error
        if (
          attempt === options.maxRetries ||
          !options.shouldRetry(err, attempt)
        ) {
          break;
        }

        // Calculate delay with exponential backoff
        const delay = Math.min(
          options.initialDelay * Math.pow(options.backoffMultiplier, attempt),
          options.maxDelay
        );

        console.log(
          `Retrying in ${delay}ms... (attempt ${attempt + 2}/${
            options.maxRetries + 1
          })`
        );
        await sleep(delay);
      }
    }

    setIsLoading(false);
    setError(
      lastError instanceof Error ? lastError.message : "An error occurred"
    );
    throw lastError;
  }, []); // No dependencies - use refs for stable function

  const retry = useCallback(async (): Promise<T> => {
    setRetryCount(0);
    return execute();
  }, [execute]);

  const canRetry = !isLoading && error !== null;

  return {
    execute,
    isLoading,
    error,
    retryCount,
    canRetry,
    retry,
  };
}

/**
 * Enhanced data refresh hook with retry mechanism
 */
interface UseDataRefreshWithRetryOptions {
  refreshFn: () => void | Promise<void>;
  dependencies?: any[];
  enableVisibilityRefresh?: boolean;
  enableFocusRefresh?: boolean;
  enablePopstateRefresh?: boolean;
  retryOptions?: RetryOptions;
}

export function useDataRefreshWithRetry({
  refreshFn,
  dependencies = [],
  enableVisibilityRefresh = true,
  enableFocusRefresh = true,
  enablePopstateRefresh = true,
  retryOptions = {},
}: UseDataRefreshWithRetryOptions) {
  const retry = useRetry(
    async () => {
      await refreshFn();
    },
    {
      maxRetries: 3,
      initialDelay: 1000,
      ...retryOptions,
    }
  );

  // Import the original useDataRefresh functionality
  const { useDataRefresh } = require("./useDataRefresh");

  useDataRefresh({
    refreshFn: retry.execute,
    dependencies,
    enableVisibilityRefresh,
    enableFocusRefresh,
    enablePopstateRefresh,
  });

  return retry;
}

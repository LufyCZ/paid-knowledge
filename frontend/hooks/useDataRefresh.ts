"use client";

import { useEffect, useCallback } from "react";

interface UseDataRefreshOptions {
  refreshFn: () => void | Promise<void>;
  dependencies?: any[];
  enableVisibilityRefresh?: boolean;
  enableFocusRefresh?: boolean;
  enablePopstateRefresh?: boolean;
}

/**
 * Custom hook to handle data refresh on various browser events
 * This ensures data stays fresh when users navigate back, switch tabs, etc.
 */
export function useDataRefresh({
  refreshFn,
  dependencies = [],
  enableVisibilityRefresh = true,
  enableFocusRefresh = true,
  enablePopstateRefresh = true,
}: UseDataRefreshOptions) {
  const safeRefresh = useCallback(async () => {
    try {
      await refreshFn();
    } catch (error) {
      console.error("Error refreshing data:", error);
    }
  }, [refreshFn]);

  // Refresh on visibility change (tab switching)
  useEffect(() => {
    if (!enableVisibilityRefresh) return;

    const handleVisibilityChange = () => {
      if (!document.hidden) {
        safeRefresh();
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () =>
      document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, [safeRefresh, enableVisibilityRefresh]);

  // Refresh on window focus
  useEffect(() => {
    if (!enableFocusRefresh) return;

    const handleFocus = () => {
      safeRefresh();
    };

    window.addEventListener("focus", handleFocus);
    return () => window.removeEventListener("focus", handleFocus);
  }, [safeRefresh, enableFocusRefresh]);

  // Refresh on browser back/forward navigation
  useEffect(() => {
    if (!enablePopstateRefresh) return;

    const handlePopState = () => {
      // Small delay to ensure component is mounted
      setTimeout(() => {
        safeRefresh();
      }, 100);
    };

    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, [safeRefresh, enablePopstateRefresh]);

  // Refresh when dependencies change
  useEffect(() => {
    if (dependencies.length > 0) {
      safeRefresh();
    }
  }, dependencies);
}

"use client";

import { useEffect, useRef } from "react";

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
  const isRefreshingRef = useRef(false);

  const safeRefresh = async () => {
    // Prevent concurrent refreshes
    if (isRefreshingRef.current) {
      return;
    }
    
    try {
      isRefreshingRef.current = true;
      await refreshFn();
    } catch (error) {
      console.error("Error refreshing data:", error);
    } finally {
      isRefreshingRef.current = false;
    }
  };

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enableVisibilityRefresh]);

  // Refresh on window focus
  useEffect(() => {
    if (!enableFocusRefresh) return;

    const handleFocus = () => {
      safeRefresh();
    };

    window.addEventListener("focus", handleFocus);
    return () => window.removeEventListener("focus", handleFocus);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enableFocusRefresh]);

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enablePopstateRefresh]);

  // Refresh when dependencies change (only if dependencies are provided)
  useEffect(() => {
    if (dependencies.length > 0) {
      safeRefresh();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, dependencies);
}

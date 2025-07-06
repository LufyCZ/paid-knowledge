"use client";

import { Button } from "@/components/ui/button";

interface RetryButtonProps {
  onRetry: () => void;
  isLoading?: boolean;
  error?: string | null;
  canRetry?: boolean;
  retryCount?: number;
  maxRetries?: number;
  className?: string;
}

export function RetryButton({
  onRetry,
  isLoading = false,
  error = null,
  canRetry = false,
  retryCount = 0,
  maxRetries = 3,
  className = "",
}: RetryButtonProps) {
  if (!error || !canRetry) {
    return null;
  }

  return (
    <div className={`space-y-3 ${className}`}>
      <div className="flex items-center space-x-3">
        <Button
          onClick={onRetry}
          disabled={isLoading}
          variant="outline"
          size="sm"
          className="flex items-center space-x-2"
        >
          {isLoading ? (
            <>
              <div className="w-4 h-4 border-2 border-gray-300 border-t-blue-600 rounded-full animate-spin" />
              <span>Retrying...</span>
            </>
          ) : (
            <>
              <span>🔄</span>
              <span>Retry</span>
            </>
          )}
        </Button>

        {retryCount > 0 && (
          <span className="text-sm text-gray-500">
            Attempt {retryCount + 1}/{maxRetries + 1}
          </span>
        )}
      </div>

      {error && (
        <div className="flex items-start space-x-2 p-3 bg-red-50 border border-red-200 rounded-lg">
          <span className="text-red-600 mt-0.5">⚠️</span>
          <div>
            <p className="text-red-700 text-sm font-medium">
              Error loading data
            </p>
            <p className="text-red-600 text-xs mt-1">{error}</p>
          </div>
        </div>
      )}
    </div>
  );
}

interface ErrorWithRetryProps {
  error: string | null;
  onRetry: () => void;
  isLoading?: boolean;
  canRetry?: boolean;
  retryCount?: number;
  maxRetries?: number;
  title?: string;
  description?: string;
  className?: string;
}

export function ErrorWithRetry({
  error,
  onRetry,
  isLoading = false,
  canRetry = false,
  retryCount = 0,
  maxRetries = 3,
  title = "Failed to load data",
  description,
  className = "",
}: ErrorWithRetryProps) {
  if (!error) {
    return null;
  }

  return (
    <div
      className={`bg-red-50 border border-red-200 rounded-xl p-6 ${className}`}
    >
      <div className="text-center space-y-4">
        <div className="text-4xl">⚠️</div>
        <div>
          <h3 className="text-lg font-semibold text-red-800">{title}</h3>
          {description && (
            <p className="text-red-600 text-sm mt-1">{description}</p>
          )}
          <p className="text-red-600 text-xs mt-2 font-mono bg-red-100 p-2 rounded">
            {error}
          </p>
        </div>

        {canRetry && (
          <div className="space-y-2">
            <Button
              onClick={onRetry}
              disabled={isLoading}
              variant="outline"
              className="border-red-300 text-red-700 hover:bg-red-100"
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-red-300 border-t-red-600 rounded-full animate-spin mr-2" />
                  Retrying...
                </>
              ) : (
                <>
                  <span className="mr-2">🔄</span>
                  Try Again
                </>
              )}
            </Button>

            {retryCount > 0 && (
              <p className="text-red-600 text-xs">
                Attempt {retryCount + 1} of {maxRetries + 1}
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

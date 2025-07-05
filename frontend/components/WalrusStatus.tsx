"use client";

import { useState, useEffect } from "react";
import { WalrusStorage } from "@/lib/walrus-storage";

interface WalrusStats {
  total_records: number;
  records_by_type: Record<string, number>;
  cache_size: number;
  last_updated: string;
}

export function WalrusStatusIndicator() {
  const [stats, setStats] = useState<WalrusStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const walrusStats = await WalrusStorage.getStats();
        setStats(walrusStats);
      } catch (error) {
        console.error("Failed to fetch Walrus stats:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchStats();
    const interval = setInterval(fetchStats, 30000); // Update every 30 seconds
    return () => clearInterval(interval);
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center space-x-2">
        <div className="w-2 h-2 rounded-full bg-gray-400 animate-pulse" />
        <span className="text-sm text-gray-600">Loading...</span>
      </div>
    );
  }

  const healthColor =
    stats?.total_records && stats.total_records > 0 ? "green" : "yellow";

  return (
    <div className="flex items-center space-x-2">
      <div
        className={`w-2 h-2 rounded-full bg-${healthColor}-500`}
        title={`Walrus Storage: ${stats?.total_records || 0} records`}
      />
      <span className="text-sm text-gray-600">
        {stats ? `${stats.total_records} records` : "Unknown"}
      </span>
    </div>
  );
}

export function WalrusDashboard() {
  const [stats, setStats] = useState<WalrusStats | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const walrusStats = await WalrusStorage.getStats();
      setStats(walrusStats);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch stats");
    } finally {
      setIsLoading(false);
    }
  };

  const clearCache = () => {
    WalrusStorage.clearCache();
    setStats((prev) => (prev ? { ...prev, cache_size: 0 } : null));
  };

  useEffect(() => {
    fetchStats();
  }, []);

  if (isLoading && !stats) {
    return <div className="p-4">Loading Walrus storage status...</div>;
  }

  if (error) {
    return <div className="p-4 text-red-600">Error: {error}</div>;
  }

  return (
    <div className="p-6 space-y-6">
      <div className="border-b pb-4">
        <h2 className="text-2xl font-bold">Walrus Storage Dashboard</h2>
        <p className="text-gray-600">Monitor decentralized storage on Walrus</p>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-blue-50 p-4 rounded-lg">
          <div className="text-2xl font-bold text-blue-600">
            {stats?.total_records || 0}
          </div>
          <div className="text-sm text-gray-600">Total Records</div>
        </div>
        <div className="bg-green-50 p-4 rounded-lg">
          <div className="text-2xl font-bold text-green-600">
            {stats?.cache_size || 0}
          </div>
          <div className="text-sm text-gray-600">Cached Records</div>
        </div>
        <div className="bg-purple-50 p-4 rounded-lg">
          <div className="text-2xl font-bold text-purple-600">
            {stats?.records_by_type
              ? Object.keys(stats.records_by_type).length
              : 0}
          </div>
          <div className="text-sm text-gray-600">Record Types</div>
        </div>
        <div className="bg-gray-50 p-4 rounded-lg">
          <div className="text-xs font-bold text-gray-600">
            {stats?.last_updated
              ? new Date(stats.last_updated).toLocaleString()
              : "Never"}
          </div>
          <div className="text-sm text-gray-600">Last Updated</div>
        </div>
      </div>

      {/* Record Types Breakdown */}
      {stats?.records_by_type &&
        Object.keys(stats.records_by_type).length > 0 && (
          <div className="border p-4 rounded-lg">
            <h3 className="text-lg font-semibold mb-4">Records by Type</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {Object.entries(stats.records_by_type).map(([type, count]) => (
                <div key={type} className="bg-gray-50 p-3 rounded">
                  <div className="text-lg font-bold">{count}</div>
                  <div className="text-sm text-gray-600 capitalize">
                    {type.replace("_", " ")}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

      {/* Actions */}
      <div className="flex space-x-4">
        <button
          onClick={fetchStats}
          disabled={isLoading}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
        >
          {isLoading ? "Refreshing..." : "Refresh Stats"}
        </button>
        <button
          onClick={clearCache}
          className="px-4 py-2 bg-orange-600 text-white rounded hover:bg-orange-700"
        >
          Clear Cache
        </button>
      </div>

      {/* Storage Health */}
      <div className="border p-4 rounded-lg">
        <h3 className="text-lg font-semibold mb-2">Storage Health</h3>
        <div className="space-y-2">
          <div className="flex justify-between">
            <span>Total Records:</span>
            <span className="font-medium">{stats?.total_records || 0}</span>
          </div>
          <div className="flex justify-between">
            <span>Cache Hit Rate:</span>
            <span className="font-medium">
              {stats?.total_records && stats?.cache_size
                ? Math.round((stats.cache_size / stats.total_records) * 100)
                : 0}
              %
            </span>
          </div>
          <div className="flex justify-between">
            <span>Storage Status:</span>
            <span
              className={`font-medium ${
                stats?.total_records && stats.total_records > 0
                  ? "text-green-600"
                  : "text-yellow-600"
              }`}
            >
              {stats?.total_records && stats.total_records > 0
                ? "Active"
                : "Empty"}
            </span>
          </div>
        </div>
      </div>

      {/* Storage Info */}
      <div className="border p-4 rounded-lg bg-blue-50">
        <h3 className="text-lg font-semibold mb-2">About Walrus Storage</h3>
        <div className="text-sm text-gray-700 space-y-2">
          <p>
            Walrus is a decentralized storage network that provides high
            availability and redundancy for your data. All records are stored as
            immutable blobs.
          </p>
          <p>
            <strong>Benefits:</strong>
          </p>
          <ul className="list-disc list-inside ml-4 space-y-1">
            <li>Decentralized and censorship-resistant</li>
            <li>High availability and redundancy</li>
            <li>Immutable data storage</li>
            <li>Built-in indexing for fast queries</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

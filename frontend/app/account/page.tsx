"use client";

import { useState, useEffect } from "react";
import { useWallet } from "@/hooks/useWallet";
import {
  useProfile,
  canVerifyAt,
  getVerificationLevel,
} from "@/hooks/useProfile";
import { useWorldIdVerification } from "@/hooks/useWorldIdVerification";
import { useDataRefresh } from "@/hooks/useDataRefresh";
import { ErrorWithRetry } from "@/components/RetryButton";
import { useMiniKit } from "../providers";
import { MiniKit } from "@worldcoin/minikit-js";
import { Button } from "@/components/ui/button";
import { ClientOnly } from "@/components/ClientOnly";
import { QuestManagement } from "@/components/QuestManagementMobile";
import Link from "next/link";

export default function AccountPage() {
  const { isConnected, address, connect, worldchainUsername } = useWallet();
  const { installed } = useMiniKit();
  const {
    profile,
    isLoading,
    error,
    retryCount,
    canRetry,
    refreshProfile,
    retry,
    updateProfile,
  } = useProfile();
  const [isClient, setIsClient] = useState(false);

  // Add data refresh on navigation events
  useDataRefresh({
    refreshFn: refreshProfile,
    dependencies: [], // Remove dependencies to prevent infinite loops
  });

  // Prevent hydration issues
  useEffect(() => {
    setIsClient(true);
  }, []);

  // World ID verification hooks
  const deviceVerification = useWorldIdVerification({
    verificationType: "Device",
    onSuccess: () => {
      refreshProfile();
      setVerificationInProgress(null);
    },
    onError: (error) => {
      console.error("Device verification failed:", error);
      setVerificationInProgress(null);
    },
  });

  const orbVerification = useWorldIdVerification({
    verificationType: "Orb",
    onSuccess: () => {
      refreshProfile();
      setVerificationInProgress(null);
    },
    onError: (error) => {
      console.error("Orb verification failed:", error);
      setVerificationInProgress(null);
    },
  });

  // Form states
  const [verificationInProgress, setVerificationInProgress] = useState<
    "device" | "orb" | null
  >(null);

  // Get username from multiple sources
  const [username, setUsername] = useState<string | null>(null);

  // Update username from various sources
  useEffect(() => {
    if (!isClient) return; // Only run on client-side

    const getUsername = () => {
      // Priority 1: From wallet hook (already has localStorage integration)
      if (worldchainUsername) {
        return worldchainUsername;
      }

      // Priority 2: From MiniKit directly
      if (installed && MiniKit.user?.username) {
        return MiniKit.user.username;
      }

      // Priority 3: From localStorage backup
      if (typeof window !== "undefined") {
        const storedUsername = localStorage.getItem("world_username");
        if (storedUsername) {
          return storedUsername;
        }
      }

      // Priority 4: From profile
      if (profile?.username) {
        return profile.username;
      }

      return null;
    };

    const newUsername = getUsername();
    setUsername(newUsername);

    // Store in localStorage if we got it from MiniKit and it's not already stored
    if (
      typeof window !== "undefined" &&
      installed &&
      MiniKit.user?.username &&
      newUsername !== localStorage.getItem("world_username")
    ) {
      localStorage.setItem("world_username", MiniKit.user.username);
    }
  }, [isClient, installed, worldchainUsername, profile?.username]);

  // Auto-reconnect if we have stored connection data but are not connected
  useEffect(() => {
    if (!isClient || (!isConnected && typeof window !== "undefined")) {
      const storedWallet = localStorage.getItem("worldchain-wallet");
      if (storedWallet) {
        try {
          const walletData = JSON.parse(storedWallet);
          if (walletData.isConnected && walletData.address && installed) {
            // Attempt to restore connection
            console.log("Attempting to restore wallet connection...");
            // The useWallet hook should handle this automatically, but we can trigger it
          }
        } catch (error) {
          console.error("Failed to parse stored wallet data:", error);
        }
      }
    }
  }, [isClient, isConnected, installed]);

  console.log("Debug info:");
  console.log("- Username from state:", username);
  console.log("- worldchainUsername from wallet:", worldchainUsername);
  console.log("- MiniKit installed:", installed);
  console.log("- MiniKit user:", installed ? MiniKit.user : "Not installed");
  console.log("- Is connected:", isConnected);
  console.log("- Address:", address);
  console.log("- Is client:", isClient);

  // Update username in profile if it has changed
  useEffect(() => {
    if (profile && username && profile.username !== username) {
      updateProfile({ username });
    }
  }, [profile, username, updateProfile]);

  const handleDeviceVerify = async () => {
    setVerificationInProgress("device");
    await deviceVerification.verify();
  };

  const handleOrbVerify = async () => {
    setVerificationInProgress("orb");
    await orbVerification.verify();
  };

  const getVerificationBadge = () => {
    const level = getVerificationLevel(profile);
    switch (level) {
      case "orb":
        return (
          <div className="inline-flex items-center px-4 py-2 rounded-full text-sm font-semibold bg-gradient-to-r from-purple-500 to-purple-600 text-white shadow-sm">
            <span className="mr-2">🔮</span>
            Orb Verified
          </div>
        );
      case "device":
        return (
          <div className="inline-flex items-center px-4 py-2 rounded-full text-sm font-semibold bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-sm">
            <span className="mr-2">📱</span>
            Device Verified
          </div>
        );
      default:
        return (
          <div className="inline-flex items-center px-4 py-2 rounded-full text-sm font-medium bg-gray-100 text-gray-600 border">
            <span className="mr-2">🔒</span>
            Unverified
          </div>
        );
    }
  };

  if (!isConnected) {
    return (
      <ClientOnly
        fallback={
          <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
            <div className="text-center p-8 bg-white rounded-xl shadow-lg max-w-md w-full">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-2 text-gray-600">Loading...</p>
            </div>
          </div>
        }
      >
        <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
          <div className="text-center p-8 bg-white rounded-xl shadow-lg max-w-md w-full">
            <div className="text-6xl mb-4">👤</div>
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Account</h1>
            <p className="text-gray-600 mb-6">
              Connect your wallet to view and manage your account
            </p>
            {!installed ? (
              <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                <p className="text-yellow-800 text-sm">
                  Please install World App to continue
                </p>
              </div>
            ) : (
              <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-blue-800 text-sm">
                  World App detected. Click below to connect your wallet.
                </p>
              </div>
            )}
            <Button onClick={connect} className="w-full" disabled={!installed}>
              {!installed ? "Install World App" : "Connect Wallet"}
            </Button>
          </div>
        </div>
      </ClientOnly>
    );
  }

  return (
    <ClientOnly
      fallback={
        <div className="min-h-screen bg-gray-50 py-8 pb-28">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-2 text-gray-600">Loading account...</p>
            </div>
          </div>
        </div>
      }
    >
      <div className="min-h-screen bg-gray-50 py-8 pb-28">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Account</h1>
            <p className="mt-2 text-gray-600">
              Manage your profile and World ID verification
            </p>

            {/* Connection Status */}
            {/* <div className="mt-4">
            <ConnectionStatus
              showDetails={true}
              className="text-base px-4 py-2"
            />
          </div> */}
          </div>

          {/* Loading State */}
          {isLoading && (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-2 text-gray-600">Loading profile...</p>
            </div>
          )}

          {/* Error State */}
          {error && (
            <ErrorWithRetry
              error={error}
              onRetry={retry}
              isLoading={isLoading}
              canRetry={canRetry}
              retryCount={retryCount}
              title="Failed to load profile"
              description="There was an error loading your profile data. Please try again."
              className="mb-6"
            />
          )}

          {/* Profile Content */}
          {profile && (
            <div className="space-y-6">
              {/* Profile Overview Card */}
              <div className="bg-white rounded-xl shadow-sm border p-6">
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between mb-6 gap-4">
                  <div>
                    <h2 className="text-xl font-semibold text-gray-900">
                      Profile Overview
                    </h2>
                    <p className="text-gray-600 mt-1">
                      Your account information and verification status
                    </p>
                  </div>
                  <div className="self-start">{getVerificationBadge()}</div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Basic Info */}
                  <div className="space-y-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-3">
                        Wallet Address
                      </label>
                      <div className="bg-gray-50 p-4 rounded-lg border">
                        <code className="text-sm text-gray-800 break-all font-mono">
                          {address}
                        </code>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-3">
                        Username
                      </label>
                      <div className="bg-gray-50 p-4 rounded-lg border">
                        <span className="text-gray-800 font-medium">
                          {username ||
                            profile?.username ||
                            "Not connected to World App"}
                        </span>
                        {!username && (
                          <p className="text-xs text-gray-500 mt-1">
                            Connect to World App to sync your username
                          </p>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Stats */}
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-3 rounded-lg border border-blue-200">
                        <div className="text-lg font-bold text-blue-700">
                          {profile.forms_created_count}
                        </div>
                        <div className="text-xs text-blue-600 font-medium">
                          Quests Created
                        </div>
                      </div>
                      <div className="bg-gradient-to-br from-green-50 to-green-100 p-3 rounded-lg border border-green-200">
                        <div className="text-lg font-bold text-green-700">
                          {profile.forms_submitted_count}
                        </div>
                        <div className="text-xs text-green-600 font-medium">
                          Quests Submitted
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-3 rounded-lg border border-purple-200">
                        <div className="text-lg font-bold text-purple-700">
                          {profile.forms_accepted_count}
                        </div>
                        <div className="text-xs text-purple-600 font-medium">
                          Quests Accepted
                        </div>
                      </div>
                      <div className="bg-gradient-to-br from-orange-50 to-orange-100 p-3 rounded-lg border border-orange-200">
                        <div className="text-lg font-bold text-orange-700">
                          $ {profile.total_rewards_earned.toFixed(2)}
                        </div>
                        <div className="text-xs text-orange-600 font-medium">
                          Total Rewards
                        </div>
                      </div>
                    </div>

                    {/* Separate USDC and WLD Rewards */}
                    <div className="grid grid-cols-2 gap-3">
                      <div className="bg-gradient-to-br from-blue-50 to-indigo-100 p-3 rounded-lg border border-indigo-200">
                        <div className="text-base font-bold text-indigo-700">
                          {(profile.total_rewards_usdc || 0).toFixed(2)}
                        </div>
                        <div className="text-xs text-indigo-600 font-medium">
                          💵 USDC Earned
                        </div>
                      </div>
                      <div className="bg-gradient-to-br from-violet-50 to-violet-100 p-3 rounded-lg border border-violet-200">
                        <div className="text-base font-bold text-violet-700">
                          {(profile.total_rewards_wld || 0).toFixed(2)}
                        </div>
                        <div className="text-xs text-violet-600 font-medium">
                          🌍 WLD Earned
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* World ID Verification Card */}
              <div className="bg-white rounded-xl shadow-sm border p-6">
                <div className="mb-6">
                  <h2 className="text-xl font-semibold text-gray-900 mb-2">
                    World ID Verification
                  </h2>{" "}
                  <p className="text-gray-600">
                    Verify your identity with World ID to access exclusive
                    quests and features
                  </p>
                </div>

                <div className="space-y-4">
                  {/* Device Verification */}
                  <div className="border border-gray-200 rounded-xl p-5 hover:bg-gray-50 transition-colors">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                      <div className="flex items-center space-x-4">
                        <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                          <span className="text-2xl">📱</span>
                        </div>
                        <div className="flex-1">
                          <h3 className="font-semibold text-gray-900 mb-1">
                            Device Verification
                          </h3>
                          <p className="text-sm text-gray-600">
                            Standard verification using your device
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-3">
                        {canVerifyAt(profile, "Device") ? (
                          <Button
                            onClick={handleDeviceVerify}
                            disabled={
                              deviceVerification.isLoading ||
                              verificationInProgress === "device"
                            }
                            size="sm"
                            className="w-full sm:w-auto"
                          >
                            {verificationInProgress === "device"
                              ? "Verifying..."
                              : "Verify Now"}
                          </Button>
                        ) : (
                          <div className="inline-flex items-center px-3 py-2 rounded-full text-sm font-medium bg-green-100 text-green-800">
                            <span className="mr-1">✅</span>
                            Verified
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Orb Verification */}
                  <div className="border border-gray-200 rounded-xl p-5 hover:bg-gray-50 transition-colors">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                      <div className="flex items-center space-x-4">
                        <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                          <span className="text-2xl">🔮</span>
                        </div>
                        <div className="flex-1">
                          <h3 className="font-semibold text-gray-900 mb-1">
                            Orb Verification
                          </h3>
                          <p className="text-sm text-gray-600">
                            Premium verification using World ID Orb
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-3">
                        {canVerifyAt(profile, "Orb") ? (
                          <Button
                            onClick={handleOrbVerify}
                            disabled={
                              orbVerification.isLoading ||
                              verificationInProgress === "orb"
                            }
                            size="sm"
                            className="w-full sm:w-auto bg-purple-600 hover:bg-purple-700"
                          >
                            {verificationInProgress === "orb"
                              ? "Verifying..."
                              : "Verify Now"}
                          </Button>
                        ) : (
                          <div className="inline-flex items-center px-3 py-2 rounded-full text-sm font-medium bg-purple-100 text-purple-800">
                            <span className="mr-1">✅</span>
                            Verified
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Verification Errors */}
                {(deviceVerification.error || orbVerification.error) && (
                  <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                    <div className="flex items-center">
                      <span className="text-red-600 mr-2">⚠️</span>
                      <p className="text-red-700 text-sm">
                        {deviceVerification.error || orbVerification.error}
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Quick Actions */}
              <div className="bg-white rounded-xl shadow-sm border p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">
                  Quick Actions
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {" "}
                  <Link href="/form-builder" className="block">
                    <Button variant="outline" className="w-full h-12 text-base">
                      <span className="mr-2">➕</span>
                      Create New Quest
                    </Button>
                  </Link>
                  <Link href="/forms" className="block">
                    <Button variant="outline" className="w-full h-12 text-base">
                      <span className="mr-2">📝</span>
                      Browse Quests
                    </Button>
                  </Link>
                </div>
              </div>

              {/* Quest Management Card */}
              <div className="bg-white rounded-xl shadow-sm border p-6">
                <div className="mb-6">
                  <h2 className="text-xl font-semibold text-gray-900 mb-2">
                    My Quests
                  </h2>
                  <p className="text-gray-600">
                    {`Manage the quests you've created and review submissions`}
                  </p>
                </div>

                <QuestManagement walletAddress={address} />
              </div>
            </div>
          )}
        </div>
      </div>
    </ClientOnly>
  );
}

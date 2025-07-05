"use client";

import { useState, useEffect } from "react";
import { UserProfile, VerificationLog } from "@/lib/types";
import { useWallet } from "./useWallet";

interface UseProfileReturn {
  profile: UserProfile | null;
  isLoading: boolean;
  error: string | null;
  refreshProfile: () => Promise<void>;
  updateProfile: (updates: Partial<UserProfile>) => Promise<boolean>;
}

export const useProfile = (): UseProfileReturn => {
  const { address: walletAddress, isConnected } = useWallet();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isClient, setIsClient] = useState(false);

  // Initialize client-side state
  useEffect(() => {
    setIsClient(true);
  }, []);

  // Load profile from localStorage on mount
  useEffect(() => {
    if (!isClient || !walletAddress) return;

    const cachedProfile = localStorage.getItem(
      `profile_${walletAddress.toLowerCase()}`
    );
    if (cachedProfile) {
      try {
        setProfile(JSON.parse(cachedProfile));
      } catch (err) {
        console.error("Error parsing cached profile:", err);
      }
    }
  }, [walletAddress, isClient]);

  const fetchProfile = async () => {
    if (!walletAddress || !isConnected) {
      setProfile(null);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Fetch profile from Walrus API
      const response = await fetch(`/api/profile?wallet=${walletAddress}`);

      if (!response.ok) {
        if (response.status === 404) {
          // Profile doesn't exist yet
          setProfile(null);
          return;
        }
        throw new Error(`Failed to fetch profile: ${response.statusText}`);
      }

      const data = await response.json();
      const fetchedProfile = data.profile;

      setProfile(fetchedProfile);

      // Cache profile in localStorage
      if (fetchedProfile && isClient) {
        localStorage.setItem(
          `profile_${walletAddress.toLowerCase()}`,
          JSON.stringify(fetchedProfile)
        );
      }
    } catch (err) {
      console.error("Error fetching profile:", err);
      setError(err instanceof Error ? err.message : "Failed to fetch profile");
    } finally {
      setIsLoading(false);
    }
  };

  const updateProfile = async (
    updates: Partial<UserProfile>
  ): Promise<boolean> => {
    if (!walletAddress || !isConnected) {
      setError("Wallet not connected");
      return false;
    }

    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch("/api/profile", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          wallet_address: walletAddress,
          ...updates,
        }),
      });

      if (!response.ok) {
        throw new Error(`Failed to update profile: ${response.statusText}`);
      }

      const data = await response.json();
      const updatedProfile = data.profile;

      setProfile(updatedProfile);

      // Update cache
      if (updatedProfile && isClient) {
        localStorage.setItem(
          `profile_${walletAddress.toLowerCase()}`,
          JSON.stringify(updatedProfile)
        );
      }

      return true;
    } catch (err) {
      console.error("Error updating profile:", err);
      setError(err instanceof Error ? err.message : "Failed to update profile");
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const refreshProfile = async () => {
    await fetchProfile();
  };

  // Auto-fetch profile when wallet connects
  useEffect(() => {
    if (isClient && walletAddress && isConnected) {
      fetchProfile();
    }
  }, [walletAddress, isConnected, isClient]);

  return {
    profile,
    isLoading,
    error,
    refreshProfile,
    updateProfile,
  };
};

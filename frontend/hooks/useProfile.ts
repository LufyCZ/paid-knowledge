"use client";

import { useState, useEffect } from "react";
import { UserProfile, VerificationLog } from "@/lib/supabase";
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
      const response = await fetch(
        `/api/profile?wallet_address=${encodeURIComponent(walletAddress)}`
      );

      if (!response.ok) {
        throw new Error("Failed to fetch profile");
      }

      const data = await response.json();
      setProfile(data.profile);

      // Cache profile in localStorage
      localStorage.setItem(
        `profile_${walletAddress.toLowerCase()}`,
        JSON.stringify(data.profile)
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch profile");
      console.error("Error fetching profile:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const updateProfile = async (
    updates: Partial<UserProfile>
  ): Promise<boolean> => {
    if (!walletAddress || !isConnected) {
      return false;
    }

    try {
      const response = await fetch("/api/profile", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          walletAddress,
          updates,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to update profile");
      }

      const data = await response.json();
      setProfile(data.profile);

      // Update cache
      localStorage.setItem(
        `profile_${walletAddress.toLowerCase()}`,
        JSON.stringify(data.profile)
      );

      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update profile");
      console.error("Error updating profile:", err);
      return false;
    }
  };

  // Auto-fetch profile when wallet connects
  useEffect(() => {
    if (isClient) {
      fetchProfile();
    }
  }, [walletAddress, isConnected, isClient]);

  return {
    profile,
    isLoading,
    error,
    refreshProfile: fetchProfile,
    updateProfile,
  };
};

// Helper functions for localStorage management
export const clearProfileCache = (walletAddress?: string) => {
  if (typeof window === "undefined") return; // Prevent SSR issues

  if (walletAddress) {
    localStorage.removeItem(`profile_${walletAddress.toLowerCase()}`);
  } else {
    // Clear all profile caches
    Object.keys(localStorage).forEach((key) => {
      if (key.startsWith("profile_")) {
        localStorage.removeItem(key);
      }
    });
  }
};

export const getVerificationLevel = (
  profile: UserProfile | null
): "None" | "Device" | "Orb" => {
  return profile?.verification_level || "None";
};

export const isVerified = (
  profile: UserProfile | null,
  level?: "Device" | "Orb"
): boolean => {
  if (!profile) return false;

  if (level === "Device") {
    return (
      profile.verification_level === "Device" ||
      profile.verification_level === "Orb"
    );
  }

  if (level === "Orb") {
    return profile.verification_level === "Orb";
  }

  // Any verification
  return profile.verification_level !== "None";
};

export const canVerifyAt = (
  profile: UserProfile | null,
  level: "Device" | "Orb"
): boolean => {
  if (!profile) return true;

  if (level === "Device") {
    return !profile.device_verified_at;
  }

  if (level === "Orb") {
    return !profile.orb_verified_at;
  }

  return false;
};

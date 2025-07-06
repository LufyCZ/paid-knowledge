import { UserProfile } from "@/lib/supabase";

export type VerificationLevel = "None" | "Device" | "Orb" | "All";

/**
 * Check if a user can access a quest based on their verification level
 * @param userProfile - The user's profile containing verification info
 * @param questEligibility - The quest's eligibility requirement
 * @returns Object containing canAccess boolean and reason if access is denied
 */
export const canAccessQuest = (
  userProfile: UserProfile | null,
  questEligibility: VerificationLevel
): { canAccess: boolean; reason?: string } => {
  // If quest is open to all, anyone can access
  if (questEligibility === "All") {
    return { canAccess: true };
  }

  // If user is not connected, they can't access any restricted quests
  if (!userProfile) {
    return {
      canAccess: false,
      reason: "Please connect your wallet to access this quest",
    };
  }

  // Check verification requirements
  switch (questEligibility) {
    case "Device":
      if (!userProfile.device_verified_at) {
        return {
          canAccess: false,
          reason:
            "This quest requires device verification. Please verify on your Profile.",
        };
      }
      return { canAccess: true };

    case "Orb":
      if (!userProfile.orb_verified_at) {
        return {
          canAccess: false,
          reason:
            "This quest requires Orb verification. Please verify on your Profile.",
        };
      }
      return { canAccess: true };

    default:
      return { canAccess: true };
  }
};

/**
 * Get the user's current verification level
 */
export const getUserVerificationLevel = (
  userProfile: UserProfile | null
): VerificationLevel => {
  if (!userProfile) return "None";

  if (userProfile.orb_verified_at) return "Orb";
  if (userProfile.device_verified_at) return "Device";

  return "None";
};

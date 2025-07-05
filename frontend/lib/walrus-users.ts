import { WalrusStorage } from "./walrus-storage";

export interface UserProfile {
  id: string;
  wallet_address: string;
  username?: string;
  verification_level: "None" | "Device" | "Orb";
  device_verified_at?: string;
  orb_verified_at?: string;
  notifications_enabled: boolean;
  total_rewards_earned: number;
  total_rewards_usdc: number;
  total_rewards_wld: number;
  forms_created_count: number;
  forms_submitted_count: number;
  forms_accepted_count: number;
  created_at: string;
  updated_at: string;
}

export interface VerificationLog {
  id: string;
  wallet_address: string;
  verification_type: "Device" | "Orb";
  world_id_payload: any;
  verified_at: string;
  action_id?: string;
  signal?: string;
}

export async function getUserProfile(walletAddress: string) {
  try {
    // Query for user profile by wallet address
    const result = await WalrusStorage.queryRecords({
      type: "user_profile",
      metadata_filter: {
        wallet_address: walletAddress.toLowerCase(),
      },
    });

    if (!result.success) {
      throw new Error(result.error || "Failed to fetch profile");
    }

    let profile: UserProfile | null = null;

    if (result.data && result.data.length > 0) {
      // Profile exists
      const profileRecord = result.data[0];
      profile = { ...profileRecord.data, id: profileRecord.id };
    } else {
      // Create new profile
      const newProfile: UserProfile = {
        id: "", // Will be set by WalrusStorage
        wallet_address: walletAddress.toLowerCase(),
        verification_level: "None",
        notifications_enabled: true,
        total_rewards_earned: 0,
        total_rewards_usdc: 0,
        total_rewards_wld: 0,
        forms_created_count: 0,
        forms_submitted_count: 0,
        forms_accepted_count: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      const createResult = await WalrusStorage.saveRecord(
        "user_profile",
        newProfile,
        {
          metadata: {
            wallet_address: walletAddress.toLowerCase(),
            verification_level: "None",
          },
        }
      );

      if (createResult.success && createResult.id) {
        profile = { ...newProfile, id: createResult.id };
      }
    }

    if (!profile) {
      throw new Error("Failed to get or create profile");
    }

    // Get verification history
    const verificationResult = await WalrusStorage.queryRecords({
      type: "verification_log",
      metadata_filter: {
        wallet_address: walletAddress.toLowerCase(),
      },
    });

    const verificationLogs = verificationResult.success
      ? (verificationResult.data || [])
          .map((v) => ({ ...v.data, id: v.id }))
          .sort(
            (a, b) =>
              new Date(b.verified_at).getTime() -
              new Date(a.verified_at).getTime()
          )
      : [];

    // Get form statistics
    const [formsCreated, formsSubmitted, formsAccepted] = await Promise.all([
      WalrusStorage.queryRecords({
        type: "bounty_form",
        metadata_filter: {
          creator_id: walletAddress.toLowerCase(),
        },
      }),
      WalrusStorage.queryRecords({
        type: "form_response",
        metadata_filter: {
          wallet_address: walletAddress.toLowerCase(),
        },
      }),
      WalrusStorage.queryRecords({
        type: "form_response",
        metadata_filter: {
          wallet_address: walletAddress.toLowerCase(),
          status: "approved",
        },
      }),
    ]);

    return {
      profile: {
        ...profile,
        forms_created_count: formsCreated.success
          ? formsCreated.data?.length || 0
          : 0,
        forms_submitted_count: formsSubmitted.success
          ? formsSubmitted.data?.length || 0
          : 0,
        forms_accepted_count: formsAccepted.success
          ? formsAccepted.data?.length || 0
          : 0,
      },
      verificationLogs,
      success: true,
    };
  } catch (error) {
    console.error("Error in getUserProfile:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error occurred",
    };
  }
}

export async function updateUserProfile(
  walletAddress: string,
  updates: Partial<UserProfile>
) {
  try {
    // First get the current profile
    const profileResult = await getUserProfile(walletAddress);
    if (!profileResult.success || !profileResult.profile) {
      throw new Error("Profile not found");
    }

    // Update the profile
    const result = await WalrusStorage.updateRecord(
      profileResult.profile.id,
      {
        ...updates,
        updated_at: new Date().toISOString(),
      },
      {
        wallet_address: walletAddress.toLowerCase(),
        verification_level:
          updates.verification_level ||
          profileResult.profile.verification_level,
      }
    );

    if (!result.success) {
      throw new Error("Failed to update profile");
    }

    return {
      success: true,
    };
  } catch (error) {
    console.error("Error in updateUserProfile:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error occurred",
    };
  }
}

export async function logVerification(
  walletAddress: string,
  verificationType: "Device" | "Orb",
  worldIdPayload: any,
  actionId?: string,
  signal?: string
) {
  try {
    const verificationLog: VerificationLog = {
      id: "", // Will be set by WalrusStorage
      wallet_address: walletAddress.toLowerCase(),
      verification_type: verificationType,
      world_id_payload: worldIdPayload,
      verified_at: new Date().toISOString(),
      action_id: actionId,
      signal: signal,
    };

    const result = await WalrusStorage.saveRecord(
      "verification_log",
      verificationLog,
      {
        metadata: {
          wallet_address: walletAddress.toLowerCase(),
          verification_type: verificationType,
          verified_at: new Date().toISOString(),
        },
      }
    );

    if (!result.success) {
      throw new Error(result.error || "Failed to log verification");
    }

    // Update user profile with verification
    const now = new Date().toISOString();
    const updateData: Partial<UserProfile> = {
      verification_level: verificationType,
      updated_at: now,
    };

    if (verificationType === "Device") {
      updateData.device_verified_at = now;
    } else {
      updateData.orb_verified_at = now;
    }

    await updateUserProfile(walletAddress, updateData);

    return {
      success: true,
      logId: result.id,
    };
  } catch (error) {
    console.error("Error in logVerification:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error occurred",
    };
  }
}

export async function checkExistingVerification(
  walletAddress: string,
  verificationType: "Device" | "Orb"
) {
  try {
    const profileResult = await getUserProfile(walletAddress);
    if (!profileResult.success || !profileResult.profile) {
      return { exists: false };
    }

    const profile = profileResult.profile;

    if (verificationType === "Device" && profile.device_verified_at) {
      return { exists: true, verified_at: profile.device_verified_at };
    }

    if (verificationType === "Orb" && profile.orb_verified_at) {
      return { exists: true, verified_at: profile.orb_verified_at };
    }

    return { exists: false };
  } catch (error) {
    console.error("Error in checkExistingVerification:", error);
    return {
      exists: false,
      error: error instanceof Error ? error.message : "Unknown error occurred",
    };
  }
}

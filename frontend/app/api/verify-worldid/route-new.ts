import { NextRequest, NextResponse } from "next/server";
import { VerificationLevel } from "@worldcoin/minikit-js";
import {
  checkExistingVerification,
  logVerification,
  getUserProfile,
  updateUserProfile,
} from "@/lib/walrus-users";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      walletAddress,
      verificationType,
      worldIdPayload,
      actionId,
      signal,
    } = body;

    if (!walletAddress || !verificationType || !worldIdPayload) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    if (!["Device", "Orb"].includes(verificationType)) {
      return NextResponse.json(
        { error: "Invalid verification type" },
        { status: 400 }
      );
    }

    // Check if user already has this verification level
    const profileResult = await getUserProfile(walletAddress);

    if (profileResult.success && profileResult.profile) {
      const existingProfile = profileResult.profile;

      // Check if already verified at this level
      if (verificationType === "Device" && existingProfile.device_verified_at) {
        return NextResponse.json(
          { error: "Already verified with Device level" },
          { status: 400 }
        );
      }
      if (verificationType === "Orb" && existingProfile.orb_verified_at) {
        return NextResponse.json(
          { error: "Already verified with Orb level" },
          { status: 400 }
        );
      }
    }

    // Log the verification attempt
    const verificationLog = await logVerification(
      walletAddress,
      verificationType as "Device" | "Orb",
      worldIdPayload,
      actionId,
      signal
    );

    if (!verificationLog.success) {
      return NextResponse.json(
        { error: "Failed to log verification" },
        { status: 500 }
      );
    }

    // Update or create user profile
    try {
      const existingProfile = profileResult.success
        ? profileResult.profile
        : null;

      const profileData = {
        wallet_address: walletAddress,
        verification_level: verificationType as "Device" | "Orb",
        device_verified_at:
          verificationType === "Device"
            ? new Date().toISOString()
            : existingProfile?.device_verified_at,
        orb_verified_at:
          verificationType === "Orb"
            ? new Date().toISOString()
            : existingProfile?.orb_verified_at,
        updated_at: new Date().toISOString(),
      };

      const result = await updateUserProfile(walletAddress, profileData);

      if (!result.success) {
        throw new Error(result.error || "Failed to update profile");
      }

      return NextResponse.json({
        success: true,
        verificationLevel: verificationType,
        profile: profileResult.profile,
      });
    } catch (profileError) {
      console.error("Profile update error:", profileError);
      return NextResponse.json(
        { error: "Verification logged but profile update failed" },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("World ID verification error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

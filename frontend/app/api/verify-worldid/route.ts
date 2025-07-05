import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { VerificationLevel } from "@worldcoin/minikit-js";

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
    const { data: existingProfile } = await supabase
      .from("user_profiles")
      .select("*")
      .eq("wallet_address", walletAddress.toLowerCase())
      .single();

    if (existingProfile) {
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

    // Log the verification
    const { error: logError } = await supabase
      .from("verification_logs")
      .insert({
        wallet_address: walletAddress.toLowerCase(),
        verification_type: verificationType,
        world_id_payload: worldIdPayload,
        action_id: actionId,
        signal: signal,
        verified_at: new Date().toISOString(),
      });

    if (logError) {
      console.error("Error logging verification:", logError);
      return NextResponse.json(
        { error: "Failed to log verification" },
        { status: 500 }
      );
    }

    // Update user profile
    const now = new Date().toISOString();
    let updateData: any = {
      updated_at: now,
    };

    if (verificationType === "Device") {
      updateData.device_verified_at = now;
      // If user doesn't have any verification, set to Device
      if (
        !existingProfile?.verification_level ||
        existingProfile.verification_level === "None"
      ) {
        updateData.verification_level = "Device";
      }
    } else if (verificationType === "Orb") {
      updateData.orb_verified_at = now;
      // Orb is always the highest level
      updateData.verification_level = "Orb";
    }

    // Upsert user profile
    const { data: updatedProfile, error: updateError } = await supabase
      .from("user_profiles")
      .upsert({
        wallet_address: walletAddress.toLowerCase(),
        verification_level:
          updateData.verification_level ||
          existingProfile?.verification_level ||
          "None",
        device_verified_at:
          updateData.device_verified_at || existingProfile?.device_verified_at,
        orb_verified_at:
          updateData.orb_verified_at || existingProfile?.orb_verified_at,
        notifications_enabled: existingProfile?.notifications_enabled ?? true,
        total_rewards_earned: existingProfile?.total_rewards_earned || 0,
        total_rewards_usdc: existingProfile?.total_rewards_usdc || 0,
        total_rewards_wld: existingProfile?.total_rewards_wld || 0,
        forms_created_count: existingProfile?.forms_created_count || 0,
        forms_submitted_count: existingProfile?.forms_submitted_count || 0,
        forms_accepted_count: existingProfile?.forms_accepted_count || 0,
        username: existingProfile?.username,
        updated_at: now,
      })
      .select()
      .single();

    if (updateError) {
      console.error("Error updating profile:", updateError);
      return NextResponse.json(
        { error: "Failed to update profile" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      profile: updatedProfile,
      message: `Successfully verified with ${verificationType} level`,
    });
  } catch (error) {
    console.error("Verification API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

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
      // Only set to Device level if user doesn't have Orb verification
      if (
        !existingProfile?.verification_level ||
        existingProfile.verification_level === "None"
      ) {
        updateData.verification_level = "Device";
      }
      // If user already has Orb verification, keep it as Orb (don't downgrade)
      if (existingProfile?.verification_level === "Orb") {
        updateData.verification_level = "Orb";
      }
    } else if (verificationType === "Orb") {
      updateData.orb_verified_at = now;
      // Orb is always the highest level, always set it
      updateData.verification_level = "Orb";
    }

    // Update or create user profile
    let updatedProfile;

    if (existingProfile) {
      // Profile exists, update it
      const { data, error: updateError } = await supabase
        .from("user_profiles")
        .update(updateData)
        .eq("wallet_address", walletAddress.toLowerCase())
        .select()
        .single();

      if (updateError) {
        console.error("Error updating profile:", updateError);
        return NextResponse.json(
          { error: "Failed to update profile" },
          { status: 500 }
        );
      }
      updatedProfile = data;
    } else {
      // Profile doesn't exist, create it
      const { data, error: createError } = await supabase
        .from("user_profiles")
        .insert({
          wallet_address: walletAddress.toLowerCase(),
          verification_level: updateData.verification_level || "Device",
          device_verified_at: updateData.device_verified_at,
          orb_verified_at: updateData.orb_verified_at,
          notifications_enabled: true,
          total_rewards_earned: 0,
          total_rewards_usdc: 0,
          total_rewards_wld: 0,
          forms_created_count: 0,
          forms_submitted_count: 0,
          forms_accepted_count: 0,
          updated_at: now,
        })
        .select()
        .single();

      if (createError) {
        console.error("Error creating profile:", createError);
        return NextResponse.json(
          { error: "Failed to create profile" },
          { status: 500 }
        );
      }
      updatedProfile = data;
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

import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const walletAddress = searchParams.get("wallet_address");

    if (!walletAddress) {
      return NextResponse.json(
        { error: "Wallet address is required" },
        { status: 400 }
      );
    }

    // Get or create user profile
    let { data: profile, error: profileError } = await supabase
      .from("user_profiles")
      .select("*")
      .eq("wallet_address", walletAddress.toLowerCase())
      .single();

    if (profileError && profileError.code !== "PGRST116") {
      // PGRST116 is "not found" - other errors are actual problems
      console.error("Error fetching profile:", profileError);
      return NextResponse.json(
        { error: "Failed to fetch profile" },
        { status: 500 }
      );
    }

    // If profile doesn't exist, create it
    if (!profile) {
      const { data: newProfile, error: createError } = await supabase
        .from("user_profiles")
        .insert({
          wallet_address: walletAddress.toLowerCase(),
          verification_level: "None",
          notifications_enabled: true,
          total_rewards_earned: 0,
          total_rewards_usdc: 0,
          total_rewards_wld: 0,
          forms_created_count: 0,
          forms_submitted_count: 0,
          forms_accepted_count: 0,
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

      profile = newProfile;
    }

    // Get verification history
    const { data: verificationLogs, error: logsError } = await supabase
      .from("verification_logs")
      .select("*")
      .eq("wallet_address", walletAddress.toLowerCase())
      .order("verified_at", { ascending: false });

    if (logsError) {
      console.error("Error fetching verification logs:", logsError);
      // Don't fail the request, just log the error
    }

    // Get additional stats from other tables
    const [
      { count: formsCreated },
      { count: formsSubmitted },
      { count: formsAccepted },
    ] = await Promise.all([
      supabase
        .from("bounty_forms")
        .select("*", { count: "exact", head: true })
        .eq("creator_id", walletAddress.toLowerCase()),

      supabase
        .from("form_responses")
        .select("*", { count: "exact", head: true })
        .eq("wallet_address", walletAddress.toLowerCase()),

      supabase
        .from("form_responses")
        .select("*", { count: "exact", head: true })
        .eq("wallet_address", walletAddress.toLowerCase())
        .eq("status", "approved"),
    ]);

    // Update the counts in the profile if they've changed
    if (
      profile.forms_created_count !== (formsCreated || 0) ||
      profile.forms_submitted_count !== (formsSubmitted || 0) ||
      profile.forms_accepted_count !== (formsAccepted || 0)
    ) {
      const { data: updatedProfile } = await supabase
        .from("user_profiles")
        .update({
          forms_created_count: formsCreated || 0,
          forms_submitted_count: formsSubmitted || 0,
          forms_accepted_count: formsAccepted || 0,
        })
        .eq("wallet_address", walletAddress.toLowerCase())
        .select()
        .single();

      if (updatedProfile) {
        profile = updatedProfile;
      }
    }

    return NextResponse.json({
      profile,
      verificationHistory: verificationLogs || [],
    });
  } catch (error) {
    console.error("Profile API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { walletAddress, updates } = body;

    if (!walletAddress) {
      return NextResponse.json(
        { error: "Wallet address is required" },
        { status: 400 }
      );
    }

    // Update user profile
    const { data: updatedProfile, error } = await supabase
      .from("user_profiles")
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq("wallet_address", walletAddress.toLowerCase())
      .select()
      .single();

    if (error) {
      console.error("Error updating profile:", error);
      return NextResponse.json(
        { error: "Failed to update profile" },
        { status: 500 }
      );
    }

    return NextResponse.json({ profile: updatedProfile });
  } catch (error) {
    console.error("Profile update API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

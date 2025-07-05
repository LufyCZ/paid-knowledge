import { NextRequest, NextResponse } from "next/server";
import { getUserProfile, updateUserProfile } from "@/lib/walrus-users";

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

    const result = await getUserProfile(walletAddress);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || "Failed to fetch profile" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      profile: result.profile,
      verificationHistory: result.verificationLogs,
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

    const result = await updateUserProfile(walletAddress, updates);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || "Failed to update profile" },
        { status: 500 }
      );
    }

    // Get updated profile
    const profileResult = await getUserProfile(walletAddress);

    return NextResponse.json({
      profile: profileResult.success ? profileResult.profile : null,
    });
  } catch (error) {
    console.error("Profile update API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

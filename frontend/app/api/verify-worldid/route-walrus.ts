import { NextRequest, NextResponse } from "next/server";
import { VerificationLevel } from "@worldcoin/minikit-js";
import { checkExistingVerification, logVerification } from "@/lib/walrus-users";

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
    const existingVerification = await checkExistingVerification(
      walletAddress,
      verificationType as "Device" | "Orb"
    );

    if (existingVerification.exists) {
      return NextResponse.json(
        { error: `Already verified with ${verificationType} level` },
        { status: 400 }
      );
    }

    // Log the verification
    const result = await logVerification(
      walletAddress,
      verificationType as "Device" | "Orb",
      worldIdPayload,
      actionId,
      signal
    );

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || "Failed to log verification" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Verification recorded successfully",
      logId: result.logId,
    });
  } catch (error) {
    console.error("World ID verification error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

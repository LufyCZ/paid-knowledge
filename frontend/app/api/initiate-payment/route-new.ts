import { NextRequest, NextResponse } from "next/server";
import { initiatePayment } from "@/lib/walrus-payments";

export async function POST(req: NextRequest) {
  try {
    // Get request body for additional payment details (optional)
    const body = await req.json().catch(() => ({}));

    // Initiate payment in Walrus storage
    const result = await initiatePayment(body);

    if (!result.success) {
      console.error("Error initiating payment:", result.error);
      return NextResponse.json(
        { error: "Failed to initiate payment" },
        { status: 500 }
      );
    }

    return NextResponse.json({ id: result.referenceId });
  } catch (error) {
    console.error("Error initiating payment:", error);
    return NextResponse.json(
      { error: "Failed to initiate payment" },
      { status: 500 }
    );
  }
}

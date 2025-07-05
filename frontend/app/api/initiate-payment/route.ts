import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";

export async function POST(req: NextRequest) {
  try {
    // Generate unique reference ID
    const uuid = crypto.randomUUID().replace(/-/g, "");

    // Get request body for additional payment details (optional)
    const body = await req.json().catch(() => ({}));

    // Store the payment initiation in database for verification later
    const { error } = await supabaseAdmin.from("payment_references").insert({
      reference_id: uuid,
      status: "initiated",
      initiated_at: new Date().toISOString(),
      metadata: body,
    });

    if (error) {
      console.error("Error storing payment reference:", error);
      // Continue anyway, as the reference can still be used for verification
    }

    return NextResponse.json({ id: uuid });
  } catch (error) {
    console.error("Error initiating payment:", error);
    return NextResponse.json(
      { error: "Failed to initiate payment" },
      { status: 500 }
    );
  }
}

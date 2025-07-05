import { NextRequest, NextResponse } from "next/server";
import { MiniAppPaymentSuccessPayload } from "@worldcoin/minikit-js";
import { supabaseAdmin } from "@/lib/supabase-admin";

interface IRequestPayload {
  payload: MiniAppPaymentSuccessPayload;
}

export async function POST(req: NextRequest) {
  try {
    const { payload } = (await req.json()) as IRequestPayload;

    if (!payload || !payload.reference || !payload.transaction_id) {
      return NextResponse.json(
        { success: false, error: "Invalid payload" },
        { status: 400 }
      );
    }

    // 1. Check that we have this reference in our database
    const { data: paymentRef, error: fetchError } = await supabaseAdmin
      .from("payment_references")
      .select("*")
      .eq("reference_id", payload.reference)
      .single();

    if (fetchError || !paymentRef) {
      console.error(
        "Payment reference not found:",
        payload.reference,
        fetchError
      );
      return NextResponse.json(
        { success: false, error: "Payment reference not found" },
        { status: 404 }
      );
    }

    // 2. Verify the transaction with Worldcoin Developer Portal
    const appId = process.env.NEXT_PUBLIC_WORLDCOIN_APP_ID;
    const apiKey = process.env.WORLDCOIN_DEV_PORTAL_API_KEY;

    if (!appId || !apiKey) {
      console.error("Missing Worldcoin configuration");
      return NextResponse.json(
        { success: false, error: "Server configuration error" },
        { status: 500 }
      );
    }

    const response = await fetch(
      `https://developer.worldcoin.org/api/v2/minikit/transaction/${payload.transaction_id}?app_id=${appId}`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${apiKey}`,
        },
      }
    );

    if (!response.ok) {
      console.error(
        "Failed to verify transaction with Worldcoin:",
        response.statusText
      );
      return NextResponse.json(
        { success: false, error: "Failed to verify transaction" },
        { status: 500 }
      );
    }

    const transaction = await response.json();

    // 3. Verify the transaction details match our expectations
    if (
      transaction.reference !== payload.reference ||
      transaction.status === "failed"
    ) {
      console.error("Transaction verification failed:", {
        expected: payload.reference,
        actual: transaction.reference,
        status: transaction.status,
      });

      // Update payment reference with failure
      await supabaseAdmin
        .from("payment_references")
        .update({
          status: "failed",
          transaction_id: payload.transaction_id,
          verification_result: transaction,
          updated_at: new Date().toISOString(),
        })
        .eq("reference_id", payload.reference);

      return NextResponse.json(
        { success: false, error: "Transaction verification failed" },
        { status: 400 }
      );
    }

    // 4. Optimistically accept the payment (transaction is on-chain but may not be mined yet)
    const { error: updateError } = await supabaseAdmin
      .from("payment_references")
      .update({
        status: "confirmed",
        transaction_id: payload.transaction_id,
        verification_result: transaction,
        confirmed_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("reference_id", payload.reference);

    if (updateError) {
      console.error("Failed to update payment reference:", updateError);
      return NextResponse.json(
        { success: false, error: "Failed to update payment status" },
        { status: 500 }
      );
    }

    console.log("Payment confirmed successfully:", {
      reference: payload.reference,
      transactionId: payload.transaction_id,
      status: transaction.status,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error confirming payment:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}

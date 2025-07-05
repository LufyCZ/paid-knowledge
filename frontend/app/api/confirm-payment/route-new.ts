import { NextRequest, NextResponse } from "next/server";
import { MiniAppPaymentSuccessPayload } from "@worldcoin/minikit-js";
import {
  getPaymentReference,
  updatePaymentStatus,
} from "@/lib/walrus-payments";
import { updateFormStatus } from "@/lib/walrus-forms";

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

    // 1. Check that we have this reference in our Walrus storage
    const paymentResult = await getPaymentReference(payload.reference);

    if (!paymentResult.success || !paymentResult.paymentInitiation) {
      console.error(
        "Payment reference not found:",
        payload.reference,
        paymentResult.error
      );
      return NextResponse.json(
        { success: false, error: "Payment reference not found" },
        { status: 404 }
      );
    }

    const paymentRef = paymentResult.paymentInitiation;

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

    try {
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
          "Worldcoin API error:",
          response.status,
          response.statusText
        );
        return NextResponse.json(
          { success: false, error: "Failed to verify transaction" },
          { status: 400 }
        );
      }

      const transactionData = await response.json();
      console.log("Transaction verified:", transactionData);

      // 3. Validate transaction details
      if (transactionData.reference !== payload.reference) {
        console.error("Reference mismatch");
        return NextResponse.json(
          { success: false, error: "Transaction verification failed" },
          { status: 400 }
        );
      }

      // 4. Update payment status to confirmed
      const updateResult = await updatePaymentStatus(
        payload.reference,
        "confirmed",
        payload.transaction_id,
        {
          verified_at: new Date().toISOString(),
          transaction_data: transactionData,
          max_questions: paymentRef.metadata?.max_questions || 100,
        }
      );

      if (!updateResult.success) {
        console.error("Failed to update payment status:", updateResult.error);
        return NextResponse.json(
          { success: false, error: "Failed to update payment status" },
          { status: 500 }
        );
      }

      // 5. If there's a form associated, activate it
      if (paymentRef.form_id) {
        const formUpdateResult = await updateFormStatus(
          paymentRef.form_id,
          "active"
        );

        if (!formUpdateResult.success) {
          console.error("Failed to activate form:", formUpdateResult.error);
          // Continue anyway, payment is confirmed
        }
      }

      return NextResponse.json({
        success: true,
        message: "Payment confirmed successfully",
        transaction_id: payload.transaction_id,
        reference: payload.reference,
      });
    } catch (apiError) {
      console.error("Error verifying transaction:", apiError);
      return NextResponse.json(
        { success: false, error: "Transaction verification failed" },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error("Error confirming payment:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}

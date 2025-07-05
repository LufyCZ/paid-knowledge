import { WalrusStorage } from "./walrus-storage";

export interface PaymentReference {
  id: string;
  form_id: string;
  creator_wallet: string;
  amount: number;
  token: "USDC" | "WLD";
  transaction_hash: string | null;
  status: "pending" | "confirmed" | "failed";
  max_questions: number;
  created_at: string;
  updated_at: string;
}

export interface PaymentInitiation {
  id: string;
  reference_id: string;
  status: "initiated" | "pending" | "confirmed" | "failed";
  form_id?: string;
  creator_wallet?: string;
  amount?: number;
  token?: "USDC" | "WLD";
  metadata?: any;
  initiated_at: string;
  updated_at: string;
}

export async function createPaymentReference(
  data: Omit<PaymentReference, "id" | "created_at" | "updated_at">
) {
  try {
    const paymentRef: PaymentReference = {
      ...data,
      id: "", // Will be set by WalrusStorage
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const result = await WalrusStorage.saveRecord(
      "payment_reference",
      paymentRef,
      {
        metadata: {
          form_id: data.form_id,
          creator_wallet: data.creator_wallet,
          status: data.status,
          token: data.token,
        },
      }
    );

    if (!result.success) {
      throw new Error(result.error || "Failed to create payment reference");
    }

    return {
      success: true,
      paymentReference: { ...paymentRef, id: result.id },
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error occurred",
    };
  }
}

export async function initiatePayment(data: {
  form_id?: string;
  creator_wallet?: string;
  amount?: number;
  token?: "USDC" | "WLD";
  metadata?: any;
}) {
  try {
    const referenceId = crypto.randomUUID().replace(/-/g, "");

    const paymentInitiation: PaymentInitiation = {
      id: "", // Will be set by WalrusStorage
      reference_id: referenceId,
      status: "initiated",
      form_id: data.form_id,
      creator_wallet: data.creator_wallet,
      amount: data.amount,
      token: data.token,
      metadata: data.metadata,
      initiated_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const result = await WalrusStorage.saveRecord(
      "payment_initiation",
      paymentInitiation,
      {
        metadata: {
          reference_id: referenceId,
          status: "initiated",
          form_id: data.form_id,
          creator_wallet: data.creator_wallet,
        },
      }
    );

    if (!result.success) {
      throw new Error(result.error || "Failed to initiate payment");
    }

    return {
      success: true,
      referenceId,
      paymentInitiation: { ...paymentInitiation, id: result.id },
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error occurred",
    };
  }
}

export async function getPaymentReference(referenceId: string) {
  try {
    const result = await WalrusStorage.queryRecords({
      type: "payment_initiation",
      metadata_filter: {
        reference_id: referenceId,
      },
    });

    if (!result.success) {
      throw new Error(result.error || "Failed to fetch payment reference");
    }

    if (!result.data || result.data.length === 0) {
      return {
        success: false,
        error: "Payment reference not found",
      };
    }

    const paymentRecord = result.data[0];
    const paymentInitiation: PaymentInitiation = {
      ...paymentRecord.data,
      id: paymentRecord.id,
    };

    return {
      success: true,
      paymentInitiation,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error occurred",
    };
  }
}

export async function updatePaymentStatus(
  referenceId: string,
  status: "pending" | "confirmed" | "failed",
  transactionHash?: string,
  additionalData?: any
) {
  try {
    // First get the existing payment
    const paymentResult = await getPaymentReference(referenceId);

    if (!paymentResult.success || !paymentResult.paymentInitiation) {
      throw new Error("Payment reference not found");
    }

    const updatedPayment: PaymentInitiation = {
      ...paymentResult.paymentInitiation,
      status,
      updated_at: new Date().toISOString(),
      ...additionalData,
    };

    // If this is a confirmed payment and we have form details, create a payment reference
    if (
      status === "confirmed" &&
      updatedPayment.form_id &&
      updatedPayment.creator_wallet &&
      updatedPayment.amount &&
      updatedPayment.token
    ) {
      const paymentRefResult = await createPaymentReference({
        form_id: updatedPayment.form_id,
        creator_wallet: updatedPayment.creator_wallet,
        amount: updatedPayment.amount,
        token: updatedPayment.token,
        transaction_hash: transactionHash || null,
        status: "confirmed",
        max_questions: additionalData?.max_questions || 100,
      });

      if (!paymentRefResult.success) {
        console.error(
          "Failed to create payment reference:",
          paymentRefResult.error
        );
      }
    }

    const result = await WalrusStorage.updateRecord(
      paymentResult.paymentInitiation.id,
      updatedPayment,
      {
        metadata: {
          reference_id: referenceId,
          status,
          form_id: updatedPayment.form_id,
          creator_wallet: updatedPayment.creator_wallet,
        },
      }
    );

    if (!result.success) {
      throw new Error(result.error || "Failed to update payment status");
    }

    return {
      success: true,
      paymentInitiation: updatedPayment,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error occurred",
    };
  }
}

export async function getPaymentsByForm(formId: string) {
  try {
    const result = await WalrusStorage.queryRecords({
      type: "payment_reference",
      metadata_filter: {
        form_id: formId,
      },
    });

    if (!result.success) {
      throw new Error(result.error || "Failed to fetch payments");
    }

    const payments =
      result.data?.map((record) => ({
        ...record.data,
        id: record.id,
      })) || [];

    return {
      success: true,
      payments,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error occurred",
    };
  }
}

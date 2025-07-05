import { NextRequest, NextResponse } from "next/server";
import {
  verifyCloudProof,
  IVerifyResponse,
  ISuccessResult,
} from "@worldcoin/minikit-js";

interface IRequestPayload {
  payload: ISuccessResult;
  action: string;
  signal: string | undefined;
}

export async function POST(req: NextRequest) {
  const { payload, action, signal } = (await req.json()) as IRequestPayload;
  const app_id = process.env.NEXT_PUBLIC_WORLDCOIN_APP_ID as `app_${string}`;

  if (!app_id) {
    console.error("Missing NEXT_PUBLIC_WORLDCOIN_APP_ID environment variable");
    return NextResponse.json({
      error: "Server configuration error",
      status: 500,
    });
  }

  console.log("Verifying with:", { app_id, action, signal });

  const verifyRes = (await verifyCloudProof(
    payload,
    app_id,
    action,
    signal
  )) as IVerifyResponse;

  if (verifyRes.success) {
    console.log("Verification successful:", verifyRes);
    return NextResponse.json({ verifyRes, status: 200 });
  } else {
    console.error("Verification failed:", verifyRes);
    return NextResponse.json({ verifyRes, status: 400 });
  }
}

import { NextRequest, NextResponse } from "next/server";
import { getBountyForms, createBountyForm } from "@/lib/walrus-forms";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get("limit") || "10");
    const offset = parseInt(searchParams.get("offset") || "0");

    const result = await getBountyForms(limit, offset);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || "Failed to fetch forms" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      forms: result.data,
      success: true,
    });
  } catch (error) {
    console.error("Forms API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.json();

    const result = await createBountyForm(formData);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || "Failed to create form" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      ...result.data,
      success: true,
    });
  } catch (error) {
    console.error("Form creation API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

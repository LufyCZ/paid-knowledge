import { NextRequest, NextResponse } from "next/server";
import { submitFormResponse, getFormResponses } from "@/lib/walrus-forms";

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const submissionData = await request.json();

    // Add form ID to submission data
    submissionData.formId = params.id;

    const result = await submitFormResponse(submissionData);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || "Failed to submit response" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      ...result.data,
      success: true,
    });
  } catch (error) {
    console.error("Form submission API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const result = await getFormResponses(params.id);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || "Failed to fetch responses" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      responses: result.data,
      success: true,
    });
  } catch (error) {
    console.error("Form responses API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

import { NextRequest, NextResponse } from "next/server";
import { getBountyForm, updateFormStatus } from "@/lib/walrus-forms";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const result = await getBountyForm(params.id);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || "Form not found" },
        { status: result.error === "Form not found" ? 404 : 500 }
      );
    }

    return NextResponse.json({
      form: result.data,
      success: true,
    });
  } catch (error) {
    console.error("Form API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { status } = await request.json();

    if (!["draft", "active", "completed", "cancelled"].includes(status)) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 });
    }

    const result = await updateFormStatus(params.id, status);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || "Failed to update form status" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Form status updated successfully",
    });
  } catch (error) {
    console.error("Form update API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

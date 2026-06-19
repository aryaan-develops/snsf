import { NextResponse } from "next/server";
import { getImageKit } from "@/lib/imagekit";

export async function GET() {
  try {
    const imagekit = getImageKit();
    const authParams = imagekit.helper.getAuthenticationParameters();
    return NextResponse.json(authParams);
  } catch (error) {
    console.error("ImageKit auth error:", error);
    return NextResponse.json(
      { error: "Failed to generate ImageKit authentication parameters" },
      { status: 500 }
    );
  }
}

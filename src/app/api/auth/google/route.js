import { createGoogleAuthURL } from "../../../../lib/auth";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const authUrl = await createGoogleAuthURL();
    return NextResponse.redirect(authUrl);
  } catch (error) {
    console.error("Google OAuth URL generation error:", error);
    return NextResponse.json({ error: "Failed to create auth URL" }, { status: 500 });
  }
}
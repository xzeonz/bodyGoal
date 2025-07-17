import { handleGoogleCallback } from "../../../../lib/auth";
import { redirect } from "next/navigation";
import { NextResponse } from "next/server";

export async function GET(request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  
  if (!code || !state) {
    return NextResponse.redirect(new URL("/login?error=missing-params", request.url));
  }
  
  try {
    const user = await handleGoogleCallback(code, state);
    
    // Check if user has completed onboarding
    const { prisma } = await import("../../../../lib/prisma");
    const userWithOnboarding = await prisma.user.findUnique({
      where: { id: user.id },
      include: { onboarding: true },
    });
    
    // Redirect to onboarding if not completed, otherwise to dashboard
    if (!userWithOnboarding?.onboarding) {
      return NextResponse.redirect(new URL("/onboarding", request.url));
    } else {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }
  } catch (error) {
    console.error("OAuth callback error:", error);
    return NextResponse.redirect(new URL("/login?error=oauth-failed", request.url));
  }
}
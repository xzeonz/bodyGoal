import { Google } from "arctic";
import { prisma } from "./prisma";
import { cookies } from "next/headers";

// Initialize Google OAuth with Arctic
export const google = new Google(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.GOOGLE_REDIRECT_URI
);

// Generate Google OAuth URL
export async function createGoogleAuthURL() {
  const state = generateState();
  const codeVerifier = generateCodeVerifier();
  
  const cookieStore = await cookies();
  cookieStore.set("google_oauth_state", state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 10, // 10 minutes
    sameSite: "lax"
  });
  
  cookieStore.set("google_code_verifier", codeVerifier, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 10, // 10 minutes
    sameSite: "lax"
  });
  
  const scopes = ["openid", "profile", "email"];
const url = await google.createAuthorizationURL(state, codeVerifier, scopes);
  
  return url.toString();
}

// Handle Google OAuth callback
export async function handleGoogleCallback(code, state) {
  const cookieStore = await cookies();
  const storedState = cookieStore.get("google_oauth_state")?.value;
  const codeVerifier = cookieStore.get("google_code_verifier")?.value;
  
  if (!storedState || !codeVerifier || storedState !== state) {
    throw new Error("Invalid state");
  }
  
  try {
    const tokens = await google.validateAuthorizationCode(code, codeVerifier);
    
    // Get user info from Google
    const response = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
      headers: {
        Authorization: `Bearer ${tokens.accessToken()}`
      }
    });
    
    const googleUser = await response.json();
    
    // Check if user exists in database
    let user = await prisma.user.findUnique({
      where: { email: googleUser.email }
    });
    
    // Create user if doesn't exist
    if (!user) {
      user = await prisma.user.create({
        data: {
          email: googleUser.email,
          name: googleUser.name,
          avatarUrl: googleUser.picture
        }
      });
    }
    
    // Create session
    await createSession(user.id);
    
    return user;
  } catch (error) {
    console.error("Google OAuth error:", error);
    throw error;
  }
}

// Create user session
export async function createSession(userId) {
  const cookieStore = await cookies();
  
  const user = await prisma.user.findUnique({
    where: { id: userId }
  });
  
  if (!user) {
    throw new Error("User not found");
  }
  
  cookieStore.set('user-session', JSON.stringify({
    id: user.id,
    email: user.email,
    name: user.name
  }), {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    maxAge: 60 * 60 * 24 * 7, // 7 days
    sameSite: 'lax'
  });
}

// Get current session
export async function getSession() {
  const cookieStore = await cookies();
  const userSession = cookieStore.get('user-session');
  
  if (userSession) {
    try {
      const userData = JSON.parse(userSession.value);
      return {
        user: {
          id: userData.id,
          email: userData.email,
          name: userData.name
        }
      };
    } catch (error) {
      console.error("Failed to parse session:", error);
    }
  }
  
  return null;
}

// Logout user
export async function logout() {
  const cookieStore = await cookies();
  cookieStore.delete('user-session');
  cookieStore.delete('google_oauth_state');
  cookieStore.delete('google_code_verifier');
}

// Helper functions
function generateState() {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
}

function generateCodeVerifier() {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
}
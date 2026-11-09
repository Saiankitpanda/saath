import { NextResponse } from "next/server";
import { signSessionData } from "@/lib/server/session-security";

const DJANGO_URL = process.env.DJANGO_API_URL || "http://127.0.0.1:8000/api";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as any;
    const { credential, accessToken, email, name, role } = body;

    let userEmail = email ? email.trim().toLowerCase() : "";
    let userName = name ? name.trim() : "";

    // 1. If Google JWT credential (ID Token) is provided, decode payload
    if (credential) {
      try {
        const parts = credential.split(".");
        if (parts.length >= 2) {
          const payload = JSON.parse(Buffer.from(parts[1], "base64url").toString("utf-8"));
          userEmail = (payload.email || userEmail).toLowerCase().trim();
          userName = payload.name || userName;
        }
      } catch {
        // Fallback
      }
    } else if (accessToken) {
      // 2. If OAuth access token provided, fetch user info directly from Google API
      try {
        const gRes = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
          headers: { Authorization: `Bearer ${accessToken}` },
          signal: AbortSignal.timeout(3000),
        });
        if (gRes.ok) {
          const gData = (await gRes.json()) as any;
          userEmail = (gData.email || userEmail).toLowerCase().trim();
          userName = gData.name || userName;
        }
      } catch {
        // Fallback
      }
    }

    if (!userEmail) {
      return NextResponse.json(
        { error: "Google authentication failed. No verified email provided." },
        { status: 400 }
      );
    }

    // 3. Register or fetch user in Django
    let userData: any = null;
    const targetRole = role === "listener" ? "listener" : "client";

    try {
      const djangoRes = await fetch(`${DJANGO_URL}/auth/register/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: userEmail,
          password: `GoogleAuth_${userEmail}`,
          fullName: userName || userEmail.split("@")[0],
          role: targetRole,
        }),
        signal: AbortSignal.timeout(2000),
      });

      const data = (await djangoRes.json()) as any;
      if (djangoRes.ok && data.status === "success") {
        userData = data.user;
      } else if (djangoRes.status === 409 || data.message?.toLowerCase().includes("already exists")) {
        // User already registered in Django, fetch their user details
        const loginRes = await fetch(`${DJANGO_URL}/auth/login/`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: userEmail,
            password: `GoogleAuth_${userEmail}`,
          }),
          signal: AbortSignal.timeout(2000),
        });
        const loginData = (await loginRes.json()) as any;
        if (loginData.user) {
          userData = loginData.user;
        }
      }
    } catch {
      // Offline fallback
    }

    if (!userData) {
      const isListener = targetRole === "listener";
      const cleanName = userName || userEmail.split("@")[0];
      userData = {
        id: `google-${Date.now()}`,
        email: userEmail,
        fullName: cleanName,
        displayName: cleanName,
        activeRole: targetRole,
        clientEnrolled: true,
        listenerEnrolled: isListener,
        pairingCode: isListener ? `SAATH-${Math.floor(1000 + Math.random() * 9000)}` : undefined,
      };
    }

    const response = NextResponse.json({
      success: true,
      user: userData,
      message: `Welcome, ${userData.fullName || userData.displayName}!`,
    });

    const sessionCookieVal = encodeURIComponent(signSessionData(userData));
    response.cookies.set("saath_session", sessionCookieVal, {
      path: "/",
      httpOnly: false,
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 30,
    });

    return response;
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message || "Google authentication failed." }, { status: 500 });
  }
}

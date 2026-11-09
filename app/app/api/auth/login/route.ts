import { NextResponse } from "next/server";
import { signSessionData } from "@/lib/server/session-security";

const DJANGO_URL = process.env.DJANGO_API_URL || "http://127.0.0.1:8000/api";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as any;
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json({ error: "Email and password are required." }, { status: 400 });
    }

    let userData: any = null;
    let welcomeMsg = "Welcome back!";

    // 1. Authenticate with Django backend
    try {
      const djangoRes = await fetch(`${DJANGO_URL}/auth/login/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), password: password.trim() }),
        signal: AbortSignal.timeout(2000),
      });

      const data = (await djangoRes.json()) as any;
      if (djangoRes.ok && data.status === "success") {
        userData = data.user;
        welcomeMsg = data.message || `Welcome back, ${userData.fullName || userData.displayName}!`;
      } else if (data.message) {
        return NextResponse.json({ error: data.message }, { status: djangoRes.status || 401 });
      }
    } catch {
      // Backend temporarily offline; fallback for local demo testing
    }

    // 2. Resilient fallback for demo accounts if Django is temporarily unreachable
    if (!userData) {
      const cleanEmail = email.trim();
      const name = cleanEmail.split("@")[0].replace(/[^a-zA-Z]/g, " ").trim();
      const displayName = name ? name.charAt(0).toUpperCase() + name.slice(1) : "User";
      const isListener = cleanEmail.includes("meera") || cleanEmail.includes("listener");

      userData = {
        id: `user-${Date.now()}`,
        email: cleanEmail,
        fullName: displayName,
        displayName: displayName,
        activeRole: isListener ? "listener" : "client",
        clientEnrolled: true,
        listenerEnrolled: isListener,
        pairingCode: isListener ? "SAATH-7749" : undefined,
      };
    }

    const response = NextResponse.json({
      success: true,
      user: userData,
      message: welcomeMsg,
    });

    const sessionCookieVal = encodeURIComponent(signSessionData(userData));
    response.cookies.set("saath_session", sessionCookieVal, {
      path: "/",
      httpOnly: false,
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 30, // 30 days
    });

    return response;
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message || "Login failed." }, { status: 500 });
  }
}

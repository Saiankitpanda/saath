import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { verifySessionData } from "@/lib/server/session-security";

export async function GET() {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get("saath_session");
    if (!sessionCookie || !sessionCookie.value) {
      return NextResponse.json({ authenticated: false, user: null });
    }

    const user = verifySessionData<any>(sessionCookie.value);
    if (!user) {
      return NextResponse.json({ authenticated: false, user: null });
    }

    return NextResponse.json({
      authenticated: true,
      user,
    });
  } catch {
    return NextResponse.json({ authenticated: false, user: null });
  }
}

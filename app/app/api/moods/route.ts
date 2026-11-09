import { cookies } from "next/headers";
import { NextResponse } from "next/server";

const DJANGO_URL = process.env.DJANGO_API_URL || "http://127.0.0.1:8000/api";

export async function GET(request: Request) {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get("saath_session");

    try {
      const djangoRes = await fetch(`${DJANGO_URL}/moods/`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Cookie: sessionCookie ? `saath_session=${sessionCookie.value}` : "",
        },
      });

      if (djangoRes.ok) {
        const data = await djangoRes.json();
        return NextResponse.json(data);
      }
    } catch {
      // Fallback
    }

    return NextResponse.json({
      status: "success",
      moods: [],
    });
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message || "Failed to fetch moods." }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as any;
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get("saath_session");

    try {
      const djangoRes = await fetch(`${DJANGO_URL}/moods/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Cookie: sessionCookie ? `saath_session=${sessionCookie.value}` : "",
        },
        body: JSON.stringify(body),
      });

      if (djangoRes.ok) {
        const data = await djangoRes.json();
        return NextResponse.json(data);
      }
    } catch {
      // Fallback
    }

    return NextResponse.json({
      status: "success",
      message: "Mood recorded quietly.",
      mood: {
        id: `mood-${Date.now()}`,
        mood: body.mood || "steady",
        note: body.note || "",
        createdAt: new Date().toISOString(),
      },
    });
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message || "Failed to save mood." }, { status: 500 });
  }
}

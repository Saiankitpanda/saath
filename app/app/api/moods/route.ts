import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { getChatGPTUser } from "@/app/chatgpt-auth";
import { listUserMoods, recordUserMood } from "@/lib/server/moods-service";

const DJANGO_URL = process.env.DJANGO_API_URL || "http://127.0.0.1:8000/api";

export async function GET(request: Request) {
  try {
    const actor = await getChatGPTUser();
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get("saath_session");

    // 1. Try real Django backend first
    try {
      const djangoRes = await fetch(`${DJANGO_URL}/moods/`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Cookie: sessionCookie ? `saath_session=${sessionCookie.value}` : "",
        },
        signal: AbortSignal.timeout(1500),
      });

      if (djangoRes.ok) {
        const data = await djangoRes.json();
        return NextResponse.json(data);
      }
    } catch {
      // Fallback to local server store
    }

    if (actor) {
      const moods = listUserMoods(actor.userId);
      return NextResponse.json({
        status: "success",
        moods,
      });
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
    const actor = await getChatGPTUser();
    const body = (await request.json()) as any;
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get("saath_session");

    // 1. Try real Django backend first
    try {
      const djangoRes = await fetch(`${DJANGO_URL}/moods/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Cookie: sessionCookie ? `saath_session=${sessionCookie.value}` : "",
        },
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(1500),
      });

      if (djangoRes.ok) {
        const data = await djangoRes.json();
        return NextResponse.json(data);
      }
    } catch {
      // Fallback to local server store
    }

    const userId = actor?.userId || "anon";
    const entry = recordUserMood(userId, body.mood || "steady", body.note || "");

    return NextResponse.json({
      status: "success",
      message: "Mood recorded quietly in your calm sanctuary.",
      entry,
    });
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message || "Failed to save mood." }, { status: 500 });
  }
}

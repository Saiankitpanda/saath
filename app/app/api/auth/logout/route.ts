import { NextResponse } from "next/server";

/** Sites sign-out is via the ChatGPT / Sites flow, not Django cookies. */
export async function POST() {
  return NextResponse.json(
    {
      error: "Use Sites / ChatGPT sign-out. Django session cookies are not the minimal auth path.",
      auth: "sites",
    },
    { status: 410 },
  );
}

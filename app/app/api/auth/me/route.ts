import { NextResponse } from "next/server";

/** Parallel Django session identity is not used by Vinext/D1 APIs. Use GET /api/status. */
export async function GET() {
  return NextResponse.json(
    {
      error: "Use GET /api/status for Sites identity. Django saath_session is not the minimal auth path.",
      auth: "sites",
    },
    { status: 410 },
  );
}

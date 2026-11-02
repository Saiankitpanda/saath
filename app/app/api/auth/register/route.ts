import { NextResponse } from "next/server";

/** Django registration is not part of the minimal Vinext/D1 product. */
export async function POST() {
  return NextResponse.json(
    {
      error: "Django registration is disabled on the minimal Saath path. Sign in with Sites, then enroll via PUT /api/profile.",
      auth: "sites",
    },
    { status: 410 },
  );
}

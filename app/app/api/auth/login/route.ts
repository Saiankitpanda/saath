import { NextResponse } from "next/server";

/**
 * Django email/password login is not part of the minimal Vinext/D1 product.
 * Primary identity is ChatGPT Sites (local mock: /signin-with-chatgpt).
 */
export async function POST() {
  return NextResponse.json(
    {
      error: "Django password login is disabled on the minimal Saath path. Use /signin-with-chatgpt, then enroll via PUT /api/profile.",
      auth: "sites",
    },
    { status: 410 },
  );
}

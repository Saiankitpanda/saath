import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const returnTo = url.searchParams.get("return_to") || "/?view=profile";
  
  // Safe redirect back to the app return path
  const target = returnTo.startsWith("/") ? returnTo : `/${returnTo}`;
  return NextResponse.redirect(new URL(target, request.url));
}


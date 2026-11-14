import { NextResponse } from "next/server";

export async function POST() {
  const response = NextResponse.json({
    success: true,
    message: "Signed out successfully.",
  });

  response.cookies.delete("saath_session");
  response.cookies.delete("saath_auth_user");
  response.cookies.delete("__sites_local_auth");
  response.cookies.set("saath_session", "", { path: "/", maxAge: 0 });
  response.cookies.set("__sites_local_auth", "", { path: "/", maxAge: 0 });

  return response;
}

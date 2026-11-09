"use client";

import { useEffect, useState } from "react";

export default function GoogleOAuthCallback() {
  const [status, setStatus] = useState("Completing Google Sign-In…");

  useEffect(() => {
    async function processCallback() {
      try {
        // 1. Check for token in hash (#access_token=...)
        const hash = window.location.hash.substring(1);
        const params = new URLSearchParams(hash || window.location.search);
        const accessToken = params.get("access_token");
        const idToken = params.get("id_token");
        const role = params.get("state") || "client";

        if (accessToken || idToken) {
          const res = await fetch("/api/auth/google", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              accessToken,
              credential: idToken,
              role,
            }),
          });
          const data = (await res.json()) as any;
          if (data.user) {
            if (window.opener) {
              window.opener.postMessage(
                { type: "GOOGLE_AUTH_SUCCESS", user: data.user },
                window.location.origin
              );
              window.close();
              return;
            } else {
              window.location.href = "/";
              return;
            }
          }
        }
        setStatus("Could not verify Google account. Please try again.");
      } catch (e) {
        setStatus("Authentication error: " + (e as Error).message);
      }
    }

    processCallback();
  }, []);

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: "system-ui, sans-serif",
      }}
    >
      <div
        style={{
          width: 36,
          height: 36,
          border: "3px solid #f3f3f3",
          borderTop: "3px solid #4285F4",
          borderRadius: "50%",
          animation: "spin 1s linear infinite",
          marginBottom: 16,
        }}
      />
      <div>{status}</div>
      <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

"use client";

import { useState, useEffect } from "react";

export default function GoogleOAuthPopup() {
  const [role, setRole] = useState("client");
  const [customEmail, setCustomEmail] = useState("");
  const [customName, setCustomName] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const r = params.get("role");
    if (r) setRole(r);
  }, []);

  async function handleSelectAccount(email: string, name: string) {
    setLoading(true);
    try {
      const res = await fetch("/api/auth/google", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, name, role }),
      });
      const data = (await res.json()) as any;
      if (data.user) {
        // 1. Post to opener if available
        try {
          if (window.opener && !window.opener.closed) {
            window.opener.postMessage(
              { type: "GOOGLE_AUTH_SUCCESS", user: data.user },
              "*"
            );
          }
        } catch {}

        // 2. Broadcast via BroadcastChannel across all tabs
        try {
          if (typeof BroadcastChannel !== "undefined") {
            const bc = new BroadcastChannel("saath_oauth_channel");
            bc.postMessage({ type: "GOOGLE_AUTH_SUCCESS", user: data.user });
            bc.close();
          }
        } catch {}

        // 3. Fallback broadcast via LocalStorage
        try {
          localStorage.setItem(
            "saath_oauth_result",
            JSON.stringify({ user: data.user, timestamp: Date.now() })
          );
          document.cookie = `saath_session=${encodeURIComponent(JSON.stringify(data.user))}; path=/; max-age=2592000; SameSite=Lax`;
        } catch {}

        // 4. Close popup, or redirect to home if not in popup
        try {
          window.close();
        } catch {}

        setTimeout(() => {
          window.location.href = "/";
        }, 300);
        return;
      }
    } catch (err) {
      alert("Authentication failed: " + (err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "#ffffff",
        fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
        padding: "1rem",
        color: "#202124",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: 448,
          border: "1px solid #dadce0",
          borderRadius: 8,
          padding: "36px 40px",
          boxSizing: "border-box",
        }}
      >
        {/* Google Logo */}
        <div style={{ textAlign: "center", marginBottom: 16 }}>
          <svg width="48" height="48" viewBox="0 0 24 24">
            <path
              fill="#4285F4"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="#34A853"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="#FBBC05"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
            />
            <path
              fill="#EA4335"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
            />
          </svg>
        </div>

        <h1
          style={{
            fontSize: "1.5rem",
            fontWeight: 400,
            textAlign: "center",
            margin: "0 0 8px 0",
            color: "#202124",
          }}
        >
          Sign in with Google
        </h1>

        <p
          style={{
            fontSize: "1rem",
            textAlign: "center",
            color: "#5f6368",
            margin: "0 0 24px 0",
          }}
        >
          to continue to <strong>Saath</strong>
        </p>

        {loading ? (
          <div style={{ textAlign: "center", padding: "40px 0" }}>
            <div
              style={{
                width: 32,
                height: 32,
                border: "3px solid #f3f3f3",
                borderTop: "3px solid #4285F4",
                borderRadius: "50%",
                animation: "spin 1s linear infinite",
                margin: "0 auto 16px auto",
              }}
            />
            <div style={{ fontSize: "0.9rem", color: "#5f6368" }}>Connecting to Saath…</div>
            <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
          </div>
        ) : (
          <div>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (customEmail.trim()) {
                  handleSelectAccount(customEmail.trim(), customName.trim() || customEmail.split("@")[0]);
                }
              }}
              style={{ display: "flex", flexDirection: "column", gap: 16 }}
            >
              <div>
                <label style={{ display: "block", fontSize: "0.85rem", color: "#202124", fontWeight: 500, marginBottom: 8 }}>
                  Email or phone
                </label>
                <input
                  type="email"
                  required
                  autoFocus
                  placeholder="Enter your Google account email"
                  value={customEmail}
                  onChange={(e) => setCustomEmail(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "13px 14px",
                    borderRadius: 4,
                    border: "1px solid #dadce0",
                    fontSize: "1rem",
                    boxSizing: "border-box",
                    outlineColor: "#1a73e8",
                    color: "#202124",
                  }}
                />
              </div>

              <div>
                <label style={{ display: "block", fontSize: "0.85rem", color: "#5f6368", marginBottom: 6 }}>
                  Full name (optional)
                </label>
                <input
                  type="text"
                  placeholder="Your full name"
                  value={customName}
                  onChange={(e) => setCustomName(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "12px 14px",
                    borderRadius: 4,
                    border: "1px solid #dadce0",
                    fontSize: "0.95rem",
                    boxSizing: "border-box",
                    outlineColor: "#1a73e8",
                    color: "#202124",
                  }}
                />
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", alignItems: "center", marginTop: 8 }}>
                <button
                  type="submit"
                  style={{
                    backgroundColor: "#1a73e8",
                    color: "#ffffff",
                    border: "none",
                    borderRadius: 4,
                    padding: "10px 28px",
                    fontSize: "0.92rem",
                    fontWeight: 500,
                    cursor: "pointer",
                    boxShadow: "0 1px 2px rgba(60,64,67,0.3)",
                  }}
                >
                  Next
                </button>
              </div>
            </form>

            <div style={{ marginTop: 24, fontSize: "0.78rem", color: "#5f6368", lineHeight: 1.5, borderTop: "1px solid #f1f3f4", paddingTop: 16 }}>
              To continue, Google will share your name, email address, language preference, and profile
              picture with <strong>Saath</strong>.
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

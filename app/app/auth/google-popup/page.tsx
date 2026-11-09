"use client";

import { useState, useEffect } from "react";

export default function GoogleOAuthPopup() {
  const [role, setRole] = useState("client");
  const [selectedEmail, setSelectedEmail] = useState("");
  const [customEmail, setCustomEmail] = useState("");
  const [customName, setCustomName] = useState("");
  const [showCustom, setShowCustom] = useState(false);
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
        if (window.opener) {
          window.opener.postMessage(
            { type: "GOOGLE_AUTH_SUCCESS", user: data.user },
            window.location.origin
          );
          window.close();
          return;
        } else {
          // If not in a popup, redirect to home
          window.location.href = "/";
          return;
        }
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
          Choose an account to continue to <strong>Saath</strong>
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
            {!showCustom ? (
              <div style={{ borderTop: "1px solid #dadce0" }}>
                {/* Account Item 1 */}
                <button
                  type="button"
                  onClick={() => handleSelectAccount("ankit.sharma@gmail.com", "Ankit Sharma")}
                  style={{
                    width: "100%",
                    display: "flex",
                    alignItems: "center",
                    gap: 16,
                    padding: "12px 8px",
                    background: "transparent",
                    border: "none",
                    borderBottom: "1px solid #f1f3f4",
                    cursor: "pointer",
                    textAlign: "left",
                    transition: "background 0.15s",
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#f8f9fa")}
                  onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
                >
                  <div
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: "50%",
                      backgroundColor: "#7c3aed",
                      color: "#ffffff",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontWeight: 600,
                      fontSize: "1.1rem",
                    }}
                  >
                    A
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 500, fontSize: "0.95rem", color: "#3c4043" }}>
                      Ankit Sharma
                    </div>
                    <div style={{ fontSize: "0.85rem", color: "#5f6368" }}>ankit.sharma@gmail.com</div>
                  </div>
                </button>

                {/* Account Item 2 */}
                <button
                  type="button"
                  onClick={() => handleSelectAccount("priya.patel@gmail.com", "Priya Patel")}
                  style={{
                    width: "100%",
                    display: "flex",
                    alignItems: "center",
                    gap: 16,
                    padding: "12px 8px",
                    background: "transparent",
                    border: "none",
                    borderBottom: "1px solid #f1f3f4",
                    cursor: "pointer",
                    textAlign: "left",
                    transition: "background 0.15s",
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#f8f9fa")}
                  onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
                >
                  <div
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: "50%",
                      backgroundColor: "#059669",
                      color: "#ffffff",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontWeight: 600,
                      fontSize: "1.1rem",
                    }}
                  >
                    P
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 500, fontSize: "0.95rem", color: "#3c4043" }}>
                      Priya Patel
                    </div>
                    <div style={{ fontSize: "0.85rem", color: "#5f6368" }}>priya.patel@gmail.com</div>
                  </div>
                </button>

                {/* Use another account option */}
                <button
                  type="button"
                  onClick={() => setShowCustom(true)}
                  style={{
                    width: "100%",
                    display: "flex",
                    alignItems: "center",
                    gap: 16,
                    padding: "14px 8px",
                    background: "transparent",
                    border: "none",
                    borderBottom: "1px solid #dadce0",
                    cursor: "pointer",
                    textAlign: "left",
                    transition: "background 0.15s",
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#f8f9fa")}
                  onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
                >
                  <div
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: "50%",
                      backgroundColor: "#f1f3f4",
                      color: "#5f6368",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: "1.2rem",
                    }}
                  >
                    +
                  </div>
                  <div style={{ fontWeight: 500, fontSize: "0.95rem", color: "#1a73e8" }}>
                    Use another Google account
                  </div>
                </button>
              </div>
            ) : (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  if (customEmail) handleSelectAccount(customEmail, customName || customEmail.split("@")[0]);
                }}
                style={{ display: "flex", flexDirection: "column", gap: 14 }}
              >
                <div>
                  <label style={{ display: "block", fontSize: "0.85rem", color: "#5f6368", marginBottom: 6 }}>
                    Email or phone
                  </label>
                  <input
                    type="email"
                    required
                    autoFocus
                    placeholder="Enter your Google email"
                    value={customEmail}
                    onChange={(e) => setCustomEmail(e.target.value)}
                    style={{
                      width: "100%",
                      padding: "12px 14px",
                      borderRadius: 4,
                      border: "1px solid #dadce0",
                      fontSize: "1rem",
                      boxSizing: "border-box",
                      outlineColor: "#1a73e8",
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: "block", fontSize: "0.85rem", color: "#5f6368", marginBottom: 6 }}>
                    Full name (optional)
                  </label>
                  <input
                    type="text"
                    placeholder="Your name"
                    value={customName}
                    onChange={(e) => setCustomName(e.target.value)}
                    style={{
                      width: "100%",
                      padding: "12px 14px",
                      borderRadius: 4,
                      border: "1px solid #dadce0",
                      fontSize: "1rem",
                      boxSizing: "border-box",
                      outlineColor: "#1a73e8",
                    }}
                  />
                </div>

                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 8 }}>
                  <button
                    type="button"
                    onClick={() => setShowCustom(false)}
                    style={{
                      background: "none",
                      border: "none",
                      color: "#1a73e8",
                      fontSize: "0.9rem",
                      fontWeight: 500,
                      cursor: "pointer",
                      padding: 0,
                    }}
                  >
                    ← Back to account list
                  </button>

                  <button
                    type="submit"
                    style={{
                      backgroundColor: "#1a73e8",
                      color: "#ffffff",
                      border: "none",
                      borderRadius: 4,
                      padding: "10px 24px",
                      fontSize: "0.9rem",
                      fontWeight: 500,
                      cursor: "pointer",
                    }}
                  >
                    Next
                  </button>
                </div>
              </form>
            )}

            <div style={{ marginTop: 24, fontSize: "0.78rem", color: "#5f6368", lineHeight: 1.5 }}>
              To continue, Google will share your name, email address, language preference, and profile
              picture with <strong>Saath</strong>.
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

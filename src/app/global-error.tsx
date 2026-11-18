"use client";

/** Root error boundary — replaces the whole document on catastrophic failures. */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          fontFamily: "system-ui, -apple-system, Segoe UI, sans-serif",
          background: "#f8fafc",
          color: "#0f172a",
        }}
      >
        <main
          style={{
            minHeight: "100vh",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "24px",
          }}
        >
          <div
            style={{
              maxWidth: "480px",
              width: "100%",
              background: "#fff",
              borderRadius: "24px",
              border: "1px solid #e2e8f0",
              padding: "32px",
              textAlign: "center",
            }}
          >
            <p style={{ fontSize: 48, margin: 0 }}>⚠️</p>
            <h1 style={{ fontSize: 24, margin: "16px 0 8px" }}>FixMate hit an error</h1>
            <p style={{ fontSize: 14, color: "#64748b", lineHeight: 1.6 }}>
              The application failed to start this view. Reload the page or try again.
            </p>
            <pre
              style={{
                background: "#f1f5f9",
                borderRadius: 12,
                padding: 12,
                fontSize: 12,
                textAlign: "left",
                overflowX: "auto",
                color: "#475569",
              }}
            >
              {error.message || "Unknown error"}
            </pre>
            <button
              type="button"
              onClick={reset}
              style={{
                marginTop: 16,
                background: "#059669",
                color: "#fff",
                border: 0,
                borderRadius: 12,
                padding: "12px 24px",
                fontWeight: 700,
                cursor: "pointer",
              }}
            >
              Try again
            </button>
          </div>
        </main>
      </body>
    </html>
  );
}

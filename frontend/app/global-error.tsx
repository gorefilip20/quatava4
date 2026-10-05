"use client";

import { useEffect } from "react";

export const dynamic = "force-dynamic";

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error("Global application error", error);
  }, [error]);

  return (
    <html lang="en">
      <body style={{ margin: 0, fontFamily: "system-ui, sans-serif", background: "#f6f8fb", color: "#182536" }}>
        <main style={{ minHeight: "100vh", display: "grid", placeItems: "center", padding: 24 }}>
          <section style={{ maxWidth: 520, width: "100%", padding: 32, border: "1px solid #dfe5ec", borderRadius: 12, background: "#fff", boxShadow: "0 12px 32px rgba(15, 23, 42, 0.08)" }}>
            <p style={{ margin: 0, fontSize: 11, fontWeight: 800, letterSpacing: "0.14em", textTransform: "uppercase", color: "#2876b3" }}>Quatava</p>
            <h1 style={{ margin: "12px 0 8px", fontSize: 24 }}>Something went wrong</h1>
            <p style={{ margin: 0, color: "#657286", lineHeight: 1.6 }}>The application encountered an unexpected error. Your balances and transaction records were not changed by this page error.</p>
            <button onClick={() => reset()} style={{ marginTop: 24, border: 0, borderRadius: 7, padding: "11px 16px", background: "#2876b3", color: "#fff", fontWeight: 700, cursor: "pointer" }}>Try again</button>
          </section>
        </main>
      </body>
    </html>
  );
}

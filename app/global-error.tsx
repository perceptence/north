"use client";

import { useEffect } from "react";
import "./globals.css";

/**
 * The last boundary — when the root layout itself throws.
 *
 * Next replaces the ENTIRE document here, so this file owns `<html>` and
 * `<body>`, and none of the layout's font variables are in scope. That is why
 * this is the one screen in the product written without the type system:
 * there is no `--font-newsreader` to reach for, and a serif that silently
 * falls back to Times is worse than a chosen fallback.
 *
 * ── WHY IT EXISTS AT ALL, GIVEN IT SHOULD NEVER RENDER ────────────────────
 * The alternative is Next's own screen — "Application error: a client-side
 * exception has occurred" — on a product whose non-negotiable is that errors
 * never imply the user's money is affected. That sentence, on a money app,
 * reads as *your money is gone*. Even at the very bottom of the stack the
 * coach's two rules hold: say what is still fine, and do not break character.
 *
 * Deliberately does NOT use `ErrorState` — that component imports `cn` and
 * the token layer, and this boundary catches failures that may include the
 * layout that establishes them. Self-contained is the point.
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          minHeight: "100dvh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "2rem",
          background: "#faf8f5",
          color: "#1c1a17",
          fontFamily: "ui-sans-serif, system-ui, -apple-system, sans-serif",
        }}
      >
        <div style={{ maxWidth: "32rem" }}>
          <h1
            style={{
              fontFamily: "ui-serif, Georgia, Cambria, serif",
              fontSize: "1.75rem",
              fontWeight: 400,
              lineHeight: 1.3,
              margin: "0 0 1rem",
            }}
          >
            I can&rsquo;t get to your situation just now.
          </h1>
          <p
            style={{
              fontSize: "0.9375rem",
              lineHeight: 1.6,
              margin: "0 0 1.75rem",
              color: "#57534e",
            }}
          >
            Nothing you&rsquo;ve told me has been lost, and none of your money
            has moved — North only ever reads.
          </p>
          <button
            type="button"
            onClick={reset}
            style={{
              font: "inherit",
              fontSize: "0.9375rem",
              cursor: "pointer",
              padding: "0.6rem 1.25rem",
              borderRadius: "999px",
              border: "1px solid #1c1a17",
              background: "transparent",
              color: "inherit",
            }}
          >
            Try again
          </button>
        </div>
      </body>
    </html>
  );
}

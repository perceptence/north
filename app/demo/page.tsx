"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { CoachPresence } from "@/components/nds";
import { CALLBACK_AFTER_DAYS } from "@/core/decisions";
import { seedDemoStory } from "@/lib/demo-story";

/**
 * `/demo` — the direct route to the seeded story.
 *
 * Arrival seeds inline so its wordmark can travel unbroken; this page exists
 * for anyone who types the URL, links to it, or wants to re-seed. Visiting
 * again re-seeds — it is its own reset.
 *
 * ── `?at=return` — THE SECOND MOMENT ──────────────────────────────────────
 * The same story, aged past the callback window, so Today opens on North
 * asking whether the commitment happened. That screen is the one
 * docs/STRATEGY.md calls the moat — *"the stage every competitor is
 * structurally incapable of"* — and until this parameter existed a reviewer
 * on the live link could not reach it at all without waiting three real days.
 *
 * A URL rather than a control, for two reasons: it is shareable and it is
 * screenshot-stable, which docs/ARCHITECTURE.md's determinism section asks
 * for. Read straight off `location` rather than through `useSearchParams`,
 * because this component's whole body is an effect that redirects — pulling
 * in the hook would force a Suspense boundary around a page that renders one
 * mark for a single frame.
 */
export default function DemoPage() {
  const router = useRouter();

  useEffect(() => {
    const at = new URLSearchParams(window.location.search).get("at");
    // One day past the window, not exactly on it — a boundary is a bad place
    // to stand when the reviewer's clock is not ours.
    seedDemoStory(at === "return" ? { agedDays: CALLBACK_AFTER_DAYS + 1 } : {});
    router.replace("/today");
  }, [router]);

  return (
    <div className="flex min-h-dvh items-center justify-center">
      <CoachPresence announce />
    </div>
  );
}

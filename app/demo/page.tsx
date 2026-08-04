"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { CoachPresence } from "@/components/nds";
import { CALLBACK_AFTER_DAYS } from "@/core/decisions";
import { seedDemoStory, type DemoStage } from "@/lib/demo-story";
import { clearDecisions } from "@/state/decisions-store";
import { clearProfile } from "@/state/profile-store";

/**
 * `/demo` — the door onto any moment in the story.
 *
 * Arrival seeds inline so its wordmark can travel unbroken; this page exists
 * for anyone who types the URL, links to it, or wants to re-seed. Visiting
 * again re-seeds — it is its own reset.
 *
 * ── `?at=` — WHICH MOMENT ─────────────────────────────────────────────────
 * The product's journeys are otherwise one-way. Arrival offers two doors and
 * once you take one you cannot reach the other: nothing anywhere routes to
 * `/`, so a reviewer who borrows the story never sees the onboarding
 * conversation where the thesis lives, and one who onboards never sees the
 * seeded ledger, letter or story. Worse, the only in-product link to `/demo`
 * sits on the story's too-early state, itself reachable only from an Insights
 * link that is hidden unless a story already exists — so the reset was
 * unreachable by exactly the person who needed it.
 *
 * Each moment is a URL rather than a control: shareable, screenshot-stable
 * (docs/ARCHITECTURE.md, determinism), and it keeps every one of these out of
 * the product's own IA. `/preview` renders them as a panel.
 *
 * Read straight off `location` rather than through `useSearchParams`, because
 * this component's whole body is an effect that redirects — pulling in the
 * hook would force a Suspense boundary around a page that renders one mark
 * for a single frame.
 */

interface Moment {
  /** How to age the seeded story, or `null` to wipe and start clean. */
  stage: DemoStage | null;
  to: string;
}

const MOMENTS: Record<string, Moment> = {
  /** The flagship: a decision offered, with nine months of record behind it. */
  reveal: { stage: {}, to: "/today" },
  /**
   * The moat. Aged one day past the callback window — a boundary is a bad
   * place to stand when the reviewer's clock is not ours.
   */
  return: { stage: { agedDays: CALLBACK_AFTER_DAYS + 1 }, to: "/today" },
  /** How this person got here, as the scrollable story. */
  story: { stage: {}, to: "/story" },
  /**
   * The other door. Wipes first, because onboarding with a profile already on
   * file is not the onboarding a reviewer wants to see — and this is the only
   * caller `clearProfile` has ever had.
   */
  onboarding: { stage: null, to: "/start" },
};

export default function DemoPage() {
  const router = useRouter();

  useEffect(() => {
    const at = new URLSearchParams(window.location.search).get("at");
    const moment = (at && MOMENTS[at]) || MOMENTS.reveal;

    if (moment.stage === null) {
      clearProfile();
      clearDecisions();
    } else {
      seedDemoStory(moment.stage);
    }

    router.replace(moment.to);
  }, [router]);

  return (
    <div className="flex min-h-dvh items-center justify-center">
      <CoachPresence announce />
    </div>
  );
}

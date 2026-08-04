"use client";

import { useState } from "react";
import { Wordmark } from "@/components/nds";
import { cn } from "@/lib/cn";
import { useHydrated } from "@/lib/use-hydrated";
import { useMembership } from "@/state/membership-store";
import { MembershipSheet } from "./MembershipSheet";
import { SKY_HEIGHT } from "./Sky";

/**
 * The app bar — the mark, and the standing you have with it.
 *
 * ── HOW IT GOT HERE ───────────────────────────────────────────────────────
 * The shell used to spend TWO rows on chrome: a band of sky holding a 13px
 * wordmark with 59px of nothing beneath it, then a gap, then each screen's
 * own overline. On an 812px phone that put the first real content at 184px —
 * 23% of the viewport gone before the coach said anything.
 *
 * The first fix moved each screen's name UP onto the wordmark's row. That
 * bought the space, but it put the name in the wrong place twice over: the
 * dock at the bottom already says which tab you are on, so the bar was
 * repeating it — and the two screens whose label carried real information
 * ("Today · JUL 28", the letter's date range) were keeping content out of the
 * content.
 *
 * So the labels went back into the page, where a letter puts its dateline, and
 * the bar kept only the thing that belongs to the app rather than the screen.
 *
 * ── THE PLUS WORDLET ──────────────────────────────────────────────────────
 * Shown ONLY to members: status, never an ad — a free user's masthead is
 * exactly as quiet as it always was, because a standing upsell on the calm
 * screens is the register this product refuses. For members it is the manage
 * handle: membership is an overlay reachable from every screen, not a fifth
 * destination and not a settings screen, which keeps both hard rules intact.
 * (Free users reach the same sheet through the thing they reached for — a
 * locked scenario, the voice launcher, a second goal.)
 */

export function Masthead() {
  const hydrated = useHydrated();
  const membership = useMembership();
  const [managing, setManaging] = useState(false);

  return (
    <div
      className={cn(
        "flex items-center justify-between text-text-on-deep",
        SKY_HEIGHT,
      )}
    >
      <Wordmark height={13} strokeWidth={2} />

      {/* Gated on hydration like every localStorage read — the server cannot
          know the tier, and guessing is a hydration mismatch. */}
      {hydrated && membership.tier === "plus" && (
        <button
          type="button"
          onClick={() => setManaging(true)}
          aria-label="Your Plus membership"
          className={cn(
            "type-overline hit-target cursor-pointer rounded-full",
            "opacity-70 transition-opacity duration-[--motion-micro] hover:opacity-100",
          )}
        >
          Plus
        </button>
      )}

      <MembershipSheet open={managing} onClose={() => setManaging(false)} />
    </div>
  );
}

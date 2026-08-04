"use client";

import { useState } from "react";
import Link from "next/link";
import { Wordmark } from "@/components/nds";
import { cn } from "@/lib/cn";
import { useHydrated } from "@/lib/use-hydrated";
import { useAccount } from "@/state/account-store";
import { useMembership } from "@/state/membership-store";
import { MembershipSheet } from "./MembershipSheet";
import { AvatarMark } from "./SignUp";
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
 * ── MEMBERSHIP IS WORN BY THE MARK ────────────────────────────────────────
 * A member's masthead carries the Plus LOCKUP — NORTH with the ensign, the
 * same play a masthead makes with a dagger after a name — instead of a
 * word floating at the far edge. The mark itself is locked and untouched;
 * the lockup extends it with the same pen (see Wordmark's note). Tapping
 * the lockup opens the membership room, so it is also the manage handle:
 * an overlay reachable from every screen, not a fifth destination and not
 * a settings screen.
 *
 * A free user's masthead is exactly as quiet as it always was — plain
 * NORTH, no upsell. Status, never an ad.
 */

export function Masthead() {
  const hydrated = useHydrated();
  const membership = useMembership();
  const account = useAccount();
  const [managing, setManaging] = useState(false);

  return (
    <div
      className={cn(
        "flex items-center justify-between text-text-on-deep",
        SKY_HEIGHT,
      )}
    >
      {/* Gated on hydration like every localStorage read — the server
          cannot know the tier, and guessing is a hydration mismatch. Until
          it resolves, the plain mark: nobody is shown Plus by accident. */}
      {hydrated && membership.tier === "plus" ? (
        <button
          type="button"
          onClick={() => setManaging(true)}
          aria-label="Your Plus membership"
          className="cursor-pointer rounded-sm transition-opacity duration-[--motion-micro] hover:opacity-80"
        >
          <Wordmark height={13} strokeWidth={2} plus label="" />
        </button>
      ) : (
        <Wordmark height={13} strokeWidth={2} />
      )}

      {/* The avatar is the way into the account — where an account always
          is, and pointedly NOT a fifth thing in the dock. */}
      {hydrated && account && (
        <Link
          href="/account"
          aria-label="Your account"
          className="rounded-full transition-opacity duration-[--motion-micro] hover:opacity-80"
        >
          <AvatarMark account={account} size={28} />
        </Link>
      )}

      <MembershipSheet open={managing} onClose={() => setManaging(false)} />
    </div>
  );
}

"use client";

import { Button, RHYTHM, SectionHeading, Text } from "@/components/nds";
import {
  NEVER_GATED,
  PLUS_INCLUDES,
  PLUS_PRICE_CENTS,
} from "@/core/membership";
import { cn } from "@/lib/cn";
import {
  beginPlus,
  endPlus,
  keepPlus,
  useMembership,
} from "@/state/membership-store";
import { ActionLink } from "./ActionGlyphs";
import { ExplanationPanel } from "./ExplanationPanel";

/**
 * Plus — proposed, managed, and ended in one room.
 *
 * ── HOW IT IS PROPOSED ────────────────────────────────────────────────────
 * Contextually, never as an interstitial. A locked scenario row, the voice
 * launcher on free, a second goal — each opens this sheet at the moment you
 * reached for the thing, and the sheet explains itself in the coach's voice.
 * There is no popup, no timer, and no badge shouting from the calm screens.
 *
 * ── THE HONESTY LINE IS LOAD-BEARING ──────────────────────────────────────
 * `NEVER_GATED` comes from core with the rules it describes, and the rules'
 * tests assert the sentence still tells the truth. The paywall carries its
 * own limits on its face.
 *
 * ── ENDING IS AS EASY AS BEGINNING ────────────────────────────────────────
 * One tap each way. Cancel marks the period as ending and keeps everything
 * until it does — no confirmation dialog, no "are you sure", no discount
 * offered at the door. Downgrade IS cancel: there are two tiers. The calm
 * register applies most where products usually abandon it.
 *
 * ── ONE SHEET, THREE STATES ───────────────────────────────────────────────
 * Free (the proposal) · Plus (the standing) · Plus-ending (the undo). All
 * three are the same room so "manage" is never a different place than the
 * one that sold it to you.
 */

/** $4.99 — formatted here at the edge, from the integer-cents rule. */
const PRICE = `$${(PLUS_PRICE_CENTS / 100).toFixed(2)}`;

/** A date the way the coach says dates — never a timestamp. */
function dayWord(iso: string | undefined): string {
  if (!iso) return "";
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

export function MembershipSheet({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const membership = useMembership();
  const plus = membership.tier === "plus";
  const ending = plus && membership.endsAtPeriodEnd;

  return (
    <ExplanationPanel
      open={open}
      onClose={onClose}
      eyebrow="North Plus"
      thesis={
        plus
          ? ending
            ? `Plus ends ${dayWord(membership.renewsAt)}. Until then, everything stays.`
            : "You’re on Plus."
          : "The coaching is yours either way. Plus buys room to think."
      }
    >
      <div className={cn("flex flex-col", RHYTHM.screen)}>
        <div className={cn("flex flex-col", RHYTHM.heading)}>
          <SectionHeading>
            {plus ? "What you have" : "What Plus holds"}
          </SectionHeading>
          <ul className={cn("flex flex-col", RHYTHM.pair)}>
            {PLUS_INCLUDES.map((line) => (
              <li key={line} className="type-body text-text-primary">
                {line}
              </li>
            ))}
          </ul>
        </div>

        {/* The paywall carries its own limits on its face. Quiet, but never
            absent — this is the sentence that keeps the room honest. The
            second line names the free path out loud: everything voice can
            answer, the typed coach answers free, so nothing SAYABLE is ever
            behind this sheet — only the saying of it aloud. */}
        <Text variant="meta" tone="tertiary" measure>
          {NEVER_GATED} Ask anything in writing on Navigator, free — voice
          answers with the same engine, out loud.
        </Text>

        {plus ? (
          <div className={cn("flex flex-col items-start", RHYTHM.heading)}>
            <Text variant="meta" tone="tertiary">
              Since {dayWord(membership.since)} ·{" "}
              {ending ? "runs out" : "renews"} {dayWord(membership.renewsAt)}
            </Text>
            {ending ? (
              <ActionLink onClick={() => keepPlus()}>Keep Plus</ActionLink>
            ) : (
              /* One tap, no ceremony. The room stays open so the new state —
                 with its undo — is read in place rather than vanishing. */
              <ActionLink onClick={() => endPlus()}>End Plus</ActionLink>
            )}
          </div>
        ) : (
          <div className={cn("flex flex-col items-start", RHYTHM.heading)}>
            <Text variant="meta" tone="tertiary">
              {PRICE} a month · ends whenever you say, one tap
            </Text>
            <Button variant="primary" onClick={() => beginPlus()}>
              Begin Plus
            </Button>
          </div>
        )}
      </div>
    </ExplanationPanel>
  );
}

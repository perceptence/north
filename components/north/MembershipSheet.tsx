"use client";

import { useState } from "react";
import { Button, RHYTHM, SectionHeading, Text } from "@/components/nds";
import {
  NEVER_GATED,
  PLUS_PRICE_CENTS,
  TIER_LINES,
  type Tier,
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
 * Plus — compared, bought, managed, and ended in one room.
 *
 * ── IT SHOWS BOTH TIERS, ALWAYS ───────────────────────────────────────────
 * It used to list only what Plus holds, which is an advertisement rather
 * than a comparison — and it misrepresented the product, because the free
 * tier here is a complete coach and most lines of the table already say yes
 * on both sides. Someone deciding whether to pay can now see exactly what
 * they already have next to what they would be adding. The rows come from
 * `core/membership` so the sheet cannot drift from the gates.
 *
 * ── THE PAYMENT STEP IS REAL, AND LABELLED ────────────────────────────────
 * Upgrading goes through a checkout: what you are buying, what it costs,
 * when it renews, and how to stop. That step exists because a subscription
 * with no confirmation is how products get accused of tricking people, and
 * because the demo should show the whole shape.
 *
 * What it does NOT do is collect a card. There is no processor, so a card
 * form would be a prop — and a prop that asks for a card number is the one
 * piece of theatre this product must never perform. It says so on the
 * button and in the line beneath it.
 *
 * ── AND ENDING IS AS EASY AS BEGINNING ────────────────────────────────────
 * One tap, runs to period end, everything stays until then, "Keep Plus"
 * undoes it in place. No confirmation dialog, no retention offer. Downgrade
 * IS cancel — there are two tiers.
 */

const PRICE = `$${(PLUS_PRICE_CENTS / 100).toFixed(2)}`;

function dayWord(iso: string | undefined): string {
  if (!iso) return "";
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

/** A cell: `true` renders the mark, prose renders as prose. */
function Cell({ value, mine }: { value: string | true; mine: boolean }) {
  return (
    <span
      className={cn(
        "type-meta",
        mine ? "text-text-primary" : "text-text-tertiary",
      )}
    >
      {value === true ? "Included" : value}
    </span>
  );
}

function Comparison({ tier }: { tier: Tier }) {
  return (
    <div className={cn("flex flex-col", RHYTHM.heading)}>
      <SectionHeading>What each one holds</SectionHeading>

      {/* ── STACKED, NOT A THREE-COLUMN TABLE ─────────────────────────────
          It WAS three columns — feature, free, plus — and on a 375px phone
          the feature column collapsed to roughly one word per line: "The /
          daily / read, / and / the / decision / behind / it". A comparison
          nobody can read compares nothing.

          So each line states what the thing IS on its own full-measure row,
          and the two answers sit beneath it in a pair of columns. That fits
          the phone, and the eye still runs down either side to compare. No
          breakpoint fork: one layout that works at every width beats two
          that each work at one. */}
      <ul className="flex flex-col">
        {TIER_LINES.map((line) => (
          <li
            key={line.what}
            className={cn(
              "flex flex-col border-t border-line-hairline py-3 first:border-t-0 first:pt-0",
              RHYTHM.pair,
            )}
          >
            <span className="type-body text-text-primary">{line.what}</span>
            <div className="grid grid-cols-2 gap-x-4">
              <span className="flex flex-col gap-0.5">
                <span
                  className={cn(
                    "type-overline",
                    tier === "free" ? "text-text-secondary" : "text-text-tertiary",
                  )}
                >
                  Free{tier === "free" ? " · you" : ""}
                </span>
                <Cell value={line.free} mine={tier === "free"} />
              </span>
              <span className="flex flex-col gap-0.5">
                <span
                  className={cn(
                    "type-overline",
                    tier === "plus" ? "text-text-secondary" : "text-text-tertiary",
                  )}
                >
                  Plus{tier === "plus" ? " · you" : ""}
                </span>
                <Cell value={line.plus} mine={tier === "plus"} />
              </span>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

/** Where the sheet is in the upgrade, when there is one running. */
type Stage = "comparing" | "checkout";

export function MembershipSheet({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const membership = useMembership();
  const [stage, setStage] = useState<Stage>("comparing");
  /**
   * Stamped when checkout is ENTERED, not read during render.
   *
   * "Renews a month from today" needs the clock, and a component that reads
   * the clock while rendering is impure — it produces a different tree on
   * every pass and the lint rule that caught it is right to. An event is
   * where a timestamp belongs; the render just prints it.
   */
  const [renewsOn, setRenewsOn] = useState<string | null>(null);
  const plus = membership.tier === "plus";
  const ending = plus && membership.endsAtPeriodEnd;

  /**
   * Closing resets the stage, so reopening never resumes mid-checkout — a
   * room reopened is a room entered, and finding yourself already halfway
   * through a purchase is exactly the surprise this sheet exists to avoid.
   *
   * Done on the way out rather than in an effect watching `open`: the panel
   * routes every dismissal — button, Escape, backdrop, the system Back
   * gesture — through this one callback, so there is nothing left to catch.
   */
  const close = () => {
    setStage("comparing");
    onClose();
  };

  return (
    <ExplanationPanel
      open={open}
      onClose={close}
      eyebrow={stage === "checkout" ? "Confirm" : "North Plus"}
      thesis={
        stage === "checkout"
          ? `North Plus, ${PRICE} a month.`
          : plus
            ? ending
              ? `Plus ends ${dayWord(membership.renewsAt)}. Until then, everything stays.`
              : "You’re on Plus."
            : "The coaching is yours either way. Plus buys room to think."
      }
    >
      <div className={cn("flex flex-col", RHYTHM.screen)}>
        {stage === "checkout" ? (
          <>
            <div className={cn("flex flex-col", RHYTHM.heading)}>
              <SectionHeading>What happens</SectionHeading>
              <ul className={cn("flex flex-col", RHYTHM.pair)}>
                <li className="type-body text-text-primary">
                  {PRICE} a month, starting today.
                </li>
                <li className="type-body text-text-primary">
                  Renews {dayWord(renewsOn ?? undefined)}, and every month
                  after that.
                </li>
                <li className="type-body text-text-primary">
                  Ends whenever you say — one tap, and everything stays until
                  the month you paid for runs out.
                </li>
              </ul>
            </div>

            <div className={cn("flex flex-col items-start", RHYTHM.heading)}>
              {/* Stated on the button itself, not only in the small print. */}
              <Button
                variant="primary"
                onClick={() => {
                  beginPlus();
                  setStage("comparing");
                }}
              >
                Complete upgrade — demo, no card
              </Button>
              <Text variant="meta" tone="tertiary" measure>
                This build has no payment processor and takes no card details.
                In a released version this step hands off to the App Store or
                a payment link, which is also why North still needs no account
                on a server.
              </Text>
              <ActionLink onClick={() => setStage("comparing")}>
                Back to the comparison
              </ActionLink>
            </div>
          </>
        ) : (
          <>
            <Comparison tier={membership.tier} />

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
                  <ActionLink onClick={() => endPlus()}>End Plus</ActionLink>
                )}
              </div>
            ) : (
              <div className={cn("flex flex-col items-start", RHYTHM.heading)}>
                <Text variant="meta" tone="tertiary">
                  {PRICE} a month · ends whenever you say, one tap
                </Text>
                <Button
                  variant="primary"
                  onClick={() => {
                    setRenewsOn(
                      new Date(Date.now() + 30 * 86_400_000).toISOString(),
                    );
                    setStage("checkout");
                  }}
                >
                  Upgrade to Plus
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </ExplanationPanel>
  );
}

"use client";

import { useState } from "react";
import { Button, RHYTHM, SectionHeading, Text, Wordmark } from "@/components/nds";
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

/** A held line, ticked with the product's pen — never a text checkmark. */
function Tick() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 16 16"
      className="mt-1 size-4 shrink-0 text-text-tertiary"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.25"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M3 8.5 L6.5 12 L13 4.5" />
    </svg>
  );
}

/** "Yours now" — worn by the panel that describes the reader's own tier. */
function YoursNow() {
  return (
    <span className="type-overline whitespace-nowrap rounded-full border border-line-hairline px-2.5 py-1 text-text-tertiary">
      Yours now
    </span>
  );
}

function PanelRow({ label, note }: { label: string; note?: string }) {
  return (
    <li className="flex items-start gap-2.5">
      <Tick />
      <span className="flex flex-col">
        <span className="type-body text-text-primary">{label}</span>
        {note && <span className="type-meta text-text-tertiary">{note}</span>}
      </span>
    </li>
  );
}

/**
 * The tiers as two PANELS, not a grid of cells.
 *
 * ── WHY PANELS ────────────────────────────────────────────────────────────
 * The first pass was a three-column table, unreadable at 375px; the second
 * stacked every line with a FREE/PLUS pair under each, which read as a
 * spreadsheet transposed — eight repetitions of the word "Included" and no
 * shape. What a person actually asks is "what do I have, and what would I
 * be adding?" — two questions, two surfaces.
 *
 * The Free panel lists everything free holds, in full sentences, because
 * this product's free tier is a complete coach and the panel should look
 * like one. The Plus panel opens "Everything in Free, plus" — the honest
 * version of the pattern every service uses — and lists only what changes.
 * Both are derived from `TIER_LINES` in core, so the panels cannot drift
 * from the gates.
 *
 * ── THE PLUS PANEL WEARS THE LOCKUP ───────────────────────────────────────
 * Its header is NORTH⁺ — the same lockup a member's masthead carries — so
 * the thing being bought and the thing worn afterwards are one mark. The
 * Free panel's header is a plain overline: the asymmetry is the point.
 *
 * No shadow on either: elevation belongs to the decision Card alone. The
 * reader's own tier carries a quiet "Yours now" pill rather than a border
 * treatment — hue is not how this product says "you are here".
 */
function Comparison({ tier }: { tier: Tier }) {
  const kept = TIER_LINES.filter((line) => line.free === true);
  const reduced = TIER_LINES.filter(
    (line) => line.free !== true && line.free !== "—",
  );
  const added = TIER_LINES.filter((line) => line.free !== true);

  return (
    <div className="grid gap-4 md:grid-cols-2 md:items-start">
      {/* ── FREE ─────────────────────────────────────────────────────── */}
      <section
        aria-label="What Free holds"
        className={cn(
          "flex flex-col rounded-sheet border border-line-hairline p-5",
          RHYTHM.heading,
        )}
      >
        <div className="flex items-baseline justify-between gap-3">
          <div className="flex flex-col gap-1">
            <span className="type-overline text-text-secondary">Free</span>
            <span className="type-meta text-text-tertiary">
              The whole coach, one thing at a time
            </span>
          </div>
          {tier === "free" && <YoursNow />}
        </div>
        <ul className={cn("flex flex-col", RHYTHM.pair)}>
          {kept.map((line) => (
            <PanelRow key={line.what} label={line.what} />
          ))}
          {reduced.map((line) => (
            <PanelRow
              key={line.what}
              label={line.what}
              note={typeof line.free === "string" ? line.free : undefined}
            />
          ))}
        </ul>
      </section>

      {/* ── PLUS ─────────────────────────────────────────────────────── */}
      <section
        aria-label="What Plus adds"
        className={cn(
          "flex flex-col rounded-sheet border border-line-hairline bg-surface-raised p-5",
          RHYTHM.heading,
        )}
      >
        <div className="flex items-baseline justify-between gap-3">
          <div className="flex flex-col gap-1">
            {/* The lockup a member's masthead wears — the thing bought and
                the thing worn are one mark. */}
            <Wordmark height={12} strokeWidth={2} plus label="North Plus" />
            <span className="type-meta text-text-tertiary">
              {PRICE} a month · ends whenever you say
            </span>
          </div>
          {tier === "plus" && <YoursNow />}
        </div>
        <div className={cn("flex flex-col", RHYTHM.pair)}>
          <span className="type-meta text-text-secondary">
            Everything in Free, plus
          </span>
          <ul className={cn("flex flex-col", RHYTHM.pair)}>
            {/* Subject first, the upgrade as its note — "Talking to North
                out loud / The whole conversation", never the description
                floating with no subject. Mirrors the Free panel's rows. */}
            {added.map((line) => (
              <PanelRow
                key={line.what}
                label={line.what}
                note={typeof line.plus === "string" ? line.plus : undefined}
              />
            ))}
          </ul>
        </div>
      </section>
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

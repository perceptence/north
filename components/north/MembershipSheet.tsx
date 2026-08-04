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
    /* `line-control`, not `line-hairline`. The hairline token is 1.23
       against paper — it exists to SEPARATE stacked rows, and it cannot
       describe the edge of an object. On a pill it simply vanished.
       `line-control` is the boundary token (3.18, the UI-component gate). */
    <span className="type-overline whitespace-nowrap rounded-full border border-line-control px-2.5 py-1 text-text-secondary">
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
function Comparison({
  tier,
  ending,
  onUpgrade,
  onEnd,
  onKeep,
  since,
  renewsAt,
}: {
  tier: Tier;
  ending: boolean;
  onUpgrade: () => void;
  onEnd: () => void;
  onKeep: () => void;
  since?: string;
  renewsAt?: string;
}) {
  const kept = TIER_LINES.filter((line) => line.free === true);
  const reduced = TIER_LINES.filter(
    (line) => line.free !== true && line.free !== "—",
  );
  const added = TIER_LINES.filter((line) => line.free !== true);

  /*
   * ── A CONTAINER QUERY, NOT A BREAKPOINT ──────────────────────────────
   * `md:grid-cols-2` asked the WINDOW how wide it was, and the window is
   * not what holds these. On desktop this sheet is a right-hand pane about
   * 496px wide, so a 1280px window happily split it into two ~230px
   * columns: "The whole coach, one thing at a time" broken over three
   * lines, every row wrapping mid-phrase. The panels go side by side when
   * THIS BOX is wide enough to carry them and stack otherwise — which on
   * the pane and on any phone means one full-width column, each row on its
   * own line.
   *
   * `items-stretch` (the grid default) rather than `items-start`, so where
   * they DO sit side by side the two are the same height; the actions in
   * each are pushed to the foot with `mt-auto`, so the pair closes on one
   * line instead of one card trailing off.
   */
  return (
    <div className="@container/tiers grid gap-4 @2xl/tiers:grid-cols-2">
      {/* ── FREE ─────────────────────────────────────────────────────── */}
      <section
        aria-label="What Free holds"
        className={cn(
          // Same reason as the pill: these panels are OBJECTS, and an
          // object's edge needs the boundary token, not the separator.
          "flex flex-col rounded-sheet border border-line-control p-5",
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

        {/* The Free panel's own foot, so both cards end on a line rather
            than one trailing off. It says what free costs, which is the
            honest counterpart to the price opposite. */}
        <div className="mt-auto pt-1">
          <Text variant="meta" tone="tertiary">
            Free, always. No card, no trial that ends.
          </Text>
        </div>
      </section>

      {/* ── PLUS ─────────────────────────────────────────────────────── */}
      <section
        aria-label="What Plus adds"
        className={cn(
          // NO border. The Free panel is drawn ON the sheet, so it needs an
          // edge to exist at all; this one is a raised SURFACE against the
          // sheet's sunken paper, and a surface that changes colour does not
          // also need outlining. Two ways of saying "this is a separate
          // object" is one too many, and the border was the weaker of them.
          "flex flex-col rounded-sheet bg-surface-raised p-5",
          RHYTHM.heading,
        )}
      >
        <div className="flex items-baseline justify-between gap-3">
          <div className="flex flex-col gap-1">
            {/* The lockup a member's masthead wears — the thing bought and
                the thing worn are one mark. Painted in the atmosphere HERE
                and only here: this is the moment Plus is being presented,
                and the sheet's one gradient element belongs to the thing on
                offer. The masthead's copy stays ink, because chrome that
                wears the sky on every screen spends that gradient on
                furniture. */}
            <Wordmark
              height={14}
              strokeWidth={2}
              plus
              aurora
              label="North Plus"
            />
            {/* NOT the price. The price moved to this card's foot, next to
                the button that acts on it, and leaving a copy up here meant
                the sheet quoted $4.99 twice in one card — the second time
                three inches below the first. What belongs in a header is
                what the tier IS, answering the Free panel's line opposite:
                one thing at a time ↔ all of it at once. The pacing is the
                difference between the tiers, so the pair of subtitles is
                the comparison in miniature. */}
            <span className="type-meta text-text-tertiary">
              All of it at once, and out loud
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

        {/* ── THE CLOSE, INSIDE THE CARD IT BELONGS TO ──────────────────
            The price and the button used to sit at the foot of the whole
            sheet, a screen-gap below both panels — so the thing you were
            buying and the thing that bought it were two separate objects
            with the Free panel's list between them. A price belongs to its
            product. It reads now as one card: what Plus is, what it costs,
            and the way in. */}
        <div className={cn("mt-auto flex flex-col items-stretch pt-1", RHYTHM.pair)}>
          {tier === "plus" ? (
            <>
              <Text variant="meta" tone="tertiary">
                Since {dayWord(since)} · {ending ? "runs out" : "renews"}{" "}
                {dayWord(renewsAt)}
              </Text>
              {ending ? (
                <ActionLink onClick={onKeep}>Keep Plus</ActionLink>
              ) : (
                <ActionLink onClick={onEnd}>End Plus</ActionLink>
              )}
            </>
          ) : (
            <>
              <Button variant="primary" fullWidth onClick={onUpgrade}>
                Upgrade to Plus
              </Button>
              <Text variant="meta" tone="tertiary">
                {PRICE} a month · ends whenever you say, one tap
              </Text>
            </>
          )}
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
            <Comparison
              tier={membership.tier}
              ending={!!ending}
              since={membership.since}
              renewsAt={membership.renewsAt}
              onUpgrade={() => {
                setRenewsOn(
                  new Date(Date.now() + 30 * 86_400_000).toISOString(),
                );
                setStage("checkout");
              }}
              onEnd={() => endPlus()}
              onKeep={() => keepPlus()}
            />

            <Text variant="meta" tone="tertiary">
              {NEVER_GATED} Ask anything in writing on Navigator, free — voice
              answers with the same engine, out loud.
            </Text>
          </>
        )}
      </div>
    </ExplanationPanel>
  );
}

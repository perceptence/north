"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Button,
  HorizonBand,
  HorizonField,
  RHYTHM,
  RungIndicator,
  Sheet,
  Text,
  TRANSITION,
  m,
} from "@/components/nds";
import {
  callbackDue,
  callbackDueAt,
  committedOn,
  profileWhen,
  recollect,
  settledRungIds,
} from "@/core/decisions";
import { CORRECTABLE, FIELD_BEHIND_RUNG } from "@/core/onboarding/correction";
import type { TurnId } from "@/core/onboarding/script";
import type { Decision } from "@/core/decisions/types";
import { project } from "@/core/projection";
import { evaluate, ILLUSTRATIVE_LIMITS } from "@/core/waterfall";
import type { Read } from "@/core/waterfall";
import {
  appendDecision,
  isPersistent as decisionsPersist,
  resolveDecision,
  useDecisions,
} from "@/state/decisions-store";
import { cn } from "@/lib/cn";
import { useHydrated } from "@/lib/use-hydrated";
import {
  isPersistent as profilePersists,
  useProfile,
  useProfileHistory,
} from "@/state/profile-store";
import { CorrectionTurn } from "./CorrectionTurn";
import { ActionLink, HorizonMark, LedgerMark } from "./ActionGlyphs";
import { DerivationSheet } from "./DerivationSheet";
import { LadderPanel } from "./LadderPanel";
import { ReadProse } from "./ReadProse";

/**
 * Today — the product.
 *
 * ── WHAT THIS SCREEN IS NOT ───────────────────────────────────────────────
 * It is not a dashboard. There is no score, no module grid, no four-goal
 * summary. Everything a "home" screen would scatter across five cards lives
 * here as ONE decision: the direction, the insight, and the upcoming decisions
 * are the same object seen from different angles (docs/STRATEGY.md §7).
 *
 * ── THE INVERSION ─────────────────────────────────────────────────────────
 * In every competing product the number is the hero and the interpretation is a
 * caption. Here the interpretation IS the hero and the numbers live inside it.
 * If a future change puts a big figure on top with a sentence beneath, this
 * screen has reverted to a dashboard (docs/UX-ARCHITECTURE.md §4.3).
 */

/**
 * The figure at stake, for the ledger row.
 *
 * Prefers an INTERROGABLE currency figure. The engine marks a figure
 * interrogable when it is the derived one the decision actually turns on —
 * the excess being moved, the match being left behind. The first currency
 * figure in a read is usually context ("your $140,000 in cash"), which would
 * put a number in the ledger that has nothing to do with what was decided.
 */
function amountFrom(read: Read): number | undefined {
  const figures = read.segments.filter(
    (s) => s.kind === "figure" && s.format === "currency",
  );
  const chosen =
    figures.find((s) => s.kind === "figure" && s.interrogable) ?? figures[0];
  return chosen?.kind === "figure" ? chosen.value : undefined;
}

export function TodayScreen() {
  const router = useRouter();
  const profile = useProfile();
  const decisions = useDecisions();
  // Every past state, so the return callback can recall the day it was made.
  const history = useProfileHistory();

  // `now` is created once and injected. The engine never reads a clock.
  const [now] = useState(() => new Date());
  const hydrated = useHydrated();
  const [sheet, setSheet] = useState<null | "derivation" | "ladder">(null);
  // After acting on a decision, the one field most likely to have changed.
  const [catchUp, setCatchUp] = useState<TurnId | null>(null);

  // Reaching Today without a profile is not an error — it is a route
  // (docs/UX-ARCHITECTURE.md §9, ER5).
  useEffect(() => {
    if (hydrated && !profile) router.replace("/start");
  }, [hydrated, profile, router]);

  const commit = useCallback(
    (rungId: Parameters<typeof appendDecision>[0]["rungId"], read: Read) => {
      appendDecision({
        rungId,
        summary: read.action.commit,
        outcome: "open",
        amountCents: amountFrom(read),
      });
    },
    [],
  );

  const defer = useCallback(
    (rungId: Parameters<typeof appendDecision>[0]["rungId"], read: Read) => {
      appendDecision({
        rungId,
        summary: read.action.commit,
        outcome: "deferred",
        amountCents: amountFrom(read),
      });
    },
    [],
  );

  // Render nothing until we know whether there is a profile — a flash of the
  // empty state before redirecting is worse than a blank beat.
  if (!hydrated || !profile) return null;

  // Safe to read here and not before: both flags are set by the stores' own
  // `load()`, and this sits below the hydration guard above.
  const storageWorks = profilePersists() && decisionsPersist();

  const options = { limits: ILLUSTRATIVE_LIMITS, now };
  // `callbackDue`, not `openDecision`. The ledger records a commitment the
  // instant you make it; the coach waits three days before asking whether it
  // happened. Asking immediately turned the ink button into a screen that
  // replaced itself with a question (core/decisions/callback.ts).
  const pending = callbackDue(decisions, now);
  const evaluation = evaluate(profile, {
    ...options,
    // Deferral and completion both have to mean something: a rung that already
    // has an answer is not asked about again. Deferral's answer expires — see
    // `DEFER_HOLDS_DAYS`.
    skip: settledRungIds(decisions, now),
  });

  /**
   * The commitment already made on the rung Today is about to offer.
   *
   * This is the Steady state (docs/UX-ARCHITECTURE.md §4.3: "the open decision
   * persists; no new one is surfaced until it resolves"), and without it the
   * primary action did nothing a person could see. An `open` decision does not
   * settle its rung — correctly, the money has not moved — so `evaluate`
   * returned the same rung, the same read, and the same two buttons. Pressing
   * the largest ink button in the product changed one tertiary line below the
   * fold, while "Not now" visibly advanced the ladder. The secondary action
   * worked and the primary appeared broken.
   */
  const committed = evaluation.current
    ? committedOn(decisions, evaluation.current.rung.id)
    : null;

  // The situation as it stood the day this was decided, run back through the
  // engine. Null when that day carries nothing worth recalling — the question
  // then stands alone rather than reaching for something to say.
  const recollection = pending
    ? recollect(
        pending,
        profileWhen(history, pending.decidedAt, profile),
        options,
      )
    : null;
  const firstRun = decisions.length === 0;
  // The card carries a compact horizon in its footer — the decision and its
  // long-term consequence in one object (the reference-frame card DNA). The
  // full, scrubbable field lives on Goals.
  const projection = pending ? null : project(profile, options);

  /**
   * Staged on the first run — the reveal is the one place slowness is correct.
   * On every visit after, the same entrance plays without the delay, and the
   * card is KEYED on what it is showing (below) so a changed decision animates
   * in rather than swapping silently. That is the point of the motion: it says
   * "this is different now", which a silent swap cannot.
   */
  const stage = (delay: number) => ({
    initial: { y: 10 },
    animate: { y: 0 },
    transition: firstRun
      ? { ...TRANSITION.considered, delay }
      : TRANSITION.standard,
  });

  /**
   * Changes whenever the card's content changes.
   *
   * `committed` is in the key so the keyed entrance actually PLAYS on commit.
   * Keyed on the rung alone, the rung does not change when you commit — so the
   * card never re-mounted and the motion that exists to say "this is different
   * now" never ran, which was half of why pressing the button felt like
   * nothing had happened.
   */
  const cardKey = pending
    ? `callback:${pending.id}`
    : committed
      ? `committed:${committed.id}`
      : (evaluation.current?.rung.id ?? "satisfied");

  return (
    <div className={cn("flex flex-col pb-16", RHYTHM.screen)}>
      {/* The reveal opens by reflecting the user's own words back. It is why
          they feel heard, and why that answer never needed parsing. */}
      {firstRun && (
        <m.div {...stage(0.1)}>
          <Text variant="meta" tone="tertiary">
            You said
          </Text>
          <Text variant="body" tone="secondary" measure className="mt-2">
            &ldquo;{profile.openingConcern.value}&rdquo;
          </Text>
        </m.div>
      )}

      {/* ── NO CARD ────────────────────────────────────────────────────────
          Home used to box its decision. The box was doing two jobs and only
          one of them well: it said "this is one object", which the content
          already says, and it said "this needs you", which on the ONE screen
          that always leads with the decision is not news. What it cost was
          the inversion this screen exists for — a bordered, elevated panel
          reads as a widget, and a widget's caption cannot be the hero.

          Unboxed, the coach's sentence IS the page. The rules that mattered
          survive without the border: still ONE primary action, still ink and
          not a hue, still no number without a read.

          `Card` is untouched and still the product's one card — it just no
          longer appears here (DESIGN-SYSTEM §8.3). */}
      <m.div
        key={cardKey}
        {...stage(0.55)}
        className={cn("flex flex-col", RHYTHM.screen)}
      >
        {pending ? (
          <>
            {/* ── THE RETURN, IN TWO SENTENCES ─────────────────────────────
                docs/STRATEGY.md §5 Stage 5 specifies both, and only the
                question was built. The question alone proves North kept a
                RECORD — a competitor's notification could produce it from
                the string you typed. The recollection proves MEMORY, because
                it describes the situation as it stood at the time, and only
                something holding your history can say it.

                It is composed by `recollect()` from the engine run over the
                profile of that day, so it can never contradict the reads
                around it, and it is absent rather than approximated when
                that day carries nothing worth recalling. */}
            <div className={cn("flex flex-col", RHYTHM.pair)}>
              <Dateline now={now} />
              <div className="type-voice-xl measure text-text-primary">
                You said you&rsquo;d {lowerFirst(pending.summary)}. Did that
                happen?
              </div>
            </div>

            {recollection && (
              <p className="type-voice measure text-text-secondary">
                <ReadProse read={{ segments: recollection }} />
              </p>
            )}

            <div className="flex flex-wrap items-center gap-3">
              <Button
                variant="primary"
                size="lg"
                onClick={() => {
                  resolveDecision(pending.id, "held");
                  // Acting on a decision doesn't change what North knows, so
                  // the engine would keep describing the old situation. This
                  // is where the profile catches up.
                  setCatchUp(FIELD_BEHIND_RUNG[pending.rungId]);
                }}
              >
                Yes, done
              </Button>
              <Button
                variant="secondary"
                size="lg"
                onClick={() => resolveDecision(pending.id, "deferred")}
              >
                Not yet
              </Button>
            </div>
          </>
        ) : evaluation.current ? (
          <>
            {/* Dateline and verdict are an eyebrow/title PAIR, the same
                relationship Insights uses. The date belongs to the read it
                dates, not to the screen at large.

                The read runs in two voices: the verdict at display size, the
                evidence a step down. One size for all forty-five words made a
                wall of serif with verdict, reasoning and aside all shouting
                equally.

                No `measure` cap — 34ch stops the sentence well short of a
                column already capped at 600px, which broke it into short
                ragged lines with empty paper beside them. */}
            <div className={cn("flex flex-col", RHYTHM.pair)}>
              <Dateline now={now} />
              <div className="text-text-primary">
                <ReadProse
                  read={evaluation.current.read}
                  onInterrogate={() => setSheet("derivation")}
                  staged={firstRun}
                  lead
                />
              </div>
            </div>

            {/* Position on the ladder, in the compact form — the typographic
                line plus the tick strip, directly under the read. This is
                where it has always sat, and it survived losing the card.
                A seven-row list said the same thing in twenty times the space
                and read as a table of contents, not as a mark. */}
            <RungIndicator
              rung={evaluation.current.rung.index}
              label={evaluation.current.rung.label}
              onInterrogate={() => setSheet("ladder")}
            />

            {/* TWO CHOICES, not a button and a footnote. `quiet` gave the
                defer no fill and no border, so beside a full ink pill it read
                as metadata about the button rather than the other thing you
                may do. They are peers in kind — commit or don't — and only
                the RECOMMENDATION differs, which the ink already carries.
                So: same size, same shape, one filled and one outlined. */}
            {committed ? (
              /* STEADY. The read above is unchanged and that is correct — the
                 money has not moved, so the rung is honestly still current.
                 What must change is the ASK: North does not offer a decision
                 that has already been made.

                 The date is the point. A coach that goes quiet for three days
                 is indistinguishable from one that forgot; naming the day
                 turns the wait into visible judgment, and puts the rule in
                 core/decisions/callback.ts on screen where it can be read as
                 product rather than as engineering. */
              <p className="type-voice measure text-text-secondary">
                {sameDay(new Date(committed.decidedAt), now)
                  ? "Recorded."
                  : "You decided this already."}{" "}
                I&rsquo;ll ask you how it went on{" "}
                {callbackDueAt(committed).toLocaleDateString("en-US", {
                  weekday: "long",
                  month: "short",
                  day: "numeric",
                })}
                .
              </p>
            ) : (
              <div className="flex flex-wrap items-center gap-3">
                <Button
                  variant="primary"
                  size="lg"
                  onClick={() =>
                    commit(evaluation.current!.rung.id, evaluation.current!.read)
                  }
                >
                  {evaluation.current.read.action.commit}
                </Button>
                <Button
                  variant="secondary"
                  size="lg"
                  onClick={() =>
                    defer(evaluation.current!.rung.id, evaluation.current!.read)
                  }
                >
                  {evaluation.current.read.action.defer}
                </Button>
              </div>
            )}

            {projection && (
              <div className="border-t border-line-hairline pt-6">
                {/* The decision and its long-term consequence, still together.
                    The full, scrubbable field lives on Goals. */}
                <HorizonBand
                  low={projection.lowCents}
                  high={projection.highCents}
                  central={projection.centralCents}
                  confidence={projection.confidence}
                  horizon={
                    profile.horizonMonths.value >= 300
                      ? "by retirement"
                      : `in ${Math.round(profile.horizonMonths.value / 12)} years`
                  }
                  action={
                    <ActionLink
                      icon={<HorizonMark />}
                      onClick={() => router.push("/goals")}
                    >
                      The long view
                    </ActionLink>
                  }
                />
              </div>
            )}
          </>
        ) : (
          /* THE CALM DAY — most days. Cardless on purpose: the card means
             "this needs you", so its absence is the message. And because
             nothing needs you, the screen becomes SCENIC — the long view,
             breathing, instead of a void. */
          <CalmScene
            profile={profile}
            now={now}
            // The first rung still unsatisfied on the raw ladder — what North
            // is holding even though nothing is being asked of you today.
            watching={
              evaluation.ladder.find((rung) => !rung.satisfied)?.label ?? null
            }
          />
        )}
      </m.div>

      {/* Continuity as ONE quiet line — the ledger is a drill-down, not a
          feed on the home screen. */}
      {decisions.length > 0 && (
        <ActionLink
          icon={<LedgerMark />}
          onClick={() => router.push("/decisions?from=today")}
        >
          {summarise(decisions)} · last{" "}
          {relativeTime(decisions[0].decidedAt, now)}
        </ActionLink>
      )}

      {/* ── WHEN THIS BROWSER WILL NOT REMEMBER ────────────────────────────
          `isPersistent()` has been exported by both stores since they were
          written and called by nobody, so a private-browsing user committed
          decisions, watched the ledger fill up all session, and found an
          empty product on reload — having been told nothing.

          Said once, here, in the coach's voice rather than as a banner: this
          is the screen you come back to, so it is the screen where "I won't
          remember" is the useful thing to know. Not an error — nothing has
          failed — which is why it is a quiet line and not `ErrorState`. */}
      {!storageWorks && (
        <p className="type-meta measure text-text-tertiary">
          This browser won&rsquo;t let me remember any of this after you close
          the tab. Everything still works — I just won&rsquo;t know you next
          time.
        </p>
      )}

      {/* The loop that closes: you said you did it, so North asks what
          changed rather than carrying a stale picture of you. */}
      <Sheet
        open={catchUp !== null}
        onClose={() => setCatchUp(null)}
        title={<h2 className="type-label text-text-tertiary">Let&rsquo;s catch up</h2>}
      >
        {catchUp && (
          <CorrectionTurn
            turnId={catchUp}
            label={CORRECTABLE.find((c) => c.turnId === catchUp)?.label}
            onDone={() => setCatchUp(null)}
            onCancel={() => setCatchUp(null)}
          />
        )}
      </Sheet>

      <LadderPanel
        open={sheet === "ladder"}
        onClose={() => setSheet(null)}
        ladder={evaluation.ladder}
        currentIndex={evaluation.current?.rung.index ?? 0}
      />

      <DerivationSheet
        open={sheet === "derivation"}
        onClose={() => setSheet(null)}
        profile={profile}
        facts={evaluation.facts}
      />
    </div>
  );
}

/**
 * The calm day. One sentence with the screen's single aurora word, then the
 * horizon as scenery — the projection breathing quietly, because nothing else
 * needs the room.
 *
 * ── WHY IT NAMES WHAT IT IS WATCHING ──────────────────────────────────────
 * "Nothing needs your attention" is the product working, but on its own it can
 * read as "nothing is happening here" — which is how a calm screen becomes a
 * screen you stop opening. So the calm day says what North is holding for you
 * and what it will speak up about. The reassurance is the WATCHFULNESS, not
 * the silence.
 */
function CalmScene({
  profile,
  now,
  watching,
}: {
  profile: NonNullable<ReturnType<typeof useProfile>>;
  now: Date;
  /** The rung North is holding — the next thing that would speak up. */
  watching: string | null;
}) {
  const projection = project(profile, { limits: ILLUSTRATIVE_LIMITS, now });

  return (
    <div className={cn("flex flex-col py-4", RHYTHM.screen)}>
      {/* The calm day is still a day, and it still gets named. This was the
          third state missing its dateline — the cardless screen is the one
          most likely to read as "nothing loaded" rather than "nothing needs
          you", and a date is what tells them apart. */}
      <div className={cn("flex flex-col", RHYTHM.pair)}>
        <Dateline now={now} />
        <Text variant="voice-xl" as="p" measure>
          Nothing needs your <span className="text-aurora">attention</span>.
          That&rsquo;s rare.
        </Text>
      </div>

      <Text variant="body" tone="secondary" measure>
        {watching
          ? `North is watching your ${watching}, and will say so the moment it moves.`
          : "Every rung on the ladder is behind you. North will speak up if that changes."}
      </Text>

      {projection ? (
        <div className={cn("flex flex-col xl:-mx-24", RHYTHM.heading)}>
          <HorizonField
            low={projection.lowCents}
            high={projection.highCents}
            central={projection.centralCents}
            confidence={projection.confidence}
            months={profile.horizonMonths.value}
            height={120}
          />
          <Text variant="meta" tone="tertiary">
            The long view, since there&rsquo;s nothing else to show you. It
            lives under Goals.
          </Text>
        </div>
      ) : (
        <Text variant="body" tone="secondary" measure>
          Everything the ladder asks of you is handled.
        </Text>
      )}
    </div>
  );
}

/* ── Small presentational helpers ──────────────────────────────────────── */

/**
 * The date this screen speaks for.
 *
 * One component because all THREE of Today's states need it and only one had
 * it: the dateline used to live inside the `evaluation.current` branch, so on
 * the one day the return callback fires — the stage docs/STRATEGY.md calls
 * the moat — Today named nothing at all, and the calm day named nothing
 * either. docs/UX-ARCHITECTURE.md says plainly that Today carries a dateline;
 * it carried one in the common case and dropped it in both rarer ones.
 *
 * Still an `h1`, and still exactly one per render — it is the page's heading
 * whichever state the page is in.
 */
function Dateline({ now }: { now: Date }) {
  return (
    <h1 className="type-overline text-text-tertiary">
      Today ·{" "}
      {now
        .toLocaleDateString("en-US", { month: "short", day: "numeric" })
        .toUpperCase()}
    </h1>
  );
}

/**
 * Whether a commitment was made today, in the reader's own calendar.
 *
 * Decides between "Recorded." and "You decided this already." — the first is
 * an acknowledgement and only true in the moment; on a later visit it reads
 * as a receipt reprinting itself rather than as a coach who remembers.
 */
function sameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function lowerFirst(text: string): string {
  return text.charAt(0).toLowerCase() + text.slice(1);
}

function summarise(decisions: Decision[]): string {
  const held = decisions.filter((d) => d.outcome === "held").length;
  if (held > 0) {
    return `${decisions.length} decision${decisions.length === 1 ? "" : "s"} with North · ${held} held`;
  }
  return `${decisions.length} decision${decisions.length === 1 ? "" : "s"} with North`;
}

/**
 * Deliberately coarse. False precision on a timestamp is still false
 * precision.
 *
 * Singular is handled because the boundary cases are the COMMON ones, not the
 * edge: seven days after a decision the ledger read "last 1 weeks ago", and a
 * month after, "1 months ago". A coach with a grammatical tic is a coach you
 * trust slightly less with a number.
 */
function relativeTime(iso: string, now: Date): string {
  const days = Math.floor(
    (now.getTime() - new Date(iso).getTime()) / 86_400_000,
  );
  if (days <= 0) return "today";
  if (days === 1) return "yesterday";
  if (days < 7) return `${days} days ago`;
  if (days < 30) return plural(Math.floor(days / 7), "week");
  return plural(Math.floor(days / 30), "month");
}

const plural = (n: number, unit: string) =>
  `${n} ${unit}${n === 1 ? "" : "s"} ago`;

"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Button,
  EmptyState,
  Figure,
  RHYTHM,
  SectionHeading,
  Text,
  TRANSITION,
  OutcomeMark,
  m,
  useReducedMotion,
} from "@/components/nds";
import { ledgerMonths, openDecision, summariseLedger } from "@/core/decisions";
import { cn } from "@/lib/cn";
import { useHydrated } from "@/lib/use-hydrated";
import { resolveDecision, useDecisions } from "@/state/decisions-store";
import { ActionLink, BackMark } from "./ActionGlyphs";
import { ReadProse } from "./ReadProse";

/**
 * The ledger — the memory made visible.
 *
 * The one surface no competitor has, and the only screen in consumer personal
 * finance designed to produce PRIDE rather than guilt. Every other app's
 * history view is a record of spending you regret; this is a record of
 * decisions you made well (docs/UX-ARCHITECTURE.md §4.4).
 *
 * ── THE CALL ON CELEBRATION ───────────────────────────────────────────────
 * The obvious way to make a pride screen is to celebrate: a streak, a badge, a
 * percentage held, a number counting up. Every one of those is a SCOREBOARD,
 * and a scoreboard cuts both ways — the moment a run of five is worth
 * celebrating, breaking it is a failure, and the screen has manufactured the
 * precise emotion it exists to remove, just deferred to the first miss.
 *
 * So the pride is STATED, not performed. The coach reads your record back in
 * the same voice that asked for it (core/decisions/summary.ts), and the record
 * itself is made worth reading. That is the whole redesign.
 *
 * What IS alive: rows enter on a short capped stagger, so the record reads as
 * accumulating rather than appearing, and the one open commitment carries the
 * product's single signal colour because it is genuinely live. Nothing counts,
 * ranks, congratulates, or shifts colour to "done".
 *
 * ── STILL ROWS, NOT CARDS ─────────────────────────────────────────────────
 * Ruled entries, not boxes. History is rows; that contrast is what lets a
 * bounded surface mean something elsewhere in the product.
 */

function dayLabel(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
  });
}

const emptyActions = { action: { commit: "", defer: "" } };

/**
 * Where "back" goes, and what it is allowed to call the place.
 *
 * Decisions is a drill-down reached from two screens, so a generic "Back"
 * is the one label that is never wrong and never useful — the reader has
 * to remember how they got here. Navigator's own back link names its
 * destination ("Navigator"), and this now matches it.
 *
 * The origin travels in the URL rather than in memory: it survives a
 * reload, and a link someone sends still knows where its own way out
 * goes. `today` is the fallback because Home is the product's root.
 */
const ORIGIN = {
  today: { label: "Today", path: "/today" },
  insights: { label: "Insights", path: "/insights" },
  // The coach can now hand you the ledger straight out of an answer, so
  // Navigator is a third way in — and Back has to name where you actually
  // came from, or the drill-down lies about the way out.
  navigator: { label: "Navigator", path: "/navigator" },
} as const;

type OriginKey = keyof typeof ORIGIN;

function isOriginKey(value: string | null): value is OriginKey {
  return value !== null && value in ORIGIN;
}

export function DecisionsScreen() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const decisions = useDecisions();
  const hydrated = useHydrated();
  const reduce = useReducedMotion();
  const [now] = useState(() => new Date());
  /** The entry whose resolution just landed, so the screen can say so once. */
  const [justResolved, setJustResolved] = useState<string | null>(null);

  if (!hydrated) return null;

  const pending = openDecision(decisions);
  const settled = decisions.filter((d) => d.outcome !== "open");
  const summary = summariseLedger(decisions);
  const run = ledgerMonths(settled, now);

  const stage = (delay: number) => ({
    initial: { y: 6 },
    animate: { y: 0 },
    transition: { ...TRANSITION.standard, delay },
  });

  const from = searchParams.get("from");
  const origin = isOriginKey(from) ? ORIGIN[from] : ORIGIN.today;
  /**
   * `back()` when we know we were pushed here — it pops the entry rather
   * than stacking a third one, and the origin keeps its scroll position,
   * which matters on a page as long as Insights. A deep link has nothing
   * to pop, so that case navigates outright and the label stays honest
   * either way.
   */
  const leave = () => (isOriginKey(from) ? router.back() : router.push(origin.path));

  if (decisions.length === 0) {
    return (
      <div className={cn("flex flex-col pb-16", RHYTHM.screen)}>
        {/* RHYTHM.block, matching Navigator's answer header — a back link
            above a screen's own title is the same relationship on both
            screens, so it is the same distance. */}
        <div className={cn("flex flex-col", RHYTHM.block)}>
          <ActionLink icon={<BackMark />} onClick={leave}>
            {origin.label}
          </ActionLink>
          <h1 className="type-overline text-text-tertiary">Decisions</h1>
        </div>
        {/* Never "no data" — always "here's what happens next"
            (docs/UX-ARCHITECTURE.md §7). */}
        <EmptyState
          title="Nothing here yet."
          body="The first decision you make will land here, along with whether you held it."
          action={
            <Button variant="secondary" onClick={() => router.push("/today")}>
              Back to today
            </Button>
          }
        />
      </div>
    );
  }

  return (
    <div className={cn("flex flex-col pb-16", RHYTHM.screen)}>
      {/* RHYTHM.block — see the empty state above. */}
      <div className={cn("flex flex-col", RHYTHM.block)}>
        <ActionLink icon={<BackMark />} onClick={leave}>
          {origin.label}
        </ActionLink>

        {/* The coach speaks first, as on every other screen. This was the one
            surface that opened with a label and went straight to a table — and
            the pride it was built for lives in this sentence. */}
        <m.div {...stage(0)} className={cn("flex flex-col", RHYTHM.pair)}>
          <h1 className="type-overline text-text-tertiary">Decisions</h1>
          <div className="type-voice-lg text-text-primary">
            <ReadProse read={{ ...emptyActions, segments: summary.read }} />
          </div>
        </m.div>
      </div>

      {/* Open commitments are PINNED and resolvable here — a ledger you can
          only read is a filing cabinet. */}
      {pending && (
        <m.section
          {...stage(0.06)}
          className={cn("flex flex-col", RHYTHM.heading)}
        >
          <SectionHeading>Waiting on you</SectionHeading>
          {/* The open mark belongs HERE, on the one entry that is still live —
              it is the screen's single signal element. Without it the ring was
              drawn but never rendered anywhere, because the statement below
              only lists what has settled. */}
          <div className="flex gap-4">
            <span className="translate-y-1.5">
              <OutcomeMark outcome="open" />
            </span>
            <div className={cn("flex min-w-0 flex-col", RHYTHM.pair)}>
              <div className="type-voice-md text-text-primary">
                You said you&rsquo;d {lowerFirst(pending.summary)}.
              </div>
              <Text variant="meta" tone="tertiary">
                Decided {dayLabel(pending.decidedAt)}
              </Text>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Button
              variant="primary"
              onClick={() => {
                resolveDecision(pending.id, "held");
                setJustResolved(pending.id);
              }}
            >
              Yes, done
            </Button>
            <Button
              variant="secondary"
              onClick={() => resolveDecision(pending.id, "deferred")}
            >
              Not yet
            </Button>
          </div>
        </m.section>
      )}

      {/* Holding a decision doesn't change what North KNOWS — the profile
          catches up through the correction conversation, which lives on Today.
          Saying so is more honest than silently going stale. */}
      {justResolved && !pending && (
        <m.div
          {...stage(0.06)}
          className={cn("flex flex-col items-start", RHYTHM.heading)}
        >
          <Text variant="body" tone="secondary">
            Recorded. North will ask what changed next time you&rsquo;re on
            Today, so the picture it has of you keeps up.
          </Text>
          {/* Secondary — stroke, no fill, the same shape "Not yet" wears.
              As a `quiet` Button its label sat 20px indented from the
              sentence above it, because a quiet Button's padding pushes text
              in with no visible box to justify the inset (the exact defect
              ActionLink was introduced to fix). A bordered control has an
              edge of its own, so the inset reads as the button's interior
              rather than as broken alignment.

              Secondary rather than primary on purpose: the caption says
              North will ask "next time you're on Today", so this is a door
              held open, not an instruction to walk through it now. */}
          <Button variant="secondary" onClick={() => router.push("/today")}>
            Go to Today
          </Button>
        </m.div>
      )}

      {settled.length > 0 && (
        /* ── THE RUN OF MONTHS ─────────────────────────────────────────────
           A list grouped by month is not a timeline. A timeline's job is to
           show INTERVAL, and a grouped list throws that away: three decisions
           in one week and three across a year render identically. That is why
           the first attempt — a decorative spine beside a grouped list — was
           removed; the line carried no fact.

           This one carries the fact. The run is CONTINUOUS: every month
           between the first decision and now gets a place on the rail, and a
           month with nothing in it says so (core/decisions/timeline.ts). A
           busy month now reads as a cluster, a quiet stretch reads as quiet,
           and the gap is visibly a real gap rather than missing data.

           The rail is the year. Month labels hang off it in the margin,
           outcomes are inked onto it, and the entries sit to its right —
           which is the editorial convention every good timeline uses, for the
           reason that it gives the eye one predictable path down the page. */
        <section className="relative">
          {/* The rail. Decorative — it carries no information the months and
              marks do not already carry — so it is `aria-hidden` and is the
              one thing allowed to animate into existence. */}
          <m.span
            aria-hidden="true"
            initial={reduce ? false : { scaleY: 0 }}
            animate={{ scaleY: 1 }}
            transition={TRANSITION.considered}
            style={{ transformOrigin: "top" }}
            /* Dead centre of the rail column: col-1 width + half col-2.
               Mobile 2.5rem + 0.75rem, desktop 5rem + 1rem. */
            className="absolute top-2 bottom-2 left-[3.25rem] w-px bg-line-hairline md:left-24"
          />

          <ol className="flex flex-col">
            {run.map((month, monthIndex) => (
              <li
                key={month.key}
                /* A grid, not flex with margins. The rail has to sit on an
                   exact pixel and every row has to agree with it; three named
                   columns say that once instead of negotiating it per row. */
                className="grid grid-cols-[2.5rem_1.5rem_1fr] md:grid-cols-[5rem_2rem_1fr]"
              >
                {/* The margin: month, and the year only when it changes —
                    repeating "2026" down the page is noise, and its absence
                    makes the one place it DOES change read as an event. */}
                <div
                  className={cn(
                    "pr-3 text-right",
                    // A busy month's label aligns with its first entry's text;
                    // a quiet month has no entry to align to, so its three
                    // columns centre on one line instead. Sharing `h-12` is
                    // what makes label, tick and text agree exactly rather
                    // than by a padding value someone has to keep in step.
                    month.decisions.length > 0
                      ? "pt-5"
                      : "flex h-12 flex-col justify-center",
                  )}
                >
                  <div
                    className={cn(
                      "type-overline",
                      // `text-tertiary`, not `text-disabled` — the disabled
                      // token measures 2.32 and is documented non-text only
                      // (DESIGN-SYSTEM §2.2). Tertiary is the faintest tone
                      // that still clears AA, so it is as quiet as a label is
                      // allowed to get.
                      month.decisions.length > 0
                        ? "text-text-secondary"
                        : "text-text-tertiary",
                    )}
                  >
                    {month.month.slice(0, 3)}
                  </div>
                  {(monthIndex === 0 ||
                    run[monthIndex - 1].year !== month.year) && (
                    <div className="type-meta mt-0.5 text-text-tertiary tabular-nums">
                      {month.year}
                    </div>
                  )}
                </div>

                {/* The rail column. A quiet month gets one small tick on the
                    line; a busy month's nodes are drawn by its entries. */}
                <div
                  className={cn(
                    "flex flex-col items-center",
                    month.decisions.length === 0 && "h-12 justify-center",
                  )}
                >
                  {month.decisions.length === 0 && (
                    <span
                      aria-hidden="true"
                      className="size-1 rounded-full bg-line-hairline"
                    />
                  )}
                </div>

                <div className="min-w-0">
                  {month.decisions.length === 0 ? (
                    /* A quiet month names itself. The height alone carried the
                       interval, but an unlabelled gap is ambiguous in the one
                       way that matters here — it could be read as data that
                       failed to load rather than a month in which you decided
                       nothing.

                       "A quiet month", not "no decisions": this screen exists
                       to produce pride rather than guilt, and the product
                       already holds that a stretch where nothing moved is a
                       perfectly good one (the story's too-early state). A
                       count of zero would be a scoreboard reading nil. */
                    <div className="flex h-12 items-center">
                      <span className="type-meta text-text-tertiary">
                        A quiet month
                      </span>
                    </div>
                  ) : (
                    <ol className="flex flex-col">
                      {month.decisions.map((decision, index) => (
                        <m.li
                          key={decision.id}
                          {...stage(
                            // Short, capped stagger — the record accumulating
                            // rather than a list appearing.
                            0.1 + Math.min(monthIndex + index, 6) * 0.04,
                          )}
                          className="relative flex items-baseline gap-3 py-4 pl-2 md:gap-4"
                        >
                          {/* The node sits ON the rail — pulled back into the
                              rail column, with a paper halo so the line passes
                              behind it rather than through it. */}
                          {/* The node's CENTRE has to land on the rail, and the offset that
                              does that differs per breakpoint because the rail
                              column does. Centre sits at (offset + half the node),
                              so: mobile −24 + 12 = −12 from the content edge, and
                              the rail is 12 left of it. Desktop needs −28, not
                              −32 — `-left-8` put every mark 4px off the line. */}
                          <span className="absolute -left-6 top-4 flex size-6 items-center justify-center rounded-full bg-surface-page md:-left-7">
                            <OutcomeMark outcome={decision.outcome} />
                          </span>

                          <div
                            className={cn(
                              "flex min-w-0 flex-1 flex-col",
                              RHYTHM.pair,
                            )}
                          >
                            <div className="type-voice-md text-text-primary">
                              {decision.summary}
                            </div>
                            <Text variant="meta" tone="tertiary">
                              {decision.outcome === "held"
                                ? "Held"
                                : "Set aside for later"}
                              {" · "}
                              {dayLabel(decision.decidedAt)}
                            </Text>
                          </div>

                          {decision.amountCents !== undefined && (
                            <span className="shrink-0 text-right tabular-nums">
                              <Figure
                                value={decision.amountCents}
                                format="currency"
                                confidence="inferred"
                                context="tabular"
                                label="at stake"
                              />
                            </span>
                          )}
                        </m.li>
                      ))}
                    </ol>
                  )}
                </div>
              </li>
            ))}
          </ol>
        </section>
      )}

    </div>
  );
}

/** Lower-cases the first letter, so a summary reads inside a sentence. */
function lowerFirst(value: string): string {
  return value.charAt(0).toLowerCase() + value.slice(1);
}

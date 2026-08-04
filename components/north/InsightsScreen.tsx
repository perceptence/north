"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Button,
  RHYTHM,
  SectionHeading,
  TRANSITION,
  m,
} from "@/components/nds";
import { cn } from "@/lib/cn";
import { useHydrated } from "@/lib/use-hydrated";
import {
  behind,
  composeLetter,
  type Behind,
  type ChangeKind,
  type Direction,
} from "@/core/insights";
import { ILLUSTRATIVE_LIMITS } from "@/core/waterfall";
import { useDecisions } from "@/state/decisions-store";
import { useBaselineProfile, useProfile } from "@/state/profile-store";
import {
  ActionLink,
  LedgerMark,
  SignpostMark,
  StoryMark,
} from "./ActionGlyphs";
import { InsightSheet } from "./InsightSheet";
import { ReadProse } from "./ReadProse";

/**
 * Insights — "What changed?"
 *
 * ── WHY THIS ISN'T A RUN OF PARAGRAPHS ────────────────────────────────────
 * It was, and it read like a book: sentence after sentence in one weight, so
 * the reader had to work out for themselves what moved, when, and what it
 * meant. That is the reader doing the coach's job. A letter can be prose and
 * still have STRUCTURE — a date, a subject line, a body, a consequence — and
 * the structure is what makes it readable rather than merely written.
 *
 * So each change is now a dispatch: a hairline mark showing which way it went,
 * the subject, when it happened, what happened, and — the part a flat list
 * never says — WHY IT MATTERS. The screen closes on what it leaves for
 * tomorrow, because "so what now" is the question the reader actually came
 * with.
 *
 * Direction is a GLYPH, never a colour. There is no red and no green here; up
 * and down are drawn, not tinted (docs/VISUAL-DIRECTION.md §3).
 */

const emptyActions = { action: { commit: "", defer: "" } };

/**
 * A dispatch, made openable — but only where there is something behind it.
 *
 * `behind()` returns `null` when the honest answer is "nothing to add" (an
 * empty ledger has no record to show), and then this renders a plain block
 * with no affordance at all. The alternative — always a button, sometimes
 * opening onto an apology — teaches people the taps are decoration, which is
 * the same lesson a fixed menu of offers teaches (see core/coach/offers.ts).
 *
 * `disabled` rather than a branch on the element type, so the enabled case
 * can style the label through `group-enabled:` and the dead case simply
 * doesn't light up.
 */
function BehindButton({
  detail,
  onOpen,
  children,
}: {
  detail: Behind | null;
  onOpen: (detail: Behind) => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      disabled={!detail}
      onClick={() => detail && onOpen(detail)}
      aria-label={detail ? `${detail.cue}: ${detail.eyebrow}` : undefined}
      className={cn(
        "group flex w-full flex-col text-left",
        RHYTHM.pair,
        detail && "cursor-pointer",
      )}
    >
      {children}

      {/* ── THE CUE ───────────────────────────────────────────────────────
          The dotted rule on the label was doing this job alone, and it was
          too quiet to read as an invitation — it says "there is more behind
          this" to someone already looking for it, which is not the same as
          telling a first-time reader the dispatch opens at all.

          A SPAN, not an ActionLink: the whole dispatch is already the
          button, and a button inside a button is invalid. It borrows
          ActionLink's appearance — mono-quiet text under the product's one
          dotted "there is more here" rule — without claiming its
          interaction.

          And no mark. `SpeakMark` taught this lesson on the offers list:
          the same glyph repeated down the side of four entries is four
          copies of one word. ActionLink's icon is optional for exactly this
          case. */}
      {detail && (
        <span className="type-meta pt-1 text-text-tertiary transition-colors duration-[--motion-micro] group-hover:text-text-secondary">
          <span className="underline decoration-signal-coach decoration-dotted decoration-1 underline-offset-4">
            {detail.cue}
          </span>
        </span>
      )}
    </button>
  );
}

/**
 * The mark for a direction — two ticks on the ground: before, and after.
 *
 * Three states, and they are genuinely different drawings: up means the
 * second reading stands taller, down the first, steady puts them level. Not a
 * chevron (every dashboard's arrow), not a trend curve (a mute diagonal at
 * this size) — a comparison drawn as a comparison.
 */
export function DirectionMark({ direction }: { direction: Direction }) {
  const ticks =
    direction === "up"
      ? ["M5.4 13.2 V9.4", "M10.6 13.2 V3.8"]
      : direction === "down"
        ? ["M5.4 13.2 V3.8", "M10.6 13.2 V9.4"]
        : ["M5.4 13.2 V6.6", "M10.6 13.2 V6.6"];
  return (
    <Mark>
      <path d="M2.8 13.2 H13.2" />
      <path d={ticks[0]} />
      <path d={ticks[1]} />
    </Mark>
  );
}

/** Shared frame, so every entry mark is drawn on one pen. */
function Mark({ children }: { children: React.ReactNode }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 16 16"
      className="size-4 shrink-0 text-text-tertiary"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.25"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {children}
    </svg>
  );
}

/** A rung cleared — the ladder, with the one you passed struck through. */
function LadderClearedMark() {
  return (
    <Mark>
      <path d="M4 3.2 V12.8" />
      <path d="M12 3.2 V12.8" />
      <path d="M4 6 H12" />
      <path d="M4 10 H12" opacity="0.4" />
    </Mark>
  );
}

/**
 * The mark for an entry — chosen by WHAT KIND of thing moved.
 *
 * Every entry used to wear the direction mark, which was wrong twice over.
 * Three of the four kinds are not quantities that went up or down at all — a
 * rung cleared, decisions held, a goal named are EVENTS — so direction had
 * nothing to say about them, and on any stretch where the news was good they
 * all rendered the identical up-tick. Four entries, one drawing, no
 * information.
 *
 * Direction survives where it is real: the buffer is a measure, and whether
 * it grew or shrank is the whole point. Everything else is marked by kind.
 */
function EntryMark({
  kind,
  direction,
}: {
  kind: ChangeKind;
  direction: Direction;
}) {
  if (kind === "buffer") return <DirectionMark direction={direction} />;
  if (kind === "ladder") return <LadderClearedMark />;
  if (kind === "record") return <LedgerMark />;
  return <SignpostMark />;
}

/** How long a stretch this letter covers. Coarse, like every other duration. */
function spanWord(from: Date, to: Date): string {
  const days = Math.max(
    1,
    Math.round((to.getTime() - from.getTime()) / 86_400_000),
  );
  if (days === 1) return "a day";
  if (days < 14) return `${days} days`;
  const weeks = Math.round(days / 7);
  if (weeks < 9) return `${weeks} weeks`;
  const months = Math.round(days / 30);
  return months === 1 ? "a month" : `${months} months`;
}

/** One end of the dateline. */
function dayWord(date: Date): string {
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

/** Coarse on purpose. False precision on a timestamp is still false precision. */
function whenWord(iso: string | undefined, now: Date): string | null {
  if (!iso) return null;
  const days = Math.floor(
    (now.getTime() - new Date(iso).getTime()) / 86_400_000,
  );
  if (days <= 0) return "today";
  if (days === 1) return "yesterday";
  if (days < 7) return `${days} days ago`;
  if (days < 30) return `${Math.floor(days / 7)} weeks ago`;
  return `${Math.floor(days / 30)} months ago`;
}

export function InsightsScreen() {
  const router = useRouter();
  const profile = useProfile();
  const [now] = useState(() => new Date());
  const previous = useBaselineProfile(now);
  const decisions = useDecisions();
  const hydrated = useHydrated();
  /** The dispatch whose reasoning is open. `null` is closed — one piece of
   *  state, not a boolean plus a payload that can disagree with it. */
  const [openBehind, setOpenBehind] = useState<Behind | null>(null);

  useEffect(() => {
    if (hydrated && !profile) router.replace("/start");
  }, [hydrated, profile, router]);

  if (!hydrated || !profile) return null;

  const letter = composeLetter(
    previous?.profile ?? null,
    previous?.at ?? null,
    profile,
    decisions,
    { limits: ILLUSTRATIVE_LIMITS, now },
  );

  // "Since June 21" states one edge and makes the reader work out the other
  // against today's date to know how long a stretch they are reading about.
  // A letter's dateline gives both ends, and the span in words gives the size
  // without any arithmetic at all.
  const dateline = previous
    ? `${spanWord(new Date(previous.at), now)} · ${dayWord(new Date(previous.at))} – ${dayWord(now)}`
    : null;

  const stage = (delay: number) => ({
    initial: { y: 8 },
    animate: { y: 0 },
    transition: { ...TRANSITION.standard, delay },
  });

  const options = { limits: ILLUSTRATIVE_LIMITS, now };
  const previousProfile = previous?.profile ?? null;

  return (
    <div className={cn("flex flex-col pb-16", RHYTHM.screen)}>
      {/* The dateline, in the content where a letter puts it — not in the
          letterhead. The dock already names the tab. */}
      {/* Dateline and headline are a PAIR — an eyebrow and its title, the
          same relationship an entry's label has to its sentence. They sat a
          full screen-gap apart, which read as two unrelated blocks. */}
      <m.div {...stage(0)} className={cn("flex flex-col", RHYTHM.pair)}>
        <h1 className="type-overline text-text-tertiary">
          {dateline ?? "Insights"}
        </h1>
        <div className="type-voice-lg text-text-primary">
          <ReadProse read={{ ...emptyActions, segments: letter.opening }} />
        </div>
      </m.div>

      {/* The dispatches and the closing are ONE run of the letter, so the
          boundary between them has to read like the boundary between two
          dispatches — and it did not. Three spacings were stacking there: the
          last entry's own 24 of bottom padding, then the screen gap of 40
          between siblings, then another 28 above the closing's heading. 92px,
          where every other boundary in the same list is 48.

          Nesting them in a gapless wrapper removes the screen gap from that
          one seam, leaving 24 below the last sentence and 24 above the next
          heading — the same rule, the same rhythm, all the way down. */}
      <div className="flex flex-col">
        {letter.entries.length > 0 && (
          <ol className="flex flex-col">
            {letter.entries.map((entry, index) => (
              <m.li
                key={`${entry.kind}-${index}`}
                {...stage(0.06 + index * 0.05)}
                className="border-t border-line-hairline py-6 first:border-t-0 first:pt-0"
              >
                {/* ── THE DISPATCH OPENS ───────────────────────────────────
                    Every one of these sentences is the visible tip of a real
                    calculation, and none of it was reachable — the reader who
                    wanted to know HOW North knows had nowhere to go.

                    The whole entry is the target rather than a trailing link:
                    the thing you want to know more about is the thing you
                    just read, so that is the thing you tap. The label wears
                    the dotted signal-coach rule, which is the product's one
                    mark for "there is more behind this" — the same rule an
                    inferred Figure and an interrogable RungIndicator wear.

                    `behind()` returns null where there is nothing honest to
                    add, and then this stays a plain block. A room that opens
                    onto "there is nothing here" is worse than a sentence that
                    never offered to open. */}
                <BehindButton
                  detail={behind(entry, previousProfile, profile, decisions, options)}
                  onOpen={setOpenBehind}
                >
                <div className="flex items-center gap-2.5">
                  <EntryMark kind={entry.kind} direction={entry.direction} />
                  <span className="type-label text-text-primary">
                    {entry.label}
                  </span>
                  {whenWord(entry.at, now) && (
                    <>
                      <span aria-hidden="true" className="text-text-tertiary">
                        ·
                      </span>
                      <span className="type-meta text-text-tertiary">
                        {whenWord(entry.at, now)}
                      </span>
                    </>
                  )}
                </div>

                <div className="type-voice-md text-text-primary">
                  <ReadProse
                    read={{ ...emptyActions, segments: entry.segments }}
                  />
                </div>

                {/* The consequence — the sentence a flat list never says. */}
                <div className="type-body text-text-secondary">
                  <ReadProse
                    read={{ ...emptyActions, segments: entry.meaning }}
                  />
                </div>
                </BehindButton>
              </m.li>
            ))}
          </ol>
        )}

        {/* THE SIGN-OFF, not a fifth dispatch.
            It read as one: same rule above it, same mono heading, same
            voice-md as every entry — so the letter's conclusion arrived
            looking like more of the letter's middle. And it named the one
            thing worth your attention while offering no way to take it up,
            which is a dead end at the exact moment the reader is ready to
            move.

            Two fixes, both structural. It matches the OPENING's weight
            (voice-lg), so the letter is bookended and the closing is
            unmistakably the last word rather than the next item. And it
            carries the way to act on what it just said. */}
        <m.div
          {...stage(0.1 + letter.entries.length * 0.05)}
          className={cn(
            "flex flex-col border-t border-line-hairline pt-8",
            RHYTHM.heading,
          )}
        >
          <SectionHeading>Where this leaves you</SectionHeading>
          <div className={cn("flex flex-col items-start", RHYTHM.heading)}>
            <div className="type-voice-lg text-text-primary">
              <ReadProse read={{ ...emptyActions, segments: letter.closing }} />
            </div>
            <Button variant="secondary" onClick={() => router.push("/today")}>
              Take it up on Today
            </Button>
          </div>
        </m.div>
      </div>

      {/* Elsewhere in the record. These are ways OUT of the letter, so they
          are grouped and set apart from the sign-off rather than trailing it
          as two more loose lines. */}
      <m.div
        {...stage(0.16 + letter.entries.length * 0.05)}
        className={cn("flex flex-col items-start", RHYTHM.heading)}
      >
        {/* The same material, played back one beat at a time. The offer only
            appears when there IS a story — the condition composeStory calls
            `tooEarly` — so the link never lands on an apology. */}
        {previous && !letter.quiet && (
          <ActionLink
            icon={<StoryMark />}
            onClick={() => router.push("/story")}
          >
            Watch how you got here
          </ActionLink>
        )}

        <ActionLink
          icon={<LedgerMark />}
          onClick={() => router.push("/decisions?from=insights")}
        >
          Everything you&rsquo;ve decided
        </ActionLink>

      </m.div>

      {/* The footnote — what North can't see. It is NOT one of the ways out,
          so it stops sharing their group: a disclosure filed under "elsewhere
          in the record" reads as another link you failed to notice. Its own
          rule, its own space, last and quietest — context, not a finding. */}
      <m.div
        {...stage(0.2 + letter.entries.length * 0.05)}
        className="type-meta border-t border-line-hairline pt-5 text-text-tertiary"
      >
        <ReadProse read={{ ...emptyActions, segments: letter.footnote }} />
      </m.div>

      {/* The room behind whichever dispatch was opened. One instance, driven
          by which detail is held — not one sheet per entry. */}
      <InsightSheet detail={openBehind} onClose={() => setOpenBehind(null)} />
    </div>
  );
}

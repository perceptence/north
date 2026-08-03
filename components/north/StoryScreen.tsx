"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  RHYTHM,
  Button,
  HorizonField,
  SectionHeading,
  Text,
  TRANSITION,
  m,
  useReducedMotion,
} from "@/components/nds";
import { composeStory } from "@/core/story";
import { ILLUSTRATIVE_LIMITS } from "@/core/waterfall";
import { cn } from "@/lib/cn";
import { useHydrated } from "@/lib/use-hydrated";
import { useDecisions } from "@/state/decisions-store";
import { usePreviousProfile, useProfile } from "@/state/profile-store";
import { ActionLink, BackMark } from "./ActionGlyphs";
import { ReadProse } from "./ReadProse";
import { Sky } from "./Sky";
import {
  narrowViewport,
  SKY_HEIGHT_PX,
  SKY_TRAVEL_HANDOVER_MS,
  SKY_TRAVEL_TRANSITION,
} from "./sky-travel";
import { TurnGlyph } from "./TurnGlyph";

/**
 * The story — your year, one beat at a time.
 *
 * Insights says what changed as a page. This says the same thing with TIME:
 * one claim on screen, the mark morphing to match it, and the horizon
 * reshaping to the situation as it stood at that moment. Nothing new is
 * claimed — every middle beat is a real diff (core/story/compose.ts) — so a
 * quiet stretch honestly refuses to be a story at all.
 *
 * ── TAP TO ADVANCE ────────────────────────────────────────────────────────
 * The reader sets the pace, like the onboarding conversation. Nothing here is
 * on a timer: a recap that runs away from you is a recap you watch rather than
 * read, and this is the coach talking, not a title sequence.
 *
 * The whole stage is the target, and the keyboard drives it too — this is a
 * demo surface, but a demo that a keyboard cannot operate is a demo that
 * breaks in front of someone.
 */
export function StoryScreen() {
  const router = useRouter();
  const profile = useProfile();
  const previous = usePreviousProfile();
  const decisions = useDecisions();
  const hydrated = useHydrated();
  const reduce = useReducedMotion();
  const [now] = useState(() => new Date());
  const [index, setIndex] = useState(0);
  /** Overrides the sky to the product shell's own height while leaving;
   *  null means settled at this screen's natural height (26dvh empty,
   *  30dvh with beats). */
  const [skyHeight, setSkyHeight] = useState<number | null>(null);

  const story =
    hydrated && profile
      ? composeStory(
          previous?.profile ?? null,
          previous?.at ?? null,
          profile,
          decisions,
          { limits: ILLUSTRATIVE_LIMITS, now },
        )
      : null;

  const total = story?.beats.length ?? 0;
  const last = total > 0 && index >= total - 1;

  const advance = () => setIndex((i) => nextIndex(i, total));
  const back = () => setIndex(prevIndex);

  /**
   * Shrink the sky to the product shell's own height, then hand over —
   * ArrivalScreen's wordmark trick, aimed at a height instead of a position.
   * Every exit from this screen lands on the shell (Today or Insights),
   * which share one sky height, so there is only ever one target.
   */
  const leave = useCallback(
    (href: string) => {
      if (reduce) {
        router.push(href);
        return;
      }
      setSkyHeight(
        narrowViewport() ? SKY_HEIGHT_PX.product.narrow : SKY_HEIGHT_PX.product.wide,
      );
      window.setTimeout(() => router.push(href), SKY_TRAVEL_HANDOVER_MS);
    },
    [reduce, router],
  );

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "ArrowRight" || event.key === " ") {
        event.preventDefault();
        setIndex((i) => nextIndex(i, total));
      }
      if (event.key === "ArrowLeft") {
        event.preventDefault();
        setIndex(prevIndex);
      }
      if (event.key === "Escape") leave("/insights");
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [total, leave]);

  if (!hydrated || !profile) return null;

  // Nothing changed, or there is no past yet. Said plainly, and offered the
  // demo rather than an apology — an empty state is never "no data".
  if (!story || story.tooEarly) {
    return (
      <div className="relative flex min-h-dvh flex-col">
        {/* Grows in from the shell's own height (as if continuing straight
            from Insights) up to this screen's natural 26dvh — absolute, like
            Sky's own `.atmosphere`, so it never claims flow height itself;
            the content below is spaced by its own `pt-[26dvh]`. */}
        <m.div
          className="absolute inset-x-0 top-0"
          initial={
            reduce
              ? false
              : {
                  height: narrowViewport()
                    ? SKY_HEIGHT_PX.product.narrow
                    : SKY_HEIGHT_PX.product.wide,
                }
          }
          animate={{ height: skyHeight ?? window.innerHeight * 0.26 }}
          transition={SKY_TRAVEL_TRANSITION}
        >
          <Sky className="h-full" />
        </m.div>
        <main className="relative flex flex-1 flex-col px-4 md:px-6 lg:px-7">
          <div className="mx-auto flex w-full max-w-column flex-col gap-7 pt-[26dvh]">
            <Text variant="voice-lg" as="h1" measure>
              There isn&rsquo;t a story here yet.
            </Text>
            <Text variant="body" tone="secondary" measure as="p">
              North tells this back to you once something has actually moved.
              Nothing has yet &mdash; and a quiet stretch is a perfectly good
              one.
            </Text>
            <div className="flex flex-wrap gap-3">
              <Button variant="primary" onClick={() => leave("/today")}>
                Back to today
              </Button>
              <Button variant="secondary" onClick={() => router.push("/demo")}>
                Borrow the demo story
              </Button>
            </div>
          </div>
        </main>
      </div>
    );
  }

  const beat = story.beats[index];

  return (
    <div
      className="relative flex min-h-dvh cursor-pointer flex-col select-none"
      onClick={advance}
      role="button"
      tabIndex={0}
      aria-label={`Beat ${index + 1} of ${total}. Tap or press the right arrow to continue.`}
      onKeyDown={(event) => {
        if (event.key === "Enter") advance();
      }}
    >
      {/* Same as the too-early sky above, aimed at 30dvh instead of 26 —
          this view is taller because it carries a beat's own horizon too. */}
      <m.div
        className="absolute inset-x-0 top-0"
        initial={
          reduce
            ? false
            : {
                height: narrowViewport()
                  ? SKY_HEIGHT_PX.product.narrow
                  : SKY_HEIGHT_PX.product.wide,
              }
        }
        animate={{ height: skyHeight ?? window.innerHeight * 0.3 }}
        transition={SKY_TRAVEL_TRANSITION}
      >
        <Sky className="h-full" />
      </m.div>

      <main className="relative flex flex-1 flex-col px-4 pb-10 md:px-6 lg:px-7">
        <div className="mx-auto flex w-full max-w-column flex-1 flex-col">
          <div className="flex items-center justify-between gap-4 pt-8">
            {/* Wayfinding: ticks, not a filling meter. Same grammar as the
                onboarding strip — position on a route, never workload. */}
            <div aria-hidden="true" className="flex w-32 gap-1 md:w-40">
              {story.beats.map((b, i) => (
                <span
                  key={b.id}
                  className={
                    "h-[3px] flex-1 rounded-full bg-text-on-deep transition-opacity duration-[--motion-standard] " +
                    (i === index
                      ? "opacity-100"
                      : i < index
                        ? "opacity-55"
                        : "opacity-20")
                  }
                />
              ))}
            </div>

            {/* The way out. A full-screen surface with no chrome needs one
                that isn't "tap through to the end" — the reader sets the pace
                includes deciding to stop. */}
            <button
              type="button"
              onClick={(event) => {
                event.stopPropagation();
                leave("/insights");
              }}
              className="type-meta hit-target cursor-pointer rounded-full text-text-on-deep opacity-70 underline decoration-dotted decoration-text-on-deep decoration-1 underline-offset-4 transition-opacity duration-[--motion-micro] hover:opacity-100"
            >
              Close
            </button>
          </div>

          {/* The mark is mounted ONCE and fed each beat's glyph, so it morphs
              between figures rather than swapping — the same rule the
              onboarding stage follows. */}
          <div className="pt-[10dvh]">
            <TurnGlyph
              turnId={beat.glyph}
              className="h-20 w-[120px] text-text-secondary md:h-24 md:w-[144px]"
            />
          </div>

          <m.div
            key={beat.id}
            initial={reduce ? false : { y: 10 }}
            animate={{ y: 0 }}
            transition={TRANSITION.considered}
            className={cn("flex flex-col pt-7", RHYTHM.pair)}
          >
            <SectionHeading>
              {beat.when}
            </SectionHeading>
            <div className="type-voice-xl measure text-text-primary">
              <ReadProse
                read={{ ...emptyActions, segments: beat.segments }}
              />
            </div>

          </m.div>

          {/* The horizon as it stood at this beat. It widens at the moment the
              story says it did, which is the whole reason to play this back
              rather than read it. */}
          {beat.projection && (
            <div aria-hidden="true" className="mt-auto pt-10">
              <HorizonField
                low={beat.projection.lowCents}
                high={beat.projection.highCents}
                central={beat.projection.centralCents}
                confidence={beat.projection.confidence}
                months={beat.projection.horizonMonths}
                height={96}
              />
            </div>
          )}

          <div className="flex items-start gap-4 pt-8">
            {index > 0 && (
              <ActionLink
                icon={<BackMark />}
                onClick={(event) => {
                  event.stopPropagation();
                  back();
                }}
                className="[&>span]:decoration-text-tertiary"
              >
                Back
              </ActionLink>
            )}

            {/* flex + items-start, not a plain block: this div carries no
                type-* class of its own, so as a plain block its anonymous
                line box would inherit whatever (much larger) line-height
                sits above it in the tree, and centre the short meta text
                inside that inherited box — offset from Back, which sets its
                own line-height directly. Flex layout positions the child
                against the DIV'S box, not an inherited line box, and
                items-start puts it flush with Back's own self-start.

                min-h-11 still reserves the primary Button's own height from
                the very first beat, so the swap from this meta line to the
                final Button on the last beat changes NEITHER this row's
                height NOR, through the HorizonField's mt-auto above, its
                position — the button appears in space already held for it
                rather than pushing the beat upward. */}
            <div className="ml-auto flex min-h-11 items-start">
              {last ? (
                <Button
                  variant="primary"
                  onClick={(event) => {
                    event.stopPropagation();
                    leave("/today");
                  }}
                >
                  That&rsquo;s where you are
                </Button>
              ) : (
                <Text variant="meta" tone="tertiary">
                  Tap to continue
                </Text>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

/** ReadProse takes a full Read; a beat is prose without actions. */
const emptyActions = { action: { commit: "", defer: "" } };

/**
 * Index arithmetic sits outside the component so the pointer handler and the
 * keyboard listener clamp identically — two copies of the same bounds check is
 * how the two paths drift apart.
 */
const nextIndex = (i: number, total: number) =>
  Math.min(i + 1, Math.max(0, total - 1));
const prevIndex = (i: number) => Math.max(0, i - 1);

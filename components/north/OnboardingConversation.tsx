"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Button,
  ChoiceChip,
  ChoiceChipGroup,
  CoachPresence,
  RouteMarks,
  Text,
  type RouteMark,
  TRANSITION,
  Wordmark,
  m,
  useMotionValue,
  useReducedMotion,
} from "@/components/nds";
import { buildProfile, isComplete } from "@/core/onboarding/build-profile";
import {
  expectedTurnCount,
  toAnswer,
  toTextAnswer,
  visibleTurns,
  type Answer,
  type Answers,
  type Choice,
  type Turn,
  type TurnId,
} from "@/core/onboarding/script";
import { cn } from "@/lib/cn";
import { saveProfile } from "@/state/profile-store";

import { Sky } from "./Sky";
import { SpokenField } from "./SpokenField";
import { TURN_GLYPH, TurnGlyph } from "./TurnGlyph";
import { VoiceChoice } from "./VoiceChoice";

/**
 * The onboarding conversation — one question per viewport, on a line.
 *
 * ── THE SHAPE ─────────────────────────────────────────────────────────────
 * Each turn owns a full viewport section; answering carries you to the next;
 * travelling back revisits any earlier answer, live and re-answerable. The
 * conversation is a PLACE with a direction, not a stack — going back is
 * literally going back.
 *
 * ── AND THE DIRECTION FOLLOWS THE MARKERS ─────────────────────────────────
 * Which way "next" points depends on which way this breakpoint DRAWS the
 * route, because a route drawn one way and walked another is telling the
 * reader two different things about where they are.
 *
 *   · Below `lg` the wayfinding strip lies across the masthead, left to
 *     right — so the questions are pages in a row, and a right swipe (the
 *     platform's own "back") returns to the one before.
 *   · At `lg` the strip becomes the rail in the left margin, top to bottom —
 *     so the column falls, and back is back up.
 *
 * Both are native scroll snapping on one DOM, not two implementations: the
 * axis is a breakpoint away, every travel call passes both `block` and
 * `inline` (see `TRAVEL`), and the browser pages it with the platform's real
 * physics rather than an approximation of them.
 *
 * The sky holds still while the questions travel under it. The masthead names
 * the current step and the glyph MORPHS between figures as the active section
 * changes — the same four lines re-arranging, which is the whole thesis: every
 * question is one picture of the same life.
 *
 * ── PROGRESS ──────────────────────────────────────────────────────────────
 * The old doctrine ("no meter, state the shape once") gave way to a wayfinding
 * strip: answered / here / still to come. It earns its place by being POSITION,
 * not workload — ticks on a route, not a percentage filling up. Mobile wears it
 * under the masthead; desktop hangs a rail in the left margin where each tick
 * is also a way to travel.
 *
 * ── THE PAUSE, RELOCATED ──────────────────────────────────────────────────
 * The 500ms "thinking" beat between stacked turns is gone; the scroll travel
 * IS the considered pause now — real motion with real distance, resolving in
 * visible content, never a fake.
 */

/** The chosen chip holds while its siblings exhale, then the page turns. */
const PICK_HOLD_MS = 240;

/**
 * How a section is brought into view, on whichever axis is in play.
 *
 * `block` is the vertical alignment and `inline` the horizontal one, so
 * passing both means ONE call serves the phone's sideways pages and the
 * desktop's falling column — the axis that is not scrolling simply has
 * nothing to do. Without `inline` the browser defaults to "nearest", which on
 * a horizontal scroller leaves a half-turned page sitting between two
 * questions.
 */
const TRAVEL = { block: "start", inline: "start" } as const;

export function OnboardingConversation() {
  const router = useRouter();
  const reduceMotion = useReducedMotion();
  const [answers, setAnswers] = useState<Answers>({});
  /**
   * One draft PER TEXT TURN, not one shared. With a single string, the
   * concern you typed at the door arrived pre-filled in the name field ten
   * questions later — the previous answer wearing the next question's hat.
   * Keyed by turn, each field owns its words and travelling back shows what
   * you actually said there.
   */
  const [drafts, setDrafts] = useState<Partial<Record<TurnId, string>>>({});
  const [picked, setPicked] = useState<string | null>(null);
  const [finishing, setFinishing] = useState(false);
  const [activeId, setActiveId] = useState<TurnId>("openingConcern");
  // Fed to the ONE mounted glyph while a choice turn is being answered by
  // voice (docs/VOICE.md §4.1) — created once here because the glyph and the
  // microphone live at different depths in the tree, and every VoiceChoice
  // instance across every section writes into this same value.
  const voiceAmplitude = useMotionValue(0);
  const [voiceListening, setVoiceListening] = useState(false);

  const turns = useMemo(() => visibleTurns(answers), [answers]);
  const frontier = turns.findIndex((t) => answers[t.id] === undefined);
  /** Every answered turn, plus the one being asked. The future stays unwritten. */
  const sections = frontier === -1 ? turns : turns.slice(0, frontier + 1);

  /** The turn the viewport is looking at — drives masthead, glyph, indicator. */
  const active =
    turns.find((t) => t.id === activeId) ?? sections[sections.length - 1];

  const scrollerRef = useRef<HTMLDivElement>(null);
  const sectionEls = useRef(new Map<TurnId, HTMLElement>());
  const sectionCount = useRef(1);

  /** Which section is the viewport's subject, watched rather than inferred. */
  useEffect(() => {
    const scroller = scrollerRef.current;
    if (!scroller) return;
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          const id = (entry.target as HTMLElement).dataset.turn as TurnId;
          if (id) setActiveId(id);
        }
      },
      { root: scroller, threshold: 0.55 },
    );
    for (const el of sectionEls.current.values()) observer.observe(el);
    return () => observer.disconnect();
  }, [sections.length]);

  /** A new question arriving is what turns the page. */
  useEffect(() => {
    if (sections.length <= sectionCount.current) {
      sectionCount.current = sections.length;
      return;
    }
    sectionCount.current = sections.length;
    const next = sections[sections.length - 1];
    const el = sectionEls.current.get(next.id);
    if (!el) return;
    el.scrollIntoView({
      behavior: reduceMotion ? "auto" : "smooth",
      ...TRAVEL,
    });
    // Keyboard and screen reader users land on the question, not mid-page.
    el.querySelector<HTMLElement>("[data-question]")?.focus({
      preventScroll: true,
    });
  }, [sections, reduceMotion]);

  const record = useCallback(
    (turn: Turn, answer: Answer) => {
      const wasAnswered = answers[turn.id] !== undefined;
      const next = { ...answers, [turn.id]: answer };
      setAnswers(next);

      if (isComplete(next)) {
        // `now` is stamped here, at the edge. The engine never reads a clock.
        saveProfile(buildProfile(next, new Date()));
        setFinishing(true);
        // The reveal belongs to Today's first-run state, not a duplicate here.
        router.push("/today");
        return;
      }

      // Re-answering an earlier question doesn't grow the section list, so
      // the arrival effect below won't fire — but answering still means
      // moving. Travel to whatever follows, by hand.
      if (wasAnswered) {
        const order = visibleTurns(next);
        const following = order[order.findIndex((t) => t.id === turn.id) + 1];
        if (following) {
          requestAnimationFrame(() =>
            sectionEls.current
              .get(following.id)
              ?.scrollIntoView({
                behavior: reduceMotion ? "auto" : "smooth",
                ...TRAVEL,
              }),
          );
        }
      }
    },
    [answers, router, reduceMotion],
  );

  const choose = useCallback(
    (turn: Turn, choice: Choice) => {
      if (picked !== null) return;
      setPicked(`${turn.id}:${choice.label}`);
      window.setTimeout(() => {
        setPicked(null);
        record(turn, toAnswer(choice));
      }, PICK_HOLD_MS);
    },
    [picked, record],
  );

  const jumpTo = useCallback(
    (id: TurnId) => {
      sectionEls.current
        .get(id)
        ?.scrollIntoView({
          behavior: reduceMotion ? "auto" : "smooth",
          ...TRAVEL,
        });
    },
    [reduceMotion],
  );

  if (finishing) {
    return (
      <div className="flex min-h-dvh items-center justify-center">
        <CoachPresence announce />
      </div>
    );
  }

  const activeIndex = turns.findIndex((t) => t.id === active.id);

  /**
   * The route, as marks — computed once and handed to both the strip and the
   * rail, so the two can no longer disagree about what is answered.
   */
  const routeMarks: RouteMark[] = turns.map((t) => ({
    id: t.id,
    label: TURN_GLYPH[t.id].name,
    state:
      t.id === active.id
        ? "current"
        : answers[t.id] !== undefined
          ? "answered"
          : "toCome",
    // The future stays unwritten: a question that has not been reached is not
    // somewhere you can jump to.
    reachable: sections.some((s) => s.id === t.id),
  }));

  return (
    /* ── THE CONVERSATION TRAVELS THE WAY ITS MARKERS DO ───────────────────
       Two axes, one DOM.

       Below `lg` the wayfinding strip lies ACROSS the masthead, left to
       right, so the questions move left to right too: each one is a full-width
       page, and answering carries you sideways to the next. Swiping right —
       the natural "back" on a touch surface — returns you to the question
       before it. That is all native scroll snapping, not a gesture handler:
       the browser already knows how to page a horizontal scroller, and it
       does it with the platform's own physics rather than an approximation.

       At `lg` the strip becomes the vertical rail in the left margin, so the
       page falls instead — the original behaviour, untouched.

       The rule underneath: the route is drawn one way and travelled the same
       way. A horizontal progress strip over a page that falls downward was
       telling the reader two different things about where they were.

       The masthead, the glyph stage and the desktop rail are FIXED and live
       outside the scroller. They were inside it before, where `sticky top-0`
       held the masthead against a vertical scroll — but a sticky child of a
       horizontal flex scroller is just a flex item, and it would have
       travelled sideways with the questions. */
    <div className="h-dvh">
      {/* The sky holds still; the conversation travels under it. */}
      {/* `bg-surface-page` UNDER the sky. The sky is a gradient whose last
          stop only reaches paper at its final pixel, so the header had no
          opaque floor of its own — and a question scrolled up under it showed
          through the tail. The ground goes behind the gradient; the gradient
          still paints the sky. */}
      <header
        className="fixed inset-x-0 top-0 z-10 overflow-hidden bg-surface-page"
        // Inset + bar. The sky is `h-full`, so it covers both and runs one
        // ramp from the top of the glass — see the product shell's note.
        style={{ height: "calc(var(--safe-top) + var(--chrome-onboarding))" }}
      >
        <Sky className="h-full" />
        {/* Same padding-then-column nesting as the sections below, so the
            masthead, the glyph stage, and every question share one left edge
            at every breakpoint. */}
        {/* padding-top eats the inset out of h-full, so items-center centers
            within the BAR, not within inset-plus-bar — the row never rides
            under the clock. Same fix as the product masthead's inline top. */}
        <div
          className="relative flex h-full items-center px-4 md:px-6 lg:px-7"
          style={{ paddingTop: "var(--safe-top)" }}
        >
          <div className="mx-auto flex w-full max-w-column items-center justify-between gap-6">
            <div className="flex min-w-0 flex-col gap-2.5">
              <h1 className="flex items-center gap-2.5 whitespace-nowrap text-text-on-deep">
                <Wordmark height={12} strokeWidth={2.1} />
                <span aria-hidden="true" className="type-overline opacity-70">
                  ·
                </span>
                <m.span
                  key={active.id}
                  initial={{ y: 4 }}
                  animate={{ y: 0 }}
                  transition={TRANSITION.standard}
                  className="type-overline inline-block"
                >
                  {TURN_GLYPH[active.id].name}
                </m.span>
              </h1>
              {/* Wayfinding, small screens: the route under the masthead. The
                  desktop rail takes over at lg — the SAME marks in the same
                  vocabulary, turned ninety degrees. `text-text-on-deep`
                  because this one hangs on the sky; the marks paint in
                  currentColor and know nothing about their ground. */}
              <div className="text-text-on-deep lg:hidden">
                <RouteMarks marks={routeMarks} />
              </div>
            </div>
          </div>
        </div>
        <p className="sr-only" aria-live="polite">
          Question {activeIndex + 1} of {turns.length}
        </p>
      </header>

      {/* ── THE GLYPH'S STAGE ────────────────────────────────────────────
          Fixed above every question, where the six lines re-arrange while the
          pages travel beneath them. Mounted once — never keyed — or the morph
          becomes a swap.

          IT NEEDS A FLOOR. The stage was transparent, and a glyph is mostly
          holes: once a question grew tall enough to scroll inside its own
          page, its text rode up THROUGH the compass and the two drawings sat
          on top of each other. A hairline mark cannot be read over moving
          prose, and the prose cannot be read through a hairline mark.

          So the stage carries the page's own ground and the content genuinely
          disappears behind it. `surface-page` is `paper-50`, which is exactly
          the colour the sky above it fades to — the masthead, this stage and
          the page are one continuous sheet, and the seam is invisible.

          Then a soft edge, because a hard horizontal line across the screen
          would read as a rule someone drew rather than as depth. Text should
          fade out as it goes under, the way it does at the top of the sky. */}
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-x-0 z-10"
        // Sits directly under the header, so it carries the same inset.
        style={{ top: "calc(var(--safe-top) + var(--chrome-onboarding))" }}
      >
        <div className="bg-surface-page px-4 pt-6 md:px-6 md:pt-8 lg:px-7">
          <div className="mx-auto w-full max-w-column">
            <TurnGlyph
              turnId={active.id}
              listening={voiceListening}
              amplitude={voiceAmplitude}
              className="h-20 w-[120px] text-text-secondary md:h-24 md:w-[144px]"
            />
          </div>
        </div>
        <div className="h-10 bg-gradient-to-b from-surface-page to-transparent md:h-12" />
      </div>

      {/* Wayfinding, desktop: the same marks, hung as a rail in the margin.
          Here there is room to give every one a real 44px target, so each is
          also a way to travel back up the route — which the phone strip
          cannot be, and does not need to be, because the swipe does it. */}
      {/* The breakpoint gate lives on a WRAPPER, not on RouteMarks' own
          className: `cn` is a plain joiner by design, so `hidden` and the
          component's `flex` would both survive and the winner would be
          whichever Tailwind happened to emit last. */}
      <div className="fixed top-1/2 left-6 z-20 hidden -translate-y-1/2 text-text-primary lg:block">
        <RouteMarks
          marks={routeMarks}
          direction="col"
          label="Conversation progress"
          onJump={(id) => jumpTo(id as TurnId)}
        />
      </div>

      <div
        ref={scrollerRef}
        className={cn(
          "h-dvh",
          // Phone and tablet: a row of pages, snapped, turned by swiping.
          // `overscroll-x-contain` keeps a swipe past the first question from
          // being handed to the browser as a back-navigation out of the
          // product — the one place a horizontal scroller can lose someone.
          "flex snap-x snap-mandatory overflow-x-auto overflow-y-hidden overscroll-x-contain",
          // `no-track` only bites below lg — the same argument globals.css
          // already makes for the document: on a touch surface the overlay
          // scrollbar fades by itself, so a persistent track under a
          // full-bleed question is a desktop artifact.
          "no-track",
          // Desktop: the column falls, exactly as before.
          "lg:block lg:snap-y lg:overflow-x-hidden lg:overflow-y-auto",
        )}
      >
        {sections.map((turn, index) => (
          <section
            key={turn.id}
            data-turn={turn.id}
            ref={(el) => {
              if (el) sectionEls.current.set(turn.id, el);
              else sectionEls.current.delete(turn.id);
            }}
            // justify-start with a fixed offset, not center: the question lands
            // at the same height every time, directly under the glyph's stage.
            className={cn(
              // pt tracks the chrome: when `--chrome-onboarding` came down
              // 2rem to match the product bar, this came down with it, so the
              // question keeps its distance from the glyph rather than from a
              // number the masthead no longer occupies.
              "flex snap-start flex-col justify-start px-4 pt-52 pb-16 md:px-6 md:pt-64 lg:px-7",
              // A page, exactly one viewport wide and one tall. `shrink-0` or
              // the flex row would compress ten questions into one screen.
              // Its own `overflow-y-auto` because the sideways scroller cannot
              // scroll down: a turn with many choices has to be readable on a
              // short phone without stealing the page-turn gesture.
              "h-dvh w-full shrink-0 overflow-y-auto",
              "lg:h-auto lg:min-h-dvh lg:w-auto lg:overflow-visible",
            )}
          >
            <div className="mx-auto flex w-full max-w-column flex-col gap-4">
              {index === 0 && (
                <Text variant="meta" as="p" tone="tertiary">
                  {expectedTurnCount(answers)} questions. About ninety seconds.
                </Text>
              )}

              <p
                data-question
                tabIndex={-1}
                className="type-voice-md measure text-text-primary outline-none"
              >
                {turn.question}
              </p>

              {turn.note && (
                <Text variant="meta" tone="tertiary" className="-mt-1">
                  {turn.note}
                </Text>
              )}

              {turn.kind === "text" ? (
                <>
                  <SpokenField
                    value={drafts[turn.id] ?? ""}
                    onChange={(value) =>
                      setDrafts((current) => ({ ...current, [turn.id]: value }))
                    }
                    label={turn.question}
                    autoFocus={index === 0}
                    onSubmit={() => {
                      const said = (drafts[turn.id] ?? "").trim();
                      if (said) record(turn, toTextAnswer(said));
                    }}
                    /* NOT full width, unlike the page-level actions in the
                       opening flow. Inside the composer this is one of a
                       PAIR — Continue and "Or say it" share a row — and
                       stretching it broke the pair twice over: the mic
                       wrapped to a line of its own, and the disabled state
                       became a grey slab filling a box whose whole job is
                       to look like a place to write. */
                    action={
                      <Button
                        variant="primary"
                        disabled={!(drafts[turn.id] ?? "").trim()}
                        onClick={() =>
                          record(
                            turn,
                            toTextAnswer((drafts[turn.id] ?? "").trim()),
                          )
                        }
                      >
                        Continue
                      </Button>
                    }
                  />
                </>
              ) : (
                <>
                  <ChoiceChipGroup label={turn.question} block>
                    {turn.options.map((choice) => {
                      const chosen =
                        answers[turn.id] !== undefined &&
                        answers[turn.id]!.value === choice.value &&
                        answers[turn.id]!.confidence ===
                          (choice.confidence ?? "stated");
                      const held = picked === `${turn.id}:${choice.label}`;
                      return (
                        <ChoiceChip
                          key={choice.label}
                          block
                          selected={held || chosen}
                          className={
                            picked === null || !picked.startsWith(`${turn.id}:`)
                              ? undefined
                              : held
                                ? "scale-[1.02] transition-transform duration-[--motion-standard]"
                                : "scale-95 opacity-35 transition-[opacity,transform] duration-[--motion-standard]"
                          }
                          onSelect={() => choose(turn, choice)}
                        >
                          {choice.label}
                        </ChoiceChip>
                      );
                    })}
                  </ChoiceChipGroup>

                  {/* Speaking a choice and tapping it are two doors into one
                    room — this calls the exact same `choose()` a tap does,
                    so the pick-hold animation and the recorded answer are
                    identical either way (docs/VOICE.md, Phase 1). */}
                  <VoiceChoice
                    turn={turn}
                    onMatch={(choice) => choose(turn, choice)}
                    amplitude={voiceAmplitude}
                    onListeningChange={setVoiceListening}
                    disabled={voiceListening}
                  />
                </>
              )}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}

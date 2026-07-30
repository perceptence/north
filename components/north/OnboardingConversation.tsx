"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Button,
  ChoiceChip,
  ChoiceChipGroup,
  CoachPresence,
  Text,
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
import { saveProfile } from "@/state/profile-store";
import { Sky } from "./Sky";
import { SpokenField } from "./SpokenField";
import { TURN_GLYPH, TurnGlyph } from "./TurnGlyph";
import { VoiceChoice } from "./VoiceChoice";

/**
 * The onboarding conversation — one question per viewport, on a vertical line.
 *
 * ── THE SHAPE ─────────────────────────────────────────────────────────────
 * Each turn owns a full viewport section; answering carries you down to the
 * next; scrolling up revisits any earlier answer, live and re-answerable. The
 * conversation is a PLACE with a direction, not a stack — going back is
 * literally going back up.
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

export function OnboardingConversation() {
  const router = useRouter();
  const reduceMotion = useReducedMotion();
  const [answers, setAnswers] = useState<Answers>({});
  const [draft, setDraft] = useState("");
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
    el.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth" });
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
              ?.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth" }),
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
        ?.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth" });
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

  return (
    <div
      ref={scrollerRef}
      className="h-dvh snap-y snap-mandatory overflow-y-auto"
    >
      {/* The sky holds still; the conversation travels under it. */}
      <header className="sticky top-0 z-10 h-24 overflow-hidden md:h-28">
        <Sky className="h-full" />
        {/* Same padding-then-column nesting as the sections below, so the
            masthead, the glyph stage, and every question share one left edge
            at every breakpoint. */}
        <div className="relative flex h-full items-center px-4 md:px-6 lg:px-7">
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
                desktop rail takes over at lg. */}
            <div aria-hidden="true" className="flex w-40 gap-1 lg:hidden">
              {turns.map((t) => (
                <span
                  key={t.id}
                  className={
                    "h-[3px] flex-1 rounded-full bg-text-on-deep transition-opacity duration-[--motion-standard] " +
                    (t.id === active.id
                      ? "opacity-100"
                      : answers[t.id] !== undefined
                        ? "opacity-55"
                        : "opacity-20")
                  }
                />
              ))}
            </div>
          </div>
          </div>
        </div>
        <p className="sr-only" aria-live="polite">
          Question {activeIndex + 1} of {turns.length}
        </p>
      </header>

      {/* The glyph's stage: fixed above every question, where the six lines
          re-arrange while the pages travel beneath them. Mounted once —
          never keyed — or the morph becomes a swap. */}
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-x-0 top-24 z-10 md:top-28"
      >
        <div className="px-4 pt-6 md:px-6 md:pt-8 lg:px-7">
          <div className="mx-auto w-full max-w-column">
            <TurnGlyph
              turnId={active.id}
              listening={voiceListening}
              amplitude={voiceAmplitude}
              className="h-20 w-[120px] text-text-secondary md:h-24 md:w-[144px]"
            />
          </div>
        </div>
      </div>

      {/* Wayfinding, desktop: the rail in the margin. Each answered tick is
          also a way to travel back up the route. */}
      <nav
        aria-label="Conversation progress"
        className="fixed top-1/2 left-6 z-20 hidden -translate-y-1/2 flex-col items-start gap-2.5 lg:flex"
      >
        {turns.map((t, i) => {
          const answered = answers[t.id] !== undefined;
          const current = t.id === active.id;
          const reachable = sections.some((s) => s.id === t.id);
          return (
            <button
              key={t.id}
              type="button"
              disabled={!reachable}
              onClick={() => jumpTo(t.id)}
              aria-label={`Question ${i + 1}: ${TURN_GLYPH[t.id].name}${
                answered ? ", answered" : current ? ", current" : ", to come"
              }`}
              aria-current={current ? "step" : undefined}
              // The tick is a hairline but the button is not — a 2px hit
              // target is a refusal-list violation wearing a nice outfit.
              className={
                "group flex h-4 w-10 items-center " +
                (reachable ? "cursor-pointer" : "")
              }
            >
              <span
                className={
                  "block rounded-full transition-all duration-[--motion-standard] " +
                  (current
                    ? "h-[3px] w-8 bg-text-primary"
                    : answered
                      ? "h-[2px] w-4 bg-text-tertiary group-hover:w-6 group-hover:bg-text-secondary"
                      : "h-[2px] w-4 bg-line-hairline")
                }
              />
            </button>
          );
        })}
      </nav>

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
          className="flex min-h-dvh snap-start flex-col justify-start px-4 pt-60 pb-16 md:px-6 md:pt-72 lg:px-7"
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
              <SpokenField
                value={draft}
                onChange={setDraft}
                label={turn.question}
                autoFocus={index === 0}
                onSubmit={() =>
                  draft.trim() && record(turn, toTextAnswer(draft.trim()))
                }
                action={
                  <Button
                    variant="primary"
                    disabled={!draft.trim()}
                    onClick={() => record(turn, toTextAnswer(draft.trim()))}
                  >
                    Continue
                  </Button>
                }
              />
            ) : (
              <>
                <ChoiceChipGroup label={turn.question} block={turn.block}>
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
                        block={turn.block}
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
  );
}

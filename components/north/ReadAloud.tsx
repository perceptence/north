"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { spoken, type SpeechRegister } from "@/core/speech";
import type { ReadSegment } from "@/core/waterfall";
import { cn } from "@/lib/cn";
import { useHydrated } from "@/lib/use-hydrated";
import { useSpeechSynthesis } from "@/lib/use-speech-synthesis";
import { ActionLink, SpeakMark } from "./ActionGlyphs";

/**
 * "Read this to me" — the only way North ever makes a sound.
 *
 * ── ASKING IS THE ENABLING ────────────────────────────────────────────────
 * There is no settings screen in North (CLAUDE.md), and a speech toggle set
 * once in a quieter room than the one you are in now is exactly the control
 * that will embarrass someone. So the switch IS this button: North is silent
 * until asked, every time, and the asking is scoped to the one reading you
 * asked for (docs/VOICE.md §3.4).
 *
 * Nothing here persists. No store, no localStorage, no "voice on" that
 * survives a reload — the state lives in this component and dies with it,
 * which is the design, not an omission.
 *
 * ── IT STARTS DISCREET ────────────────────────────────────────────────────
 * The default register elides every figure and points at the screen
 * (`core/speech/spoken.ts`). "Say the numbers too" is offered only WHILE it
 * is speaking, because that is the moment the user knows whether the room is
 * safe — not a preference expressed in advance. Choosing it re-reads the
 * same segments in full; it never carries over to the next reading.
 *
 * The story passes `defaultRegister="full"` — deciding to play a narrated
 * story is already deciding to listen (docs/VOICE.md §7, Phase 4).
 *
 * ── PROGRESSIVE ───────────────────────────────────────────────────────────
 * No synthesis API, no control. Not a disabled button, not a message about
 * what is missing — nothing, exactly like the mic.
 */

export interface ReadAloudProps {
  /** The engine's own segments. Never a string a caller composed by hand. */
  segments: ReadSegment[];
  /** Where the reading starts. Discreet everywhere except the story. */
  defaultRegister?: SpeechRegister;
  /** Idle label. The story says "Play it" rather than "Read this to me". */
  label?: string;
  className?: string;
}

export function ReadAloud({
  segments,
  defaultRegister = "discreet",
  label = "Read this to me",
  className,
}: ReadAloudProps) {
  const hydrated = useHydrated();
  const { available, speaking, speak, stop } = useSpeechSynthesis();
  const [register, setRegister] = useState<SpeechRegister>(defaultRegister);

  // Read from the callbacks below without making them depend on the current
  // segments — a screen that recomputes its read on every store tick would
  // otherwise hand this a new identity every frame.
  const segmentsRef = useRef(segments);
  useEffect(() => {
    segmentsRef.current = segments;
  }, [segments]);

  const readIn = useCallback(
    (next: SpeechRegister) => {
      setRegister(next);
      speak(spoken(segmentsRef.current, next));
    },
    [speak],
  );

  /**
   * Silence when the content changes underneath.
   *
   * The story advances beats while this is mounted, and Today recomposes when
   * a decision resolves. Continuing to read the previous text over the new
   * screen is the one failure mode that would make this feel out of control —
   * and control is the entire premise of an opt-in disclosure.
   *
   * Keyed on the segments' CONTENT, never their array identity. Every screen
   * here recomputes its read during render (`evaluate()`, `composeStory()`),
   * so the array is a new object every frame — depending on it directly would
   * stop the speech on the tick after it started, every time.
   */
  const contentKey = segments
    .map((s) =>
      s.kind === "text" ? s.value : `${s.format}:${s.value}:${s.confidence}`,
    )
    .join("|");

  // Only `stop()` — telling an external system to go quiet, which is what an
  // effect is for. Resetting `register` here too would be both a cascading
  // setState and redundant: `readIn` sets it before every reading, and while
  // idle nothing reads it. The next tap starts from `defaultRegister`
  // whatever it was left at.
  useEffect(() => {
    stop();
  }, [contentKey, stop]);

  // Gated on hydration: the server cannot know whether this browser speaks,
  // and guessing is a hydration mismatch either way.
  if (!hydrated || !available) return null;

  if (!speaking) {
    return (
      <ActionLink
        icon={<SpeakMark />}
        onClick={() => readIn(defaultRegister)}
        className={className}
      >
        {label}
      </ActionLink>
    );
  }

  return (
    <div className={cn("flex flex-wrap items-center gap-x-6 gap-y-2", className)}>
      <ActionLink icon={<SpeakMark />} onClick={stop}>
        Stop
      </ActionLink>

      {/* Offered only while speaking, and only when there is something left
          to reveal. In the full register this control would be a no-op that
          still looked like a choice. */}
      {register === "discreet" && (
        <ActionLink icon={<SpeakMark />} onClick={() => readIn("full")}>
          Say the numbers too
        </ActionLink>
      )}
    </div>
  );
}

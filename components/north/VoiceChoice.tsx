"use client";

import { useEffect, useRef, useState } from "react";
import { CoachPresence, type MotionValue } from "@/components/nds";
import { matchChoice } from "@/core/onboarding/voice-match";
import type { Choice, ChoiceTurn } from "@/core/onboarding/script";
import { cn } from "@/lib/cn";
import { useMicAmplitude } from "@/lib/use-mic-amplitude";
import { useSpeechRecognition } from "@/lib/use-speech-recognition";

/**
 * "Or say it" for a choice turn — Phase 1 of docs/VOICE.md.
 *
 * ── WHAT THIS ADDS THAT SpokenField DIDN'T ALREADY HAVE ───────────────────
 * SpokenField already let you dictate the one free-text answer in onboarding.
 * Every OTHER turn is a `ChoiceChipGroup` — tap only, no voice at all — which
 * is most of the conversation. This is that: speak an answer, and it resolves
 * to one of the options on screen via `matchChoice` (core/onboarding/
 * voice-match.ts), a deterministic local matcher, never a model call.
 *
 * ── IT NEVER DECIDES ANYTHING ITSELF ───────────────────────────────────────
 * A confident match calls `onMatch`, which the caller wires to the SAME
 * `choose(turn, choice)` handler a tap already uses — this component owns no
 * "selected" state and re-implements none of the pick-hold animation.
 * Speaking a choice and tapping it are two doors into one room.
 *
 * ── AND IT CAN SAY NO ──────────────────────────────────────────────────────
 * No confident match shows a quiet retry line, never an alarm — the same
 * refusal-list tone as everywhere else (docs/UX-ARCHITECTURE.md §11). The
 * heard transcript stays on screen alongside it, so "try rephrasing" is
 * something the user can actually act on rather than a guess.
 *
 * ── WHY OUTPUT IS SILENT ────────────────────────────────────────────────────
 * This is INPUT only. North does not read the question aloud or narrate the
 * match — docs/VOICE.md §3.2, voice is never a mode you enter, and output is
 * a disclosure with its own, later, opt-in (§3.4). Nothing here makes a sound.
 */

export interface VoiceChoiceProps {
  turn: ChoiceTurn;
  /** Fired on a confident match. Wire this to the same handler a tap uses. */
  onMatch: (choice: Choice) => void;
  /** The one glyph this conversation owns, fed live while listening. */
  amplitude?: MotionValue<number>;
  /** So the parent's single glyph knows whether THIS instance is live. */
  onListeningChange?: (listening: boolean) => void;
  /** True while some OTHER VoiceChoice already holds the microphone. */
  disabled?: boolean;
  className?: string;
}

export function VoiceChoice({
  turn,
  onMatch,
  amplitude,
  onListeningChange,
  disabled = false,
  className,
}: VoiceChoiceProps) {
  const [heard, setHeard] = useState("");
  const [missed, setMissed] = useState(false);
  // A ref, not just the `heard` state — `onEnd` fires from a SEPARATE native
  // callback than `onResult`, so it cannot trust a closed-over value from the
  // last render to be current. A ref update in `onResult` is synchronous and
  // always current by the time `onEnd` reads it, no batching ambiguity.
  const heardRef = useRef("");

  const { available, listening, start, stop } = useSpeechRecognition({
    onResult: (transcript) => {
      heardRef.current = transcript;
      setHeard(transcript);
      setMissed(false);
    },
    onEnd: () => {
      // Fires from the real moment recognition stopped, so resolving the
      // transcript here — rather than from an effect watching `listening`
      // flip — never chains a state update off a state update.
      const transcript = heardRef.current.trim();
      if (!transcript) return;
      const match = matchChoice(turn, transcript);
      if (match) {
        onMatch(match);
        heardRef.current = "";
        setHeard("");
        setMissed(false);
      } else {
        setMissed(true);
      }
    },
  });
  useMicAmplitude(listening, amplitude);

  // Tell the parent whenever OUR OWN listening state actually changes. This
  // one stays an effect on purpose — it is telling an EXTERNAL system (the
  // parent, which owns the single glyph) about a value React already holds,
  // the first sanctioned shape in the rule this file otherwise avoids.
  useEffect(() => {
    onListeningChange?.(listening);
  }, [listening, onListeningChange]);

  // Progressive: no API, no button. Not a disabled button, not a message
  // about what's missing — nothing, exactly like SpokenField.
  if (!available) return null;

  return (
    <div className={cn("flex flex-col gap-2", className)}>
      <button
        type="button"
        aria-pressed={listening}
        disabled={disabled && !listening}
        onClick={() => {
          if (listening) {
            stop();
            return;
          }
          setHeard("");
          setMissed(false);
          start();
        }}
        className={cn(
          "type-label hit-target inline-flex min-h-11 cursor-pointer items-center gap-2.5 self-start",
          "rounded-full border px-4 py-3 select-none",
          "transition-[background-color,border-color,color] duration-[--motion-micro]",
          listening
            ? // The open microphone is this viewport's one signal element —
              // live state, honestly announced. Same rule as SpokenField.
              "border-signal-coach text-text-primary"
            : "border-action-border text-text-secondary hover:border-action-border-hover hover:bg-surface-sunken",
          disabled && !listening && "cursor-not-allowed opacity-50",
        )}
      >
        {listening && <CoachPresence size="sm" />}
        {listening ? "Listening" : "Or say it"}
      </button>

      {/* What North heard. Stays up through a miss, not just while live, so
          "try again" has something to try differently against. */}
      {heard && (listening || missed) && (
        <p
          aria-live="polite"
          className="type-voice-md italic text-text-tertiary"
        >
          {heard}
        </p>
      )}

      {missed && !listening && (
        <p className="type-meta text-text-tertiary">
          Didn&rsquo;t catch a match — try again, or tap one.
        </p>
      )}
    </div>
  );
}

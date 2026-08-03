"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  Button,
  TRANSITION,
  Text,
  m,
  useMotionValue,
  useReducedMotion,
} from "@/components/nds";
import { respond, routeIntent } from "@/core/coach";
import type { Decision } from "@/core/decisions";
import type { Scenario } from "@/core/navigator";
import type { SituationProfile } from "@/core/profile/types";
import { spoken } from "@/core/speech";
import type { EvaluateOptions, ReadSegment } from "@/core/waterfall";
import type { TurnId } from "@/core/onboarding/script";
import { cn } from "@/lib/cn";
import { useHydrated } from "@/lib/use-hydrated";
import { useMicAmplitude } from "@/lib/use-mic-amplitude";
import {
  speechRecognitionAvailable,
  useSpeechRecognition,
} from "@/lib/use-speech-recognition";
import {
  speechSynthesisAvailable,
  useSpeechSynthesis,
} from "@/lib/use-speech-synthesis";
import { ReadProse } from "./ReadProse";
import { TurnGlyph } from "./TurnGlyph";

/**
 * Voice mode — the one place North is a voice rather than a page.
 *
 * ── THIS IS A MODE, AND THAT IS A DELIBERATE REVERSAL ─────────────────────
 * docs/VOICE.md §3.2 said "voice is never a mode". That rule existed to stop
 * North disclosing your balance to a room you did not choose. A full-screen
 * mode you deliberately enter, obviously occupy, and leave with one tap
 * serves that goal BETTER than ambient speech does: nothing here can start
 * by surprise, and there is never a question about whether North is
 * listening. The letter of the rule changed; the reason behind it did not.
 *
 * ── WHY NOT AN ORB ────────────────────────────────────────────────────────
 * Every voice product ships a pulsing sphere. North already owns a mark made
 * of six hairline strokes on a uniform skeleton that morphs between figures
 * on a spring — a voice visualiser that predates the feature. So the glyph
 * is the voice: it breathes on your actual microphone level while listening,
 * and drifts through figures on a slow cadence while North speaks.
 *
 * ── PHONE AND TABLET ONLY ─────────────────────────────────────────────────
 * The caller gates this below `lg`. Talking to your finances is a thing you
 * do holding a device, not at a desk in an open-plan office — and the
 * surface that would be most exposed is exactly the one where the entry
 * point is hidden.
 *
 * ── THE SCREEN IS STILL THE RECORD ────────────────────────────────────────
 * What you said and what North answered stay on screen as real `Figure`s
 * (docs/VOICE.md §4.2): numbers have to be SEEN, ranges and confidence marks
 * cannot survive being spoken, and a voice-only path would exclude
 * deaf and hard-of-hearing users. The glyph is the theatre; the transcript
 * is the truth.
 */

/**
 * The figures the mark drifts through while North talks.
 *
 * Chosen for shape variety rather than meaning — this is the coach's voice,
 * not a specific turn — so consecutive figures are visibly different and the
 * morph reads as movement rather than a twitch.
 */
const SPEAKING_CYCLE: TurnId[] = [
  "openingConcern",
  "horizon",
  "liquid",
  "confidence",
];

/** How long each figure holds before the mark morphs to the next. */
const CYCLE_MS = 2600;

/**
 * The way in — the only one.
 *
 * Hidden from `lg` up, and hidden entirely where the browser cannot listen.
 * Progressive as ever: no capability, no control, and never a disabled
 * button referring to something that isn't there.
 *
 * A secondary Button rather than an `ActionLink`, because entering a mode is
 * not a quiet tertiary action — but still not the primary, which belongs to
 * "Think it through" on the typed path.
 */
export function VoiceEntry({ onOpen }: { onOpen: () => void }) {
  const hydrated = useHydrated();
  const canHear = hydrated && speechRecognitionAvailable();
  const canSpeak = hydrated && speechSynthesisAvailable();
  if (!canHear || !canSpeak) return null;

  return (
    <div className="lg:hidden">
      <Button variant="secondary" onClick={onOpen}>
        Talk to North
      </Button>
    </div>
  );
}

export interface VoiceModeProps {
  profile: SituationProfile;
  decisions: Decision[];
  options: EvaluateOptions;
  scenarios: Scenario[];
  previousProfile?: SituationProfile | null;
  previousAt?: string | null;
  onClose: () => void;
}

export function VoiceMode({
  profile,
  decisions,
  options,
  scenarios,
  previousProfile = null,
  previousAt = null,
  onClose,
}: VoiceModeProps) {
  const reduce = useReducedMotion();
  const [heard, setHeard] = useState("");
  const [answer, setAnswer] = useState<ReadSegment[]>([]);
  const [cycle, setCycle] = useState(0);

  const amplitude = useMotionValue(0);
  const heardRef = useRef("");

  const { speaking, speak, stop: stopSpeaking } = useSpeechSynthesis();

  /** Answer a finished utterance, then say it back. */
  const answerNow = useCallback(
    (transcript: string) => {
      const said = transcript.trim();
      if (!said) return;

      const intent = routeIntent(said, scenarios);
      if (intent.kind === "stop") {
        onClose();
        return;
      }
      if (intent.kind === "repeat") {
        speak(spoken(answer, "full"));
        return;
      }

      const reply = respond(intent, {
        profile,
        decisions,
        options,
        previousProfile,
        previousAt,
      });
      setAnswer(reply.segments);
      // FULL register here, unlike everywhere else. Entering a spoken
      // conversation on purpose is choosing to hear it; eliding the figures
      // now would be protecting someone from the thing they asked for. The
      // transcript below still carries them with their confidence marks.
      speak(spoken(reply.segments, "full"));
    },
    [
      scenarios,
      profile,
      decisions,
      options,
      previousProfile,
      previousAt,
      speak,
      answer,
      onClose,
    ],
  );

  const {
    available: canHear,
    listening,
    start,
    stop: stopListening,
  } = useSpeechRecognition({
    onResult: (transcript) => {
      heardRef.current = transcript;
      setHeard(transcript);
    },
    onEnd: () => {
      const transcript = heardRef.current;
      heardRef.current = "";
      answerNow(transcript);
    },
  });

  useMicAmplitude(listening, amplitude);

  /**
   * The loop: listen, answer, listen again.
   *
   * This is the "always listening" the plan refused — but scoped to a mode
   * the user entered on purpose and can leave with one tap, which is a
   * different thing from a product that listens whenever it is open. It
   * never starts while North is mid-sentence, or the microphone would hear
   * the answer and try to route it.
   */
  useEffect(() => {
    if (!canHear || listening || speaking) return;
    const timer = window.setTimeout(start, 400);
    return () => window.clearTimeout(timer);
  }, [canHear, listening, speaking, start]);

  /** The mark drifts through figures while North talks. */
  useEffect(() => {
    if (!speaking || reduce) return;
    const timer = window.setInterval(
      () => setCycle((c) => c + 1),
      CYCLE_MS,
    );
    return () => window.clearInterval(timer);
  }, [speaking, reduce]);

  /** Leaving must silence both halves — a mode you left that is still
   *  talking is the exact failure this design exists to prevent. */
  useEffect(
    () => () => {
      stopSpeaking();
      stopListening();
    },
    [stopSpeaking, stopListening],
  );

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  const state = speaking ? "speaking" : listening ? "listening" : "waiting";

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Talking to North"
      className="fixed inset-0 z-50 flex flex-col overflow-hidden bg-surface-deep"
    >
      {/* The sky, radial from the centre rather than a top band — in a mode
          with no page under it there is no horizon to sit on, so the
          atmosphere gathers around the mark instead. Same three sky tokens,
          same OKLab interpolation, so every contrast figure still holds. */}
      <div
        aria-hidden="true"
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(circle at 50% 42% in oklab, " +
            "var(--sky-300) 0%, var(--sky-600) 38%, var(--sky-900) 78%)",
        }}
      />

      {/* One breath of scale on the whole field, so the atmosphere is alive
          even in the pause between turns. Slow enough to read as weather. */}
      {!reduce && (
        <m.div
          aria-hidden="true"
          className="absolute inset-0"
          style={{
            background:
              "radial-gradient(circle at 50% 42% in oklab, " +
              "var(--sky-300) 0%, transparent 55%)",
          }}
          animate={{ opacity: state === "listening" ? [0.35, 0.6, 0.35] : [0.2, 0.32, 0.2] }}
          transition={{
            duration: state === "listening" ? 3.4 : 6,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      )}

      <button
        type="button"
        onClick={onClose}
        aria-label="Leave voice mode"
        className={cn(
          "type-meta hit-target absolute top-6 right-5 z-10 cursor-pointer rounded-full",
          "text-text-on-deep opacity-70 underline decoration-dotted",
          "decoration-text-on-deep decoration-1 underline-offset-4",
          "transition-opacity duration-[--motion-micro] hover:opacity-100",
        )}
      >
        Done
      </button>

      {/* The mark, centred and large. It IS the state: breathing on your own
          voice while listening, drifting between figures while North talks. */}
      <div className="relative flex flex-1 flex-col items-center justify-center px-6">
        <TurnGlyph
          turnId={
            state === "speaking"
              ? SPEAKING_CYCLE[cycle % SPEAKING_CYCLE.length]
              : "openingConcern"
          }
          listening={state === "listening"}
          amplitude={amplitude}
          className="h-40 w-[240px] text-text-on-deep md:h-52 md:w-[312px]"
        />

        <m.p
          key={state}
          initial={reduce ? false : { y: 6 }}
          animate={{ y: 0 }}
          transition={TRANSITION.standard}
          className="type-overline mt-10 text-text-on-deep opacity-70"
        >
          {state === "speaking"
            ? "North is speaking"
            : state === "listening"
              ? "Listening"
              : "One moment"}
        </m.p>
      </div>

      {/* The record. Numbers must be SEEN — a range and its confidence mark
          cannot survive being spoken, and a voice-only path would shut out
          anyone who cannot hear it. */}
      <div className="relative flex min-h-[38dvh] flex-col justify-end gap-5 px-6 pb-12">
        {heard && (
          <Text variant="voice-md" tone="inverse" measure as="p">
            <span className="italic opacity-60">{heard}</span>
          </Text>
        )}
        {answer.length > 0 && (
          <div className="type-voice-md measure text-text-on-deep">
            <ReadProse
              read={{ action: { commit: "", defer: "" }, segments: answer }}
              onDeep
            />
          </div>
        )}
        {!heard && answer.length === 0 && (
          <Text variant="body" tone="inverse" measure as="p">
            <span className="opacity-60">
              Ask how you&rsquo;re doing, what you&rsquo;re working toward, or
              think a decision through. Say &ldquo;stop&rdquo; to leave.
            </span>
          </Text>
        )}
      </div>
    </div>
  );
}

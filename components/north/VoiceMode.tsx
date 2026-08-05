"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  TRANSITION,
  Text,
  m,
  useMotionValue,
  useReducedMotion,
} from "@/components/nds";
import { openingOffers, respond, type Intent } from "@/core/coach";
import { resolveIntent } from "@/lib/route-intent";
import type { Decision } from "@/core/decisions";
import type { Scenario } from "@/core/navigator";
import type { SituationProfile } from "@/core/profile/types";
import { spoken } from "@/core/speech";
import type { EvaluateOptions, ReadSegment } from "@/core/waterfall";
import { cn } from "@/lib/cn";
import { useMicAmplitude } from "@/lib/use-mic-amplitude";
import { useSpeechRecognition } from "@/lib/use-speech-recognition";
import { useSpeechSynthesis } from "@/lib/use-speech-synthesis";
import { ReadProse } from "./ReadProse";
import { VoiceGlyph } from "./VoiceGlyph";

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
 * `VoiceLauncher` gates the entry below `lg`. Talking to your finances is a
 * thing you do holding a device, not at a desk in an open-plan office — and
 * the surface that would be most exposed is exactly the one where the way in
 * never appears. It is reachable from every product screen via the masthead,
 * which is chrome rather than a button floating over the content.
 *
 * ── THE SCREEN IS STILL THE RECORD ────────────────────────────────────────
 * What you said and what North answered stay on screen as real `Figure`s
 * (docs/VOICE.md §4.2): numbers have to be SEEN, ranges and confidence marks
 * cannot survive being spoken, and a voice-only path would exclude
 * deaf and hard-of-hearing users. The glyph is the theatre; the transcript
 * is the truth.
 */

/** One exchange, kept. */
interface VoiceTurn {
  id: number;
  /** What you said, as recognition finally heard it. */
  said: string;
  /** What North answered — engine segments, rendered and spoken from one source. */
  segments: ReadSegment[];
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
  /**
   * What is being said RIGHT NOW — interim dictation, replaced as you speak.
   * It becomes a turn once the utterance ends.
   */
  const [heard, setHeard] = useState("");
  /**
   * ── THE WHOLE CONVERSATION, NOT THE LAST EXCHANGE ────────────────────────
   * This used to be one `heard` and one `answer`, each replaced wholesale on
   * every turn — so asking a follow-up visibly wiped the question that
   * prompted it, and by the third exchange there was no evidence the first
   * two had happened. A voice surface needs the record MORE than a typed one,
   * not less: the file's own header says "the glyph is the theatre; the
   * transcript is the truth", above a component that held one line of it.
   */
  const [turns, setTurns] = useState<VoiceTurn[]>([]);
  const turnId = useRef(0);
  /** The last thing North said, so "say that again" has something to repeat. */
  const lastAnswer = useRef<ReadSegment[]>([]);
  /**
   * What was answered last, so a continuation has something to continue.
   * A ref, not state: it is read inside a callback that fires outside the
   * render that recorded it.
   */
  const lastIntent = useRef<Intent | null>(null);
  /** Working out what was asked — see `answerNow`. */
  const [routing, setRouting] = useState(false);
  /** The sentences worth saying, conditioned on what is true of this person. */
  const opening = openingOffers({
    profile,
    decisions,
    options,
    previousProfile,
    previousAt,
  });

  const amplitude = useMotionValue(0);
  const heardRef = useRef("");
  const transcriptRef = useRef<HTMLDivElement>(null);
  /**
   * Set the instant we start leaving, and checked by `onEnd`.
   *
   * Closing stops recognition, and stopping recognition FIRES `onEnd` — the
   * same callback that composes an answer and says it out loud. Without this
   * guard, tapping Done navigated back and then North started talking to an
   * empty room, which is precisely the disclosure this whole design exists
   * to prevent.
   */
  const leavingRef = useRef(false);
  const leaveRef = useRef<(() => void) | null>(null);
  const stopListeningRef = useRef<(() => void) | null>(null);

  // `pending` is the real gap between asking the synthesiser to speak and
  // audio actually starting — what the mark draws as thinking.
  const { speaking, pending, speak, stop: stopSpeaking } =
    useSpeechSynthesis();

  /** Answer a finished utterance, then say it back. */
  const answerNow = useCallback(
    async (transcript: string) => {
      const said = transcript.trim();
      if (!said) return;

      // ── ROUTING IS NOW A REAL BEAT, SO IT HAS TO BE DRAWN ────────────────
      // With a model in front of the keyword router this can take up to its
      // budget. Without `routing`, the mode would fall back to LISTENING
      // during the wait — the microphone reopening while North is still
      // working out what was asked, which is the exact "stuck in listening"
      // failure this mode was rebuilt to fix.
      //
      // This is not an invented delay. The gap is real work happening, which
      // is the only condition under which this product draws one at all
      // (docs/UX-ARCHITECTURE.md §11).
      setRouting(true);
      let intent;
      try {
        intent = await resolveIntent(said, scenarios, lastIntent.current);
      } finally {
        setRouting(false);
      }

      // The user may have left while it was routing — same disclosure risk
      // as answering after Done, and the same guard.
      if (leavingRef.current) return;

      if (intent.kind === "stop") {
        leaveRef.current?.();
        return;
      }
      if (intent.kind === "repeat") {
        speak(spoken(lastAnswer.current, "full"));
        return;
      }

      const reply = respond(intent, {
        profile,
        decisions,
        options,
        previousProfile,
        previousAt,
      });
      lastAnswer.current = reply.segments;
      lastIntent.current = intent;
      // Appended, never replaced — the exchange joins the record rather than
      // erasing the one before it.
      setTurns((current) => [
        ...current,
        { id: turnId.current++, said, segments: reply.segments },
      ]);
      // The interim line has become a turn; clear it so it is not shown twice.
      setHeard("");
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
    ],
  );

  /** The only way out. Silences both halves BEFORE handing back. */
  const leave = useCallback(() => {
    leavingRef.current = true;
    stopSpeaking();
    stopListeningRef.current?.();
    onClose();
  }, [stopSpeaking, onClose]);

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
      // Leaving fires this too. Answering now would speak over a screen the
      // user has already left.
      if (leavingRef.current) return;
      void answerNow(transcript);
    },
    // Hands turn-taking to the platform's endpointing: recognition ends on a
    // natural pause, which is what moves this out of "listening". With
    // `continuous` it never ended and the mode sat listening forever.
    continuous: false,
  });

  // `leave` is defined before the recognition hook returns `stop`, so the
  // reference is bridged rather than reordering the hook (which would put
  // `answerNow` after its own consumer).
  useEffect(() => {
    stopListeningRef.current = stopListening;
    leaveRef.current = leave;
  }, [stopListening, leave]);

  useMicAmplitude(listening, amplitude);

  /**
   * Keep the newest exchange in view.
   *
   * A record that scrolls off the bottom is no more use than one that erased
   * itself — in a mode where the user is TALKING rather than looking, nobody
   * is going to notice an answer arriving below the fold and reach out to
   * drag it up. Older turns stay above and can be scrolled back to, which is
   * the whole point of keeping them.
   *
   * `heard` is in the deps as well as `turns`: the interim line grows as you
   * speak, and the thing being written should stay visible while it is.
   */
  useEffect(() => {
    const node = transcriptRef.current;
    if (!node) return;
    node.scrollTo({
      top: node.scrollHeight,
      behavior: reduce ? "auto" : "smooth",
    });
  }, [turns, heard, reduce]);

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
    if (!canHear || listening || speaking || pending || routing) return;
    const timer = window.setTimeout(start, 400);
    return () => window.clearTimeout(timer);
  }, [canHear, listening, speaking, pending, routing, start]);

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
      if (event.key === "Escape") leave();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [leave]);

  // Two distinct real waits draw the same figure: working out what was asked,
  // and the synthesiser's own start-up gap. To the person in the room they
  // are one beat — North considering — and splitting them into two marks
  // would be narrating machinery.
  const thinking = routing || pending;
  const state = speaking ? "speaking" : thinking ? "thinking" : "listening";

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Talking to North"
      className="fixed inset-0 z-50 flex flex-col overflow-hidden bg-surface-deep"
    >
      {/* The sky, radial from the centre rather than a top band — in a mode
          with no page under it there is no horizon to sit on, so the
          atmosphere gathers around the mark instead.

          ── THE RAMP STARTS AT sky-600, NOT sky-300 ──────────────────────────
          It used to open on sky-300, the LIGHTEST stop, at 0% — and the
          gradient's centre (42%) lands within a dozen pixels of the state
          label. So the palest point of the background sat directly behind the
          text. Measured: `--text-on-deep` on sky-300 is **2.38:1**, and the
          label's own dimming took it to **1.88:1**, against a WCAG AA floor
          of 4.5 for body text and 3.0 for large. The comment that used to sit
          here claimed "every contrast figure still holds"; it was asserted,
          never measured, and it was false.

          Nothing caught it because `lib/contrast.ts` discards the alpha
          channel and `/design` only ever proofs sky-900 and sky-600 — the two
          stops that were already recorded in `globals.css`. sky-300 was never
          a text ground anywhere else in the product, so no figure existed for
          it.

          sky-600 → sky-900 keeps the reading the mode was designed around —
          lighter at the middle, darker at the rim — and every word now sits on
          6.83:1 or better. The glow the light stop was there for survives as
          the bounded bloom below, which is confined to the glyph. */}
      <div
        aria-hidden="true"
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(circle at 50% 42% in oklab, " +
            "var(--sky-600) 0%, var(--sky-900) 78%)",
        }}
      />

      {/* One breath of light, so the atmosphere is alive even in the pause
          between turns. Slow enough to read as weather.

          ── BOUNDED, AND SITTING ON THE GLYPH RATHER THAN THE WORDS ──────────
          This carries the light stop now, which means it decides the contrast
          floor — so it is a fixed 200px disc centred on the mark at 26%, not
          a full-viewport wash centred on the text at 42%. It is fully
          transparent by 110px, and the state label sits ~120px below the
          glyph's centre, so the bloom cannot reach any text at any point in
          its cycle.

          That bound is load-bearing, not cosmetic: at peak opacity this stop
          over sky-600 measures 3.82:1 for dimmed text — under AA. Widening
          the disc or raising the opacity re-breaks what the ramp above was
          changed to fix. The glyph it lights is `aria-hidden` decoration, so
          nothing behind the bloom has a contrast requirement at all. */}
      {!reduce && (
        <m.div
          aria-hidden="true"
          className="absolute inset-0"
          style={{
            background:
              "radial-gradient(circle 200px at 50% 26% in oklab, " +
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

      {/* `top` reads `--safe-top`, not a flat offset. This is the one control
          in the mode that sits where a status bar can — a phone with a
          Dynamic Island hands a real, nonzero inset here, same as every
          other full-bleed surface in the app (see SafeArea) — and a flat
          `top-6` put Done squarely inside that band. Found by opening the
          mode inside /preview's phone frame: the button sat directly under
          the battery glyph, "Done" rendering as "▤one". Every other element
          in this mode clears the inset by construction — the glyph starts at
          16dvh, the transcript is well below it — this was the one exception,
          and only because it is absolutely positioned outside that flow. */}
      <button
        type="button"
        onClick={leave}
        aria-label="Leave voice mode"
        style={{ top: "calc(var(--safe-top) + 1rem)" }}
        className={cn(
          "type-meta hit-target absolute right-5 z-10 cursor-pointer rounded-full",
          "text-text-on-deep opacity-70 underline decoration-dotted",
          "decoration-text-on-deep decoration-1 underline-offset-4",
          "transition-opacity duration-[--motion-micro] hover:opacity-100",
        )}
      >
        Done
      </button>

      {/* The mark, centred and large. It IS the state: breathing on your own
          voice while listening, drifting between figures while North talks.

          `shrink-0`, so a long answer can never squeeze the glyph out of the
          layout — the letter is the longest thing North says and it did
          exactly that, collapsing the mark and running under the Done
          control. The transcript below scrolls instead. */}
      <div className="relative flex shrink-0 flex-col items-center justify-center px-6 pt-[16dvh] pb-8">
        <VoiceGlyph
          state={state}
          amplitude={amplitude}
          className="h-40 w-[240px] text-text-on-deep md:h-52 md:w-[312px]"
        />

        <m.p
          key={state}
          initial={reduce ? false : { y: 6 }}
          animate={{ y: 0 }}
          transition={TRANSITION.standard}
          // `text-on-deep-dim`, not `opacity-70` on the full token. They look
          // nearly identical and they are not: the token is alpha .72 and
          // carries a measured figure (4.72 on sky-600); the ad-hoc opacity
          // multiplies down to .665 and measures 4.29 — under AA, on the one
          // label that names the mode's state.
          className="type-overline mt-10 text-text-on-deep-dim"
        >
          {state === "speaking"
            ? "North is speaking"
            : state === "thinking"
              ? "Thinking"
              : "Listening"}
        </m.p>
      </div>

      {/* The record. Numbers must be SEEN — a range and its confidence mark
          cannot survive being spoken, and a voice-only path would shut out
          anyone who cannot hear it. */}
      {/* Its OWN scroll region: `flex-1 min-h-0` is what actually bounds a
          flex child — without `min-h-0` a long child refuses to shrink and
          overflows its parent instead of scrolling, which is the bug that
          put the whole Insights letter on top of the glyph. */}
      <div
        ref={transcriptRef}
        className="relative flex min-h-0 flex-1 flex-col gap-5 overflow-y-auto px-6 pb-12"
      >
        {/* Every exchange, oldest first, the way a conversation reads. Your
            words in italic at reduced weight, North's as real `Figure`s
            carrying their confidence — the same grammar the typed thread
            uses, so one surface is not quietly more trustworthy than the
            other. */}
        {turns.map((turn) => (
          <div key={turn.id} className="flex flex-col gap-3">
            <Text variant="voice-md" tone="inverse" measure as="p">
              <span className="italic opacity-60">{turn.said}</span>
            </Text>
            <div className="type-voice-md measure text-text-on-deep">
              <ReadProse read={{ segments: turn.segments }} onDeep />
            </div>
          </div>
        ))}

        {/* What is being said right now, before it becomes a turn. */}
        {heard && (
          <Text variant="voice-md" tone="inverse" measure as="p">
            <span className="italic opacity-60">{heard}</span>
          </Text>
        )}
        {/* ── WHAT TO SAY, NOT WHAT YOU COULD ASK ────────────────────────
            This was a paragraph describing the territory. It is now the
            actual sentences, chosen by the same `openingOffers` the typed
            conversation opens with — so voice mode stops suggesting "what's
            changed" to someone with no history to diff.

            Deliberately NOT tappable, unlike the typed surface. You entered a
            mode to talk; putting controls in it would undercut that. These
            are a script. */}
        {!heard && turns.length === 0 && (
          <div className="flex flex-col gap-4">
            <ul className="flex flex-col gap-2">
              {opening.map((question) => (
                <li
                  key={question}
                  className="type-voice-md measure text-text-on-deep opacity-70"
                >
                  &ldquo;{question}&rdquo;
                </li>
              ))}
            </ul>
            <Text variant="meta" tone="inverse" measure as="p">
              <span className="opacity-60">
                Or ask in your own words. Say &ldquo;stop&rdquo; to leave.
              </span>
            </Text>
          </div>
        )}
      </div>
    </div>
  );
}

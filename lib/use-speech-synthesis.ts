"use client";

import { useCallback, useEffect, useRef, useState } from "react";

/**
 * North speaking — the output half, which carries the risk the input half
 * does not.
 *
 * ── WHY THIS IS NOT SYMMETRIC WITH `useSpeechRecognition` ─────────────────
 * Listening is a keyboard replacement: the user picks the words and can stop
 * at any time. Speaking is a DISCLOSURE — it says things at whatever volume,
 * to whoever is in the room, and once it has started the user is not the one
 * controlling it (docs/VOICE.md §3.1). So this hook is built to be
 * interrupted, and it never starts on its own.
 *
 * ── THREE RULES IT ENFORCES ───────────────────────────────────────────────
 * 1. **Nothing is ever spoken that a caller did not pass in.** The text comes
 *    from `core/speech/spoken()`, composed from engine segments. No model is
 *    anywhere near this.
 * 2. **`cancel()` before every `speak()`.** The platform QUEUES utterances;
 *    without this, tapping twice reads the thing twice, one after the other,
 *    with no way to get back to silence.
 * 3. **Silence on unmount, always.** `speechSynthesis` lives on `window`, not
 *    on the component — navigating away from a screen mid-sentence would
 *    otherwise leave North talking about a page that is gone.
 *
 * ── `pending` IS A REAL MEASUREMENT, NOT A SPINNER ────────────────────────
 * `speaking` used to be set optimistically the moment `speak()` was called,
 * which made it a lie: the synthesiser takes a genuine, variable moment to
 * start, and on first use it may still be loading a voice. It now flips on
 * the utterance's own `onstart`, and `pending` covers the gap between asking
 * and hearing.
 *
 * That gap is what voice mode draws as "thinking". The distinction matters:
 * the product forbids invented delays and workload meters
 * (docs/UX-ARCHITECTURE.md §11), so a considered beat is only allowed to
 * exist where something is genuinely happening. This one is.
 *
 * ── PROGRESSIVE, LIKE THE MIC ─────────────────────────────────────────────
 * `available` is false on the server and in any browser without the API, and
 * callers render nothing at all in that case — never a disabled control that
 * refers to a capability that isn't there.
 */

export interface UseSpeechSynthesis {
  /** False on the server and wherever the API is missing. */
  available: boolean;
  /** Audio is actually coming out — set from the utterance's own `onstart`. */
  speaking: boolean;
  /** Asked to speak, not yet audible. The real start-up gap. */
  pending: boolean;
  /** Cancels anything already queued, then speaks this. */
  speak: (text: string) => void;
  stop: () => void;
}

function synthesis(): SpeechSynthesis | null {
  if (typeof window === "undefined") return null;
  return window.speechSynthesis ?? null;
}

export function speechSynthesisAvailable(): boolean {
  return synthesis() !== null;
}

/**
 * ── ONE UTTERANCE, WHOLE READING. THE SYNTH'S OWN PROSODY WINS. ───────────
 *
 * This block used to chunk the reading into sentences, and then into clauses,
 * each spoken as its own utterance with its own rate, pitch, and a measured
 * silence between them. The argument was that a browser synthesiser applies
 * ONE intonation contour to a whole string, so splitting it would give each
 * sentence its own contour and its own breath.
 *
 * That argument was wrong, and it was settled by listening rather than by
 * reasoning. Four prosody treatments were rendered through this exact voice
 * and compared against the plain one: the plain one won, clearly. Handing the
 * whole reading over at once is BETTER, because Samantha already models
 * paragraph-level prosody — the fall into a full stop, the lift out of it,
 * the pace across a clause — and chunking replaced all of that with my own
 * cruder version, plus a platform gap between every pair of utterances.
 *
 * Two defects the split was actually causing, both of which are now gone:
 *
 *   · **A doubled pause at every full stop.** Each chunk kept its terminal
 *     punctuation, so the voice paused for the period AND the platform added
 *     an inter-utterance gap on top.
 *   · **Flatter delivery, not richer.** A clause spoken alone gets a clause's
 *     contour — flat and unresolved — where the same clause inside a sentence
 *     gets the sentence's shape.
 *
 * So there is deliberately no chunking here, no rate override, and no pitch
 * override: `rate` and `pitch` are left at 1, which means "this voice's own
 * default", which is what won. **If you are about to add prosody shaping
 * here, render it and listen to it against the plain version first.** That is
 * the only test that has ever been informative about this file.
 *
 * The real ceiling is the voice, not the shaping. A stock machine has no
 * neural voice installed, and Samantha (Compact) is a concatenative synth
 * from around 2009. `PREFERRED_VOICES` below picks up an Enhanced or Premium
 * voice the moment one exists on the system, and that single download is
 * worth more than everything this file could do.
 */

/**
 * Voices worth having, best first — matched as substrings against the
 * platform's voice names.
 *
 * ── WHY THIS LIST EXISTS ──────────────────────────────────────────────────
 * Left alone, browsers hand you `voices[0]`, which on most systems is a
 * decades-old formant synth. That is the "1990s" sound, and it is a DEFAULT
 * rather than a limit: the same machine usually ships a modern neural voice
 * that simply is not first in the array.
 *
 * The tiers below are ordered by how these actually sound, not by vendor:
 * explicitly neural/premium voices first, then the good modern defaults, and
 * a general-quality hint last. Anything unmatched falls through to the
 * platform default, so a machine with none of these still speaks.
 *
 * **This is the ceiling for on-device speech.** Matching a hosted neural TTS
 * needs a server, a key, and a network round trip — a real architectural
 * decision, not a tuning one, and deliberately not taken here.
 */
const PREFERRED_VOICES = [
  // Apple's modern neural voices, and the premium/enhanced downloads.
  "Ava (Premium)",
  "Zoe (Premium)",
  "Evan (Premium)",
  "Ava (Enhanced)",
  "Zoe (Enhanced)",
  "Siri",
  "Premium",
  "Enhanced",
  // Explicitly neural engines on other platforms.
  "Neural",
  "Natural",
  // Chrome's bundled voices — a clear step up from the system formant ones.
  "Google US English",
  "Google UK English Female",
  "Google UK English",
  // Windows' newer set.
  "Microsoft Aria",
  "Microsoft Jenny",
  "Microsoft Guy",
];

/**
 * Voices that must never be chosen, whatever else matches.
 *
 * Two groups, and the second is the one that matters. The obvious novelties
 * (Zarvox, Bad News, Boing) would never be picked anyway. But macOS also
 * ships CHARACTER voices — Grandma, Grandpa, Eddy, Flo, Rocko, Shelley — and
 * those are downloadable in "(Premium)" and "(Enhanced)" form. Without them
 * listed here, the generic `Premium` preference below would happily hand a
 * financial coach the voice of a cartoon grandpa the moment someone
 * installed one.
 */
const REJECTED =
  /albert|bad news|bahh|bells|boing|bubbles|cellos|deranged|good news|jester|organ|superstar|trinoids|whisper|wobble|zarvox|fred|junior|ralph|kathy|princess|grandma|grandpa|eddy|flo|reed|rocko|sandy|shelley|bruce|agnes/i;

function pickVoice(engine: SpeechSynthesis): SpeechSynthesisVoice | null {
  const voices = engine.getVoices().filter((v) => !REJECTED.test(v.name));
  if (voices.length === 0) return null;

  // English only — the copy is English, and a Spanish voice reading English
  // is worse than a plain one.
  const english = voices.filter((v) => v.lang.toLowerCase().startsWith("en"));
  const pool = english.length > 0 ? english : voices;

  for (const wanted of PREFERRED_VOICES) {
    const found = pool.find((v) =>
      v.name.toLowerCase().includes(wanted.toLowerCase()),
    );
    if (found) return found;
  }

  // ── NOTHING PREFERRED IS THE COMMON CASE, SO IT HAS TO BE CHOSEN WELL ────
  // No machine ships with a neural voice installed; on a stock Mac this
  // branch is what actually runs, every time. It used to be
  // `pool.find(localService) ?? pool[0]` — the FIRST English voice in an
  // array nobody sorted. That happened to be Samantha here and looked fine,
  // but the same line hands another machine Daniel (en-GB) or Karen (en-AU)
  // for a US-English product, on nothing but array order.
  //
  // The OS default is the honest fallback: it is the voice this person has
  // already chosen for everything else their computer says, and picking it
  // means North sounds like the rest of their machine rather than like a
  // stranger the array happened to put first.
  return (
    pool.find((v) => v.default) ??
    pool.find((v) => v.localService) ??
    pool[0]
  );
}

export function useSpeechSynthesis(): UseSpeechSynthesis {
  const [speaking, setSpeaking] = useState(false);
  const [pending, setPending] = useState(false);
  const utterancesRef = useRef<SpeechSynthesisUtterance[]>([]);
  const voiceRef = useRef<SpeechSynthesisVoice | null>(null);
  /** Bumped by every speak/stop, so a scheduled clause knows it is stale. */
  const chainRef = useRef(0);

  /**
   * Voices load asynchronously and are often EMPTY on first call — the
   * single most common reason an app ends up on the default robot voice. So
   * the choice is made once now and again whenever the list arrives.
   */
  useEffect(() => {
    const engine = synthesis();
    if (!engine) return;

    const choose = () => {
      voiceRef.current = pickVoice(engine);
    };
    choose();
    engine.addEventListener("voiceschanged", choose);
    return () => engine.removeEventListener("voiceschanged", choose);
  }, []);

  const stop = useCallback(() => {
    const engine = synthesis();
    if (!engine) return;
    // Bumped so a cancelled utterance's own `onend` — which several browsers
    // fire on `cancel()` — cannot clear state belonging to whatever is
    // spoken next.
    chainRef.current += 1;
    engine.cancel();
    utterancesRef.current = [];
    setSpeaking(false);
    setPending(false);
  }, []);

  /**
   * Speak a reading — the whole thing, as one utterance.
   *
   * See the note at the top of this file for why there is no chunking here.
   * Short version: it was tried, rendered, and listened to, and the plain
   * reading won. `rate` and `pitch` are left alone for the same reason.
   *
   * `chainRef` is a generation counter, so a stale `onend` from an utterance
   * that has been cancelled cannot clear the state of the one that replaced
   * it. Two answers speaking over each other is precisely the disclosure this
   * hook exists to prevent.
   */
  const speak = useCallback((text: string) => {
    const engine = synthesis();
    const body = text.trim();
    if (!engine || body.length === 0) return;

    // Queued, not replaced, is the platform default — so clear first.
    engine.cancel();

    const generation = (chainRef.current += 1);
    const current = () => chainRef.current === generation;

    const utterance = new SpeechSynthesisUtterance(body);
    if (voiceRef.current) utterance.voice = voiceRef.current;

    const finish = () => {
      if (!current()) return;
      setSpeaking(false);
      setPending(false);
      utterancesRef.current = [];
    };

    utterance.onstart = () => {
      if (!current()) return;
      setPending(false);
      setSpeaking(true);
    };
    utterance.onend = finish;
    // A synthesis error is silence, never an announcement — but it still has
    // to release the state, or the mode would sit in "speaking" forever
    // (docs/UX-ARCHITECTURE.md §11).
    utterance.onerror = finish;

    utterancesRef.current = [utterance];
    setPending(true);
    engine.speak(utterance);
  }, []);

  useEffect(
    () => () => {
      chainRef.current += 1;
      for (const utterance of utterancesRef.current) {
        utterance.onstart = null;
        utterance.onend = null;
        utterance.onerror = null;
      }
      synthesis()?.cancel();
    },
    [],
  );

  return { available: speechSynthesisAvailable(), speaking, pending, speak, stop };
}

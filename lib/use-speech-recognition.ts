"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";

/**
 * Dictation, in one place.
 *
 * ── WHY THIS WAS EXTRACTED ─────────────────────────────────────────────────
 * `SpokenField` had its own copy of the Web Speech vendor shim and the
 * start/stop/cleanup plumbing. A second voice control — choice turns, in
 * onboarding — needs the exact same listening lifecycle with different
 * consumption semantics (SpokenField appends to a growing draft; a choice
 * turn wants the latest full utterance to hand to a matcher). Two copies of
 * "how North listens" is how the two drift: a permission-handling fix in one
 * that never reaches the other. One hook, two ways of using its output.
 *
 * ── STRICTLY PROGRESSIVE ───────────────────────────────────────────────────
 * `available` is the whole contract: false on the server and in any browser
 * without the API, and every caller is expected not to render a mic at all in
 * that case. There is no button that refers to a capability that isn't there
 * (docs/UX-ARCHITECTURE.md §11) — the refusal is architectural, not a message.
 *
 * ── WHAT ENDS A SESSION ────────────────────────────────────────────────────
 * A recognition error and a permission refusal both just end listening. The
 * coach never announces a failure, because there is nothing the user did
 * wrong — the same rule `SpokenField` already followed.
 */

/* Minimal shapes for the Web Speech API — lib.dom omits it, and the vendor
   types package would be a dependency for one hook. */
interface RecognitionResultChunk {
  0: { transcript: string };
  isFinal: boolean;
}
interface RecognitionEvent {
  results: ArrayLike<RecognitionResultChunk>;
}
interface Recognition {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  onresult: ((event: RecognitionEvent) => void) | null;
  onend: (() => void) | null;
  onerror: (() => void) | null;
  start(): void;
  stop(): void;
  abort(): void;
}

function recognitionCtor(): (new () => Recognition) | null {
  if (typeof window === "undefined") return null;
  const w = window as unknown as {
    SpeechRecognition?: new () => Recognition;
    webkitSpeechRecognition?: new () => Recognition;
  };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

/** True only once, only client-side, only where the API genuinely exists. */
export function speechRecognitionAvailable(): boolean {
  return recognitionCtor() !== null;
}

export interface UseSpeechRecognitionOptions {
  /**
   * The full transcript heard so far THIS session (interim + final),
   * re-delivered on every update — not a delta. Callers that want to append
   * to existing text own that merge themselves, since only they know what
   * "existing text" means for their field.
   */
  onResult: (transcript: string) => void;
  /**
   * Listening just stopped — silence was detected, or `stop()`/`abort()` was
   * called. This is the moment to act on whatever `onResult` last delivered.
   *
   * It fires from the SAME native callback that flips `listening` false, not
   * from a React effect watching for that flip — a caller that reacted to
   * the `listening` value changing would be chaining a state update off a
   * state update, which is the exact pattern React's own effect rules warn
   * against. Reacting here instead is "call setState in a callback when an
   * external system changes," which is the sanctioned shape.
   */
  onEnd?: () => void;
  /**
   * Keep listening through pauses (default), or let the engine decide when
   * the utterance ended.
   *
   * `true` is right for DICTATION, where a tap starts and a tap stops and
   * pausing to think must not cut you off. It is wrong for a hands-free
   * conversation: with `continuous`, recognition never ends on its own, so
   * `onEnd` never fires and the caller sits in "listening" forever waiting
   * for a turn that cannot arrive.
   *
   * `false` hands turn-taking to the platform's own endpointing — it stops
   * after a natural pause, which is exactly the signal a conversation needs.
   */
  continuous?: boolean;
}

export interface UseSpeechRecognition {
  /** False on the server and in any browser without the API. */
  available: boolean;
  listening: boolean;
  start: () => void;
  stop: () => void;
}

export function useSpeechRecognition({
  onResult,
  onEnd,
  continuous = true,
}: UseSpeechRecognitionOptions): UseSpeechRecognition {
  const recognitionRef = useRef<Recognition | null>(null);
  // Read inside the closure without re-creating start() on every keystroke.
  // Synced in an effect, not written during render — a ref write belongs
  // after commit, not while React is figuring out what to commit.
  const onResultRef = useRef(onResult);
  const onEndRef = useRef(onEnd);
  // Read inside `start`, which is deliberately identity-stable — so the
  // flag travels by ref rather than re-creating the callback.
  const continuousRef = useRef(continuous);
  useLayoutEffect(() => {
    onResultRef.current = onResult;
    onEndRef.current = onEnd;
    continuousRef.current = continuous;
  });
  const [listening, setListening] = useState(false);

  // Leaving the screen mid-dictation must not leave the microphone open.
  useEffect(() => () => recognitionRef.current?.abort(), []);

  const stop = useCallback(() => {
    recognitionRef.current?.stop();
    setListening(false);
  }, []);

  const start = useCallback(() => {
    const Ctor = recognitionCtor();
    if (!Ctor) return;

    const recognition = new Ctor();
    recognition.lang = navigator.language || "en-US";
    recognition.continuous = continuousRef.current;
    recognition.interimResults = true;

    recognition.onresult = (event) => {
      const spoken = Array.from(
        { length: event.results.length },
        (_, i) => event.results[i][0].transcript,
      )
        .join("")
        .trim();
      onResultRef.current(spoken);
    };
    // Both paths end the session the same quiet way: state returns to idle,
    // whatever was heard stands, nothing apologizes. `onEnd` fires from
    // right here — the real moment recognition stopped — not from a
    // downstream effect watching `listening` change.
    const end = () => {
      setListening(false);
      onEndRef.current?.();
    };
    recognition.onend = end;
    recognition.onerror = end;

    recognitionRef.current = recognition;
    recognition.start();
    setListening(true);
  }, []);

  return { available: speechRecognitionAvailable(), listening, start, stop };
}

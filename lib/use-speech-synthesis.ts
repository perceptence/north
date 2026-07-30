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
 * ── PROGRESSIVE, LIKE THE MIC ─────────────────────────────────────────────
 * `available` is false on the server and in any browser without the API, and
 * callers render nothing at all in that case — never a disabled control that
 * refers to a capability that isn't there.
 */

export interface UseSpeechSynthesis {
  /** False on the server and wherever the API is missing. */
  available: boolean;
  speaking: boolean;
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

export function useSpeechSynthesis(): UseSpeechSynthesis {
  const [speaking, setSpeaking] = useState(false);
  // Held so the cleanup below can detach handlers before cancelling — an
  // `onend` that fires during teardown would setState on a dead component.
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  const stop = useCallback(() => {
    const engine = synthesis();
    if (!engine) return;
    engine.cancel();
    setSpeaking(false);
  }, []);

  const speak = useCallback((text: string) => {
    const engine = synthesis();
    if (!engine || text.trim().length === 0) return;

    // Queued, not replaced, is the platform default — so clear first.
    engine.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    // Slightly under default: this is a coach reading a considered sentence,
    // not an assistant reading a notification.
    utterance.rate = 0.95;
    utterance.pitch = 1;

    const finish = () => {
      setSpeaking(false);
      utteranceRef.current = null;
    };
    utterance.onend = finish;
    // A synthesis error is silence, never an announcement. There is nothing
    // the user did wrong (docs/UX-ARCHITECTURE.md §11).
    utterance.onerror = finish;

    utteranceRef.current = utterance;
    engine.speak(utterance);
    setSpeaking(true);
  }, []);

  useEffect(
    () => () => {
      const utterance = utteranceRef.current;
      if (utterance) {
        utterance.onend = null;
        utterance.onerror = null;
      }
      synthesis()?.cancel();
    },
    [],
  );

  return { available: speechSynthesisAvailable(), speaking, speak, stop };
}

"use client";

import { useEffect, useRef } from "react";
import { useMotionValue, type MotionValue } from "@/components/nds";

/**
 * Live microphone level, as a MotionValue in [0, 1] — nothing else.
 *
 * ── WHY A MOTIONVALUE, NOT REACT STATE ─────────────────────────────────────
 * This updates on every animation frame while active. Routing that through
 * `useState` would re-render the whole listening control 60 times a second
 * for a number nothing in the React tree actually needs to branch on — only
 * a `style` prop needs it. Writing into a MotionValue with `.set()` updates
 * the DOM directly and skips React entirely, which is the documented reason
 * this escape hatch exists (see the barrel export in components/nds/index.ts).
 *
 * ── WHY THIS ONLY MEASURES, IT NEVER LISTENS ───────────────────────────────
 * This is deliberately independent of `useSpeechRecognition` — it opens its
 * own `getUserMedia` stream purely to read volume, and NEVER connects that
 * stream to `audioContext.destination`, so the user's own voice is never
 * played back to them. It answers one question, "how loud, right now," and
 * has no opinion about words.
 *
 * ── STRICTLY PROGRESSIVE ────────────────────────────────────────────────────
 * If `getUserMedia` or `AudioContext` are unavailable, or the permission
 * prompt is refused, this fails silently: the MotionValue simply never moves
 * off 0. There is no error, no retry, no second permission prompt — the same
 * refusal-list rule every other voice control in this product follows. A
 * caller that renders a sensible baseline at amplitude 0 (see TurnGlyph's
 * `listening` state) degrades to "the mark holds still" rather than "the
 * mark looks broken."
 */
export function useMicAmplitude(
  active: boolean,
  target?: MotionValue<number>,
): MotionValue<number> {
  // Always called, per the rules of hooks — `own` simply goes unused on the
  // branch where a caller supplies its own value. That happens when a mark
  // fed by this hook is owned somewhere OTHER than where the mic lives (the
  // onboarding glyph is mounted once, high up; the mic is per-turn, lower
  // down) — the caller creates the value, hands it down, and every listener
  // reads the same object without this hook needing to know who else does.
  const own = useMotionValue(0);
  const amplitude = target ?? own;
  const rafRef = useRef<number | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const contextRef = useRef<AudioContext | null>(null);
  // A one-pole low-pass on the raw per-frame RMS — without it the figure
  // would twitch sample to sample instead of breathing.
  const smoothedRef = useRef(0);

  useEffect(() => {
    if (!active) return;

    let cancelled = false;

    async function start() {
      const mediaDevices = navigator.mediaDevices;
      const Ctor =
        window.AudioContext ??
        (window as unknown as { webkitAudioContext?: typeof AudioContext })
          .webkitAudioContext;
      if (!mediaDevices?.getUserMedia || !Ctor) return;

      try {
        const stream = await mediaDevices.getUserMedia({ audio: true });
        if (cancelled) {
          // The permission round-trip is async; the control may have already
          // stopped listening by the time it resolves.
          for (const track of stream.getTracks()) track.stop();
          return;
        }
        streamRef.current = stream;

        const context = new Ctor();
        contextRef.current = context;
        const source = context.createMediaStreamSource(stream);
        const analyser = context.createAnalyser();
        analyser.fftSize = 256;
        // Deliberately NOT connected onward to `context.destination` — this
        // pipeline exists to measure, never to play anything back.
        source.connect(analyser);

        const buffer = new Uint8Array(analyser.frequencyBinCount);
        const tick = () => {
          analyser.getByteTimeDomainData(buffer);
          let sumSquares = 0;
          for (let i = 0; i < buffer.length; i++) {
            const centered = (buffer[i] - 128) / 128;
            sumSquares += centered * centered;
          }
          const rms = Math.sqrt(sumSquares / buffer.length);
          // A gain so ordinary speaking volume visibly registers rather than
          // reading as a sliver — RMS of speech rarely approaches 1.0 raw.
          const level = Math.min(1, rms * 4);
          smoothedRef.current += (level - smoothedRef.current) * 0.3;
          amplitude.set(smoothedRef.current);
          rafRef.current = requestAnimationFrame(tick);
        };
        rafRef.current = requestAnimationFrame(tick);
      } catch {
        // Permission refused, no device, or a browser that lies about
        // supporting the API. Amplitude stays at 0 — see the module comment.
      }
    }

    void start();

    return () => {
      cancelled = true;
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
      for (const track of streamRef.current?.getTracks() ?? []) track.stop();
      streamRef.current = null;
      void contextRef.current?.close();
      contextRef.current = null;
      smoothedRef.current = 0;
      amplitude.set(0);
    };
  }, [active, amplitude]);

  return amplitude;
}

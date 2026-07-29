"use client";

import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { CoachPresence, RHYTHM } from "@/components/nds";
import { cn } from "@/lib/cn";
import { useHydrated } from "@/lib/use-hydrated";

/**
 * The spoken answer — onboarding's free-text turn, upgraded from a form line
 * to a voice.
 *
 * The question literally says "however you'd say it out loud", so the field
 * honors that two ways:
 *
 *   1. WHAT YOU TYPE RENDERS IN THE VOICE FACE. The user's words set in
 *      Newsreader italic — speech being written down, not data being entered.
 *      This is the one place the serif belongs to the user, and it is why the
 *      reflection on Today ("You said …") feels continuous: same register,
 *      same face.
 *
 *   2. YOU CAN ACTUALLY SAY IT OUT LOUD. Dictation via the Web Speech API,
 *      strictly progressive: no support → no button, and nothing refers to
 *      what isn't there. Recognition errors and permission refusals just end
 *      the listening session — the coach never announces a failure, because
 *      there is nothing the user did wrong (the refusal list,
 *      docs/UX-ARCHITECTURE.md §11).
 *
 * Dictation APPENDS to whatever is typed, so mixing modalities mid-thought
 * works. Confidence stays `stated` either way — spoken words are still the
 * user's words.
 */

/* Minimal shapes for the Web Speech API — lib.dom omits it, and the vendor
   types package would be a dependency for one field. */
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

export interface SpokenFieldProps {
  value: string;
  onChange: (value: string) => void;
  /** Accessible name. Visually, the question above the field does this job. */
  label: string;
  onSubmit?: () => void;
  /** The turn's action (the Continue button), so it shares a row with the mic. */
  action?: ReactNode;
  autoFocus?: boolean;
  className?: string;
}

export function SpokenField({
  value,
  onChange,
  label,
  onSubmit,
  action,
  autoFocus = false,
  className,
}: SpokenFieldProps) {
  const areaRef = useRef<HTMLTextAreaElement>(null);
  const recognitionRef = useRef<Recognition | null>(null);
  /** The typed text at the moment dictation began — spoken words append. */
  const baseRef = useRef("");
  const [listening, setListening] = useState(false);
  // Gated on hydration: the server cannot know whether this browser speaks,
  // so it must not guess — rendering the mic during SSR is a hydration
  // mismatch in every browser that lacks the API (and its absence is one in
  // every browser that has it).
  const hydrated = useHydrated();
  const canListen = hydrated && recognitionCtor() !== null;

  // Auto-grow. A scrollbar inside a one-question field reads as a form.
  useLayoutEffect(() => {
    const el = areaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${el.scrollHeight}px`;
  }, [value]);

  // Leaving the turn mid-dictation must not leave the microphone open.
  useEffect(() => () => recognitionRef.current?.abort(), []);

  const stopListening = useCallback(() => {
    recognitionRef.current?.stop();
    setListening(false);
  }, []);

  const startListening = useCallback(() => {
    const Ctor = recognitionCtor();
    if (!Ctor) return;

    const recognition = new Ctor();
    recognition.lang = navigator.language || "en-US";
    recognition.continuous = true;
    recognition.interimResults = true;

    baseRef.current = value;

    recognition.onresult = (event) => {
      const spoken = Array.from(
        { length: event.results.length },
        (_, i) => event.results[i][0].transcript,
      )
        .join("")
        .trim();
      const base = baseRef.current.trim();
      onChange(base ? `${base} ${spoken}` : spoken);
    };
    // Both paths end the session the same quiet way: the pill returns to
    // "Speak", the typed text stands, nothing apologizes.
    recognition.onend = () => setListening(false);
    recognition.onerror = () => setListening(false);

    recognitionRef.current = recognition;
    recognition.start();
    setListening(true);
  }, [onChange, value]);

  return (
    /* ── THE COMPOSER ──────────────────────────────────────────────────────
       One object, with anatomy: an opening quote, your words, and the two
       ways to finish saying them — all inside the same sheet. The previous
       two attempts failed in opposite directions. A bare underline had no
       presence at all; ruled paper had presence but no CONTENT — hairlines
       floating in a white void read as an empty table, and the controls
       orbiting outside made the box a dead area between question and
       buttons. A composer is "an input box" the way the user actually means
       it: the place where you compose what you're about to say, with the
       saying built in.

       What keeps it North rather than a chat widget:
       - The hanging quote. Today opens with "You said …", so what you write
         here is literally what the coach will quote back. The mark says so
         up front, and your words render in the voice face — speech being
         written down.
       - Raised white, hairline edge, NO elevation. The one elevated thing
         on any screen is the decision Card.
       - No placeholder. The question above is still the label (§8.2).

       The sheet used to BLEED outward by its own padding, so the writing
       stayed flush with the question above it. It bought that alignment by
       making the composer the widest object on the page — wider than the
       question, wider than the list beneath it — which on Navigator simply
       read as spread out. The column is this page's measure; the answer
       sitting a pen's width inside it is the smaller price. */
    <div
      className={cn(
        "flex flex-col",
        RHYTHM.heading,
        "rounded-card border border-line-hairline bg-surface-raised",
        "px-4 py-4 md:px-5 md:py-5",
        "transition-colors duration-[--motion-micro]",
        "focus-within:border-action-border-hover",
        className,
      )}
      onClick={(event) => {
        // The whole sheet is the writing surface — a click on its padding
        // hands you the pen rather than doing nothing. Controls keep their
        // own clicks.
        if (event.target === event.currentTarget) areaRef.current?.focus();
      }}
    >
      <div
        className="flex cursor-text gap-3"
        onClick={() => areaRef.current?.focus()}
      >
        {/* The open quotation. It gives the empty sheet a beginning — the
            coach has stopped talking and it's your line — and it is why the
            reflection on Today ("You said …") feels continuous. */}
        <span
          aria-hidden="true"
          className="type-voice-xl leading-none text-text-tertiary select-none"
        >
          &ldquo;
        </span>
        <textarea
          ref={areaRef}
          rows={1}
          value={value}
          aria-label={label}
          autoFocus={autoFocus}
          onChange={(event) => onChange(event.target.value)}
          onKeyDown={(event) => {
            // Enter submits; Shift+Enter breaks the line. In a conversation,
            // Enter means "I'm done talking."
            if (event.key === "Enter" && !event.shiftKey && onSubmit) {
              event.preventDefault();
              onSubmit();
            }
          }}
          className={cn(
            // The user's words, in the voice face. Speech, not data entry.
            "type-voice-md w-full resize-none overflow-hidden bg-transparent italic",
            // Room for two lines before it grows — a one-line slot reads as
            // a search bar, and this is a place to say something.
            "min-h-16 text-text-primary md:min-h-17",
            // The sheet's border carries focus; a second ring inside it would
            // draw a box in a box.
            "focus:outline-none",
          )}
        />
      </div>

      <div className="flex flex-wrap items-center gap-3">
        {action}
        {canListen && (
          <button
            type="button"
            aria-pressed={listening}
            onClick={listening ? stopListening : startListening}
            className={cn(
              "type-label inline-flex min-h-11 cursor-pointer items-center gap-2.5",
              "rounded-full border px-4 py-3 select-none",
              "transition-[background-color,border-color,color] duration-[--motion-micro]",
              listening
                ? // The open microphone is this viewport's one signal element —
                  // live state, honestly announced.
                  "border-signal-coach text-text-primary"
                : "border-action-border text-text-secondary hover:border-action-border-hover hover:bg-surface-sunken",
            )}
          >
            {listening && <CoachPresence size="sm" />}
            {listening ? "Listening" : "Or say it"}
          </button>
        )}
      </div>
    </div>
  );
}

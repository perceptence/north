"use client";

import { useLayoutEffect, useRef, type ReactNode } from "react";
import { CoachPresence, RHYTHM } from "@/components/nds";
import { cn } from "@/lib/cn";
import { useHydrated } from "@/lib/use-hydrated";
import { useSpeechRecognition } from "@/lib/use-speech-recognition";

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

export interface SpokenFieldProps {
  value: string;
  onChange: (value: string) => void;
  /** Accessible name. Visually, the question above the field does this job. */
  label: string;
  onSubmit?: () => void;
  /**
   * Dictation just finished, with what it heard.
   *
   * Given the transcript directly rather than left to read `value` back out
   * of state: this fires from the recognition engine's own callback, and a
   * caller that reached for the state variable instead could easily read the
   * render before the last `onChange` landed. Navigator uses it to answer a
   * spoken question without a tap — "speak a question, read the answer"
   * (docs/VOICE.md §7, Phase 2) — while the typed path keeps its button.
   */
  onSpeechEnd?: (transcript: string) => void;
  /** The turn's action (the Continue button), so it shares a row with the mic. */
  action?: ReactNode;
  /**
   * Questions worth asking, shown where the writing goes.
   *
   * ── WHY THEY LIVE IN THE FIELD ──────────────────────────────────────────
   * They used to hang below the composer as loose links, which read as page
   * chrome — a menu that happened to sit near an input. They are not chrome:
   * they are sentences you could say, so they belong where your sentences go.
   *
   * They occupy the placeholder's position and clear the moment you type, but
   * they are BUTTONS, not a placeholder. That distinction is the whole point.
   * `core/coach/offers.ts` exists because seven of the eleven things this
   * coach can answer had no tap path anywhere in the product; real placeholder
   * text would put six of them back out of reach and show the seventh.
   */
  suggestions?: string[];
  onSuggest?: (question: string) => void;
  autoFocus?: boolean;
  className?: string;
}

export function SpokenField({
  value,
  onChange,
  label,
  onSubmit,
  onSpeechEnd,
  action,
  suggestions,
  onSuggest,
  autoFocus = false,
  className,
}: SpokenFieldProps) {
  const areaRef = useRef<HTMLTextAreaElement>(null);
  /** The typed text at the moment dictation began — spoken words append. */
  const baseRef = useRef("");
  /** The last full value dictation produced, for `onSpeechEnd`. Synchronous,
   *  so it is always current by the time the engine says it has stopped. */
  const heardRef = useRef("");
  // Gated on hydration: the server cannot know whether this browser speaks,
  // so it must not guess — rendering the mic during SSR is a hydration
  // mismatch in every browser that lacks the API (and its absence is one in
  // every browser that has it).
  const hydrated = useHydrated();
  const {
    available,
    listening,
    start: startListening,
    stop: stopListening,
  } = useSpeechRecognition({
    onResult: (spoken) => {
      const base = baseRef.current.trim();
      const composed = base ? `${base} ${spoken}` : spoken;
      heardRef.current = composed;
      onChange(composed);
    },
    onEnd: () => {
      const heard = heardRef.current.trim();
      heardRef.current = "";
      // Nothing heard is not a failure and gets no announcement — the user
      // may simply have opened the mic and changed their mind.
      if (heard) onSpeechEnd?.(heard);
    },
  });
  const canListen = hydrated && available;
  /**
   * Offers show only on an empty field — they occupy the writing area, and
   * the writing wins it back the instant there is any. Clearing the field
   * brings them back, which is the behaviour a placeholder has and the reason
   * this reads as one.
   */
  const showOffers = !value && (suggestions?.length ?? 0) > 0;

  // Auto-grow. A scrollbar inside a one-question field reads as a form.
  useLayoutEffect(() => {
    const el = areaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${el.scrollHeight}px`;
  }, [value]);

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
        // `rounded-sheet` (28), not `rounded-card` (20). The card radius
        // belongs to the decision Card, which is the one elevated object in
        // the product; wearing it here made the composer read as a second
        // card competing with it. The sheet radius is the softer, larger
        // corner the composer's own doc-comment has always called it.
        "rounded-sheet border border-line-hairline bg-surface-raised",
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
        {/* ── ONE CELL, TWO OCCUPANTS ─────────────────────────────────────
            The field and the offered questions are stacked in the SAME grid
            cell, so the writing area is as tall as whichever needs more and
            nothing has to know how many offers there are. Absolute
            positioning would have wanted a magic height per count; this
            sizes itself for one, two or three.

            The offers sit above in paint order and are `pointer-events-none`
            as a group — so a click on a question picks it, and a click in the
            space around them falls through and hands you the pen. */}
        <div className="grid w-full">
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
              "col-start-1 row-start-1",
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

          {showOffers && (
            <ul
              aria-label="Questions you could ask"
              className={cn(
                "col-start-1 row-start-1 pointer-events-none",
                "flex flex-col items-start gap-1 self-start",
              )}
            >
              {suggestions!.map((question) => (
                <li key={question}>
                  <button
                    type="button"
                    onClick={() => onSuggest?.(question)}
                    className={cn(
                      // The voice face, italic, like the words you would have
                      // typed — because tapping one IS saying it — but one
                      // notch under them. At the full speaking size a
                      // suggestion looked like a commitment already made.
                      // Tertiary until you reach for it, then ink: the
                      // question becoming yours.
                      "type-voice-sm pointer-events-auto cursor-pointer text-left italic",
                      "text-text-tertiary transition-colors duration-[--motion-micro]",
                      "hover:text-text-primary focus-visible:text-text-primary",
                      "focus:outline-none",
                    )}
                  >
                    {/* The product's one mark for "there is more behind
                        this" — the same dotted rule an ActionLink and an
                        inferred Figure wear. Without it these are placeholder
                        text, and nobody taps placeholder text. */}
                    <span className="underline decoration-signal-coach decoration-dotted decoration-1 underline-offset-4">
                      {question}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        {action}
        {canListen && (
          <button
            type="button"
            aria-pressed={listening}
            onClick={() => {
              if (listening) {
                stopListening();
                return;
              }
              // The transcript is a full re-delivery each update, not a
              // delta — so THIS field is responsible for remembering what was
              // already typed and prepending it back on.
              baseRef.current = value;
              startListening();
            }}
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

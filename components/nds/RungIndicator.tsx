import { cn } from "@/lib/cn";
import { sentenceCase } from "@/lib/text";

/**
 * Position on the Waterfall (docs/FOUNDATION.md §4).
 *
 * The primary form is typographic — "4 of 7 · tax-advantaged space". Ticks are
 * a quiet secondary.
 *
 * HARD CONSTRAINT: never celebrate advancement. No animation on rung change, no
 * completion state, no color shift to "done", no streak. The moment this reads
 * as a progress ring, North has become a game about money — which is exactly
 * the register that loses this category (docs/STRATEGY.md §3, P3).
 *
 * This is also NOT an onboarding progress bar. Onboarding has no progress
 * indicator; one would turn a conversation into a form.
 */

export const WATERFALL_LENGTH = 7;

export interface RungIndicatorProps {
  /** 1-indexed position on the Waterfall. */
  rung: number;
  /** The rung's name. e.g. "tax-advantaged space" */
  label: string;
  /** Ticks are optional. Typography alone is always sufficient. */
  showTicks?: boolean;
  /**
   * Renders as a button into the ladder disclosure.
   *
   * The mark states a position — "4 of 7" — and a position invites exactly
   * one question: *what are the other six, and why is this one mine?* Without
   * this it was a dead end, which is the one thing no figure in North is
   * allowed to be: a number the reader cannot interrogate is a number they
   * have to take on faith.
   */
  onInterrogate?: () => void;
  className?: string;
}

export function RungIndicator({
  rung,
  label,
  showTicks = true,
  onInterrogate,
  className,
}: RungIndicatorProps) {
  const body = (
    <>
      <span
        className={cn(
          "type-meta text-text-tertiary",
          // The same dotted rule an inferred figure wears. This IS a derived
          // reading of your situation, so it carries the grammar that says so
          // and the affordance that says it can be opened.
          onInterrogate &&
            "underline decoration-dotted decoration-signal-coach decoration-1 underline-offset-4",
        )}
      >
        {rung} of {WATERFALL_LENGTH} · {sentenceCase(label)}
      </span>

      {showTicks && (
        <span aria-hidden="true" className="flex items-end gap-1">
          {/* Thin vertical ticks — the system's hairline data mark. The
              current rung stands slightly taller; nothing animates, nothing
              celebrates. */}
          {Array.from({ length: WATERFALL_LENGTH }, (_, index) => (
            <span
              key={index}
              className={cn(
                "w-0.5 rounded-full",
                index + 1 === rung ? "h-3.5" : "h-2.5",
                index < rung ? "bg-signal-coach" : "bg-text-disabled",
              )}
            />
          ))}
        </span>
      )}
    </>
  );

  if (!onInterrogate) {
    return (
      <div className={cn("flex items-center gap-3", className)}>{body}</div>
    );
  }

  return (
    <button
      type="button"
      onClick={onInterrogate}
      aria-label={`${rung} of ${WATERFALL_LENGTH}, ${label}. Show the whole ladder.`}
      className={cn(
        "hit-target flex cursor-pointer items-center gap-3 self-start rounded-full",
        "transition-opacity duration-[--motion-micro] hover:opacity-70",
        className,
      )}
    >
      {body}
    </button>
  );
}

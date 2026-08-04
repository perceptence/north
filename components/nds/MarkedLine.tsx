import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

/**
 * A mark set level with the FIRST line of the text beside it.
 *
 * ── THE BUG THIS EXISTS TO END ────────────────────────────────────────────
 * `items-start` aligns two BOXES. It does not align a glyph with text: a 16px
 * mark inside a 26px line box sits five pixels high of where the eye expects
 * it, so every one of these rows grew a hand-tuned nudge — `mt-2`, `mt-1`,
 * `mt-0.5`, `mt-[0.45em]`. Each was measured once, against one type size, and
 * then silently outlived it.
 *
 * They were all wrong by the time this was written. `ErrorState` used `mt-2`
 * (8px) to centre an 8px dot in a 34px line, which needs 13. `Tick` used
 * `mt-1` against a 26px line, which needs 5. Today's Steady line used
 * `mt-[0.45em]`, and because `em` scales with font-size, changing that line's
 * type from voice to meta silently shrank a 10px correction to 6 — a nudge
 * that moved with the type but in the wrong direction and by the wrong
 * amount, which is worse than one that does not move at all.
 *
 * ── THE MEASUREMENT THE BROWSER ALREADY HAS ───────────────────────────────
 * `1lh` is one line-height of the element it is written on. So a wrapper that
 * is `h-[1lh]` is exactly one line tall, and a glyph centred inside it is
 * centred on the line — with no number in the source, at any type size,
 * forever. Verified resolving to 18/26/34px against `type-meta`, `type-body`
 * and `type-voice-md`.
 *
 * ── THE TYPE GOES ON THE ROW ──────────────────────────────────────────────
 * `1lh` reads the wrapper's INHERITED line-height, so the row itself has to
 * carry the type of its first line — `className="type-meta"`, not a type
 * class buried on a child. That is the one rule this component asks for, and
 * it is the reason it cannot drift: the thing that sets the line and the
 * thing that measures it are the same declaration.
 */
export interface MarkedLineProps {
  /** The glyph. Hidden from assistive tech — the text carries the meaning. */
  mark: ReactNode;
  children: ReactNode;
  /**
   * MUST include the type class of the first line, because that is what
   * `1lh` resolves against.
   */
  className?: string;
  /** Defaults to the tertiary-action gap. */
  gap?: string;
}

export function MarkedLine({
  mark,
  children,
  className,
  gap = "gap-2.5",
}: MarkedLineProps) {
  return (
    <div className={cn("flex items-start", gap, className)}>
      <span
        aria-hidden="true"
        className="flex h-[1lh] shrink-0 items-center"
      >
        {mark}
      </span>
      <span className="min-w-0 flex-1">{children}</span>
    </div>
  );
}

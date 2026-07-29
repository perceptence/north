import { cn } from "@/lib/cn";

/**
 * The wordmark — LOCKED. Do not redraw.
 *
 * NORTH lettered stroke by stroke in the same hairline hand that draws the
 * turn glyphs and the horizon marks, wide-tracked, with the O replaced by a
 * working compass: bezel ticks east and west, and a needle whose north point
 * is the ONE filled shape in the entire identity. Everything else North draws
 * is an open stroke; the direction itself is the exception.
 *
 * ── THE GEOMETRY IS THE SPEC ──────────────────────────────────────────────
 * Cap height 28, baseline 62, every optical gap 9 units, both needle halves
 * on one pen (identical waist and tip, the north half also filled). These
 * numbers were settled by measurement, not by eye — changing any coordinate
 * below re-opens a question that is closed. Scale the mark with `height`; the
 * strokes scale with it, which is what keeps the proportions a logo's rather
 * than a UI element's.
 *
 * ── TWO PIECES, ONE DRAWING ───────────────────────────────────────────────
 * `Wordmark` is the horizontal lockup for mastheads. `CompassMark` is the O
 * alone — the app icon, the favicon, and the only piece that may ever appear
 * without the name. They share these coordinates exactly, so the icon is
 * literally a letter of the wordmark rather than a separate drawing.
 */

/** Ink box of the full lockup, including stroke overhang. */
const WORD_VIEW = "45.2 33.2 139.6 29.6";
const WORD_RATIO = 139.6 / 29.6;

/** Ink box of the compass alone. Square, so icons need no padding maths. */
const MARK_VIEW = "73.2 33.2 29.6 29.6";

/** The letters. The O is absent — the compass stands in for it. */
const LETTERS = [
  "M46 62 V34",
  "M46 34 L65 62",
  "M65 62 V34",
  "M111 62 V34",
  "M111 34 H120 C127.5 34 127.5 47 120 47 H111",
  "M118 47 L126 62",
  "M135 34 H155",
  "M145 34 V62",
  "M164 62 V34",
  "M184 62 V34",
  "M164 48 H184",
];

/** The instrument: ring, west tick, east tick, then the needle's south half. */
const COMPASS = [
  "M74.8 48 H78.2",
  "M97.8 48 H101.2",
  "M84.9 48 L88 58.6 L91.1 48 Z",
];

/** The needle's north half — filled AND stroked, so both halves share a pen. */
const NEEDLE_NORTH = "M88 37.4 L91.1 48 L84.9 48 Z";

function Compass({ strokeWidth }: { strokeWidth: number }) {
  return (
    <g
      stroke="currentColor"
      fill="none"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx={88} cy={48} r={14} />
      {COMPASS.map((d) => (
        <path key={d} d={d} />
      ))}
      <path d={NEEDLE_NORTH} fill="currentColor" />
    </g>
  );
}

export interface WordmarkProps {
  /** Cap-box height in px. Width follows the locked ratio. */
  height?: number;
  /**
   * Stroke weight in the mark's own units (cap height = 28). The default is
   * the drawn weight; nudge it up only where a surface renders the mark small
   * enough that the hairline would wash out.
   */
  strokeWidth?: number;
  /** Accessible name. Set to "" when an adjacent heading already says it. */
  label?: string;
  className?: string;
}

export function Wordmark({
  height = 14,
  strokeWidth = 1.6,
  label = "North",
  className,
}: WordmarkProps) {
  return (
    <svg
      viewBox={WORD_VIEW}
      width={Math.round(height * WORD_RATIO)}
      height={height}
      fill="none"
      role={label ? "img" : undefined}
      aria-label={label || undefined}
      aria-hidden={label ? undefined : "true"}
      className={cn("block", className)}
    >
      <g
        stroke="currentColor"
        fill="none"
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        {LETTERS.map((d) => (
          <path key={d} d={d} />
        ))}
      </g>
      <Compass strokeWidth={strokeWidth} />
    </svg>
  );
}

export interface CompassMarkProps {
  /** Rendered size in px. The mark is square. */
  size?: number;
  strokeWidth?: number;
  label?: string;
  className?: string;
}

/**
 * The compass alone — the app icon and favicon.
 *
 * The same coordinates as the wordmark's O, cropped square. It is a letter of
 * the name, not a second drawing, which is why the two can never drift.
 */
export function CompassMark({
  size = 24,
  strokeWidth = 1.6,
  label = "North",
  className,
}: CompassMarkProps) {
  return (
    <svg
      viewBox={MARK_VIEW}
      width={size}
      height={size}
      fill="none"
      role={label ? "img" : undefined}
      aria-label={label || undefined}
      aria-hidden={label ? undefined : "true"}
      className={cn("block", className)}
    >
      <Compass strokeWidth={strokeWidth} />
    </svg>
  );
}

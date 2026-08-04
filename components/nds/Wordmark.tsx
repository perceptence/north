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
export const WORD_VIEW = "45.2 33.2 139.6 29.6";
export const WORD_RATIO = 139.6 / 29.6;

/** Ink box of the Plus lockup — the same drawing, plus the ensign. */
const PLUS_VIEW = "45.2 33.2 162.6 29.6";
const PLUS_RATIO = 162.6 / 29.6;

/** Ink box of the compass alone. Square, so icons need no padding maths. */
const MARK_VIEW = "73.2 33.2 29.6 29.6";

/** The letters. The O is absent — the compass stands in for it. */
export const LETTERS = [
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
export const COMPASS = [
  "M74.8 48 H78.2",
  "M97.8 48 H101.2",
  "M84.9 48 L88 58.6 L91.1 48 Z",
];

/** The needle's north half — filled AND stroked, so both halves share a pen. */
export const NEEDLE_NORTH = "M88 37.4 L91.1 48 L84.9 48 Z";

/** Where the needle turns: the compass's own centre. */
export const COMPASS_CENTER = { x: 88, y: 48 } as const;

/**
 * The Plus ensign — a compass rose, seated after the H at cap register.
 *
 * ── THE PLAY ON THE MARK, WITHOUT TOUCHING THE MARK ───────────────────────
 * The wordmark is locked, so membership is not drawn INTO it — no filled
 * ring, no gilded needle. The lockup EXTENDS instead, the way a masthead
 * sets a device after a name: the same optical gap (9 units, H ends at
 * 184) and the same pen. Members' chrome carries the rose; everyone
 * else's carries NORTH alone; the drawing both share never changes.
 *
 * And the ensign is not a typographic "+" — it is the identity's own
 * instrument again, smaller. A four-point rose: the vertical axis is the
 * NEEDLE'S OWN GEOMETRY at half scale, its north point filled exactly as
 * the needle's is (the identity's one filled shape, restated, never a
 * second kind of fill), and the east–west points ride behind it as an open
 * stroke, the way the bezel's ticks flank the ring. Premium is drawn as
 * more compass, because that is the only ornament this identity owns.
 *
 * Centred at (197, 39.4) — the rose hangs in the cap's upper register like
 * a superscript, its tip level with the needle's own.
 */
export const PLUS_ENSIGN = {
  /** East–west points: one open diamond lying across the axis. */
  strokes: ["M190.9 39.4 L197 37.3 L203.1 39.4 L197 41.5 Z"],
  /** South half of the vertical needle, open like the big needle's. */
  south: "M195.3 39.4 L197 45.1 L198.7 39.4 Z",
  /** North half — filled, the needle's own shape at half scale. */
  north: "M197 33.7 L198.7 39.4 L195.3 39.4 Z",
} as const;

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
  /** Renders the Plus lockup — NORTH with the ensign. Membership chrome. */
  plus?: boolean;
  /**
   * Stroke weight in the mark's own units (cap height = 28). The default is
   * the drawn weight; nudge it up only where a surface renders the mark small
   * enough that the hairline would wash out.
   */
  strokeWidth?: number;
  /**
   * Accessible name. Defaults to "North" — or "North Plus" with the ensign —
   * and may be set to "" when an adjacent heading already says it.
   */
  label?: string;
  className?: string;
}

export function Wordmark({
  height = 14,
  plus = false,
  strokeWidth = 1.6,
  label,
  className,
}: WordmarkProps) {
  const name = label ?? (plus ? "North Plus" : "North");
  return (
    <svg
      viewBox={plus ? PLUS_VIEW : WORD_VIEW}
      width={Math.round(height * (plus ? PLUS_RATIO : WORD_RATIO))}
      height={height}
      fill="none"
      role={name ? "img" : undefined}
      aria-label={name || undefined}
      aria-hidden={name ? undefined : "true"}
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
        {plus && (
          <>
            {PLUS_ENSIGN.strokes.map((d) => (
              <path key={d} d={d} />
            ))}
            <path d={PLUS_ENSIGN.south} />
            <path d={PLUS_ENSIGN.north} fill="currentColor" />
          </>
        )}
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

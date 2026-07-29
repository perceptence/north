"use client";

import {
  useCallback,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
} from "react";
import type { ReactNode } from "react";
import { cn } from "@/lib/cn";
import { CONFIDENCE_PHRASE, type Confidence } from "@/core/confidence";
import { formatCurrency, type Cents, type Months } from "@/core/money";

/**
 * The Horizon Field — the projection as a landscape, not a widget.
 *
 * A full-width field of hairlines whose silhouette IS the distribution: dense
 * and tall where outcomes cluster, falling away toward the honest edges. This
 * is the large-format sibling of `HorizonBand` — same encoding, built for the
 * moments where the projection is the SUBJECT (Goals, the calm day), not a
 * footnote.
 *
 * ── THE SCRUB ─────────────────────────────────────────────────────────────
 * When `onScrub` is given, the field is a real slider: drag anywhere and the
 * horizon year moves under your finger — a plumb-line cursor tracks the
 * pointer, the caller recomputes the projection, and the field reshapes on
 * springs. Keyboard works too: it is `role="slider"` with arrow-key stepping
 * and the year announced via `aria-valuetext`. Exploration, not editing — the
 * caller owns whether anything persists.
 *
 * Deterministic as ever: heights are a fixed raised-cosine, no randomness.
 */

const BAR_COUNT = 72;
const FLOOR_PX = 3;
const TRACK_PX = 2;

export interface HorizonFieldProps {
  low: Cents;
  high: Cents;
  central?: Cents;
  confidence: Confidence;
  /** Track ceiling. Defaults to `high` + 15%. */
  domainMax?: Cents;
  /** Field height in px. The scene decides how much sky it gets. */
  height?: number;
  /** Current horizon, for the cursor label and slider semantics. */
  months: Months;
  /** Present = interactive. Called with a snapped month value while dragging. */
  onScrub?: (months: Months) => void;
  scrubMin?: Months;
  scrubMax?: Months;
  /** Snap increment for scrubbing. Defaults to a year. */
  scrubStep?: Months;
  /**
   * A trailing action on the caption row, right-aligned to the field.
   */
  action?: ReactNode;
  className?: string;
}

function yearsLabel(months: Months): string {
  if (months >= 300) return "at retirement";
  const years = Math.round(months / 12);
  return years <= 1 ? "in a year" : `in ${years} years`;
}

export function HorizonField({
  low,
  high,
  central,
  confidence,
  domainMax,
  height = 132,
  months,
  onScrub,
  scrubMin = 60,
  scrubMax = 480,
  scrubStep = 12,
  action,
  className,
}: HorizonFieldProps) {
  const fieldRef = useRef<HTMLDivElement>(null);
  const [cursor, setCursor] = useState<number | null>(null); // 0..1 while scrubbing
  const interactive = Boolean(onScrub);

  const ceiling = domainMax ?? Math.round(high * 1.15);
  const peak =
    high > low
      ? Math.min(
          0.85,
          Math.max(0.15, ((central ?? (low + high) / 2) - low) / (high - low)),
        )
      : 0.5;

  const bars = Array.from({ length: BAR_COUNT }, (_, index) => {
    const position = (index + 0.5) / BAR_COUNT;
    const value = position * ceiling;
    if (value < low || value > high || high <= low) {
      return { height: TRACK_PX, inBand: false, weight: 0 };
    }
    const t = (value - low) / (high - low);
    const weight =
      t <= peak
        ? Math.sin((Math.PI / 2) * (t / peak))
        : Math.sin((Math.PI / 2) * ((1 - t) / (1 - peak)));
    return {
      height: FLOOR_PX + Math.round(weight * (height - FLOOR_PX)),
      inBand: true,
      weight,
    };
  });

  const scrubTo = useCallback(
    (clientX: number) => {
      if (!onScrub || !fieldRef.current) return;
      const rect = fieldRef.current.getBoundingClientRect();
      const ratio = Math.min(1, Math.max(0, (clientX - rect.left) / rect.width));
      setCursor(ratio);
      const raw = scrubMin + ratio * (scrubMax - scrubMin);
      const snapped = Math.round(raw / scrubStep) * scrubStep;
      onScrub(Math.min(scrubMax, Math.max(scrubMin, snapped)));
    },
    [onScrub, scrubMin, scrubMax, scrubStep],
  );

  const handlePointerDown = useCallback(
    (event: ReactPointerEvent) => {
      if (!interactive) return;
      try {
        event.currentTarget.setPointerCapture(event.pointerId);
      } catch {
        // Synthetic pointers (tests, automation) have no capturable id.
      }
      scrubTo(event.clientX);
    },
    [interactive, scrubTo],
  );

  const handlePointerMove = useCallback(
    (event: ReactPointerEvent) => {
      if (!interactive || event.buttons === 0) return;
      scrubTo(event.clientX);
    },
    [interactive, scrubTo],
  );

  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent) => {
      if (!onScrub) return;
      const delta =
        event.key === "ArrowRight" || event.key === "ArrowUp"
          ? scrubStep
          : event.key === "ArrowLeft" || event.key === "ArrowDown"
            ? -scrubStep
            : 0;
      if (delta === 0) return;
      event.preventDefault();
      onScrub(Math.min(scrubMax, Math.max(scrubMin, months + delta)));
    },
    [onScrub, months, scrubMin, scrubMax, scrubStep],
  );

  return (
    <div className={cn("flex flex-col gap-3", className)}>
      <div
        ref={fieldRef}
        role={interactive ? "slider" : "img"}
        tabIndex={interactive ? 0 : undefined}
        aria-label={
          interactive
            ? "Horizon year — drag or use arrow keys"
            : `Projected range: ${formatCurrency(low, { abbreviate: true })} to ${formatCurrency(high, { abbreviate: true })} ${yearsLabel(months)}, ${CONFIDENCE_PHRASE[confidence]}`
        }
        aria-valuemin={interactive ? scrubMin : undefined}
        aria-valuemax={interactive ? scrubMax : undefined}
        aria-valuenow={interactive ? months : undefined}
        aria-valuetext={interactive ? yearsLabel(months) : undefined}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={() => setCursor(null)}
        onPointerCancel={() => setCursor(null)}
        onKeyDown={handleKeyDown}
        className={cn(
          "relative flex w-full items-end gap-0.5",
          interactive && "cursor-ew-resize touch-none select-none",
        )}
        style={{ height }}
      >
        {bars.map((bar, index) => (
          <span
            key={index}
            aria-hidden="true"
            className={cn(
              "min-w-0 flex-1 rounded-full",
              bar.inBand ? "breathe bg-signal-band" : "bg-line-hairline",
              "transition-[height,opacity] duration-[--motion-considered] ease-[--ease-spring]",
            )}
            style={{
              height: bar.height,
              // Rounded to a stable precision: the server serializes style
              // floats truncated, so full-precision values hydrate as a
              // mismatch on any page that SSRs the field (Arrival does).
              opacity: bar.inBand
                ? Number((0.25 + 0.75 * bar.weight).toFixed(3))
                : 1,
              // Staggered breathing — the shimmer travels across the field.
              animationDelay: `${(index % BAR_COUNT) * 90}ms`,
            }}
          />
        ))}

        {/* The plumb line — SS1's chart cursor, honestly employed. Only while
            the finger is down; the label is the year being tried. */}
        {interactive && cursor !== null && (
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-y-0"
            style={{ left: `${cursor * 100}%` }}
          >
            <div className="absolute inset-y-0 w-px -translate-x-1/2 bg-text-primary" />
            <div className="type-overline absolute -top-6 -translate-x-1/2 whitespace-nowrap text-text-primary">
              {yearsLabel(months)}
            </div>
          </div>
        )}
      </div>

      {(interactive || action) && (
        // Caption left, action right, both on the field's own edges. Stacked,
        // the action read as a third orphaned row under a graphic it was
        // already about.
        // Stacked on a phone. Side by side, neither the caption nor the action
        // fits its half, so BOTH wrapped to two ragged lines and collided in
        // the middle — two wrapped fragments reading as one broken sentence.
        // There is no width to share at 375px, so they take turns instead.
        <div className="flex flex-col gap-2 md:flex-row md:items-baseline md:justify-between md:gap-4">
          {interactive && (
            <span className="type-meta text-text-tertiary">
              Drag the field to try a different year.
            </span>
          )}
          {action}
        </div>
      )}
    </div>
  );
}

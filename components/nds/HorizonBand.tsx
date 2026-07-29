"use client";

import type { ReactNode } from "react";
import { cn } from "@/lib/cn";
import type { Confidence } from "@/core/confidence";
import { formatCurrency, type Cents } from "@/core/money";
import { Figure } from "./Figure";

/**
 * A projected range, drawn as a hairline distribution.
 *
 * ── STILL NOT A CHART ─────────────────────────────────────────────────────
 * No axes, no gridlines, no legend, no tooltip. What changed in the craft
 * pass is the mark: instead of one solid bar, the range renders as a fan of
 * thin vertical hairlines whose heights rise toward the central estimate and
 * fall toward the edges. The shape IS the honesty — dense where outcomes
 * cluster, thin where they trail off — and the fan visibly widens when North
 * knows less. Same claim as before, now legible at a glance.
 *
 * The Assumptions sheet remains this component's table-view twin: no value
 * here is reachable only through the visual encoding.
 *
 * Heights are deterministic — a fixed raised-cosine over [low, high] with its
 * peak at the central estimate. No randomness, ever.
 *
 * When several bands are compared, pass a shared `domainMax` or the
 * comparison is a lie (see core/navigator/answer.ts).
 */

const BAR_COUNT = 48;
/** Track height in px at the tallest bar; floors keep off-band bars visible. */
const PEAK_PX = 26;
const FLOOR_PX = 3;
const TRACK_PX = 2;

export interface HorizonBandProps {
  low: Cents;
  high: Cents;
  confidence: Confidence;
  /**
   * Where the distribution peaks. Optional — defaults to the midpoint. Not
   * displayed as a number anywhere: it shapes the fan, and the fan is not a
   * point estimate.
   */
  central?: Cents;
  /**
   * Plain-language horizon. e.g. "by retirement". Optional: side-by-side
   * comparisons label themselves and skip the caption.
   */
  horizon?: string;
  /** Track domain ceiling. Defaults to `high` plus 15% headroom. */
  domainMax?: Cents;
  onShowAssumptions?: () => void;
  /**
   * A trailing action on the FIGURES row, right-aligned to the band.
   *
   * The endpoints and the way deeper into them belong on one line: stacked,
   * the action read as a third, orphaned row under a graphic it was already
   * about.
   */
  action?: ReactNode;
  className?: string;
}

export function HorizonBand({
  low,
  high,
  confidence,
  central,
  horizon,
  domainMax,
  onShowAssumptions,
  action,
  className,
}: HorizonBandProps) {
  const ceiling = domainMax ?? Math.round(high * 1.15);

  // Peak position within the band, clamped away from the edges so the fan
  // always reads as a swell rather than a cliff.
  const peak =
    high > low
      ? Math.min(0.85, Math.max(0.15, ((central ?? (low + high) / 2) - low) / (high - low)))
      : 0.5;

  const bars = Array.from({ length: BAR_COUNT }, (_, index) => {
    const position = (index + 0.5) / BAR_COUNT; // 0..1 across the track
    const value = position * ceiling;
    if (value < low || value > high || high <= low) {
      return { height: TRACK_PX, inBand: false, weight: 0 };
    }
    const t = (value - low) / (high - low); // 0..1 within the band
    const weight =
      t <= peak
        ? Math.sin((Math.PI / 2) * (t / peak))
        : Math.sin((Math.PI / 2) * ((1 - t) / (1 - peak)));
    return {
      height: FLOOR_PX + Math.round(weight * (PEAK_PX - FLOOR_PX)),
      inBand: true,
      weight,
    };
  });

  return (
    <div className={cn("flex flex-col gap-3", className)}>
      {horizon && (
        // `type-section`, not `type-overline`. This caption HEADS a block —
        // the same job "What you're working toward" does on Goals — and the
        // two were set at different weights for no reason anyone could state.
        // The extra bottom margin is the gap the band needs: at gap-3 the
        // caption sat on top of its own graphic.
        <div className="type-section mb-2 text-text-secondary">
          On this path {horizon}
        </div>
      )}

      <div
        role="img"
        aria-label={[
          `Projected range: ${formatCurrency(low, { abbreviate: true })}`,
          `to ${formatCurrency(high, { abbreviate: true })}`,
          horizon,
        ]
          .filter(Boolean)
          .join(" ")}
        className="flex items-end gap-0.5"
        style={{ height: PEAK_PX }}
      >
        {bars.map((bar, index) => (
          <span
            key={index}
            aria-hidden="true"
            className={cn(
              "min-w-0 flex-1 rounded-full",
              // Off-band hairlines are the track: decorative, sub-gate by
              // design. In-band bars are signal, opacity graded with weight —
              // the peak always reads at full 9.43:1.
              bar.inBand ? "bg-signal-band" : "bg-line-hairline",
              "transition-[height,opacity] duration-[--motion-considered] ease-[--ease-spring]",
            )}
            style={{
              height: bar.height,
              // Rounded to a stable precision: the server serializes style
              // floats truncated, so full-precision values hydrate as a
              // mismatch on any page that SSRs the band (same fix as
              // HorizonField).
              opacity: bar.inBand
                ? Number((0.3 + 0.7 * bar.weight).toFixed(3))
                : 1,
            }}
          />
        ))}
      </div>

      <div className="flex items-baseline justify-between gap-4">
        <span className="type-figure text-text-primary">
          <Figure
            value={low}
            format="currency"
            confidence={confidence}
            context="tabular"
            abbreviate
            label="low end of the projection"
          />
          <span aria-hidden="true" className="mx-2 text-text-tertiary">
            –
          </span>
          <Figure
            value={high}
            format="currency"
            confidence={confidence}
            context="tabular"
            abbreviate
            label="high end of the projection"
          />
        </span>

        {action}

        {onShowAssumptions && !action && (
          <button
            type="button"
            onClick={onShowAssumptions}
            className={cn(
              "type-meta hit-target shrink-0 cursor-pointer rounded-chip",
              "text-text-secondary underline decoration-dotted",
              "decoration-signal-coach underline-offset-4",
              "transition-colors duration-[--motion-micro] hover:text-text-primary",
            )}
          >
            what&rsquo;s assumed
          </button>
        )}
      </div>
    </div>
  );
}

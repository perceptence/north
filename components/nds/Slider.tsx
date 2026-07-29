"use client";

import { useId } from "react";
import { cn } from "@/lib/cn";

/**
 * A continuous input.
 *
 * ── WHY THIS EXISTS NOW ───────────────────────────────────────────────────
 * The system listed Slider as deliberately absent, and its governance rule says
 * a new component must appear in at least two places
 * (docs/DESIGN-SYSTEM.md §10). It now carries five parameters across four
 * Navigator scenarios, and exploration — dragging to watch the projection move
 * — is the entire point of a simulator. Chips are still right for genuinely
 * discrete choices; this is for ranges.
 *
 * ── BUILT ON THE NATIVE CONTROL ───────────────────────────────────────────
 * `input[type=range]` supplies the slider role, arrow-key stepping, Home/End,
 * and touch handling. Only the paint is ours. A hand-rolled div-with-drag would
 * be worse in every way that matters and better in none.
 *
 * `valueLabel` is what a screen reader announces instead of the raw number —
 * "sixty thousand dollars", not "6000000". Formatting stays with the caller so
 * this component never reaches into the money layer.
 */

export interface SliderProps {
  value: number;
  onChange: (value: number) => void;
  min: number;
  max: number;
  step: number;
  /** Accessible name. e.g. "Deposit" */
  label: string;
  /** The current value, already formatted. Announced and displayed. */
  valueLabel: string;
  /** Optional end captions, already formatted. */
  minLabel?: string;
  maxLabel?: string;
  className?: string;
}

export function Slider({
  value,
  onChange,
  min,
  max,
  step,
  label,
  valueLabel,
  minLabel,
  maxLabel,
  className,
}: SliderProps) {
  const id = useId();

  return (
    <div className={cn("flex flex-col", className)}>
      <div className="flex items-baseline justify-between gap-4">
        <label htmlFor={id} className="type-meta text-text-tertiary">
          {label}
        </label>
        <output htmlFor={id} className="type-figure text-text-primary">
          {valueLabel}
        </output>
      </div>

      <input
        id={id}
        type="range"
        className="nds-slider"
        min={min}
        max={max}
        step={step}
        value={value}
        aria-valuetext={valueLabel}
        onChange={(event) => onChange(Number(event.target.value))}
      />

      {(minLabel || maxLabel) && (
        <div className="flex items-baseline justify-between">
          <span className="type-meta text-text-tertiary">{minLabel}</span>
          <span className="type-meta text-text-tertiary">{maxLabel}</span>
        </div>
      )}
    </div>
  );
}

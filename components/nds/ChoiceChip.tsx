"use client";

import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

/**
 * The primary input in North. Onboarding and the correction loop.
 *
 * Selection is weight and surface — never a color fill. Amounts and answers
 * are never colored (docs/VISUAL-DIRECTION.md §3.3).
 *
 * 44px minimum at every breakpoint including desktop: these are the main way
 * a user talks to the coach, and a misfire is expensive.
 */

export interface ChoiceChipProps {
  selected?: boolean;
  disabled?: boolean;
  onSelect?: () => void;
  /** Full-width single column — set by the parent when any label runs long. */
  block?: boolean;
  className?: string;
  children: ReactNode;
}

export function ChoiceChip({
  selected = false,
  disabled = false,
  onSelect,
  block = false,
  className,
  children,
}: ChoiceChipProps) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={selected}
      disabled={disabled}
      onClick={onSelect}
      className={cn(
        "type-label inline-flex min-h-11 items-center rounded-full px-4 py-3",
        "cursor-pointer text-left duration-[--motion-micro]",
        "transition-[background-color,border-color,color,transform]",
        !disabled && "active:scale-[0.98]",
        selected
          ? // Selection reads through border weight and surface lift, not hue.
            "border-2 border-text-primary bg-surface-raised text-text-primary shadow-card"
          : "border border-action-border text-text-secondary hover:border-action-border-hover hover:bg-surface-sunken",
        block ? "w-full" : "w-auto",
        disabled && "pointer-events-none opacity-40",
        className,
      )}
    >
      {children}
    </button>
  );
}

/**
 * Groups chips and owns the radio semantics.
 *
 * Wraps by default; switches to a single column when any label runs long,
 * because a ragged two-column wrap of uneven labels reads as broken.
 */
export interface ChoiceChipGroupProps {
  /** Accessible name — usually the question the chips answer. */
  label: string;
  block?: boolean;
  className?: string;
  children: ReactNode;
}

export function ChoiceChipGroup({
  label,
  block = false,
  className,
  children,
}: ChoiceChipGroupProps) {
  return (
    <div
      role="radiogroup"
      aria-label={label}
      className={cn(
        "flex gap-2",
        block ? "flex-col" : "flex-wrap",
        className,
      )}
    >
      {children}
    </div>
  );
}

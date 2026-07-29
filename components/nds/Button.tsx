"use client";

import type { ButtonHTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/cn";
import { CoachPresence } from "./CoachPresence";

/**
 * The primary action is ink, not a hue.
 *
 * There is no colored button in North — that single decision sidesteps the
 * entire fintech color problem and reads as print
 * (docs/VISUAL-DIRECTION.md §3.1).
 *
 * One `primary` per screen (docs/DESIGN-SYSTEM.md §9, rule 2).
 */

export type ButtonVariant = "primary" | "secondary" | "quiet";
export type ButtonSize = "md" | "lg";

const VARIANT_CLASS: Record<ButtonVariant, string> = {
  primary: cn(
    "bg-action-primary text-text-inverse",
    "hover:bg-action-primary-hover active:bg-action-primary-pressed",
  ),
  secondary: cn(
    "border border-action-border text-text-primary",
    "hover:border-action-border-hover hover:bg-surface-sunken",
  ),
  quiet: "text-text-secondary hover:text-text-primary",
};

const SIZE_CLASS: Record<ButtonSize, string> = {
  md: "h-11 px-5", // 44px — the touch floor
  lg: "h-13 px-6", // 52px — the card's primary action
};

export interface ButtonProps
  extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, "className"> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  fullWidth?: boolean;
  /** Label cross-fades to a CoachPresence dot. Never a spinner. */
  pending?: boolean;
  className?: string;
  children: ReactNode;
}

export function Button({
  variant = "primary",
  size = "md",
  fullWidth = false,
  pending = false,
  disabled,
  className,
  children,
  ...rest
}: ButtonProps) {
  const isInert = disabled || pending;

  return (
    <button
      type="button"
      disabled={isInert}
      aria-busy={pending || undefined}
      className={cn(
        "type-label relative inline-flex items-center justify-center",
        // Pill, per the craft pass — controls are capsules; the ink is the brand.
        "rounded-full duration-[--motion-micro]",
        // Press feedback. A control that visibly receives the tap reads as
        // responsive; colour alone does not. Reduced motion strips the scale
        // and keeps the colour change.
        "transition-[background-color,border-color,color,transform]",
        !isInert && "active:scale-[0.98]",
        "cursor-pointer select-none",
        VARIANT_CLASS[variant],
        SIZE_CLASS[size],
        fullWidth && "w-full",
        // Disabled never uses text-disabled as a foreground on its own — the
        // whole control drops to 40% so nothing reads as live-but-unreadable.
        isInert && "pointer-events-none opacity-40",
        className,
      )}
      {...rest}
    >
      {/* The label holds its own width so pending causes no layout shift. */}
      <span
        className={cn(
          "transition-opacity duration-[--motion-micro]",
          pending && "opacity-0",
        )}
      >
        {children}
      </span>
      {pending && (
        <span className="absolute inset-0 flex items-center justify-center">
          <CoachPresence size="sm" announce />
        </span>
      )}
    </button>
  );
}

import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

/**
 * North has exactly one card, and it is the decision.
 *
 * An "insight card" that doesn't ask for a decision is a dashboard widget —
 * the pattern the whole strategy exists to reject. Cards proliferate in
 * dashboards because every module needs a container; when exactly one thing on
 * a screen is a card, the card itself means *this needs you*
 * (docs/DESIGN-SYSTEM.md §8.3).
 *
 * History entries are `Row`s, not Cards. That contrast is the point.
 *
 * The anatomy is fixed and ordered by props rather than composition, which is
 * what makes a card header, a card icon, or an overflow menu unrepresentable.
 */

export type CardVariant = "decision" | "callback" | "satisfied";

const VARIANT_LABEL: Record<CardVariant, string> = {
  decision: "Your current decision",
  callback: "A follow-up from North",
  satisfied: "Nothing needs your attention",
};

export interface CardProps {
  variant?: CardVariant;
  /** The coach's verdict, in prose. Largest element on the screen. */
  read: ReactNode;
  /** RungIndicator. Omitted on callback and satisfied. */
  rung?: ReactNode;
  primaryAction?: ReactNode;
  secondaryAction?: ReactNode;
  /** HorizonBand. Sits beneath the decision that moves it. */
  horizon?: ReactNode;
  className?: string;
}

export function Card({
  variant = "decision",
  read,
  rung,
  primaryAction,
  secondaryAction,
  horizon,
  className,
}: CardProps) {
  const hasActions = Boolean(primaryAction || secondaryAction);

  return (
    <section
      aria-label={VARIANT_LABEL[variant]}
      className={cn(
        "rounded-card border border-line-hairline bg-surface-raised",
        "shadow-card",
        // Extra bottom padding so the actions breathe.
        "px-6 pt-6 pb-8",
        className,
      )}
    >
      <div className="type-voice-lg text-text-primary measure">{read}</div>

      {rung && <div className="mt-5">{rung}</div>}

      {hasActions && (
        <div className="mt-6 flex flex-col gap-3">
          {primaryAction}
          {secondaryAction}
        </div>
      )}

      {horizon && (
        <div className="mt-8 border-t border-line-hairline pt-5">{horizon}</div>
      )}
    </section>
  );
}

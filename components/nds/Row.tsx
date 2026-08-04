"use client";

import type { ReactNode } from "react";
import type { DecisionOutcome } from "@/core/decisions";
import { cn } from "@/lib/cn";
import { OutcomeMark } from "./OutcomeMark";

/**
 * The ledger entry. History is rows, not cards — that contrast is what makes
 * the Card mean something (docs/DESIGN-SYSTEM.md §8.3).
 *
 * Three outcomes, and there is deliberately no "failed", "missed", or
 * "overdue". A commitment not acted on returns to `open` and the coach
 * re-asks. Guilt is the category's central retention failure
 * (docs/STRATEGY.md §3, P3) — a product that keeps a scorecard of your
 * failures is the one you delete.
 */

/**
 * The same three outcomes the ledger uses — re-exported rather than redefined,
 * so a fourth can never appear in one place and not the other.
 */
export type RowOutcome = DecisionOutcome;

const OUTCOME_LABEL: Record<RowOutcome, string> = {
  held: "Held",
  deferred: "Deferred",
  open: "Open",
};

export interface RowProps {
  outcome: RowOutcome;
  /** What was decided. */
  children: ReactNode;
  /** A Figure in `tabular` context. */
  figure?: ReactNode;
  /** Already-formatted, human-readable. e.g. "3 weeks ago" */
  timestamp?: string;
  onSelect?: () => void;
  className?: string;
}

export function Row({
  outcome,
  children,
  figure,
  timestamp,
  onSelect,
  className,
}: RowProps) {
  const content = (
    <>
      {/* One line tall, mark centred in it — the same measurement
          `MarkedLine` makes, inlined because this row also carries a figure
          and a timestamp and is not a two-slot layout. `type-body` is the
          first line's type, so `1lh` is 26px here. */}
      <span className="type-body flex h-[1lh] shrink-0 items-center">
        <OutcomeMark outcome={outcome} />
      </span>

      <span className="min-w-0 flex-1">
        <span className="type-body block text-text-primary">{children}</span>
        {timestamp && (
          <span className="type-meta mt-1 block text-text-tertiary">
            <span className="sr-only">{OUTCOME_LABEL[outcome]} · </span>
            {timestamp}
          </span>
        )}
      </span>

      {figure && <span className="tabular shrink-0 pt-0.5">{figure}</span>}
    </>
  );

  const shared = cn(
    "flex w-full items-start gap-3 border-b border-line-hairline py-4 text-left",
    className,
  );

  if (!onSelect) {
    return <div className={shared}>{content}</div>;
  }

  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        shared,
        "cursor-pointer transition-colors duration-[--motion-micro]",
        "hover:bg-surface-sunken",
      )}
    >
      {content}
    </button>
  );
}

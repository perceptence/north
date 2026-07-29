import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

/**
 * The base of Today, and the only route into Decisions.
 *
 * It carries the entire navigation load for the second surface, and it places
 * history directly beneath the present decision — which is exactly the
 * relationship a coach has to it (docs/UX-ARCHITECTURE.md §2).
 *
 * Reduced prominence: the past is present but subordinate
 * (docs/VISUAL-DIRECTION.md §2, principle 5). Same visual language as the
 * ledger, one step quieter.
 */

export interface ContinuityStripProps {
  /** Two or three `Row`s. More belongs on the Decisions surface. */
  children: ReactNode;
  /** e.g. "4 decisions with North" */
  summary: string;
  onOpenLedger: () => void;
  className?: string;
}

export function ContinuityStrip({
  children,
  summary,
  onOpenLedger,
  className,
}: ContinuityStripProps) {
  return (
    <section aria-label="Recent decisions" className={cn("flex flex-col", className)}>
      <div className="type-meta pb-2 text-text-tertiary">{summary}</div>

      <div className="opacity-70">{children}</div>

      <button
        type="button"
        onClick={onOpenLedger}
        className={cn(
          "type-label hit-target mt-4 flex cursor-pointer items-center gap-1",
          "self-start rounded-control text-text-secondary transition-colors",
          "duration-[--motion-micro] hover:text-text-primary",
        )}
      >
        All decisions
        <svg viewBox="0 0 20 20" className="size-4" fill="none" aria-hidden="true">
          <path
            d="M8 4l6 6-6 6"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>
    </section>
  );
}

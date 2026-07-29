import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

/**
 * Two rules, both specific to financial software.
 *
 * 1. THE ERROR MUST NEVER IMPLY THE USER'S MONEY IS AFFECTED. A bare
 *    "Something went wrong" rendered near a dollar figure reads as *your money
 *    is gone*. `unaffected` is a required prop for exactly this reason — you
 *    cannot render an error here without saying what is still fine.
 *
 * 2. THE COACH NEVER BREAKS CHARACTER. No system message, no error code, no
 *    stack trace. A failure is something the coach can't do right now.
 *
 * Uses `signal-attention` (warm clay), never red — red beside an amount reads
 * as loss (docs/VISUAL-DIRECTION.md §3.2).
 */

export interface ErrorStateProps {
  /** In the coach's voice. Not "Error" and not "Something went wrong". */
  title: ReactNode;
  /** What is explicitly unaffected. Required — see rule 1. */
  unaffected: ReactNode;
  /** One action, and it must be one that actually works. */
  action?: ReactNode;
  className?: string;
}

export function ErrorState({
  title,
  unaffected,
  action,
  className,
}: ErrorStateProps) {
  return (
    <div
      role="alert"
      className={cn(
        "flex flex-col gap-4 rounded-card border border-line-hairline",
        "bg-surface-raised px-6 py-6",
        className,
      )}
    >
      <div className="flex items-start gap-3">
        <span
          aria-hidden="true"
          className="mt-2 size-2 shrink-0 rounded-full bg-signal-attention"
        />
        <p className="type-voice-md measure text-text-primary">{title}</p>
      </div>
      <p className="type-body measure text-text-secondary">{unaffected}</p>
      {action && <div className="mt-1 self-start">{action}</div>}
    </div>
  );
}

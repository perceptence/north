import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

/**
 * An empty state in a coaching product is never "no data". It is "here's what
 * happens next" (docs/UX-ARCHITECTURE.md §7).
 *
 * Never an illustration. Never an apology.
 */

export interface EmptyStateProps {
  /** What this surface will hold. */
  title: ReactNode;
  /** What produces it. */
  body: ReactNode;
  /** Exactly one. */
  action?: ReactNode;
  className?: string;
}

export function EmptyState({ title, body, action, className }: EmptyStateProps) {
  return (
    <div className={cn("flex flex-col gap-4 py-8", className)}>
      <p className="type-voice-md measure text-text-primary">{title}</p>
      <p className="type-body measure text-text-secondary">{body}</p>
      {action && <div className="mt-2 self-start">{action}</div>}
    </div>
  );
}

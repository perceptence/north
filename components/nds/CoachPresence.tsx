import { cn } from "@/lib/cn";

/**
 * The considered pause between conversation turns.
 *
 * A coach that answers instantly reads as a lookup table, so this is the one
 * place latency is *added* deliberately — 400–600ms
 * (docs/UX-ARCHITECTURE.md §8). It must always resolve into visible content;
 * a pause that produces no change is a fake.
 *
 * This is not a spinner. There are no spinners.
 */

export interface CoachPresenceProps {
  /** `sm` sits inside a pending Button. `md` sits in the conversation. */
  size?: "sm" | "md";
  /** Announced to assistive tech while the coach is composing. */
  announce?: boolean;
  className?: string;
}

const SIZE_CLASS = {
  sm: "size-1.5",
  md: "size-2",
} as const;

export function CoachPresence({
  size = "md",
  announce = false,
  className,
}: CoachPresenceProps) {
  return (
    <span
      className={cn("inline-flex items-center", className)}
      role={announce ? "status" : undefined}
      aria-label={announce ? "North is thinking" : undefined}
    >
      <span
        aria-hidden="true"
        className={cn(
          "rounded-full bg-signal-coach animate-coach-pulse",
          SIZE_CLASS[size],
        )}
      />
    </span>
  );
}

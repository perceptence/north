import { cn } from "@/lib/cn";

/**
 * The atmosphere.
 *
 * One fixed ramp — dawn's. This used to pick from three (dawn/day/dusk) by
 * the reader's clock hour, computed once per mount. The intent was a sky
 * that "doesn't shift mid-session" — but a mount-scoped computation isn't a
 * session-scoped one, and a long working session that outlives an hour
 * boundary (ours did) remounts into a visibly different gradient with no
 * warning. Fixed rather than session-pinned: simpler, and nothing in the
 * product currently depends on the sky reading the clock at all.
 */
const DAWN = `linear-gradient(180deg in oklab, var(--sky-900) 0%, var(--sky-600) 45%, var(--sky-300) 75%, var(--paper-50) 100%)`;

export function Sky({ className }: { className?: string }) {
  return (
    <div
      aria-hidden="true"
      className={cn("atmosphere", className)}
      style={{ backgroundImage: DAWN }}
    />
  );
}

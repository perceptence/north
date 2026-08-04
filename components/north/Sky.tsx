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

/**
 * The sky's height, and therefore the masthead bar's and its spacer's.
 *
 * ONE constant used by all three, because they are the same measurement.
 * It lives HERE, not in Masthead: the masthead is a client component now
 * (it reads the membership store), and a constant exported across a
 * "use client" boundary into a server layout arrives as a client-reference
 * proxy, not a string — which put a stringified error where a class name
 * belonged and collapsed the sky to zero height. The sky is server-safe;
 * its measurement belongs with it.
 */
export const SKY_HEIGHT = "h-16 md:h-20";

export function Sky({ className }: { className?: string }) {
  return (
    <div
      aria-hidden="true"
      className={cn("atmosphere", className)}
      style={{ backgroundImage: DAWN }}
    />
  );
}

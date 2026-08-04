"use client";

import { useEffect } from "react";
import { Button, ErrorState } from "@/components/nds";

/**
 * What a product screen shows when it throws.
 *
 * ── THIS IS THE MOUNT `ErrorState` NEVER HAD ──────────────────────────────
 * The component has existed for a while, with `unaffected` as a REQUIRED prop
 * so that nobody can render an error here without saying what is still fine.
 * It was rendered in exactly one place: the `/design` gallery. There was no
 * `error.tsx` anywhere in the app, so an actual throw fell through to Next's
 * default — *"Application error: a client-side exception has occurred"* —
 * rendered beside dollar figures.
 *
 * That single screen broke both of CLAUDE.md's error non-negotiables at once:
 * it implies the user's money is affected, and it is unmistakably system
 * voice rather than the coach's.
 *
 * ── WHAT IT IS SAFE TO PROMISE ────────────────────────────────────────────
 * "Nothing you've told me has been lost" is true by construction rather than
 * by hope: the profile and the ledger live in `localStorage` and are written
 * on change, so a render that throws cannot have taken them with it. That is
 * the only claim made, and it is the one that matters — every figure on these
 * screens is derived, so nothing shown here is a record of anything.
 *
 * `reset()` is Next's own re-render of the segment, which is the honest
 * action: the data is intact, so trying again genuinely is the fix.
 */
export default function ProductError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // The one place the digest is useful — the console, for whoever is
    // debugging. Never the screen (rule 2: the coach does not break
    // character, and an error code is the clearest way to break it).
    console.error(error);
  }, [error]);

  return (
    <div className="px-5 py-16">
      <ErrorState
        title="I can't work that out just now."
        unaffected="Nothing you've told me has been lost, and none of your money has moved — North only ever reads."
        action={
          <Button variant="secondary" size="lg" onClick={reset}>
            Try again
          </Button>
        }
      />
    </div>
  );
}

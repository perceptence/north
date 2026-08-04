"use client";

import { useCallback } from "react";
import { useRouter } from "next/navigation";
import { RHYTHM, SectionHeading, Button } from "@/components/nds";
import type { Behind } from "@/core/insights";
import type { Destination } from "@/core/coach";
import { cn } from "@/lib/cn";
import { ExplanationPanel } from "./ExplanationPanel";
import { ReadProse } from "./ReadProse";

/**
 * The room behind one dispatch in the letter.
 *
 * ── WHY `ExplanationPanel` AND NOT `DerivationSheet` ──────────────────────
 * The distinction the system already draws (docs/DESIGN-SYSTEM.md §8.4): a
 * DerivationSheet shows ONE number's arithmetic, an ExplanationPanel shows the
 * reasoning behind a whole answer, meant to be read. A letter entry is an
 * answer — "your buffer moved, and here is what that means" — so it opens the
 * room `LadderPanel` opens into, not the one a tapped figure does.
 *
 * Figures inside still carry their own working: `ReadProse` renders them as
 * `Figure`s, so a number in here is as interrogable as a number anywhere else.
 *
 * ── AND WHY IT CARRIES A DOOR ─────────────────────────────────────────────
 * Same argument as `CoachReply.goes`: a room that explains a thing and offers
 * no way to act on it is a dead end at the exact moment the reader is ready to
 * move. `core/` names the destination; this file knows the routes.
 */

const PATHS: Record<Destination, string> = {
  today: "/today",
  decisions: "/decisions?from=insights",
  goals: "/goals",
  insights: "/insights",
};

export function InsightSheet({
  detail,
  onClose,
}: {
  /** `null` closes the room — the caller does not track a second flag. */
  detail: Behind | null;
  onClose: () => void;
}) {
  const router = useRouter();

  /**
   * Leave through the door — closing the room first, then travelling.
   *
   * ── WHY THIS IS NOT JUST `onClose(); router.push(path)` ───────────────
   * That is what it was, and the button did nothing. `Sheet` pushes a
   * history entry when it opens so Back closes it, and retires that entry
   * on close with `window.history.back()` — which is ASYNCHRONOUS. So the
   * push landed first and the pop landed second, and the pop took the
   * router straight back to Insights. A door that silently returns you to
   * the room you were already in.
   *
   * So the travel WAITS for the sheet's own pop. One entry retired, one
   * pushed: net one navigation, and Back from the destination returns to
   * Insights rather than reopening the room you just left through.
   *
   * The timeout is the belt to that braces. If the sheet ever closes
   * without popping — it only pops when it pushed, and a future variant
   * might not — the door still opens instead of doing nothing, which is
   * the one outcome worth engineering against.
   *
   * This is the first sheet in the product that navigates. If a second
   * grows a door, this belongs in a shared hook rather than a second copy.
   */
  const goThrough = useCallback(
    (to: Destination) => {
      const path = PATHS[to];
      let travelled = false;
      // Initialised rather than left undefined so `go` can close over it
      // before the timer exists — it fires long after this line either way.
      let timer = 0;

      const go = () => {
        if (travelled) return;
        travelled = true;
        window.removeEventListener("popstate", go);
        window.clearTimeout(timer);
        router.push(path);
      };

      window.addEventListener("popstate", go);
      timer = window.setTimeout(go, 300);
      onClose();
    },
    [onClose, router],
  );

  return (
    <ExplanationPanel
      open={detail !== null}
      onClose={onClose}
      eyebrow={detail?.eyebrow ?? ""}
      thesis={detail?.thesis ?? ""}
    >
      {detail && (
        <div className={cn("flex flex-col", RHYTHM.screen)}>
          {detail.sections.map((section) => (
            <div
              key={section.heading}
              className={cn("flex flex-col", RHYTHM.heading)}
            >
              <SectionHeading>{section.heading}</SectionHeading>
              <div className="type-body measure text-text-primary">
                <ReadProse read={{ segments: section.segments }} />
              </div>
            </div>
          ))}

          {detail.goes && detail.goesLabel && (
            <Button variant="secondary" onClick={() => goThrough(detail.goes!)}>
              {detail.goesLabel}
            </Button>
          )}
        </div>
      )}
    </ExplanationPanel>
  );
}

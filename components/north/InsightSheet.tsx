"use client";

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
            <Button
              variant="secondary"
              onClick={() => {
                onClose();
                router.push(PATHS[detail.goes!]);
              }}
            >
              {detail.goesLabel}
            </Button>
          )}
        </div>
      )}
    </ExplanationPanel>
  );
}

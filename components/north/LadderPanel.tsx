"use client";

import { Text } from "@/components/nds";
import type { RungState } from "@/core/waterfall";
import { cn } from "@/lib/cn";
import { sentenceCase } from "@/lib/text";
import { ExplanationPanel } from "./ExplanationPanel";

/**
 * The whole ladder — what "4 of 7" is counting.
 *
 * ── WHY IT IS A DISCLOSURE ────────────────────────────────────────────────
 * The rung mark states a position, and a position invites exactly one
 * question: *what are the other six, and why is this one mine?* For a while
 * that question had no answer at all — the mark was a dead end, which is the
 * one thing no figure in North is allowed to be.
 *
 * A seven-row list was tried in the FLOW of Today and removed: it said what
 * the tick strip already says, in twenty times the space, and turned the one
 * screen that must stay a single decision into a table of contents. Behind a
 * disclosure it costs nothing and answers everything — which is where the
 * ladder belonged all along.
 *
 * ── THIS IS NOT A PROGRESS SCREEN ─────────────────────────────────────────
 * The hard constraint on RungIndicator holds here in full: never celebrate
 * advancement. Nothing animates, nothing completes, and a settled rung gets
 * LESS ink rather than more — the opposite of how a game would draw it. What
 * is shown is position on a route, the same grammar as onboarding's
 * wayfinding strip.
 *
 * Order is the engine's order, always. This never re-sorts.
 */

export interface LadderPanelProps {
  open: boolean;
  onClose: () => void;
  ladder: RungState[];
  /** The rung the coach is on right now. */
  currentIndex: number;
}

export function LadderPanel({
  open,
  onClose,
  ladder,
  currentIndex,
}: LadderPanelProps) {
  return (
    <ExplanationPanel
      open={open}
      onClose={onClose}
      eyebrow="Why this one"
      thesis="Financial priority is ordered, and everyone is on the same ladder."
    >
      <Text variant="body" tone="secondary" measure as="p">
        North works down these in order, so the only one it asks you about is
        the first that isn&rsquo;t settled. That is why it never opens with
        seven things — and why the rungs above this one have gone quiet.
      </Text>

      <ol className="flex flex-col">
        {ladder.map((rung) => {
          const current = rung.index === currentIndex;
          // "Behind you" is positional, not a claim about satisfaction: a rung
          // you deferred is still behind the one North is asking about now.
          const behind = rung.index < currentIndex;

          return (
            <li
              key={rung.id}
              className="flex items-baseline gap-4 border-t border-line-hairline py-4 first:border-t-0"
            >
              <span
                className={cn(
                  "type-figure w-6 shrink-0 tabular-nums",
                  current ? "text-text-primary" : "text-text-tertiary",
                )}
              >
                {String(rung.index).padStart(2, "0")}
              </span>

              <span
                className={cn(
                  "flex-1",
                  current
                    ? "type-voice-md text-text-primary"
                    : behind
                      ? "type-body text-text-tertiary"
                      : "type-body text-text-disabled",
                )}
              >
                {sentenceCase(rung.label)}
              </span>

              <span className="type-meta shrink-0 text-text-tertiary">
                {current ? "you’re here" : behind ? "behind you" : ""}
              </span>
            </li>
          );
        })}
      </ol>

      <Text variant="meta" tone="tertiary" measure as="p">
        A rung goes quiet when it&rsquo;s settled or when you&rsquo;ve told
        North to leave it — either way it stops asking, and starts asking about
        what&rsquo;s underneath.
      </Text>
    </ExplanationPanel>
  );
}

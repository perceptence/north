"use client";

import { Figure, Text } from "@/components/nds";
import { cn } from "@/lib/cn";
import { CONFIDENCE_LABEL } from "@/core/confidence";
import type { Projection } from "@/core/projection";
import { ExplanationPanel } from "./ExplanationPanel";
import { RHYTHM } from "@/components/nds";

/**
 * What the horizon rests on — the assumptions, as statements.
 *
 * The room's chrome lives in `ExplanationPanel`, shared with the Navigator's
 * "What this rests on" so the two behave identically. What is specific here is
 * the content: each assumption set as a STATEMENT — label, figure, and the
 * confidence spoken as a phrase — rather than a table row, because this is the
 * one disclosure in the product meant to be read rather than scanned.
 */

export interface AssumptionsPanelProps {
  open: boolean;
  onClose: () => void;
  projection: Projection;
}

export function AssumptionsPanel({
  open,
  onClose,
  projection,
}: AssumptionsPanelProps) {
  return (
    <ExplanationPanel
      open={open}
      onClose={onClose}
      eyebrow="What this rests on"
      thesis="A range is what honesty looks like when the future is involved."
    >
          <Text variant="body" tone="secondary" measure as="p">
            North projects forward from what you&rsquo;ve told it and what it
            has had to assume. Every one of those inputs is listed below, marked
            with how well it&rsquo;s known. Change any of them and the horizon
            moves.
          </Text>

          {/* Each assumption as a STATEMENT, not a table row: the aside rule
              marks the block as the coach's own working. */}
          <ul className={cn("flex flex-col border-l border-line-hairline pl-5", RHYTHM.block)}>
            {projection.assumptions.map((assumption) => (
              <li key={assumption.label} className={cn("flex flex-col", RHYTHM.pair)}>
                <Text variant="body" tone="primary" as="span">
                  {assumption.label}
                </Text>

                {assumption.value !== undefined && assumption.format && (
                  <span className="type-voice-md text-text-primary">
                    <Figure
                      value={assumption.value}
                      format={assumption.format}
                      confidence={assumption.confidence}
                      label={assumption.label}
                    />
                  </span>
                )}

                <Text variant="meta" tone="tertiary" as="span">
                  {CONFIDENCE_LABEL[assumption.confidence]}
                </Text>
              </li>
            ))}
          </ul>

          <Text variant="body" tone="secondary" measure as="p">
            A single number here would be easier to read, and it would be a lie.
            The width of the band is the part North is honest about.
          </Text>

    </ExplanationPanel>
  );
}

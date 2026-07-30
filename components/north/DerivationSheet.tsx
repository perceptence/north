"use client";

import { useState, type ReactNode } from "react";
import { Figure, Sheet, Text } from "@/components/nds";
import { cn } from "@/lib/cn";
import { CONFIDENCE_LABEL, type Confidence, type Field } from "@/core/confidence";
import type { FigureFormat } from "@/core/money";
import { CORRECTABLE } from "@/core/onboarding/correction";
import { SCRIPT, type TurnId } from "@/core/onboarding/script";
import type { SituationProfile } from "@/core/profile/types";
import type { DerivedFacts } from "@/core/waterfall";
import { CorrectionTurn } from "./CorrectionTurn";
import { RHYTHM } from "@/components/nds";

/**
 * Where the numbers come from — and the way to fix them.
 *
 * "Earn every number" made literal: every row shows the value AND how well
 * North knows it, so a user can see which parts of the read rest on something
 * they said and which rest on a guess (docs/VISUAL-DIRECTION.md §2, principle 3).
 *
 * ── THE CORRECTION LIVES HERE ─────────────────────────────────────────────
 * Tapping a row you told us swaps this sheet's contents for a single question.
 * Not a second sheet stacked on the first, and not a settings screen — the
 * coach simply turns and asks you again (docs/UX-ARCHITECTURE.md §5.3).
 *
 * The split matters too: what you TOLD US is correctable; what we WORKED OUT is
 * not, because correcting a derived figure would mean overriding the maths
 * rather than fixing its inputs.
 *
 * KNOWN LIMITATION: this shows the whole working, not the provenance of the one
 * figure that was tapped. Per-figure provenance needs the engine to declare
 * inputs per segment.
 */

export interface DerivationSheetProps {
  open: boolean;
  onClose: () => void;
  profile: SituationProfile;
  facts: DerivedFacts;
}

/** The answer the user actually gave, where the script has a label for it. */
function optionLabel(turnId: TurnId, value: unknown): string | null {
  const turn = SCRIPT.find((t) => t.id === turnId);
  if (!turn || turn.kind !== "choice") return null;
  return turn.options.find((o) => o.value === value)?.label ?? null;
}

interface Told {
  node: ReactNode;
  confidence: Confidence;
}

/** What the profile holds for a correctable field, ready to render. */
function told(profile: SituationProfile, turnId: TurnId): Told | null {
  const asFigure = (
    field: Field<number>,
    format: FigureFormat,
    label: string,
  ): Told => ({
    node: (
      <Figure
        value={field.value}
        format={format}
        confidence={field.confidence}
        context="tabular"
        label={label}
      />
    ),
    confidence: field.confidence,
  });

  switch (turnId) {
    case "liquid":
      return asFigure(profile.liquidCents, "currency", "cash you hold");
    case "monthlyOut":
      return asFigure(profile.monthlyOutCents, "currency", "monthly outgoings");
    case "retirement":
      return asFigure(profile.retirementBps, "percent", "going to retirement");
    case "employerMatch":
      return asFigure(profile.employerMatchBps, "percent", "employer match");
    case "dependents":
      return asFigure(profile.dependents, "count", "people depending on you");
    case "horizon":
      return asFigure(profile.horizonMonths, "duration", "time horizon");

    case "incomeBand": {
      // Categorical — there is no figure, so we echo the band they picked.
      const label = optionLabel("incomeBand", profile.incomeBand.value);
      return {
        node: (
          <Text variant="figure" as="span">
            {label ?? String(profile.incomeBand.value)}
          </Text>
        ),
        confidence: profile.incomeBand.confidence,
      };
    }

    case "expensiveDebt": {
      const worst = profile.obligations.value[0];
      return {
        node: worst ? (
          <Figure
            value={worst.balanceCents}
            format="currency"
            confidence={profile.obligations.confidence}
            context="tabular"
            label="expensive debt"
          />
        ) : (
          <Text variant="figure" as="span" tone="tertiary">
            None
          </Text>
        ),
        confidence: profile.obligations.confidence,
      };
    }

    default:
      return null;
  }
}

function Line({
  label,
  value,
  confidence,
  onCorrect,
}: {
  label: string;
  value: ReactNode;
  confidence: Confidence;
  onCorrect?: () => void;
}) {
  const body = (
    <>
      <span className="min-w-0 flex-1 text-left">
        <Text variant="body" tone="secondary" as="span">
          {label}
        </Text>
        <Text variant="meta" tone="tertiary" as="span" className="ml-2">
          {CONFIDENCE_LABEL[confidence]}
        </Text>
      </span>
      <span className="tabular shrink-0">{value}</span>
    </>
  );

  const shared =
    "flex w-full items-baseline justify-between gap-4 border-b border-line-hairline py-3";

  if (!onCorrect) return <div className={shared}>{body}</div>;

  return (
    <button
      type="button"
      onClick={onCorrect}
      className={`${shared} cursor-pointer rounded-chip transition-colors duration-[--motion-micro] hover:bg-surface-raised`}
    >
      {body}
    </button>
  );
}

export function DerivationSheet({
  open,
  onClose,
  profile,
  facts,
}: DerivationSheetProps) {
  const [correcting, setCorrecting] = useState<{
    turnId: TurnId;
    label: string;
  } | null>(null);

  const close = () => {
    setCorrecting(null);
    onClose();
  };

  return (
    <Sheet
      open={open}
      onClose={close}
      title={
        <h2 className="type-label text-text-tertiary">
          {correcting ? "One question" : "Where this comes from"}
        </h2>
      }
    >
      {correcting ? (
        <CorrectionTurn
          turnId={correcting.turnId}
          label={correcting.label}
          onDone={() => setCorrecting(null)}
          onCancel={() => setCorrecting(null)}
        />
      ) : (
        <div className={cn("flex flex-col", RHYTHM.block)}>
          <section className="flex flex-col">
            <Text variant="meta" tone="tertiary" className="pb-1">
              What you told us · tap to change
            </Text>
            {CORRECTABLE.map(({ turnId, label }) => {
              const shown = told(profile, turnId);
              if (!shown) return null;
              return (
                <Line
                  key={turnId}
                  label={label}
                  value={shown.node}
                  confidence={shown.confidence}
                  onCorrect={() => setCorrecting({ turnId, label })}
                />
              );
            })}
          </section>

          <section className="flex flex-col">
            <Text variant="meta" tone="tertiary" className="pb-1">
              What we worked out
            </Text>
            {/* Not correctable: fixing a derived figure would mean overriding
                the maths instead of correcting what it was given. */}
            <Line
              label="Months your cash covers"
              confidence={facts.liquidityMonths.confidence}
              value={
                <Figure
                  value={facts.liquidityMonths.value}
                  format="duration"
                  confidence={facts.liquidityMonths.confidence}
                  context="tabular"
                  label="months your cash covers"
                />
              }
            />
            <Line
              label="Cash above the floor"
              confidence={facts.excessCash.confidence}
              value={
                <Figure
                  value={facts.excessCash.value}
                  format="currency"
                  confidence={facts.excessCash.confidence}
                  context="tabular"
                  label="cash above the floor"
                />
              }
            />
            <Line
              label="Monthly income we assume"
              confidence={facts.monthlyIncome.confidence}
              value={
                <Figure
                  value={facts.monthlyIncome.value}
                  format="currency"
                  confidence={facts.monthlyIncome.confidence}
                  context="tabular"
                  label="monthly income we assume"
                />
              }
            />
            <Line
              label="Tax-advantaged room unused"
              confidence={facts.unusedTaxAdvantaged.confidence}
              value={
                <Figure
                  value={facts.unusedTaxAdvantaged.value}
                  format="currency"
                  confidence={facts.unusedTaxAdvantaged.confidence}
                  context="tabular"
                  label="tax-advantaged room unused"
                />
              }
            />
          </section>

          <Text variant="meta" tone="tertiary">
            Anything marked <em>assumed</em> is our guess, not your answer.
            Nothing here comes from your accounts — it is what you told us, and
            what we worked out from it.
          </Text>
        </div>
      )}
    </Sheet>
  );
}

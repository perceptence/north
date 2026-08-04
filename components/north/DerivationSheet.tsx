"use client";

import { useState, type ReactNode } from "react";
import { Figure, Sheet, Text } from "@/components/nds";
import { cn } from "@/lib/cn";
import { CONFIDENCE_LABEL, type Confidence, type Field } from "@/core/confidence";
import type { FigureFormat } from "@/core/money";
import { CORRECTABLE } from "@/core/onboarding/correction";
import { SCRIPT, type TurnId } from "@/core/onboarding/script";
import type { SituationProfile } from "@/core/profile/types";
import { costliest, type DerivedFacts, type EvaluateOptions } from "@/core/waterfall";
import {
  explain,
  type DerivationKey,
  type DerivationStep,
} from "@/core/derivation";
import { ReadProse } from "./ReadProse";
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
 * ── PER-FIGURE, AND AS SENTENCES ──────────────────────────────────────────
 * This used to open on twelve rows of label, value and confidence — every
 * field North holds, in two tables, whatever you tapped. Numbers after
 * numbers, answering "what do you know" rather than "where did THAT come
 * from". The limitation was recorded here and is now closed: the engine
 * declares `explains` on each interrogable figure, and `core/derivation`
 * composes that figure's working as a chain of sentences ending on the number
 * you tapped.
 *
 * The chain is prose because a table makes the reader do the arithmetic and
 * infer the relationships. Each line states one input and what it means; the
 * conclusion is the answer to the question the tap asked. That is the
 * product's own inversion (docs/UX-ARCHITECTURE.md §4.3) applied to the one
 * screen that had reverted to a spreadsheet — and this is the overlay the
 * same document calls "the interaction most likely to convince a skeptical
 * reviewer the reasoning is real".
 *
 * The full table survives as the fallback, for figures the engine has not
 * declared a derivation for and for callers that do not pass one.
 */

export interface DerivationSheetProps {
  open: boolean;
  onClose: () => void;
  profile: SituationProfile;
  facts: DerivedFacts;
  /**
   * Which figure was tapped, if the engine declared one.
   *
   * When present the sheet shows THAT number's working and nothing else.
   * Absent — a figure with no declared derivation, or a caller that has not
   * been taught to pass it — it falls back to the full table below, which is
   * what every tap used to get.
   */
  explains?: string | null;
  options: EvaluateOptions;
}

/**
 * One line of the working.
 *
 * Correctable steps are buttons, because the step that is WRONG is the step
 * you want to tap — the overlay is a way in, not a read-only receipt. Steps
 * with no `from` are the engine's own constants and rules, which are not
 * yours to change and would be dishonest to offer.
 */
function Step({
  step,
  onCorrect,
}: {
  step: DerivationStep;
  onCorrect?: () => void;
}) {
  const body = (
    <span className="type-body block text-left text-text-secondary">
      <ReadProse read={{ segments: step.segments }} unruled />
    </span>
  );

  if (!onCorrect) {
    return <li className="py-2">{body}</li>;
  }

  return (
    <li>
      <button
        type="button"
        onClick={onCorrect}
        className={cn(
          "-mx-2 flex w-full cursor-pointer items-baseline gap-3 rounded-chip px-2 py-2",
          "text-left transition-colors duration-[--motion-micro]",
          "hover:bg-surface-raised",
        )}
      >
        {body}
        <span className="type-meta shrink-0 text-text-tertiary underline decoration-dotted underline-offset-4">
          change
        </span>
      </button>
    </li>
  );
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
      // The engine's own definition, not the first obligation on file — a
      // mortgage is not expensive debt, and this overlay exists to show the
      // working rather than to contradict it.
      const worst = costliest(profile.obligations.value);
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
  explains: key,
  options,
}: DerivationSheetProps) {
  const [correcting, setCorrecting] = useState<{
    turnId: TurnId;
    label: string;
  } | null>(null);

  const close = () => {
    setCorrecting(null);
    onClose();
  };

  const working = key ? explain(key as DerivationKey, profile, facts, options) : null;
  const labelFor = (turnId: TurnId) =>
    CORRECTABLE.find((c) => c.turnId === turnId)?.label ?? "";

  return (
    <Sheet
      open={open}
      onClose={close}
      title={
        <h2 className="type-label text-text-tertiary">
          {correcting
            ? "One question"
            : (working?.title ?? "Where this comes from")}
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
      ) : working ? (
        /* ── THE WORKING FOR ONE FIGURE ──────────────────────────────────
           Sentences, not a table. A table asks the reader to do the
           arithmetic and infer the relationships; a chain states one input
           per line and lands on the number they tapped. Composed in
           `core/derivation` from the same facts `derive()` produced, so it
           cannot drift from the maths it describes. */
        <div className={cn("flex flex-col", RHYTHM.heading)}>
          <ol className="flex flex-col">
            {working.steps.map((step, i) => (
              <Step
                key={i}
                step={step}
                onCorrect={
                  step.from
                    ? () =>
                        setCorrecting({
                          turnId: step.from!,
                          label: labelFor(step.from!),
                        })
                    : undefined
                }
              />
            ))}
          </ol>

          {/* The conclusion, at the coach's size — it is the answer to the
              question the tap asked, and everything above it is evidence. */}
          <div className="type-voice measure border-t border-line-hairline pt-4 text-text-primary">
            <ReadProse read={{ segments: working.result }} />
          </div>

          <Text variant="meta" tone="tertiary">
            Nothing here comes from your accounts — it is what you told us, and
            what North worked out from it.
          </Text>
        </div>
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

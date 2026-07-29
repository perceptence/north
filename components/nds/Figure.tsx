"use client";

import { cn } from "@/lib/cn";
import { CONFIDENCE_PHRASE, type Confidence } from "@/core/confidence";
import {
  formatCount,
  formatCurrency,
  formatMonths,
  formatPercent,
  type FigureFormat,
} from "@/core/money";

/**
 * North's signature component. The only way a number enters the product.
 *
 * Raw numeric text anywhere is a review failure (docs/DESIGN-SYSTEM.md §9,
 * rule 6). Every Figure carries a confidence, and that confidence is part of
 * the accessible name — a screen reader user learns which numbers are theirs
 * and which are North's guesses, exactly as a sighted user does from the
 * visual grammar.
 */

export type { FigureFormat };

/** `prose` sits inside the coach's sentence. `tabular` sits in a column. */
export type FigureContext = "prose" | "tabular";

export interface FigureProps {
  /** Integer. Cents for currency, basis points for percent, months for duration. */
  value: number;
  format: FigureFormat;
  confidence: Confidence;
  context?: FigureContext;
  /** Collapse large currency: $1,240,000 → $1.2M */
  abbreviate?: boolean;
  /** What this figure is, for assistive tech. e.g. "annual return" */
  label?: string;
  /** Renders as a button into the derivation sheet. */
  interrogable?: boolean;
  onInterrogate?: () => void;
  className?: string;
}

/**
 * ── THE RULE MEANS "THERE IS MORE BEHIND THIS" ────────────────────────────
 *
 * A dotted rule in `signal-coach` is the product's one mark for *openable*:
 * `ActionLink` wears it, the interrogable `RungIndicator` wears it, and every
 * interrogable figure wears it too. One look, one meaning, everywhere.
 *
 * It did not used to work that way, and the result was incoherent: the rule
 * was chosen by CONFIDENCE, so whether a number could be opened had no visual
 * signal at all. Two figures in the same sentence — one openable, one not —
 * rendered identically, while the same number rendered black on Today and grey
 * on Goals purely because one reading was inferred and the other assumed. The
 * reader was being shown a distinction they could not act on, and denied the
 * one they could.
 *
 * So: **openable is drawn, confidence is spoken.** Every interrogable figure
 * is grey with the dotted rule. Confidence still travels in the accessible
 * name on every figure — which is the actual non-negotiable — and `assumed`
 * keeps its visible dashed rule when the figure is NOT openable, because
 * "North guessed this" is honesty the reader deserves whether or not there is
 * a panel behind it.
 *
 * Underline rather than border-bottom: a figure inside prose can wrap across
 * lines, and text-decoration follows the wrap. A border does not.
 */
const OPENABLE_CLASS =
  "text-text-secondary underline decoration-dotted decoration-signal-coach " +
  "decoration-1 underline-offset-4";

const CONFIDENCE_CLASS: Record<Confidence, string> = {
  stated: "text-text-primary",
  inferred: "text-text-primary",
  assumed:
    "text-text-secondary underline decoration-dashed decoration-action-border " +
    "decoration-1 underline-offset-4",
};

function format({
  value,
  format: kind,
  abbreviate,
}: Pick<FigureProps, "value" | "format" | "abbreviate">): string {
  switch (kind) {
    case "currency":
      return formatCurrency(value, { abbreviate });
    case "percent":
      return formatPercent(value);
    case "duration":
      return formatMonths(value);
    case "count":
      return formatCount(value);
  }
}

export function Figure({
  value,
  format: kind,
  confidence,
  context = "prose",
  abbreviate = false,
  label,
  interrogable = false,
  onInterrogate,
  className,
}: FigureProps) {
  const formatted = format({ value, format: kind, abbreviate });

  // Explicit, so mono digits are never announced character-by-character and
  // the confidence always travels with the value.
  const accessibleName = [
    formatted,
    label,
    CONFIDENCE_PHRASE[confidence],
    interrogable ? "Show how this was calculated" : undefined,
  ]
    .filter(Boolean)
    .join(", ");

  // `prose` INHERITS whatever face it sits in — it is speech, and speech takes
  // the voice of the sentence around it. Forcing the serif here made figures
  // render serif inside sans body copy on the Navigator and Insights, which
  // read as a mistake rather than a choice.
  // `tabular` switches to mono and aligns, because a column is not speech.
  const contextClass = context === "tabular" ? "type-figure" : "";

  // Openable wins the paint. A figure you can act on says so first; its
  // confidence is still on the accessible name either way.
  const shared = cn(
    contextClass,
    interrogable ? OPENABLE_CLASS : CONFIDENCE_CLASS[confidence],
    className,
  );

  if (!interrogable) {
    return (
      <span className={shared} aria-label={accessibleName} role="text">
        <span aria-hidden="true">{formatted}</span>
      </span>
    );
  }

  return (
    <button
      type="button"
      onClick={onInterrogate}
      aria-label={accessibleName}
      className={cn(
        shared,
        "hit-target cursor-pointer rounded-chip transition-colors",
        "hover:decoration-2 focus-visible:decoration-2",
      )}
    >
      <span aria-hidden="true">{formatted}</span>
    </button>
  );
}

/**
 * Money is integer cents. Never floats.
 *
 * Float drift in a financial product is an instant credibility kill, and it is
 * unrecoverable once a user notices. Values enter as integers and are formatted
 * only at the edge — inside `Figure`, and nowhere else.
 */

/** An amount in whole cents. 4_000_000 === $40,000.00 */
export type Cents = number;

/** A rate in basis points. 600 === 6.00%. Integer, for the same reason. */
export type BasisPoints = number;

/** A span in whole months. 11 === 11 months. */
export type Months = number;

/**
 * How a number should be rendered.
 *
 * Lives here rather than in the `Figure` component because the engine produces
 * figures too, and one definition is what keeps the engine's output and the
 * component's props structurally compatible.
 */
export type FigureFormat = "currency" | "percent" | "duration" | "count";

const assertInteger = (value: number, label: string): void => {
  if (!Number.isInteger(value)) {
    throw new TypeError(
      `${label} must be an integer — got ${value}. Money is integer cents; ` +
        `rates are basis points. See lib/money.ts.`,
    );
  }
};

export interface CurrencyOptions {
  /** Collapse large values: $1,240,000 → $1.2M. Used by HorizonBand. */
  abbreviate?: boolean;
}

/** Format integer cents as display currency. */
export function formatCurrency(
  cents: Cents,
  { abbreviate = false }: CurrencyOptions = {},
): string {
  assertInteger(cents, "cents");

  const negative = cents < 0;
  const absolute = Math.abs(cents);

  let body: string;

  if (abbreviate && absolute >= 100_000_000) {
    // $1M and above, one decimal: $1.2M
    body = `$${trimZero((absolute / 100_000_000).toFixed(1))}M`;
  } else if (abbreviate && absolute >= 1_000_000) {
    // $10k and above, no decimal: $40K
    body = `$${Math.round(absolute / 100_000)}K`;
  } else {
    const dollars = absolute / 100;
    body = new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: absolute % 100 === 0 ? 0 : 2,
      maximumFractionDigits: absolute % 100 === 0 ? 0 : 2,
    }).format(dollars);
  }

  return negative ? `−${body}` : body;
}

/** Format basis points as a percentage. 600 → "6%", 675 → "6.75%" */
export function formatPercent(basisPoints: BasisPoints): string {
  assertInteger(basisPoints, "basisPoints");
  const percent = basisPoints / 100;
  return `${trimZero(percent.toFixed(2))}%`;
}

/** Format whole months as a human span. 11 → "11 months", 24 → "2 years" */
export function formatMonths(months: Months): string {
  assertInteger(months, "months");
  if (months === 0) return "0 months";
  if (months % 12 === 0) {
    const years = months / 12;
    return `${years} ${years === 1 ? "year" : "years"}`;
  }
  return `${months} ${months === 1 ? "month" : "months"}`;
}

/** Format a plain count. */
export function formatCount(value: number): string {
  assertInteger(value, "count");
  return new Intl.NumberFormat("en-US").format(value);
}

/** "6.00" → "6", "6.75" → "6.75", "1.0" → "1" */
function trimZero(fixed: string): string {
  return fixed.replace(/\.?0+$/, "");
}

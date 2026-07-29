/**
 * The confidence grammar.
 *
 * Every figure North renders carries how well it knows that figure. This is the
 * product's smartest idea made visible (docs/VISUAL-DIRECTION.md §3.4) and the
 * reason a user trusts North's numbers over a competitor's.
 *
 * There is no `unknown`. A field North doesn't know is a question the coach
 * hasn't asked — it renders as a prompt, or not at all. It never renders as a
 * blank, a dash, or a zero (docs/UX-ARCHITECTURE.md §7.3).
 */
export type Confidence = "stated" | "inferred" | "assumed";

/** Every value in the SituationProfile is wrapped with how it was learned. */
export interface Field<T> {
  value: T;
  confidence: Confidence;
  /** ISO date the value was learned or last confirmed. */
  asOf: string;
}

/**
 * The spoken form of a confidence level, for assistive technology.
 *
 * A sighted user reads confidence from the visual grammar. A screen reader user
 * must get the same meaning — not a bare number. This is the accessibility
 * requirement most likely to be skipped and the one that matters most here: the
 * entire trust model depends on knowing which figures are yours and which are
 * North's guesses.
 */
export const CONFIDENCE_PHRASE: Record<Confidence, string> = {
  stated: "a figure you told us",
  inferred: "derived from what you told us",
  assumed: "our assumption",
};

/** The short form, for the derivation sheet's field list. */
export const CONFIDENCE_LABEL: Record<Confidence, string> = {
  stated: "you told us",
  inferred: "derived",
  assumed: "assumed",
};

/* ── Combination ──────────────────────────────────────────────────────────
   Confidence is a lattice: stated > inferred > assumed. When figures combine,
   the result is only as trustworthy as its weakest input.
   ─────────────────────────────────────────────────────────────────────── */

const RANK: Record<Confidence, number> = {
  stated: 2,
  inferred: 1,
  assumed: 0,
};

/** The weakest of the given confidences. Defaults to `stated` for an empty set. */
export function weakest(...levels: Confidence[]): Confidence {
  return levels.reduce<Confidence>(
    (lowest, level) => (RANK[level] < RANK[lowest] ? level : lowest),
    "stated",
  );
}

/**
 * The confidence of a value North *computed* from other values.
 *
 * Capped at `inferred` — a figure North worked out is never something the user
 * told us, however solid its inputs. This is the rule that stops a derived
 * number from inheriting `stated` and presenting itself with more authority
 * than it has earned.
 */
export function derived(...inputs: Confidence[]): Confidence {
  return weakest("inferred", ...inputs);
}

/** Convenience for building a `Field<T>` from a computation. */
export function field<T>(
  value: T,
  confidence: Confidence,
  asOf: string,
): Field<T> {
  return { value, confidence, asOf };
}

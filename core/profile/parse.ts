import type { Confidence, Field } from "../confidence.ts";
import type {
  FinancialConfidence,
  Goal,
  IncomeBand,
  Obligation,
  ObligationKind,
  SituationProfile,
} from "./types.ts";

/**
 * The gate between stored bytes and the engine.
 *
 * ── WHY A VERSION CHECK WAS NOT ENOUGH ────────────────────────────────────
 * Every store gated on `parsed.version === SCHEMA_VERSION` and then a
 * truthiness probe — `parsed.profile`, `parsed.account?.id` — and cast the
 * rest with `as`. A record carrying the right version and the wrong SHAPE
 * walked straight into the Waterfall, where a missing `liquidCents` is not a
 * crash but something worse: arithmetic on `undefined`, and a coach stating a
 * number with total confidence that means nothing.
 *
 * This is not hypothetical. Hand-writing a profile with `incomeBand:
 * "400k-plus"` — a plausible typo for the real `"over-400k"` — put the app
 * into its error boundary in one render. A half-finished migration does the
 * same thing to a real person, and the version number is no help precisely
 * because the version is the part that was right.
 *
 * ── ALL OR NOTHING, ON PURPOSE ────────────────────────────────────────────
 * A partially valid profile is the dangerous case, not the safe one. Salvaging
 * eight of ten fields produces a read the engine is confident about and a
 * person cannot recognise; rejecting the record routes to onboarding, which is
 * the same harmless direction the stores already take when JSON.parse throws.
 * Ten answers is ninety seconds. A wrong read is a lost reader.
 *
 * ── HAND-WRITTEN, LIKE EVERY OTHER BOUNDARY HERE ──────────────────────────
 * `core/` is deliberately dependency-free (CLAUDE.md), so this is the same
 * shape as `core/coach/parse-intent.ts`: narrow `unknown` step by step, return
 * `null` on the first thing that does not hold. No schema library, no
 * reflection, and it runs under Node with no transpiler.
 */

/* ── Primitives ─────────────────────────────────────────────────────────── */

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/**
 * A finite number, and NOT `NaN`.
 *
 * `typeof NaN === "number"`, so the obvious check admits the one value that
 * poisons every figure downstream — and `NaN` is exactly what a bad
 * `JSON.parse` round-trip or a hand-edited record tends to produce.
 */
function isNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

/** Money and durations are counts of a unit; a fraction of a cent is a bug. */
function isWholeAtLeastZero(value: unknown): value is number {
  return isNumber(value) && Number.isInteger(value) && value >= 0;
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.length > 0;
}

/** An ISO timestamp `Date` can actually read — `asOf` drives freshness. */
function isIsoDate(value: unknown): value is string {
  return (
    typeof value === "string" &&
    value.length > 0 &&
    Number.isFinite(new Date(value).getTime())
  );
}

const CONFIDENCES: readonly string[] = ["stated", "inferred", "assumed"];
const INCOME_BANDS: readonly string[] = [
  "under-100k",
  "100k-200k",
  "200k-400k",
  "over-400k",
];
const FINANCIAL_CONFIDENCES: readonly string[] = [
  "lost",
  "unsure",
  "mostly-ok",
  "confident",
];
const OBLIGATION_KINDS: readonly string[] = [
  "student",
  "auto",
  "card",
  "mortgage",
  "other",
];

function oneOf<T extends string>(
  value: unknown,
  allowed: readonly string[],
): value is T {
  return typeof value === "string" && allowed.includes(value);
}

/* ── Field<T> ───────────────────────────────────────────────────────────── */

/**
 * Unwraps a `Field`, checking the envelope AND the value inside it.
 *
 * The envelope matters as much as the payload: a field with a valid value and
 * an unreadable `asOf` breaks freshness (which now decides when the coach
 * re-asks) without breaking any arithmetic, so it would fail silently and
 * late.
 */
function field<T>(
  raw: unknown,
  valid: (value: unknown) => value is T,
): Field<T> | null {
  if (!isRecord(raw)) return null;
  if (!valid(raw.value)) return null;
  if (!oneOf<Confidence>(raw.confidence, CONFIDENCES)) return null;
  if (!isIsoDate(raw.asOf)) return null;
  return { value: raw.value, confidence: raw.confidence, asOf: raw.asOf };
}

/* ── Composites ─────────────────────────────────────────────────────────── */

function isObligation(value: unknown): value is Obligation {
  if (!isRecord(value)) return false;
  if (!oneOf<ObligationKind>(value.kind, OBLIGATION_KINDS)) return false;
  if (!isWholeAtLeastZero(value.balanceCents)) return false;
  // A rate may be 0 (an interest-free plan) but never negative, and a
  // four-digit-plus basis-point rate above 100% is a corrupt record.
  if (!isWholeAtLeastZero(value.rateBps) || value.rateBps > 10_000) return false;
  return true;
}

function isObligationList(value: unknown): value is Obligation[] {
  return Array.isArray(value) && value.every(isObligation);
}

function isGoal(value: unknown): value is Goal {
  if (!isRecord(value)) return false;
  if (!isNonEmptyString(value.label)) return false;
  if (!isWholeAtLeastZero(value.targetCents)) return false;
  if (!isWholeAtLeastZero(value.savedCents)) return false;
  // Zero months would divide by zero in `monthlyNeed`.
  if (!isWholeAtLeastZero(value.withinMonths) || value.withinMonths < 1)
    return false;
  return true;
}

/* ── The profile ────────────────────────────────────────────────────────── */

/**
 * A `SituationProfile`, or `null` if the record cannot be trusted whole.
 *
 * `null` means "there is no profile here", which every caller already handles
 * — it is the state a first-time visitor is in.
 */
export function parseProfile(raw: unknown): SituationProfile | null {
  if (!isRecord(raw)) return null;

  const openingConcern = field<string>(
    raw.openingConcern,
    (v): v is string => typeof v === "string",
  );
  const incomeBand = field<IncomeBand>(raw.incomeBand, (v): v is IncomeBand =>
    oneOf<IncomeBand>(v, INCOME_BANDS),
  );
  const liquidCents = field<number>(raw.liquidCents, isWholeAtLeastZero);
  const monthlyOutCents = field<number>(raw.monthlyOutCents, isWholeAtLeastZero);
  const obligations = field<Obligation[]>(raw.obligations, isObligationList);
  const dependents = field<number>(raw.dependents, isWholeAtLeastZero);
  const retirementBps = field<number>(
    raw.retirementBps,
    (v): v is number => isWholeAtLeastZero(v) && v <= 10_000,
  );
  const employerMatchBps = field<number>(
    raw.employerMatchBps,
    (v): v is number => isWholeAtLeastZero(v) && v <= 10_000,
  );
  const horizonMonths = field<number>(raw.horizonMonths, isWholeAtLeastZero);
  const financialConfidence = field<FinancialConfidence>(
    raw.financialConfidence,
    (v): v is FinancialConfidence =>
      oneOf<FinancialConfidence>(v, FINANCIAL_CONFIDENCES),
  );

  if (
    !openingConcern ||
    !incomeBand ||
    !liquidCents ||
    !monthlyOutCents ||
    !obligations ||
    !dependents ||
    !retirementBps ||
    !employerMatchBps ||
    !horizonMonths ||
    !financialConfidence
  ) {
    return null;
  }

  const profile: SituationProfile = {
    openingConcern,
    incomeBand,
    liquidCents,
    monthlyOutCents,
    obligations,
    dependents,
    retirementBps,
    employerMatchBps,
    horizonMonths,
    financialConfidence,
  };

  /**
   * Goals are OPTIONAL and absent until the first one is named — never `[]`
   * (see the note on the type). So a missing key is valid and an unreadable
   * one is not: a corrupt goal would otherwise compete for the surplus with a
   * target nobody set.
   */
  if (raw.goals !== undefined) {
    if (!Array.isArray(raw.goals)) return null;
    const goals: Field<Goal>[] = [];
    for (const entry of raw.goals) {
      const parsed = field<Goal>(entry, isGoal);
      if (!parsed) return null;
      goals.push(parsed);
    }
    if (goals.length > 0) profile.goals = goals;
  }

  return profile;
}

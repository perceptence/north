import type { Decision } from "./types.ts";

/**
 * The ledger as a run of months — including the ones nothing happened in.
 *
 * ── WHY EMPTY MONTHS ARE THE WHOLE POINT ──────────────────────────────────
 * A list grouped by month is not a timeline. A timeline's job is to show
 * INTERVAL — that these things happened close together, and those ones did
 * not — and a grouped list throws that away: three decisions in one week and
 * three across a year render identically.
 *
 * So the run is CONTINUOUS. Every month between the first decision and the
 * last gets a place, and a month with nothing in it says so. That does three
 * things at once: a busy month reads as a cluster, a quiet stretch reads as
 * quiet, and the gap is visibly a real gap rather than missing data.
 *
 * It also happens to be the honest shape for this product. North already
 * tells you a stretch where nothing moved is "a perfectly good one"
 * (the story's too-early state); a ledger that hides its quiet months would
 * be arguing the opposite.
 *
 * Newest first, because a record is read from now backwards.
 */

export interface LedgerMonth {
  /** Stable key: "2026-07". */
  key: string;
  /** "July" — the year is carried by the group, not repeated per month. */
  month: string;
  year: number;
  /** Newest first within the month. Empty for a quiet month. */
  decisions: Decision[];
}

const MONTH_NAMES = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

const key = (year: number, monthIndex: number) =>
  `${year}-${String(monthIndex + 1).padStart(2, "0")}`;

/**
 * @param decisions any order; only settled ones belong here (an open
 *                  commitment is pinned above the record, not filed in it)
 * @param now       the newest edge of the run, so a record that ends months
 *                  ago still shows the silence since
 */
export function ledgerMonths(
  decisions: Decision[],
  now: Date,
): LedgerMonth[] {
  if (decisions.length === 0) return [];

  const dated = [...decisions].sort((a, b) =>
    b.decidedAt.localeCompare(a.decidedAt),
  );

  const oldest = new Date(dated[dated.length - 1].decidedAt);
  // The run ends at the more recent of "now" and the newest decision — a
  // clock that has moved on should show the quiet since, and a decision dated
  // ahead of `now` (a seeded demo, a clock skew) must never be dropped.
  const newestDecision = new Date(dated[0].decidedAt);
  const end = newestDecision > now ? newestDecision : now;

  const months: LedgerMonth[] = [];
  let year = end.getFullYear();
  let month = end.getMonth();

  const oldestYear = oldest.getFullYear();
  const oldestMonth = oldest.getMonth();

  while (year > oldestYear || (year === oldestYear && month >= oldestMonth)) {
    const k = key(year, month);
    months.push({
      key: k,
      month: MONTH_NAMES[month],
      year,
      decisions: dated.filter((d) => {
        const at = new Date(d.decidedAt);
        return key(at.getFullYear(), at.getMonth()) === k;
      }),
    });

    month -= 1;
    if (month < 0) {
      month = 11;
      year -= 1;
    }
  }

  return months;
}

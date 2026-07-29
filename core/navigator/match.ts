import type { Scenario, ScenarioId } from "./types.ts";

/**
 * Routing a question in the user's own words to a scenario the engine can
 * actually answer.
 *
 * ── WHY THIS EXISTS ───────────────────────────────────────────────────────
 * A fixed list of five questions tells the user the product only thinks about
 * five things. They arrive with their own words — "should I quit and travel
 * for a year", "is it dumb to buy a place right now" — and a curated list
 * silently refuses them. That refusal reads as a product with no intelligence
 * in it, which is the opposite of true: the intelligence is the engine, and
 * the only thing missing was a door.
 *
 * ── WHY IT IS NOT A MODEL CALL ────────────────────────────────────────────
 * This ROUTES; it never answers. Whatever the user types, the answer is still
 * computed by the same seven rules that produce Today, so the product's
 * central promise holds: the engine never depends on a model call to produce
 * an answer (CLAUDE.md). Matching is deterministic keyword scoring, which
 * means it is testable, instant, works offline, and cannot hallucinate a
 * scenario that does not exist. A model could later replace this function's
 * body to widen recall — and the guarantee would still hold, because the
 * thing it returns is a scenario id, not a claim about someone's money.
 *
 * ── AND WHY IT MUST BE ABLE TO SAY NO ─────────────────────────────────────
 * `matchQuestion` returning nothing is a FEATURE. A coach that pretends every
 * question is one of its five is worse than one that names its limits.
 */

/**
 * Terms that indicate a scenario. Multi-word phrases score higher because
 * "pay cut" is decisive where "pay" alone is not.
 *
 * Deliberately data, like the Waterfall rules and the onboarding script —
 * widening what North understands is an edit here, never a code change.
 */
const TERMS: Record<ScenarioId, string[]> = {
  home: [
    "home",
    "house",
    "buy a place",
    "property",
    "mortgage",
    "deposit",
    "down payment",
    "flat",
    "apartment",
    "condo",
    "first home",
    "own place",
    "buying",
  ],
  "career-break": [
    "career break",
    "sabbatical",
    "quit",
    "resign",
    "time off",
    "take a break",
    "travel",
    "unpaid leave",
    "stop working",
    "step back",
    "year off",
    "maternity",
    "paternity",
    "parental leave",
    "go back to school",
    "study",
  ],
  "contribute-more": [
    "contribute",
    "save more",
    "put away",
    "put more",
    "invest more",
    "401k",
    "401(k)",
    "retirement",
    "pension",
    "ira",
    "increase",
    "more each month",
    "raise my",
    "saving more",
  ],
  "pay-cut": [
    "pay cut",
    "paycut",
    "lower salary",
    "less money",
    "earn less",
    "take less",
    "new job",
    "switch jobs",
    "change careers",
    "downshift",
    "part time",
    "part-time",
    "reduce my income",
  ],
  "debt-first": [
    "debt",
    "loan",
    "credit card",
    "pay off",
    "payoff",
    "clear my",
    "interest",
    "owe",
    "balance",
    "minimum payment",
    "student loan",
  ],
};

export interface QuestionMatch {
  scenario: Scenario;
  /** Higher is a better fit. Comparable only within one call. */
  score: number;
}

/** Lowercase, strip punctuation, collapse whitespace. */
function normalize(input: string): string {
  return input
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s()]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Rank the scenarios that could answer this question, best first.
 *
 * Returns an empty array when nothing matches — the caller is expected to say
 * so plainly rather than guessing. `available` is passed in (not read from the
 * full list) so a scenario hidden for this profile — the debt question for
 * someone with no debt — can never be offered.
 */
export function matchQuestion(
  question: string,
  available: Scenario[],
): QuestionMatch[] {
  const text = normalize(question);
  if (text.length < 3) return [];

  const matches: QuestionMatch[] = [];

  for (const scenario of available) {
    const terms = TERMS[scenario.id] ?? [];
    let score = 0;

    for (const term of terms) {
      if (!text.includes(term)) continue;
      // A phrase is decisive where a single word is suggestive; longer terms
      // also beat shorter ones that happen to be substrings of them.
      score += term.includes(" ") ? 3 : 1;
    }

    if (score > 0) matches.push({ scenario, score });
  }

  return matches.sort(
    (a, b) => b.score - a.score || a.scenario.id.localeCompare(b.scenario.id),
  );
}

/**
 * True when one scenario wins clearly enough to open it without asking.
 *
 * A near-tie must NOT auto-open: answering the wrong question confidently is
 * the failure mode that makes a router feel dumb.
 */
export function isDecisive(matches: QuestionMatch[]): boolean {
  if (matches.length === 0) return false;
  if (matches.length === 1) return true;
  return matches[0].score >= matches[1].score * 2;
}

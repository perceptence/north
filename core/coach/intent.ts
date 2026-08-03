import { isDecisive, matchQuestion } from "../navigator/match.ts";
import type { Scenario } from "../navigator/types.ts";
import type { Intent, IntentKind } from "./types.ts";

/**
 * THE ROUTER — the one seam a model would ever sit behind.
 *
 * ── WHY IT IS DETERMINISTIC TODAY ─────────────────────────────────────────
 * There is no model infrastructure in this project: no API route, no key,
 * nothing to call. More importantly, per CLAUDE.md the engine may never
 * depend on a model call to produce an answer — so the router is the ONLY
 * place a model could ever go, and even then it may only return an `Intent`
 * (see `./types.ts`). Keyword scoring is testable, instant, works offline,
 * and cannot invent a topic that does not exist.
 *
 * ── HOW TO SWAP IN A MODEL LATER ──────────────────────────────────────────
 * Replace this function's body. Nothing else changes: callers already treat
 * the return value as an opaque typed intent, `respond()` is pure, and
 * `matchQuestion` stays as the offline fallback exactly as docs/VOICE.md §5
 * describes. That is the whole reason the seam is one function.
 *
 * ── ORDER IS LOAD-BEARING ─────────────────────────────────────────────────
 * Control words win over topics ("stop" is never a question about goals), and
 * a decisive scenario match wins over topic keywords — "should I buy a house"
 * mentions no topic word but is unambiguously the home scenario. Topics are
 * checked last and only settle what a scenario did not claim.
 */

/**
 * Terms per intent, as data — the same shape `core/navigator/match.ts` uses,
 * and for the same reason: widening what the coach understands should be an
 * edit here, never a code change.
 *
 * Multi-word phrases score higher, because "how am i doing" is decisive where
 * "doing" alone is noise.
 */
const TERMS: Record<Exclude<IntentKind, "scenario" | "unknown">, string[]> = {
  stop: ["stop", "be quiet", "never mind", "nevermind", "cancel", "shut up", "enough"],
  repeat: [
    "say that again",
    "again",
    "repeat",
    "what did you say",
    "come again",
    "one more time",
  ],
  standing: [
    "how am i doing",
    "where do i stand",
    "how are things",
    "what should i do",
    "what do i do",
    "what now",
    "my situation",
    "how am i",
    "am i ok",
    "am i okay",
    "am i on track",
    "whats up",
    "what is up",
    "today",
    "right now",
  ],
  ladder: [
    "why that",
    "why this",
    "why is that",
    "whats next",
    "what is next",
    "what comes next",
    "the ladder",
    "rung",
    "priority",
    "order",
    "why are you asking",
    "after this",
  ],
  decisions: [
    "what have i decided",
    "what did i decide",
    "my decisions",
    "decisions",
    "my record",
    "what have i held",
    "held",
    "my history",
    "ledger",
    "commitments",
  ],
  goals: [
    "what am i working toward",
    "my goals",
    "goals",
    "goal",
    "working toward",
    "saving for",
    "my targets",
    "sabbatical",
    "deposit",
  ],
  changes: [
    "what changed",
    "whats changed",
    "what has changed",
    "what moved",
    "whats moved",
    "since we last",
    "whats new",
    "what is new",
    "lately",
    "recently",
    "catch me up",
  ],
  horizon: [
    "where am i heading",
    "where does this leave me",
    "retirement",
    "long term",
    "long run",
    "the horizon",
    "how much will i have",
    "what will i have",
    "in the end",
    "by the time",
  ],
};

/**
 * Lowercase, strip punctuation, collapse whitespace.
 *
 * Apostrophes are DELETED, not turned into spaces, so "what's next" collapses
 * to "whats next" and matches the term as written. Replacing them with a
 * space gives "what s next", which matches nothing — the same trap the
 * onboarding matcher hit, recorded here so the third matcher doesn't hit it
 * again. Both curly and straight forms, because dictation emits curly.
 */
function normalize(input: string): string {
  return input
    .toLowerCase()
    .replace(/['‘’]/g, "")
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/** Sum of matched term weights — phrases beat single words. */
function score(text: string, terms: string[]): number {
  let total = 0;
  for (const term of terms) {
    if (!text.includes(term)) continue;
    total += term.includes(" ") ? 3 : 1;
  }
  return total;
}

/**
 * Route a transcript to something the engine can answer.
 *
 * `available` is passed in rather than read from the full scenario list, so a
 * scenario hidden for this profile — the debt question for someone with no
 * debt — can never be routed to.
 *
 * Returns `{ kind: "unknown" }` freely. **A coach that pretends every
 * question is one of its topics is worse than one that names its limits**,
 * and the refusal is a real part of the product's posture
 * (docs/UX-ARCHITECTURE.md §4.5).
 */
export function routeIntent(transcript: string, available: Scenario[]): Intent {
  const text = normalize(transcript);
  if (text.length < 2) return { kind: "unknown" };

  // 1 · Control words. "stop" is never a question about anything.
  if (score(text, TERMS.stop) > 0) return { kind: "stop" };
  if (score(text, TERMS.repeat) > 0) return { kind: "repeat" };

  // 2 · A scenario, when one wins clearly. Deliberately reuses the Navigator's
  //     own matcher — one definition of what a scenario question sounds like.
  const scenarios = matchQuestion(transcript, available);
  const scenarioWon = scenarios.length > 0 && isDecisive(scenarios);

  // 3 · Topics.
  const topics = (
    ["standing", "ladder", "decisions", "goals", "horizon", "changes"] as const
  )
    .map((kind) => ({ kind, value: score(text, TERMS[kind]) }))
    .filter((t) => t.value > 0)
    .sort((a, b) => b.value - a.value || a.kind.localeCompare(b.kind));

  const topTopic = topics[0];

  // A decisive scenario beats a topic UNLESS the topic is a stronger, longer
  // phrase — "what am i working toward" mentions no scenario, but "should i
  // buy a house" mentions no topic, and both must land correctly.
  if (scenarioWon && (!topTopic || scenarios[0].score >= topTopic.value)) {
    return { kind: "scenario", id: scenarios[0].scenario.id };
  }

  if (topTopic) return { kind: topTopic.kind };

  // A scenario that matched but not decisively is still better than nothing —
  // the caller can ask which one was meant, exactly as the typed Navigator
  // already does.
  if (scenarios.length > 0) {
    return { kind: "scenario", id: scenarios[0].scenario.id };
  }

  return { kind: "unknown" };
}

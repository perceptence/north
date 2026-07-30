import type { Choice, ChoiceTurn } from "./script.ts";

/**
 * Routing a spoken answer to the choice it meant.
 *
 * ── WHY THIS IS NOT A MODEL CALL ───────────────────────────────────────────
 * Same reasoning as `core/navigator/match.ts`, and the same conclusion: this
 * ROUTES, it never decides anything about the user's money. Whatever gets
 * matched is recorded exactly as if it had been tapped — the same `Choice`,
 * the same confidence, the same downstream engine. Matching is deterministic
 * scoring, which means it is testable, instant, works offline, and cannot
 * hallucinate an option that isn't actually one of the four on screen. A
 * model could later replace this function's body to widen what it
 * understands, and the guarantee would still hold, because the thing it
 * returns is a `Choice` already present in `turn.options`, never a claim.
 *
 * (There is also, plainly, no hosted model wired into this project — no API
 * route, no key. A local matcher is not a placeholder for a future call; it
 * is the correct architecture for a money product regardless, per
 * docs/VOICE.md §2.1 — "the engine never depends on a model call to produce
 * an answer.")
 *
 * ── WHY IT MUST BE ABLE TO SAY NO ──────────────────────────────────────────
 * Guessing wrong and guessing confidently is worse than admitting it didn't
 * catch that — a coach that silently records the wrong income band has lied
 * about the user's own money on their behalf. So every score has to clear a
 * floor, AND beat the next-best option by a real margin, or this returns
 * `null` and the caller asks again.
 *
 * ── HOW A NUMBER IS COMPARED ───────────────────────────────────────────────
 * `choice.value` is already unit-converted for the engine (cents, basis
 * points) and that encoding differs per turn — comparing a spoken number
 * against it would require this module to know what turn it's looking at.
 * Instead, numbers are extracted from BOTH sides in their natural spoken
 * units — the transcript, and the option's own LABEL text ("About $20,000" →
 * 20000; "About 3%" → 3) — and compared directly. This makes the matcher
 * unit-agnostic and turn-agnostic: it never needs to learn a new turn's
 * encoding, because it never looks at `value` at all.
 */

export interface ChoiceMatch {
  choice: Choice;
  /** Higher is a better fit. Comparable only within one call. */
  score: number;
}

/** Below this, a score is noise — not enough signal to act on at all. */
const MIN_CONFIDENT_SCORE = 4;
/** The winner must clear the runner-up by this factor to avoid a coin-flip. */
const DECISIVE_MARGIN = 1.6;

/** Small connective words that carry no signal about WHICH option was meant. */
const STOPWORDS = new Set([
  "a",
  "an",
  "and",
  "or",
  "the",
  "is",
  "it",
  "im",
  "i",
  "id",
  "me",
  "my",
  "about",
  "roughly",
  "around",
  "just",
  "like",
  "um",
  "uh",
  "think",
  "would",
  "say",
  "maybe",
  "kind",
  "of",
  "so",
  "in",
  "on",
  "to",
  "that",
  "thats",
  "yeah",
  "yes",
  "well",
  "guess",
  "have",
  "has",
  "for",
]);

/** Lowercase, strip possessives and punctuation, collapse whitespace. */
function words(text: string): Set<string> {
  return new Set(
    text
      .toLowerCase()
      // Straight apostrophe plus the two curly variants (‘ ’), by
      // explicit escape — a literal character class here is one keystroke
      // from silently collapsing to duplicates of the same glyph.
      .replace(/['‘’]/g, "")
      .replace(/[^a-z0-9\s]/g, " ")
      .split(/\s+/)
      .filter((w) => w.length > 0 && !STOPWORDS.has(w)),
  );
}

const ONES: Record<string, number> = {
  zero: 0,
  no: 0,
  none: 0,
  nothing: 0,
  one: 1,
  two: 2,
  three: 3,
  four: 4,
  five: 5,
  six: 6,
  seven: 7,
  eight: 8,
  nine: 9,
  ten: 10,
  eleven: 11,
  twelve: 12,
  thirteen: 13,
  fourteen: 14,
  fifteen: 15,
  sixteen: 16,
  seventeen: 17,
  eighteen: 18,
  nineteen: 19,
  twenty: 20,
  thirty: 30,
  forty: 40,
  fifty: 50,
  sixty: 60,
  seventy: 70,
  eighty: 80,
  ninety: 90,
};

/**
 * The first number spoken or written, in NATURAL units — "20k", "$20,000"
 * and "twenty thousand" all read as 20000. Returns `null` rather than
 * guessing when nothing numeric is present, because not every answer has a
 * number ("Honestly, pretty lost" is a complete, correct answer with none).
 *
 * Digit form is tried first — dictation transcribes spoken numbers as digits
 * far more often than it spells them out, so this is the common path, not a
 * fallback. Word form covers the rest: "two hundred thousand" chains a group
 * (ones → an optional hundred) through a scale word (thousand/million); a
 * trailing unit word like "years" or "percent" is simply not recognized and
 * ignored, which is what makes "ten years" correctly read as 10.
 */
export function extractNumber(text: string): number | null {
  const cleaned = text.toLowerCase();

  const digitMatch = cleaned.match(
    /\$?\s*(\d[\d,]*\.?\d*)\s*(k|m|thousand|million)?/,
  );
  if (digitMatch) {
    const raw = Number.parseFloat(digitMatch[1].replace(/,/g, ""));
    if (!Number.isNaN(raw)) {
      const suffix = digitMatch[2];
      const mult =
        suffix === "k"
          ? 1_000
          : suffix === "m" || suffix === "million"
            ? 1_000_000
            : suffix === "thousand"
              ? 1_000
              : 1;
      return raw * mult;
    }
  }

  const tokens = cleaned.replace(/[^a-z\s]/g, " ").split(/\s+/).filter(Boolean);
  let group = 0;
  let total = 0;
  let sawAny = false;
  for (const token of tokens) {
    if (token in ONES) {
      group += ONES[token];
      sawAny = true;
    } else if (token === "hundred") {
      group = (group || 1) * 100;
      sawAny = true;
    } else if (token === "thousand" || token === "million") {
      total += (group || 1) * (token === "thousand" ? 1_000 : 1_000_000);
      group = 0;
      sawAny = true;
    }
  }
  if (!sawAny) return null;
  return total + group;
}

interface NumericSpec {
  low: number;
  high: number;
}

type BoundDirection = "over" | "under" | null;

/**
 * Does this text stake out one side of a boundary — "over", "under", or
 * neither? Shared between labels and transcripts, because the SAME check
 * has to run on both sides: a label's direction is what defines its range,
 * and a transcript's direction is a strong, explicit vote that deserves to
 * be trusted MORE than incidental word overlap (see the scoring bonus below,
 * and the comment on why it exists).
 *
 * "X or more" / "X or less" is a distinct, common construction from "more
 * than X" — "Three or more" means the bucket starts AT three, where "more
 * than three" would exclude it. Both count as the same direction here; nothing
 * downstream needs the inclusive/exclusive distinction at this granularity.
 */
function boundDirection(text: string): BoundDirection {
  const lower = text.toLowerCase();
  if (/\bunder\b|\bless than\b|\bbelow\b|\bor less\b|\bor fewer\b/.test(lower)) {
    return "under";
  }
  if (/\bover\b|\bmore than\b|\babove\b|\bor more\b|\bor greater\b/.test(lower)) {
    return "over";
  }
  return null;
}

/**
 * What a choice LABEL numerically means, if anything.
 *
 * "$100k – $200k" is a real closed range; "Under $100k" / "Over $400k" are
 * open-ended on one side; "About $20,000" is a point estimate, represented as
 * a zero-width range so containment and distance share one code path below.
 */
function labelRange(label: string): NumericSpec | null {
  const dashParts = label.split(/[–—-]/);
  if (dashParts.length === 2) {
    const low = extractNumber(dashParts[0]);
    const high = extractNumber(dashParts[1]);
    if (low !== null && high !== null) return { low, high };
  }

  const n = extractNumber(label);
  if (n === null) return null;
  const direction = boundDirection(label);
  if (direction === "under") return { low: -Infinity, high: n };
  if (direction === "over") return { low: n, high: Infinity };
  return { low: n, high: n };
}

/** How well a transcript's number fits a label's numeric meaning. */
function numericScore(transcriptNumber: number, spec: NumericSpec): number {
  if (transcriptNumber >= spec.low && transcriptNumber <= spec.high) {
    return 9;
  }
  const anchor = Number.isFinite(spec.low) ? spec.low : spec.high;
  if (!Number.isFinite(anchor) || anchor === 0) return 0;
  const relativeDistance = Math.abs(transcriptNumber - anchor) / anchor;
  if (relativeDistance <= 0.15) return 7;
  if (relativeDistance <= 0.35) return 4;
  if (relativeDistance <= 0.6) return 1;
  return 0;
}

/** Word-overlap score. A label whose every significant word showed up wins
 * decisively; a partial echo earns only weak, rarely-enough-alone credit. */
function phraseScore(transcriptWords: Set<string>, label: string): number {
  const labelWords = [...words(label)];
  if (labelWords.length === 0) return 0;
  const hits = labelWords.filter((w) => transcriptWords.has(w));
  if (hits.length === labelWords.length) {
    return 6 + labelWords.length;
  }
  return hits.length;
}

/**
 * Rank every option this turn offers against what was heard, best first.
 * Exported alongside `matchChoice` for the same reason `matchQuestion` is:
 * so a caller — or a test — can see the runner-up, not just the winner.
 */
export function rankChoices(turn: ChoiceTurn, transcript: string): ChoiceMatch[] {
  const transcriptWords = words(transcript);
  const transcriptNumber = extractNumber(transcript);
  const transcriptDirection = boundDirection(transcript);

  const ranked = turn.options.map((choice) => {
    let score = phraseScore(transcriptWords, choice.label);
    if (transcriptNumber !== null) {
      const spec = labelRange(choice.label);
      if (spec) score += numericScore(transcriptNumber, spec);
    }
    // An explicit "over"/"under" in what was SAID is a strong, deliberate
    // vote for whichever option opens the same way — and it has to be, because
    // two adjacent ranges sharing one boundary number ("…–$400k" next to
    // "Over $400k") both score a perfect numeric hit at that exact value.
    // Token overlap alone doesn't reliably break that tie: "Over $400k"
    // tokenizes to "400k" as one fused token, which a transcript saying
    // "400 thousand" as two separate words never matches. This bonus is a
    // direct check on the thing that actually disambiguates it.
    if (transcriptDirection !== null && transcriptDirection === boundDirection(choice.label)) {
      score += 6;
    }
    return { choice, score };
  });

  return ranked.sort((a, b) => b.score - a.score);
}

/**
 * The option this transcript meant, or `null` if nothing was confident and
 * clear enough to act on without asking again.
 */
export function matchChoice(turn: ChoiceTurn, transcript: string): Choice | null {
  const ranked = rankChoices(turn, transcript);
  if (ranked.length === 0) return null;

  const [best, runnerUp] = ranked;
  if (best.score < MIN_CONFIDENT_SCORE) return null;
  if (runnerUp && best.score < runnerUp.score * DECISIVE_MARGIN) return null;
  return best.choice;
}

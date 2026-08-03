import type { Confidence } from "../confidence.ts";
import type { FigureFormat } from "../money.ts";
import type { ReadSegment } from "../waterfall/types.ts";

/**
 * A read, said out loud.
 *
 * `ReadSegment[]` is written to be READ — "$1.2M", "4%", a dashed rule under
 * a figure North guessed at. None of that survives a speaker. This turns the
 * same segments the screens render into something a voice can say, and it
 * lives in `core/` with tests because the rules are product rules, not
 * rendering details (docs/VOICE.md §5.1).
 *
 * ── THE MODEL NEVER WRITES THIS ───────────────────────────────────────────
 * Every sentence North speaks is composed here, from segments the engine
 * produced. That is the load-bearing property of the whole voice plan
 * (docs/VOICE.md §2.1): a hallucinated number cannot be spoken, because no
 * model is ever handed the chance to produce one. This function is pure,
 * synchronous, and total.
 *
 * ── TWO REGISTERS, BECAUSE SPEECH IS A DISCLOSURE ─────────────────────────
 * North says things like "your $140,000 in cash is the problem". On a train
 * that is an exposure the user never agreed to, so the DEFAULT register
 * elides every figure and points at the screen instead (docs/VOICE.md §3.3).
 * The interpretation is the part worth hearing; the numbers were always
 * meant to be seen, along with the confidence marks that cannot survive
 * being spoken anyway.
 *
 * ── CONFIDENCE HAS TO SURVIVE THE CROSSING ────────────────────────────────
 * A figure North guessed at wears a dashed rule on screen. Spoken in the
 * full register it carries a hedge word instead — otherwise voice would
 * state assumptions with MORE certainty than text, which is the exact
 * inversion of this product's ethics.
 */

export type SpeechRegister = "discreet" | "full";

/**
 * What stands in for a figure when the register declines to say it.
 *
 * Chosen against the engine's actual copy rather than in the abstract: the
 * reads put figures in noun-phrase slots ("You have ⟨figure⟩ set aside",
 * "You're contributing ⟨figure⟩", "That gap is about ⟨figure⟩ a year"), and
 * these are the substitutions that stay grammatical across them. A per-figure
 * `label` was tried first and is worse — labels read "in cash", "of
 * outgoings", which duplicate the words that already follow the figure.
 */
const ELISION: Record<FigureFormat, string> = {
  currency: "that much",
  percent: "that much",
  duration: "that long",
  count: "that many",
};

/**
 * Said after a discreet reading, once, so the elisions have somewhere to
 * point. Without it the register is just vague; with it, it is deliberately
 * pointing at where the numbers live.
 */
const DISCREET_CODA = "The numbers are on screen.";

/** Hedges an `assumed` figure in the full register. `inferred` needs none —
 *  it is derived from figures the user themselves gave. */
const HEDGE: Record<Confidence, string> = {
  stated: "",
  inferred: "",
  assumed: "roughly ",
};

const ONES = [
  "zero", "one", "two", "three", "four", "five", "six", "seven", "eight",
  "nine", "ten", "eleven", "twelve", "thirteen", "fourteen", "fifteen",
  "sixteen", "seventeen", "eighteen", "nineteen",
];

const TENS = [
  "", "", "twenty", "thirty", "forty", "fifty", "sixty", "seventy", "eighty",
  "ninety",
];

const SCALES: ReadonlyArray<readonly [number, string]> = [
  [1_000_000_000, "billion"],
  [1_000_000, "million"],
  [1_000, "thousand"],
];

/**
 * A non-negative integer in words. "one hundred forty thousand".
 *
 * No "and" before the tens — American convention, matching the product's
 * `en-US` formatting everywhere else.
 */
export function numberToWords(value: number): string {
  if (!Number.isFinite(value)) return "";
  const n = Math.abs(Math.round(value));

  if (n < 20) return ONES[n];
  if (n < 100) {
    const tens = TENS[Math.floor(n / 10)];
    const rest = n % 10;
    return rest === 0 ? tens : `${tens}-${ONES[rest]}`;
  }
  if (n < 1000) {
    const hundreds = `${ONES[Math.floor(n / 100)]} hundred`;
    const rest = n % 100;
    return rest === 0 ? hundreds : `${hundreds} ${numberToWords(rest)}`;
  }

  for (const [size, name] of SCALES) {
    if (n >= size) {
      const whole = Math.floor(n / size);
      const rest = n % size;
      const head = `${numberToWords(whole)} ${name}`;
      return rest === 0 ? head : `${head} ${numberToWords(rest)}`;
    }
  }

  return String(n);
}

/** Digits after a decimal point, spoken one at a time: 25 → "two five". */
function decimalsToWords(fractional: string): string {
  return fractional
    .split("")
    .map((digit) => ONES[Number(digit)])
    .join(" ");
}

/** A number that may carry a decimal. 4.25 → "four point two five". */
function decimalToWords(value: number): string {
  const rounded = Math.round(value * 100) / 100;
  if (Number.isInteger(rounded)) return numberToWords(rounded);

  const [whole, fractional] = rounded.toFixed(2).replace(/0+$/, "").split(".");
  return `${numberToWords(Number(whole))} point ${decimalsToWords(fractional)}`;
}

/** Integer cents, spoken. Mirrors `formatCurrency`'s abbreviation rule. */
function currencyToWords(cents: number, abbreviate: boolean): string {
  const negative = cents < 0;
  const absolute = Math.abs(cents);
  const dollars = Math.round(absolute / 100);

  let body: string;
  if (abbreviate && absolute >= 100_000_000) {
    // ONE decimal, exactly as `formatCurrency` abbreviates it. The reader is
    // looking at "$1.5M" while hearing this, so speaking the unrounded 1.47
    // would have the eye and the ear disagreeing about the same figure —
    // which in a money product is the whole ballgame.
    const millions = Number((absolute / 100_000_000).toFixed(1));
    body = `${decimalToWords(millions)} million dollars`;
  } else if (dollars === 1) {
    body = "one dollar";
  } else {
    body = `${numberToWords(dollars)} dollars`;
  }

  return negative ? `minus ${body}` : body;
}

/** Basis points, spoken. 400 → "four percent", 425 → "four point two five percent". */
function percentToWords(basisPoints: number): string {
  return `${decimalToWords(basisPoints / 100)} percent`;
}

/** Whole months, spoken. Mirrors `formatMonths` — 24 becomes years, not months. */
function durationToWords(months: number): string {
  if (months === 0) return "zero months";
  if (months % 12 === 0) {
    const years = months / 12;
    return `${numberToWords(years)} ${years === 1 ? "year" : "years"}`;
  }
  return `${numberToWords(months)} ${months === 1 ? "month" : "months"}`;
}

/**
 * Words the copy already uses to hedge, so the spoken hedge doesn't double up.
 *
 * The engine writes "about ⟨figure⟩" and "roughly ⟨figure⟩" itself in several
 * rules. Adding the `assumed` hedge on top of those produced "about roughly
 * one thousand four hundred fifty dollars" — caught reading real engine
 * output aloud, not in a fixture. Two hedges do not make a figure twice as
 * uncertain; they make the coach sound unsure of its own sentence.
 */
const ALREADY_HEDGED = /\b(about|around|roughly|approximately|nearly|almost|up to)\s*$/i;

/**
 * The connector between the two ends of a range: "between X and Y", "X to Y".
 *
 * A range hedged at both ends — "between roughly X and roughly Y" — says the
 * same uncertainty twice, when the WIDTH of the range is already the product's
 * way of stating it (DESIGN-SYSTEM, HorizonBand: "the band's length IS the
 * uncertainty"). One hedge opens the range; the far end inherits it.
 */
const RANGE_CONNECTOR = /^\s*(and|to|[–—-])\s*$/i;

/** One figure segment, in the full register, with its hedge. */
function figureToWords(
  segment: Extract<ReadSegment, { kind: "figure" }>,
  precedingText: string,
  hedgeCarries: boolean,
): string {
  const hedge =
    hedgeCarries || ALREADY_HEDGED.test(precedingText)
      ? ""
      : HEDGE[segment.confidence];

  switch (segment.format) {
    case "currency":
      return hedge + currencyToWords(segment.value, segment.abbreviate ?? false);
    case "percent":
      return hedge + percentToWords(segment.value);
    case "duration":
      return hedge + durationToWords(segment.value);
    case "count":
      return hedge + numberToWords(segment.value);
  }
}

/**
 * Punctuation a speaker can hear.
 *
 * An em-dash is a real pause in the copy — the product writes them
 * deliberately — but a synthesiser either says nothing or says "dash". A
 * comma is the pause it was always standing for. Whitespace is collapsed
 * last so elisions never leave a double space behind.
 */
function forSpeaking(text: string): string {
  return text
    .replace(/\s*[—–]\s*/g, ", ")
    .replace(/\s+/g, " ")
    .replace(/\s+([.,;:!?])/g, "$1")
    // An elision can strand ", ," or ". ." against the copy's own punctuation.
    .replace(/,\s*,/g, ",")
    .replace(/\s*,\s*\./g, ".")
    .trim();
}

/**
 * The read, as one string ready for a speech synthesiser.
 *
 * Returns "" for an empty read rather than a placeholder sentence — a caller
 * with nothing to say should say nothing.
 */
export function spoken(
  segments: ReadSegment[],
  register: SpeechRegister,
): string {
  if (segments.length === 0) return "";

  /** True once a figure has been hedged, until the range it opened closes. */
  let hedgeCarries = false;

  const body = segments
    .map((segment, index) => {
      if (segment.kind === "text") {
        // A range connector keeps the previous hedge alive across it;
        // anything else ends its reach.
        if (!RANGE_CONNECTOR.test(segment.value)) hedgeCarries = false;
        return segment.value;
      }
      if (register !== "full") return ELISION[segment.format];

      // The hedge depends on what the copy just said, so a figure needs the
      // text immediately before it.
      const previous = segments[index - 1];
      const precedingText =
        previous && previous.kind === "text" ? previous.value : "";

      const said = figureToWords(segment, precedingText, hedgeCarries);
      hedgeCarries =
        hedgeCarries ||
        (HEDGE[segment.confidence] !== "" && !ALREADY_HEDGED.test(precedingText));
      return said;
    })
    .join("");

  const spokenBody = forSpeaking(body);
  if (spokenBody.length === 0) return "";

  // Only point at the screen when something was actually withheld. A read
  // with no figures in it says the same thing in both registers, and telling
  // someone to go look at numbers that were never elided is just noise.
  const elidedSomething =
    register === "discreet" && segments.some((s) => s.kind === "figure");

  if (!elidedSomething) return spokenBody;

  const separator = /[.!?]$/.test(spokenBody) ? " " : ". ";
  return `${spokenBody}${separator}${DISCREET_CODA}`;
}

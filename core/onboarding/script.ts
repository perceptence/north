import type { Confidence } from "../confidence.ts";

/**
 * The onboarding conversation, as DATA.
 *
 * Same principle as the Waterfall rules: the script is a declarative list, not
 * control flow. The screen renders whatever is here, so changing the
 * conversation never means touching a component.
 *
 * ── DESIGN NOTES ──────────────────────────────────────────────────────────
 *
 * EMOTIONAL FIRST, STRUCTURED AFTER. It opens with the question the user
 * arrived with, not the data the system needs, and works backward to the facts
 * (docs/UX-ARCHITECTURE.md §4.2).
 *
 * ONE FREE-TEXT FIELD, EVERYTHING ELSE SELECTED. Selection guarantees a valid
 * profile, is faster on mobile, and keeps the flow deterministic. Free text is
 * used exactly once, where the answer's CONTENT matters more than its
 * parseability — and it is never parsed, only reflected back.
 *
 * CONCRETE VALUES, NOT RANGES. A chip reading "About $8,000" is something the
 * user ASSERTED, so it lands as `stated`. Offering "$6,000–$10,000" and storing
 * the midpoint would be our assumption wearing the user's voice — and would
 * quietly degrade every downstream figure to `assumed`.
 *
 * "I DON'T KNOW" IS A FIRST-CLASS ANSWER. Those options carry
 * `confidence: "assumed"`, so not knowing something is captured honestly rather
 * than forced into a false certainty. It is also what later makes the
 * correction loop meaningful.
 */

export type TurnId =
  | "openingConcern"
  | "confidence"
  | "incomeBand"
  | "monthlyOut"
  | "liquid"
  | "expensiveDebt"
  | "debtBalance"
  | "dependents"
  | "retirement"
  | "employerMatch"
  | "horizon"
  | "name"
  | "consent"
  | "goalLabel"
  | "goalTarget"
  | "goalWhen"
  | "goalSaved";

/**
 * Which conversation a turn belongs to. Onboarding never asks about goals —
 * Day 0 is about who you are; where you're going is a conversation the Goals
 * surface starts when you're ready (docs/UX-ARCHITECTURE.md, the redesign).
 */
export type TurnStage = "onboarding" | "goal";

export type AnswerValue = string | number;

/**
 * A recorded answer.
 *
 * Confidence is captured AT THE MOMENT OF CHOICE rather than re-derived from
 * the value later. Two options can legitimately share a value — "Nothing yet"
 * and "I don't know" are both `0` for retirement — and they mean completely
 * different things. Looking confidence up by value silently collapses them and
 * turns an admitted unknown into a false certainty.
 */
export interface Answer {
  value: AnswerValue;
  confidence: Confidence;
}

export type Answers = Partial<Record<TurnId, Answer>>;

export interface Choice {
  label: string;
  value: AnswerValue;
  /** Defaults to `stated` — the user picked it. */
  confidence?: Confidence;
}

/** Records a chosen option, preserving whether the user actually knew. */
export function toAnswer(choice: Choice): Answer {
  return { value: choice.value, confidence: choice.confidence ?? "stated" };
}

/** Records a typed answer. Free text is always something the user stated. */
export function toTextAnswer(value: string): Answer {
  return { value, confidence: "stated" };
}

interface TurnBase {
  id: TurnId;
  /** Defaults to "onboarding". */
  stage?: TurnStage;
  question: string;
  /** One quiet clarifying line. Used sparingly. */
  note?: string;
  /** Progressive disclosure: the turn only appears when this holds. */
  showIf?: (answers: Answers) => boolean;
}

export interface TextTurn extends TurnBase {
  kind: "text";
  /**
   * May be declined. The screen offers a quiet skip that records an EMPTY
   * answer — an answer, so completeness still holds; empty, so the builder
   * knows nothing was said. Only the name asks for this: a coach accepts
   * "I'd rather not say", and a required name is a form's demand, not a
   * conversation's question.
   */
  optional?: boolean;
}

export interface ChoiceTurn extends TurnBase {
  kind: "choice";
  options: Choice[];
  /** Force a single column when labels run long. */
  block?: boolean;
}

/**
 * A statement to take in, not a question to answer — the coach setting its
 * own terms before the reveal. One action acknowledges it. It is still a
 * TURN, in the script with the rest, because the coach never breaks
 * character into system voice: the disclaimer is the coach stating its
 * boundary, in its own words, where the conversation already lives.
 */
export interface AcknowledgeTurn extends TurnBase {
  kind: "acknowledge";
  /** The terms, one per line, in the coach's voice. */
  statement: string[];
  /** What pressing the single action means. */
  action: string;
}

export type Turn = TextTurn | ChoiceTurn | AcknowledgeTurn;

const hasExpensiveDebt = (answers: Answers) =>
  answers.expensiveDebt !== undefined && answers.expensiveDebt.value !== "none";

export const SCRIPT: readonly Turn[] = [
  {
    id: "openingConcern",
    kind: "text",
    question: "What’s the money thing you keep meaning to deal with?",
    // The composer's hanging quote already frames the answer as speech, so
    // the note no longer has to disclaim anything — it just invites.
    note: "However you’d say it out loud.",
  },
  {
    id: "confidence",
    kind: "choice",
    question: "And how do you feel about money, day to day?",
    block: true,
    options: [
      { label: "Honestly, pretty lost", value: "lost" },
      { label: "I get by, but I’m unsure", value: "unsure" },
      { label: "Mostly fine", value: "mostly-ok" },
      { label: "I’ve got a handle on it", value: "confident" },
    ],
  },
  {
    id: "incomeBand",
    kind: "choice",
    question: "Roughly what does your household bring in?",
    block: true,
    options: [
      { label: "Under $100k", value: "under-100k" },
      { label: "$100k – $200k", value: "100k-200k" },
      { label: "$200k – $400k", value: "200k-400k" },
      { label: "Over $400k", value: "over-400k" },
    ],
  },
  {
    id: "monthlyOut",
    kind: "choice",
    question: "About how much goes out in a normal month?",
    note: "Everything — rent, bills, food, the lot.",
    options: [
      { label: "About $2,000", value: 200_000 },
      { label: "About $3,500", value: 350_000 },
      { label: "About $5,000", value: 500_000 },
      { label: "About $8,000", value: 800_000 },
      { label: "About $12,000", value: 1_200_000 },
      { label: "More than $15,000", value: 1_500_000 },
    ],
  },
  {
    id: "liquid",
    kind: "choice",
    question: "And how much is sitting in cash right now?",
    note: "Checking and savings. Not retirement accounts.",
    options: [
      { label: "Almost nothing", value: 50_000 },
      { label: "About $5,000", value: 500_000 },
      { label: "About $15,000", value: 1_500_000 },
      { label: "About $40,000", value: 4_000_000 },
      { label: "About $100,000", value: 10_000_000 },
      { label: "More than that", value: 20_000_000 },
    ],
  },
  {
    id: "expensiveDebt",
    kind: "choice",
    question: "Is anything charging you serious interest?",
    note: "Roughly 7% or more. A mortgage or a cheap car loan doesn’t count.",
    block: true,
    options: [
      { label: "No, nothing expensive", value: "none" },
      { label: "A credit card", value: "card" },
      { label: "Something else", value: "other" },
      { label: "I’m not sure", value: "unsure", confidence: "assumed" },
    ],
  },
  {
    id: "debtBalance",
    kind: "choice",
    question: "Roughly how much is on it?",
    showIf: hasExpensiveDebt,
    options: [
      { label: "About $2,000", value: 200_000 },
      { label: "About $8,000", value: 800_000 },
      { label: "About $20,000", value: 2_000_000 },
      { label: "More than $40,000", value: 4_000_000 },
    ],
  },
  {
    id: "dependents",
    kind: "choice",
    question: "Does anyone else depend on your income?",
    options: [
      { label: "No", value: 0 },
      { label: "One person", value: 1 },
      { label: "Two", value: 2 },
      { label: "Three or more", value: 3 },
    ],
  },
  {
    id: "retirement",
    kind: "choice",
    question: "How much of your pay goes to retirement?",
    block: true,
    options: [
      { label: "Nothing yet", value: 0 },
      { label: "About 3%", value: 300 },
      { label: "About 6%", value: 600 },
      { label: "10% or more", value: 1_000 },
      { label: "I max it out", value: 2_100 },
      { label: "I don’t know", value: 0, confidence: "assumed" },
    ],
  },
  {
    id: "employerMatch",
    kind: "choice",
    question: "Does your employer match any of it?",
    block: true,
    options: [
      { label: "No match", value: 0 },
      { label: "Up to 3%", value: 300 },
      { label: "Up to 4%", value: 400 },
      { label: "Up to 6%", value: 600 },
      { label: "I don’t know", value: 0, confidence: "assumed" },
    ],
  },
  {
    id: "horizon",
    kind: "choice",
    question: "How far ahead are you thinking?",
    block: true,
    options: [
      { label: "The next few years", value: 60 },
      { label: "About ten years", value: 120 },
      { label: "Twenty years or so", value: 240 },
      { label: "Retirement, whenever that is", value: 300 },
    ],
  },
  {
    id: "name",
    kind: "text",
    optional: true,
    question: "Nearly there. What should I call you?",
    note: "A first name is plenty — it’s only for addressing you.",
  },
  {
    /**
     * ── THE TERMS, LAST — BEFORE THE REVEAL ──────────────────────────────
     * The one legal-shaped moment in the product, said in the coach's own
     * voice at the moment it matters: after you've told it everything and
     * immediately before it tells you anything. A checkbox in a footer is
     * where consent goes to be ignored; a coach states its boundary out
     * loud and waits for a nod.
     */
    id: "consent",
    kind: "acknowledge",
    question: "Before I show you anything — how I work.",
    statement: [
      "I coach; I don’t advise. I’ll name what matters and show my working, but I won’t pick investments, and nothing here is investment advice.",
      "What I know is what you’ve told me. Every figure is a reading of that — ranges, not promises.",
      "And everything stays on this device. There’s no account and no server behind me.",
    ],
    action: "Understood",
  },
  {
    id: "goalLabel",
    stage: "goal",
    kind: "choice",
    question: "What are you working toward?",
    block: true,
    options: [
      { label: "A home deposit", value: "A home deposit" },
      { label: "A sabbatical", value: "A sabbatical" },
      { label: "A wedding", value: "A wedding" },
      { label: "Something of my own", value: "Something of my own" },
    ],
  },
  {
    id: "goalTarget",
    stage: "goal",
    kind: "choice",
    question: "Roughly how much does it take?",
    options: [
      { label: "About $20,000", value: 2_000_000 },
      { label: "About $50,000", value: 5_000_000 },
      { label: "About $80,000", value: 8_000_000 },
      { label: "About $150,000", value: 15_000_000 },
    ],
  },
  {
    id: "goalWhen",
    stage: "goal",
    kind: "choice",
    question: "And when would you like it to happen?",
    options: [
      { label: "In about 2 years", value: 24 },
      { label: "In about 3 years", value: 36 },
      { label: "In about 5 years", value: 60 },
      { label: "No date yet", value: 60, confidence: "assumed" },
    ],
  },
  {
    id: "goalSaved",
    stage: "goal",
    kind: "choice",
    question: "How much is already set aside for it?",
    options: [
      { label: "Nothing yet", value: 0 },
      { label: "About $5,000", value: 500_000 },
      { label: "About $15,000", value: 1_500_000 },
      { label: "About $40,000", value: 4_000_000 },
    ],
  },
] as const;

/** The turns of a stage that apply, given what has been answered so far. */
export function visibleTurns(
  answers: Answers,
  stage: TurnStage = "onboarding",
): Turn[] {
  return SCRIPT.filter(
    (turn) =>
      (turn.stage ?? "onboarding") === stage &&
      (!turn.showIf || turn.showIf(answers)),
  );
}

/**
 * How many questions the user is being asked, right now.
 *
 * Stated ONCE at the start rather than tracked by a persistent meter. A
 * progress bar reframes a conversation as work remaining, which is what makes
 * it a form (docs/UX-ARCHITECTURE.md §4.2) — but leaving someone unsure whether
 * there are five questions or fifty is its own anxiety. Saying the shape once
 * is the honest middle.
 */
export function expectedTurnCount(answers: Answers = {}): number {
  return visibleTurns(answers).length;
}

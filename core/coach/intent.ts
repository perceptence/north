import { isDecisive, matchQuestion } from "../navigator/match.ts";
import { CONTINUATIONS } from "./elaborate.ts";
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
 *
 * ── THE DEFAULT IS AN ANSWER, NOT A REFUSAL ───────────────────────────────
 * This router used to refuse anything it did not recognise, which made the
 * term lists carry an impossible job: they had to enumerate every way a
 * person might phrase a question, or the coach said "I can't". A survey of 29
 * unrehearsed phrasings refused 25 of them — "so where am I at", "am I
 * behind", "what's the damage" — every one of which the engine answers
 * perfectly well.
 *
 * The lists cannot win that race. **What CAN be enumerated is the small,
 * closed set of things North must refuse** — markets, securities, tickers,
 * crypto — because that set is defined by the product's scope rather than by
 * English. So the polarity is inverted: refuse on POSITIVE EVIDENCE of
 * out-of-scope, and otherwise answer. Anything that reads like a person
 * asking about their own money, and matches no topic, falls back to
 * `standing` — the coach's honest default, and a true answer composed from
 * the engine either way.
 *
 * The refusal is not weakened by this; it is made accurate. It still fires,
 * out loud, for exactly the questions docs/UX-ARCHITECTURE.md §4.5 says it
 * must — and no longer for the twenty ordinary ones standing next to them.
 */

/**
 * Terms per intent, as data — the same shape `core/navigator/match.ts` uses,
 * and for the same reason: widening what the coach understands should be an
 * edit here, never a code change.
 *
 * Multi-word phrases score higher, because "how am i doing" is decisive where
 * "doing" alone is noise.
 */
const TERMS: Record<
  Exclude<
    IntentKind,
    "scenario" | "unknown" | "stop" | "repeat" | "elaborate"
  >,
  string[]
> = {
  capabilities: [
    "what can you do",
    "what can i ask",
    "what do you know",
    "what should i ask",
    "how does this work",
    "how do you work",
    "what are you",
    "who are you",
    "what are my options",
    "my options",
    "help",
    "examples",
  ],
  standing: [
    "how am i doing",
    "how am i doing today",
    "where do i stand",
    "how are things",
    "how are things looking",
    "what should i do",
    "what do i do",
    "what should i focus on",
    "what should i work on",
    "what now",
    "my situation",
    "hows my money",
    "how is my money",
    "my money",
    "give me an update",
    "an update",
    "update me",
    "how am i",
    "am i ok",
    "am i okay",
    "am i alright",
    "am i fine",
    "am i doing well",
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
    "first",
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
    "what did i commit to",
    "what i committed",
    "my commitments",
    "what have i promised",
    "my track record",
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
    "anything new",
    "anything changed",
    "lately",
    "recently",
    "catch me up",
    "bring me up to speed",
  ],
  horizon: [
    "where am i heading",
    "where does this leave me",
    "retirement",
    "long term",
    "long run",
    "the horizon",
    "stop working",
    "when can i stop",
    "how much will i have",
    "what will i have",
    "where will i end up",
    "where does this end",
    "how much will i end up with",
    "in the end",
    "by the time",
  ],
};

/**
 * ── A COMMAND IS THE WHOLE UTTERANCE, NOT A WORD INSIDE ONE ───────────────
 *
 * Control words used to be scored like topics, with the same substring test.
 * That is wrong in a way that took a review running the real code to see: a
 * topic is a thing your sentence is ABOUT, so containing its words is
 * evidence; a command is a thing your sentence IS, so containing its words is
 * evidence of nothing.
 *
 * The bug it produced was as bad as this file gets. "enough" was a stop term,
 * matched as a substring, so **"is that enough?"** — the single most natural
 * follow-up to a figure the coach has just read aloud, and arguably the
 * question this whole product exists to answer — routed to `stop`. On the
 * typed surface the question vanished with no reply; in voice mode it called
 * `leave()` and closed the mode outright. A word-count guard did not help,
 * because the question is itself three words. "should i cancel" did the same,
 * and "against" contains "again" so it routed to `repeat`.
 *
 * So commands are now matched as EXACT utterances, after stripping the
 * politeness a person wraps around one. "Please stop talking now" is a
 * command; "is that enough" is a question that happens to share a word with
 * one. Nothing containing a command can be a command.
 */
const FILLER = new Set([
  "please", "ok", "okay", "north", "hey", "just", "now", "thanks",
  "alright", "right", "um", "uh", "er",
]);

const STOP_COMMANDS = new Set([
  "stop", "stop it", "stop talking", "stop reading", "stop speaking",
  "be quiet", "quiet", "silence",
  "never mind", "nevermind", "forget it", "leave it",
  "cancel", "shut up", "hush",
  "thats enough", "enough of that", "that will do",
]);

const REPEAT_COMMANDS = new Set([
  "again", "say that again", "say it again", "repeat", "repeat that",
  "what did you say", "come again", "one more time", "sorry what", "pardon",
  "i missed that", "didnt catch that",
]);

/**
 * The command this utterance IS, or null because it is a question.
 *
 * Checked both as spoken and with the filler removed, so "stop" and "please
 * stop now" are the same command and "is that enough" is neither.
 */
/** The utterance without the politeness wrapped around it. */
function stripFiller(text: string): string {
  return text
    .split(" ")
    .filter((word) => !FILLER.has(word))
    .join(" ");
}

function command(text: string): "stop" | "repeat" | null {
  const stripped = stripFiller(text);

  for (const candidate of [text, stripped]) {
    if (STOP_COMMANDS.has(candidate)) return "stop";
    if (REPEAT_COMMANDS.has(candidate)) return "repeat";
  }
  return null;
}

/**
 * The only list that has to be complete — and the only one that CAN be.
 *
 * These are the subjects North refuses, and the set is closed because it is
 * defined by the product's scope (docs/FOUNDATION.md §9: coaching, never
 * investment advice), not by how people phrase things. A person can ask "how
 * am I doing" in five hundred ways; there is only one way to be asking about
 * a ticker.
 *
 * Deliberately narrow in one direction: no "interest rates", no "inflation",
 * no "the fed" — those act ON the user's situation, which the engine reasons
 * about, and refusing them would be refusing the product.
 *
 * ── SUBJECTS ONLY. NEVER PHRASINGS. ───────────────────────────────────────
 * The first version broke this rule and was wrong in both directions at once,
 * which a review caught by running the code rather than reading it:
 *
 *   TOO NARROW — it had "the market" but not bare "markets", no `invest`
 *     vocabulary at all, and only two issuer names. So "how are markets doing
 *     today", "what's a good investment right now", "how should I invest my
 *     savings" and "should I buy apple" all escaped the refusal and were
 *     answered with a full reading of the user's own finances. Truthful, and
 *     an answer to a question nobody asked.
 *
 *   TOO BROAD — it also contained "options", "shares", "what do you think of"
 *     and "should i invest in", none of which name a subject. "options" is
 *     ALSO a `capabilities` term nine lines up, and since the refusal is
 *     checked first, "what are my options?" — the product's own help question,
 *     which the refusal copy explicitly invites — was answered with the
 *     investment-advice refusal.
 *
 * The rule that keeps this honest: **every entry must name a thing, not a way
 * of asking.** "should i invest in my 401k" is a contribution question this
 * engine answers; "how should I invest my savings" is asset allocation, which
 * it must not. The difference is the object, so that is what is listed.
 */
const OUT_OF_SCOPE = [
  // Instruments and asset classes.
  "stock", "stocks", "share price", "ticker", "tickers", "equities",
  "etf", "etfs", "index fund", "index funds", "mutual fund", "mutual funds",
  "hedge fund", "which fund", "what fund",
  "bonds", "commodities", "derivatives", "futures", "forex", "gold", "silver",
  // Crypto.
  "bitcoin", "crypto", "cryptocurrency", "ethereum", "solana", "nft",
  // Markets and indices. Bare "market"/"markets" as well as the determined
  // forms — their absence is what let "are markets up" through.
  "market", "markets", "stock market", "nasdaq", "dow", "dow jones",
  // Both renderings of S&P: `normalize` turns the ampersand into a space, but
  // DICTATION writes it out as a word — "how's the S and P 500 doing" was the
  // one markets question that still escaped after the first repair.
  "s p", "s p 500", "s and p", "s and p 500", "sp 500", "sp500",
  "ftse", "nifty", "sensex",
  // Named issuers. Not a registry — the shape of the question. A coach asked
  // about a specific company is being asked to pick a security whichever
  // company it is.
  "nvidia", "tesla", "apple", "amazon", "google", "microsoft", "netflix",
  // Allocation and picking, named as the SUBJECT rather than as an opener.
  // "invest my"/"invest it", never bare "invest in" — the latter refuses
  // "should I invest in my 401k", which is the contribute-more scenario.
  "invest my", "investing my", "invest it", "invest that",
  "how to invest", "where to invest", "what to invest",
  "good investment", "best investment", "investment advice", "investments",
  "asset allocation", "portfolio", "my returns", "rate of return",
  // Timing and picking.
  "day trading", "time the market", "buy the dip", "p e ratio", "valuation",
];

/**
 * Words that mark an utterance as a person asking about themselves.
 *
 * Not a topic list and never scored — the ONLY job is to tell a question
 * apart from noise, so "so where am I at" gets an answer and "asdfgh qwerty"
 * gets the honest "I didn't follow". Question words and first-person markers
 * are all that takes, and both are closed sets in English.
 */
const ASKING = new Set([
  // Question words, straight and contracted — the apostrophe is stripped by
  // `normalize`, so both forms have to be listed or "where's" reads as a word
  // the set has never seen.
  "what", "whats", "how", "hows", "when", "whens", "where", "wheres",
  "why", "whys", "which", "who", "whos",
  "should", "shall", "can", "could", "would", "will", "do", "does", "did",
  "is", "are", "am", "was", "were", "have", "has", "any", "anything",
  // First person — an utterance about themselves is a question for the coach
  // whether or not it is shaped like one ("I'm worried about money").
  "i", "im", "ive", "id", "me", "my", "mine", "we", "our", "us",
  // Addressed to someone.
  "tell", "give", "show", "explain", "help", "need", "want",
]);

/** True if `term` appears in `text` as whole words, never mid-word. */
function hasTerm(text: string, term: string): boolean {
  const at = ` ${text} `.indexOf(` ${term} `);
  return at !== -1;
}

/**
 * Is this a subject North refuses, on the evidence?
 *
 * Exported because the refusal must be decidable WITHOUT the model. When
 * routing runs behind a network call (`lib/route-intent.ts`), this is checked
 * first and a match short-circuits — so a markets question is never sent
 * anywhere, and no model is ever in a position to be talked into answering
 * one. A model asked nicely to refuse investment advice is not a control; a
 * request that is never made is.
 */
export function outOfScope(transcript: string): boolean {
  const text = normalize(transcript);
  return OUT_OF_SCOPE.some((term) => hasTerm(text, term));
}

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

/**
 * How well a query matches one intent's terms.
 *
 * TWO passes, because exact substring alone was refusing 41% of perfectly
 * ordinary questions. "am I doing ok" does not CONTAIN "am i ok", so it
 * scored zero against `standing` and fell through to the refusal — the worst
 * possible answer to a question the engine answers perfectly well.
 *
 *   · Exact phrase — the strong signal. A phrase beats a word, because "how
 *     am i doing" is decisive where "doing" alone is noise.
 *   · Loose — EVERY word of a multi-word term present somewhere in the
 *     query, in any order. Catches re-orderings and interjected filler
 *     ("am I doing ok", "how are things looking") at a lower weight, so it
 *     never outranks a real phrase hit.
 *
 * ── WHY EVERY WORD, RATHER THAN THE INTERESTING ONES ──────────────────────
 * The first attempt dropped stopwords first and required the remainder. That
 * was much worse than the bug it fixed: with "what", "do", "i" and "my"
 * removed, most terms collapsed to ONE content word, so "should I buy
 * nvidia" satisfied "what should i do" on the strength of "should" alone —
 * and North confidently answered a markets question it must refuse.
 *
 * Requiring the whole term keeps the loose pass honest: it forgives ORDER
 * and EXTRA words, never missing ones. "am I doing ok" ⊇ {am, i, ok} passes;
 * "should I buy nvidia" ⊉ {what, should, i, do} does not.
 */
function score(text: string, terms: string[]): number {
  const queryWords = new Set(text.split(" "));
  let total = 0;

  for (const term of terms) {
    if (text.includes(term)) {
      total += term.includes(" ") ? 3 : 1;
      continue;
    }

    // Single words are already settled by the exact pass — a lone word
    // either appears or it does not, and testing it loosely is the same
    // test twice.
    // Three DISTINCT words minimum. Two-word terms are made of the
    // commonest words in the language, so loose-matching them means
    // matching almost any sentence — and the exact pass already covers
    // them.
    const words = new Set(term.split(" "));
    if (words.size < 3) continue;
    if ([...words].every((w) => queryWords.has(w))) total += 2;
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
 * Returns `{ kind: "unknown" }` on evidence, not on absence. **A coach that
 * pretends every question is one of its topics is worse than one that names
 * its limits** (docs/UX-ARCHITECTURE.md §4.5) — but a coach that refuses
 * every question it did not anticipate is worse than both, and that is what
 * the previous default made this. See the header note.
 */
export function routeIntent(
  transcript: string,
  available: Scenario[],
  /**
   * What was answered immediately before, if anything.
   *
   * Only continuations need it, and they need it absolutely: "why" is a
   * question about the previous answer or it is nothing at all. Optional so
   * every existing caller and test keeps working unchanged — without it the
   * router behaves exactly as it did, which is also the correct behaviour on
   * the first turn.
   */
  last?: Intent | null,
): Intent {
  const text = normalize(transcript);
  if (text.length < 2) return { kind: "unknown" };

  const words = text.split(" ");

  // 1 · Commands, matched as the WHOLE utterance. See `command()` for why
  //     containment is the wrong test here — "is that enough" and "when can I
  //     stop working" are questions, not instructions to go quiet.
  const control = command(text);
  if (control) return { kind: control };

  // 2 · A continuation — but only when there is something to continue. Also
  //     whole-utterance, for the same reason commands are: these are built
  //     from the commonest words in English, and "why" matching inside "why
  //     is my buffer short" would swallow the question.
  //
  //     Elaborating an elaboration walks back to what was originally asked,
  //     so "why" then "tell me more" both deepen the same answer instead of
  //     recursing into nothing.
  if (last && last.kind !== "unknown" && CONTINUATIONS.has(stripFiller(text))) {
    // Continuing an elaboration goes DEEPER on the same subject rather than
    // restarting it — asking "why" and then "tell me more" must not land on
    // the same layer twice.
    if (last.kind === "elaborate") {
      return { kind: "elaborate", of: last.of, depth: last.depth + 1 };
    }
    return { kind: "elaborate", of: last.kind, depth: 1 };
  }

  // 3 · The refusal, on positive evidence — BEFORE any matching, so a
  //     markets question can never be talked into a topic by the words
  //     standing around it ("should I buy nvidia" shares three words with
  //     "what should I do").
  if (OUT_OF_SCOPE.some((term) => hasTerm(text, term))) return { kind: "unknown" };

  // 4 · A scenario, when one wins clearly. Deliberately reuses the Navigator's
  //     own matcher — one definition of what a scenario question sounds like.
  const scenarios = matchQuestion(transcript, available);
  const scenarioWon = scenarios.length > 0 && isDecisive(scenarios);

  // 5 · Topics. `capabilities` sits here rather than with the control words
  //     because "what can you do" is a real question, not a command — but it
  //     must be able to beat a scenario, or "what can I ask about a house"
  //     opens the house scenario instead of explaining itself.
  const topics = (
    [
      "capabilities",
      "standing",
      "ladder",
      "decisions",
      "goals",
      "horizon",
      "changes",
    ] as const
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

  // 6 · Nothing matched, and nothing said this was out of scope. So it is a
  //     question about this person's money phrased in a way no list
  //     anticipated — which is the normal case, not the exception.
  //
  //     `standing` is the right default because it is the answer to the
  //     question behind almost every vague one: "am I behind", "what's the
  //     damage", "should I be worried", "give it to me straight" are all
  //     asking where they stand. And it is composed from the engine like
  //     every other answer, so the worst case is a true reading of something
  //     adjacent to what was asked — a coach reframing, not a coach refusing.
  if (words.some((word) => ASKING.has(word))) {
    return { kind: "standing" };
  }

  // Not a question and not about them. Silence, a misfire of the microphone,
  // or a sentence meant for someone else in the room.
  return { kind: "unknown" };
}

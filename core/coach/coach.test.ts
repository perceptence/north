import { describe, it } from "node:test";
import assert from "node:assert/strict";

import { outOfScope, routeIntent } from "./intent.ts";
import { parseIntent } from "./parse-intent.ts";
import { respond } from "./respond.ts";
import {
  FIXTURE_ASOF,
  FIXTURE_NOW,
  SQUEEZED,
  UNADVISED_EARNER,
} from "../../data/fixtures/personas.ts";
import {
  SCENARIOS as ALL_SCENARIOS,
  availableScenarios,
} from "../navigator/scenarios.ts";
import { ILLUSTRATIVE_LIMITS } from "../waterfall/limits.ts";
import type { Field } from "../confidence.ts";
import type { SituationProfile } from "../profile/types.ts";
import type { Decision } from "../decisions/types.ts";

const stated = <T>(value: T): Field<T> => ({
  value,
  confidence: "stated",
  asOf: FIXTURE_ASOF,
});

/**
 * The hero persona, plus a named goal — so `goals` and `horizon` have
 * something real to answer with. Built on the same fixtures the engine's own
 * tests use, rather than a hand-rolled profile that drifts from the real
 * shape (the first version of this file did exactly that, and `derive`
 * rejected it).
 */
const PROFILE: SituationProfile = {
  ...UNADVISED_EARNER,
  goals: [
    // `savedCents` is REQUIRED, and omitting it is silent: `planGoals` does
    // `targetCents - savedCents`, so the whole pacing sentence came out as
    // "a sabbatical asks about dollars a month; about dollars of that isn't
    // there yet" — NaN all the way through to two figures with a null value.
    // The `as SituationProfile` cast below is what hid it from the compiler,
    // and the assertion was only `segments.length > 0`, which NaN satisfies.
    stated({
      label: "a sabbatical",
      targetCents: 4_000_000,
      withinMonths: 24,
      savedCents: 500_000,
    }),
  ],
} as SituationProfile;

const OPTIONS = { limits: ILLUSTRATIVE_LIMITS, now: FIXTURE_NOW };
const SCENARIOS = availableScenarios(PROFILE);

const DECISIONS: Decision[] = [
  {
    id: "d1",
    rungId: "liquidity",
    summary: "Build the buffer first",
    outcome: "held",
    decidedAt: "2026-06-25T00:00:00.000Z",
  } as Decision,
];

const route = (q: string) => routeIntent(q, SCENARIOS);

describe("routeIntent — control words win", () => {
  it("routes stop before anything else", () => {
    assert.equal(route("stop").kind, "stop");
    assert.equal(route("never mind").kind, "stop");
  });

  it("takes a command wrapped in politeness", () => {
    for (const q of ["please stop", "ok stop now", "stop talking", "forget it"]) {
      assert.equal(route(q).kind, "stop", q);
    }
  });

  /**
   * The regression that mattered most in this file.
   *
   * Control words were scored by SUBSTRING, like topics. So "enough" matched
   * inside "is that enough?" — the most natural follow-up to a figure the
   * coach has just read aloud — and routed to `stop`: silence on the typed
   * surface, and `leave()` in voice mode, which closes the product. A
   * word-count guard did not save it, because the question is three words.
   *
   * A command is the whole utterance, never a word inside one. These are the
   * exact phrasings that broke, found by a review executing the router.
   */
  it("does not let a command eat a question that merely contains one", () => {
    for (const q of [
      "is it enough",
      "is that enough",
      "is this enough",
      "should i cancel",
      "do I have enough saved",
      "will it be enough",
      "am I saving enough",
      "what am I working against", // "again" lives inside "against"
    ]) {
      const kind = route(q).kind;
      assert.ok(kind !== "stop" && kind !== "repeat", `${q} → ${kind}`);
    }
    assert.equal(route("when can I stop working").kind, "horizon");
  });

  it("routes a request to repeat", () => {
    assert.equal(route("say that again").kind, "repeat");
    assert.equal(route("what did you say").kind, "repeat");
  });
});

describe("routeIntent — the topics a coach is actually asked", () => {
  const cases: Array<[string, string]> = [
    ["how am I doing", "standing"],
    ["where do I stand", "standing"],
    ["what should I do", "standing"],
    ["why that", "ladder"],
    ["what's next", "ladder"],
    ["what have I decided", "decisions"],
    ["what am I working toward", "goals"],
    ["where am I heading", "horizon"],
    ["how much will I have", "horizon"],
  ];

  for (const [question, kind] of cases) {
    it(`"${question}" → ${kind}`, () => {
      assert.equal(route(question).kind, kind);
    });
  }
});

describe("routeIntent — scenarios still route", () => {
  it("sends a house question to the home scenario", () => {
    const intent = route("should I buy a house");
    assert.equal(intent.kind, "scenario");
    assert.equal(intent.kind === "scenario" && intent.id, "home");
  });

  it("sends a debt question to the debt scenario, for someone who has debt", () => {
    // SQUEEZED, not the hero: the hero's only obligation is a 6.2% mortgage,
    // so the engine correctly does not offer them a high-interest-debt
    // scenario at all. Routing has to be tested against a profile the
    // scenario actually applies to.
    const intent = routeIntent(
      "should I clear my credit card first",
      availableScenarios(SQUEEZED),
    );
    assert.equal(intent.kind, "scenario");
    assert.equal(intent.kind === "scenario" && intent.id, "debt-first");
  });

  it("never routes to a scenario this profile cannot be asked", () => {
    const noDebt = { ...PROFILE, obligations: stated([]) } as SituationProfile;
    const intent = routeIntent(
      "should I pay off my credit card",
      availableScenarios(noDebt),
    );
    assert.notEqual(
      intent.kind === "scenario" ? intent.id : null,
      "debt-first",
    );
  });
});

/**
 * The regression guard that matters most.
 *
 * A survey of 31 ordinary phrasings once refused 12 of them — 41% of
 * answerable questions met "I can't reason about that honestly", including
 * every form of "what can you do". These are those phrasings. The suite is
 * asymmetric on purpose: it asserts the ANSWERABLE ones never fall to
 * `unknown`, and separately that the two genuinely un-answerable ones always
 * do. Widening the terms must never cost the refusal.
 */
describe("routeIntent — the phrasings people actually use", () => {
  const answerable = [
    "what can you do", "what can I ask", "help", "what do you know about me",
    "how am I doing", "am I doing ok", "am I doing alright",
    "how are things looking", "how's my money", "what's my situation",
    "give me an update", "what should I focus on", "what's the priority",
    "why that one", "what have I decided", "what did I commit to",
    "show me my record", "what am I saving for", "how are my goals",
    "am I on track for my goals", "how much will I have",
    "where will I end up", "what's changed", "anything new", "catch me up",
    "can I buy a house", "should I quit my job", "should I save more",
  ];

  for (const q of answerable) {
    it(`answers "${q}"`, () => {
      assert.notEqual(route(q).kind, "unknown", `refused: ${q}`);
    });
  }

  it("still refuses what it genuinely cannot reason about", () => {
    for (const q of ["should I buy nvidia", "what's bitcoin doing"]) {
      assert.equal(route(q).kind, "unknown", `should have refused: ${q}`);
    }
  });

  it("answers the first question anyone asks", () => {
    // This one was the whole reason for the sweep: a coach that refuses
    // "what can you do" has failed before the conversation starts.
    for (const q of ["what can you do", "what can I ask", "help"]) {
      assert.equal(route(q).kind, "capabilities", q);
    }
  });
});

/**
 * The guard on the DEFAULT, which is the thing that was actually broken.
 *
 * The list above is phrasings the terms were written against, so it could
 * only ever prove the terms match themselves. These 24 were written blind
 * against the lists as they then stood, and 25 of a 29-question survey
 * containing them met the refusal. That was never a coverage gap; it was the
 * polarity, refusing anything unrecognised.
 *
 * Two of them stopped being blind afterwards: "first" was added to the
 * `ladder` terms and "stop working" to `horizon` in the same repair, so those
 * two now match verbatim. They stay because they still guard the default —
 * but the honest claim for this block is "these were not written to fit the
 * lists", not "no list has since been fitted to them".
 *
 * None of these need to route to a PARTICULAR intent. The assertion is only
 * that a person asking about their own money gets an answer, because every
 * answer is composed from the engine and is therefore true whichever topic
 * it lands on.
 */
describe("routeIntent — phrasings nobody wrote a term for", () => {
  const unrehearsed = [
    "so where am I at", "give it to me straight", "talk to me about my money",
    "is my cash doing anything", "am I wasting money", "what's the damage",
    "tell me something useful", "what would you do in my shoes",
    "I'm worried about money", "should I be worried",
    "is there anything I'm missing", "what am I getting wrong",
    "how far off am I", "how long until I'm okay", "can I afford to relax",
    "am I behind", "what's my biggest problem", "where's the money going",
    "when can I stop working", "how did I do this month",
    "did I keep my promises", "what should I sort out first",
    "what's the one thing", "is the sabbatical realistic",
  ];

  for (const q of unrehearsed) {
    it(`answers "${q}"`, () => {
      assert.notEqual(route(q).kind, "unknown", `refused: ${q}`);
    });
  }
});

describe("routeIntent — it can say no", () => {
  it("refuses on evidence, across the whole out-of-scope set", () => {
    // The one list that has to be complete, and the one that can be. If a
    // widening ever costs one of these, the product has started answering
    // questions it is not allowed to answer (docs/FOUNDATION.md §9).
    for (const q of [
      "is the S&P overvalued",
      "which ETF should I pick",
      "how's the market doing",
      "should I hold bonds",
      "what about gold right now",
      "is now a good time to buy the dip",
      "should I invest in tesla",
    ]) {
      assert.equal(route(q).kind, "unknown", `should have refused: ${q}`);
    }
  });

  /**
   * The seven that ESCAPED, found by a review running the router rather than
   * reading it. Every one was answered with a full, truthful reading of the
   * user's own finances — an answer to a question nobody asked.
   *
   * The cause was a list that named determiners and openers instead of
   * subjects: it had "the market" but not bare "markets", no `invest`
   * vocabulary, and two issuer names.
   */
  it("refuses the markets questions that used to slip through", () => {
    for (const q of [
      "how are markets doing today",
      "are markets up",
      "what's a good investment right now",
      "how should I invest my savings",
      "is real estate a good investment",
      "should I buy apple",
      "how's the S and P 500 doing", // dictation writes the ampersand out
      "how's my portfolio doing",
    ]) {
      assert.equal(route(q).kind, "unknown", `escaped the refusal: ${q}`);
    }
  });

  /**
   * The other direction, and the more embarrassing one: the same list also
   * contained "options", "shares", "what do you think of" and "should i
   * invest in" — openers and ordinary words, not subjects. Since the refusal
   * is checked first, "what are my options?" — which the refusal copy itself
   * invites the user to ask — was answered with the investment-advice
   * refusal.
   */
  it("does not refuse in-scope questions that merely sound financial", () => {
    assert.equal(route("what are my options").kind, "capabilities");
    for (const q of [
      "should I invest in my 401k", // a contribution question, not allocation
      "what do you think of my situation",
      "should I put more away",
      "am I behind",
    ]) {
      assert.notEqual(route(q).kind, "unknown", `wrongly refused: ${q}`);
    }
  });

  it("refuses a markets question rather than guessing a topic", () => {
    assert.equal(route("should I buy nvidia stock").kind, "unknown");
    assert.equal(route("what do you think of bitcoin").kind, "unknown");
  });

  it("refuses noise", () => {
    assert.equal(route("").kind, "unknown");
    assert.equal(route("a").kind, "unknown");
    assert.equal(route("asdfgh qwerty").kind, "unknown");
  });
});

/**
 * The gate in front of the model router.
 *
 * `routeIntent` builds its own intents and cannot produce an invalid one. A
 * model can — and the safety argument for a talking North (docs/VOICE.md §5)
 * rests entirely on the shape of what comes back being narrow and CHECKED.
 * These are the ways a model gets it wrong.
 */
describe("parseIntent — nothing gets in unvalidated", () => {
  it("accepts a plain topic", () => {
    assert.deepEqual(parseIntent({ kind: "goals" }, ALL_SCENARIOS), {
      kind: "goals",
    });
  });

  it("accepts a scenario the caller offered", () => {
    assert.deepEqual(parseIntent({ kind: "scenario", id: "home" }, ALL_SCENARIOS), {
      kind: "scenario",
      id: "home",
    });
  });

  it("rejects a scenario this person was never offered", () => {
    // The rule that a hidden scenario can never be routed to has to survive
    // being decided somewhere outside this codebase. Someone with no debt
    // cannot be handed the debt question by a model that guessed.
    const noDebt = ALL_SCENARIOS.filter((s) => s.id !== "debt-first");
    assert.equal(parseIntent({ kind: "scenario", id: "debt-first" }, noDebt), null);
  });

  it("rejects a scenario with no id rather than downgrading it", () => {
    assert.equal(parseIntent({ kind: "scenario" }, ALL_SCENARIOS), null);
  });

  it("rejects an invented kind", () => {
    for (const value of [
      { kind: "advice" },
      { kind: "buy" },
      { kind: "" },
      { kind: 7 },
      { kind: null },
    ]) {
      assert.equal(parseIntent(value, ALL_SCENARIOS), null, JSON.stringify(value));
    }
  });

  it("rejects prose, which is the failure this seam exists to prevent", () => {
    // Split in two on purpose. The first version of this test asserted
    // `parsed === null || Object.keys(parsed).length === 1` across the whole
    // list, which is satisfied by ANY single-key object — so a parseIntent
    // that happily accepted a bare string would have passed it. A review
    // caught that; the assertion now says which outcome it expects.
    for (const value of [
      "standing",
      "You're doing fine.",
      { text: "You're doing fine." },
      null,
      undefined,
      [],
      42,
      true,
      { kind: ["standing"] },
    ]) {
      assert.equal(
        parseIntent(value, ALL_SCENARIOS),
        null,
        `should have been rejected outright: ${JSON.stringify(value)}`,
      );
    }

    // Prose riding ALONGSIDE a valid kind is dropped, not carried through.
    assert.deepEqual(
      parseIntent(
        { kind: "standing", extra: "and here is what I think" },
        ALL_SCENARIOS,
      ),
      { kind: "standing" },
    );
  });

  it("returns null, not unknown, when it cannot vouch for a response", () => {
    // Different facts. `unknown` means North understood and won't answer;
    // null means the response is unusable and the caller must fall back to
    // the local route rather than speak a refusal it never earned.
    assert.equal(parseIntent({ kind: "nonsense" }, ALL_SCENARIOS), null);
    assert.deepEqual(parseIntent({ kind: "unknown" }, ALL_SCENARIOS), {
      kind: "unknown",
    });
  });
});

describe("outOfScope — decidable without the model", () => {
  it("is true for exactly what the router refuses", () => {
    for (const q of ["should I buy nvidia", "which ETF", "how's the market"]) {
      assert.equal(outOfScope(q), true, q);
    }
  });

  it("is false for questions about this person's own money", () => {
    for (const q of ["am I behind", "how am I doing", "can I buy a house"]) {
      assert.equal(outOfScope(q), false, q);
    }
  });
});

describe("respond — every answer comes from the engine", () => {
  const ctx = { profile: PROFILE, decisions: DECISIONS, options: OPTIONS };

  it("answers standing with the current read", () => {
    const reply = respond({ kind: "standing" }, ctx);
    assert.ok(reply.segments.length > 0);
    // A real read carries figures — proof it came from `evaluate`, not prose.
    assert.ok(reply.segments.some((s) => s.kind === "figure"));
  });

  it("answers the ladder with a position", () => {
    const reply = respond({ kind: "ladder" }, ctx);
    assert.match(
      reply.segments.map((s) => (s.kind === "text" ? s.value : "")).join(""),
      /You're on \d of \d/,
    );
  });

  it("answers decisions from the ledger summary", () => {
    const reply = respond({ kind: "decisions" }, ctx);
    assert.ok(reply.segments.length > 0);
  });

  it("says so plainly when there is no record yet", () => {
    const reply = respond({ kind: "decisions" }, { ...ctx, decisions: [] });
    assert.match(
      reply.segments.map((s) => (s.kind === "text" ? s.value : "")).join(""),
      /Nothing on the record yet/,
    );
  });

  it("answers goals with each goal's pacing", () => {
    const reply = respond({ kind: "goals" }, ctx);
    assert.ok(reply.segments.length > 0);
    // A figure with a REAL value. `length > 0` alone passed for a fixture
    // whose arithmetic was NaN, and the coach said "asks about dollars a
    // month" out loud for as long as that was the only assertion.
    const figures = reply.segments.filter((s) => s.kind === "figure");
    assert.ok(figures.length > 0, "no figure in the pacing sentence");
    for (const figure of figures) {
      assert.ok(
        Number.isFinite(figure.value),
        `figure has no number: ${JSON.stringify(figure)}`,
      );
    }
  });

  it("answers horizon with the projection headline", () => {
    const reply = respond({ kind: "horizon" }, ctx);
    assert.ok(reply.segments.some((s) => s.kind === "figure"));
  });

  it("answers a scenario with the verdict AND its tradeoff", () => {
    const reply = respond({ kind: "scenario", id: "home" }, ctx);
    const said = reply.segments
      .map((s) => (s.kind === "text" ? s.value : ""))
      .join("");
    assert.ok(said.length > 20, said);
    // A recommendation without its cost is a sales pitch.
    assert.equal(reply.opens, "home");
  });

  it("refuses without inventing a figure", () => {
    const reply = respond({ kind: "unknown" }, ctx);
    assert.ok(reply.segments.every((s) => s.kind === "text"));
    assert.match(
      reply.segments.map((s) => (s.kind === "text" ? s.value : "")).join(""),
      /can't answer honestly/,
    );
  });

  it("returns nothing for control intents — the caller owns those", () => {
    assert.equal(respond({ kind: "repeat" }, ctx).segments.length, 0);
    assert.equal(respond({ kind: "stop" }, ctx).segments.length, 0);
  });

  it("is total — every intent kind returns without throwing", () => {
    const kinds = [
      { kind: "standing" },
      { kind: "ladder" },
      { kind: "decisions" },
      { kind: "goals" },
      { kind: "horizon" },
      { kind: "repeat" },
      { kind: "stop" },
      { kind: "unknown" },
      { kind: "scenario", id: "home" },
    ] as const;
    for (const intent of kinds) {
      assert.doesNotThrow(() => respond(intent, ctx));
    }
  });
});

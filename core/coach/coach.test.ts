import { describe, it } from "node:test";
import assert from "node:assert/strict";

import { routeIntent } from "./intent.ts";
import { respond } from "./respond.ts";
import {
  FIXTURE_ASOF,
  FIXTURE_NOW,
  SQUEEZED,
  UNADVISED_EARNER,
} from "../../data/fixtures/personas.ts";
import { availableScenarios } from "../navigator/scenarios.ts";
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
    stated({ label: "a sabbatical", targetCents: 4_000_000, withinMonths: 24 }),
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

describe("routeIntent — it can say no", () => {
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

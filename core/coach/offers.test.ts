import { describe, it } from "node:test";
import assert from "node:assert/strict";

import { offers } from "./offers.ts";
import { openingOffers, respond } from "./respond.ts";
import { routeIntent } from "./intent.ts";
import {
  FIXTURE_ASOF,
  FIXTURE_NOW,
  UNADVISED_EARNER,
} from "../../data/fixtures/personas.ts";
import { availableScenarios } from "../navigator/scenarios.ts";
import { ILLUSTRATIVE_LIMITS } from "../waterfall/limits.ts";
import type { Field } from "../confidence.ts";
import type { Decision } from "../decisions/types.ts";
import type { SituationProfile } from "../profile/types.ts";

const stated = <T>(value: T): Field<T> => ({
  value,
  confidence: "stated",
  asOf: FIXTURE_ASOF,
});

const WITH_GOAL = {
  ...UNADVISED_EARNER,
  goals: [
    stated({
      label: "a sabbatical",
      targetCents: 4_000_000,
      withinMonths: 24,
      savedCents: 500_000,
    }),
  ],
} as SituationProfile;

const DECISION: Decision = {
  id: "d1",
  rungId: "liquidity",
  summary: "Build the buffer first",
  outcome: "held",
  decidedAt: "2026-06-25T00:00:00.000Z",
};

const bare = { profile: UNADVISED_EARNER, decisions: [], hasPrevious: false };

describe("what to offer asking next", () => {
  it("offers a few, never a menu", () => {
    const out = offers(null, bare);
    assert.ok(out.length > 0 && out.length <= 3, `got ${out.length}`);
  });

  it("leads with the question behind most vague ones", () => {
    assert.equal(offers(null, bare)[0], "How am I doing?");
  });

  /**
   * The rule that makes these read as a coach rather than a menu. A fixed
   * list would offer all seven always and answer three of them with "nothing
   * yet", which teaches people the offers are decoration.
   */
  it("does not offer what would answer 'nothing yet'", () => {
    const out = offers(null, bare);
    assert.ok(!out.includes("What’s changed?"), "nothing to diff against");
    assert.ok(!out.includes("What am I working toward?"), "no goal named");
    assert.ok(!out.includes("What have I decided?"), "empty ledger");
  });

  it("offers each one once it is genuinely true", () => {
    assert.ok(
      offers(null, { ...bare, hasPrevious: true }).includes("What’s changed?"),
    );
    assert.ok(
      offers(null, { ...bare, profile: WITH_GOAL }).includes(
        "What am I working toward?",
      ),
    );
    assert.ok(
      offers(null, { ...bare, decisions: [DECISION] }).includes(
        "What have I decided?",
      ),
    );
  });

  /**
   * Offering someone the question they just asked is the clearest possible
   * sign that nothing is listening.
   *
   * Asserted by ROUTING each offer rather than by comparing strings against a
   * copy of the list — a string comparison would pass just as well if the
   * wording drifted apart from what it routes to, and the first version of
   * this test was worse still: `!out.includes(asked[0]) || kind !== "standing"`
   * is vacuously true for every kind but one.
   */
  it("never offers back the question just answered", () => {
    const scenarios = availableScenarios(WITH_GOAL);
    const full = { profile: WITH_GOAL, decisions: [DECISION], hasPrevious: true };

    for (const kind of [
      "standing",
      "ladder",
      "horizon",
      "capabilities",
      "changes",
      "goals",
      "decisions",
    ] as const) {
      const out = offers({ kind }, full);
      assert.ok(out.length > 0, `${kind} offered nothing at all`);
      for (const question of out) {
        assert.notEqual(
          routeIntent(question, scenarios).kind,
          kind,
          `after answering ${kind}, offered it back as "${question}"`,
        );
      }
    }
  });
});

describe("offers reach real answers", () => {
  const context = {
    profile: WITH_GOAL,
    decisions: [DECISION],
    options: { limits: ILLUSTRATIVE_LIMITS, now: FIXTURE_NOW },
    previousProfile: UNADVISED_EARNER,
    previousAt: FIXTURE_ASOF,
  };
  const scenarios = availableScenarios(WITH_GOAL);

  /**
   * The whole safety property of a tap-path: tapping sends the SENTENCE back
   * through the same router a spoken question travels. If an offer routed to
   * `unknown`, the product would be offering a question it then refuses.
   */
  it("every offered question routes to something answerable", () => {
    const asked = openingOffers(context);
    assert.ok(asked.length > 0);
    for (const question of asked) {
      const intent = routeIntent(question, scenarios);
      assert.notEqual(intent.kind, "unknown", `offer refused: ${question}`);
    }
  });

  it("and every offer, at every step, stays answerable", () => {
    // Walk the offers the way a tapping user would, one level deep.
    for (const question of openingOffers(context)) {
      const intent = routeIntent(question, scenarios);
      const reply = respond(intent, context);
      assert.ok(reply.segments.length > 0, `empty answer for: ${question}`);
      for (const next of reply.asks ?? []) {
        assert.notEqual(
          routeIntent(next, scenarios).kind,
          "unknown",
          `follow-up refused: ${next}`,
        );
      }
    }
  });

  it("attaches offers to every answer, including the refusal", () => {
    // "Ask me what you can ask" is a sentence that should come with the
    // questions attached.
    assert.ok((respond({ kind: "unknown" }, context).asks ?? []).length > 0);
    assert.ok((respond({ kind: "standing" }, context).asks ?? []).length > 0);
  });

  it("but not to the control intents, which render nothing", () => {
    assert.equal(respond({ kind: "stop" }, context).asks, undefined);
    assert.equal(respond({ kind: "repeat" }, context).asks, undefined);
  });
});

describe("the door out of an answer", () => {
  const full = {
    profile: WITH_GOAL,
    decisions: [DECISION],
    options: { limits: ILLUSTRATIVE_LIMITS, now: FIXTURE_NOW },
    previousProfile: UNADVISED_EARNER,
    previousAt: FIXTURE_ASOF,
  };
  /** Nothing on the ledger, no goal, no past state to diff. */
  const bareCtx = {
    profile: UNADVISED_EARNER,
    decisions: [],
    options: { limits: ILLUSTRATIVE_LIMITS, now: FIXTURE_NOW },
    previousProfile: null,
    previousAt: null,
  };

  it("sends each answer to the screen it belongs to", () => {
    assert.equal(respond({ kind: "standing" }, full).goes?.to, "today");
    assert.equal(respond({ kind: "ladder" }, full).goes?.to, "today");
    assert.equal(respond({ kind: "decisions" }, full).goes?.to, "decisions");
    assert.equal(respond({ kind: "goals" }, full).goes?.to, "goals");
    assert.equal(respond({ kind: "horizon" }, full).goes?.to, "goals");
    assert.equal(respond({ kind: "changes" }, full).goes?.to, "insights");
  });

  /**
   * The same discipline the offers follow. A door onto an empty ledger, or
   * onto a letter that repeats the sentence you were just given, is worse
   * than no door — and where the answer's own next step is to TELL North
   * something, the next action is conversation, not navigation.
   */
  it("stays shut when there is nothing behind it", () => {
    assert.equal(respond({ kind: "decisions" }, bareCtx).goes, undefined);
    assert.equal(respond({ kind: "goals" }, bareCtx).goes, undefined);
    assert.equal(respond({ kind: "changes" }, bareCtx).goes, undefined);
  });

  it("offers none where the conversation is the better answer", () => {
    // Capabilities is a set of questions, not a place — and the offers below
    // it already are the ways in.
    assert.equal(respond({ kind: "capabilities" }, full).goes, undefined);
    assert.equal(respond({ kind: "unknown" }, full).goes, undefined);
    // A scenario already carries `opens`, which is a more specific door than
    // any tab.
    const scenario = respond({ kind: "scenario", id: "home" }, full);
    assert.equal(scenario.goes, undefined);
    assert.equal(scenario.opens, "home");
  });

  it("labels the two Goals doors differently, because they promise different things", () => {
    const goals = respond({ kind: "goals" }, full).goes;
    const horizon = respond({ kind: "horizon" }, full).goes;
    assert.equal(goals?.to, horizon?.to, "same screen");
    assert.notEqual(goals?.label, horizon?.label, "different promise");
  });

  it("names a screen, never a URL — core does not know the routes", () => {
    for (const kind of ["standing", "decisions", "goals", "changes"] as const) {
      const door = respond({ kind }, full).goes;
      assert.ok(door, kind);
      assert.ok(!door.to.includes("/"), `${kind} leaked a path: ${door.to}`);
      assert.ok(door.label.length > 0, `${kind} has no label`);
    }
  });
});

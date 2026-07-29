import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { evaluate } from "../waterfall/evaluate.ts";
import { ILLUSTRATIVE_LIMITS } from "../waterfall/limits.ts";
import { buildProfile, isComplete, missingAnswers } from "./build-profile.ts";
import {
  SCRIPT,
  expectedTurnCount,
  toAnswer,
  toTextAnswer,
  visibleTurns,
  type Answers,
} from "./script.ts";

const NOW = new Date("2026-07-27T00:00:00.000Z");

/** A complete set of answers for someone with no expensive debt. */
const said = (value: string | number): { value: string | number; confidence: "stated" } => ({
  value,
  confidence: "stated",
});

const CLEAN: Answers = {
  openingConcern: toTextAnswer(
    "Cash keeps piling up and I don't know what to do with it.",
  ),
  confidence: said("mostly-ok"),
  incomeBand: said("200k-400k"),
  monthlyOut: said(1_200_000),
  liquid: said(10_000_000),
  expensiveDebt: said("none"),
  dependents: said(0),
  retirement: said(400),
  employerMatch: said(400),
  horizon: said(300),
};

const WITH_DEBT: Answers = {
  ...CLEAN,
  expensiveDebt: said("card"),
  debtBalance: said(800_000),
};

describe("the script", () => {
  test("every turn has a question and a unique id", () => {
    const ids = SCRIPT.map((t) => t.id);
    assert.equal(new Set(ids).size, ids.length, "duplicate turn id");
    for (const turn of SCRIPT) {
      assert.ok(turn.question.length > 0, `${turn.id} has no question`);
    }
  });

  test("exactly one free-text turn, and it opens the conversation", () => {
    const text = SCRIPT.filter((t) => t.kind === "text");
    assert.equal(text.length, 1);
    assert.equal(SCRIPT[0].id, "openingConcern");
  });

  test("every choice turn offers at least two options", () => {
    for (const turn of SCRIPT) {
      if (turn.kind !== "choice") continue;
      assert.ok(turn.options.length >= 2, `${turn.id} has too few options`);
    }
  });

  test("the emotional questions come before the numeric ones", () => {
    const order = SCRIPT.map((t) => t.id);
    assert.ok(order.indexOf("confidence") < order.indexOf("incomeBand"));
  });
});

describe("progressive disclosure", () => {
  test("the debt amount stays hidden until there is debt", () => {
    const hidden = visibleTurns({ expensiveDebt: said("none") }).map((t) => t.id);
    assert.ok(!hidden.includes("debtBalance"));
  });

  test("and appears once there is", () => {
    for (const answer of ["card", "other", "unsure"]) {
      const shown = visibleTurns({ expensiveDebt: said(answer) }).map((t) => t.id);
      assert.ok(
        shown.includes("debtBalance"),
        `debtBalance should follow "${answer}"`,
      );
    }
  });

  test("the stated question count reflects the branch taken", () => {
    assert.equal(
      expectedTurnCount({ expensiveDebt: said("card") }),
      expectedTurnCount({ expensiveDebt: said("none") }) + 1,
    );
  });
});

describe("completeness", () => {
  test("a fresh conversation is missing everything visible", () => {
    assert.equal(missingAnswers({}).length, visibleTurns({}).length);
    assert.equal(isComplete({}), false);
  });

  test("no-debt answers are complete without a debt amount", () => {
    assert.deepEqual(missingAnswers(CLEAN), []);
    assert.equal(isComplete(CLEAN), true);
  });

  test("choosing debt makes the amount required", () => {
    const withoutAmount: Answers = { ...WITH_DEBT };
    delete withoutAmount.debtBalance;
    assert.deepEqual(missingAnswers(withoutAmount), ["debtBalance"]);
    assert.equal(isComplete(withoutAmount), false);
  });

  test("building an incomplete profile throws, and says what is missing", () => {
    assert.throws(() => buildProfile({}, NOW), /openingConcern/);
  });
});

describe("buildProfile", () => {
  test("maps answers onto the profile the engine expects", () => {
    const p = buildProfile(CLEAN, NOW);

    assert.equal(p.incomeBand.value, "200k-400k");
    assert.equal(p.liquidCents.value, 10_000_000);
    assert.equal(p.monthlyOutCents.value, 1_200_000);
    assert.equal(p.retirementBps.value, 400);
    assert.equal(p.employerMatchBps.value, 400);
    assert.equal(p.horizonMonths.value, 300);
    assert.equal(p.financialConfidence.value, "mostly-ok");
  });

  test("captures the opening answer verbatim — it is never parsed", () => {
    assert.equal(p_openingConcern(), CLEAN.openingConcern!.value);
    function p_openingConcern() {
      return buildProfile(CLEAN, NOW).openingConcern.value;
    }
  });

  test("stamps every field with the injected `now`", () => {
    const p = buildProfile(CLEAN, NOW);
    assert.equal(p.liquidCents.asOf, NOW.toISOString());
  });

  test("no expensive debt means an empty, stated obligations list", () => {
    const p = buildProfile(CLEAN, NOW);
    assert.deepEqual(p.obligations.value, []);
    assert.equal(p.obligations.confidence, "stated");
  });

  /**
   * We ask what KIND of debt it is, never its APR — nobody knows that off-hand,
   * and asking turns a conversation into an application form. So the rate is
   * North's assumption and must be marked as one.
   */
  test("debt carries an assumed rate, and the field degrades to match", () => {
    const p = buildProfile(WITH_DEBT, NOW);

    assert.equal(p.obligations.value.length, 1);
    assert.equal(p.obligations.value[0].kind, "card");
    assert.equal(p.obligations.value[0].balanceCents, 800_000);
    assert.ok(p.obligations.value[0].rateBps >= 700, "should read as expensive");
    assert.equal(p.obligations.confidence, "assumed");
  });

  test("unsure debt is still surfaced rather than silently dropped", () => {
    const p = buildProfile(
      { ...CLEAN, expensiveDebt: said("unsure"), debtBalance: said(200_000) },
      NOW,
    );
    assert.equal(p.obligations.value.length, 1);
    assert.ok(p.obligations.value[0].rateBps >= 700);
  });
});

describe("confidence at collection time", () => {
  test("a picked answer is stated", () => {
    assert.equal(buildProfile(CLEAN, NOW).retirementBps.confidence, "stated");
  });

  /**
   * "Nothing yet" and "I don't know" are BOTH value 0 for retirement, and they
   * mean completely different things. Deriving confidence from the value would
   * collapse them and turn an admitted unknown into a false certainty — so the
   * answer carries its own confidence from the moment it is chosen.
   */
  test('"I don\'t know" lands as assumed, not as a false zero', () => {
    const turn = SCRIPT.find((t) => t.id === "retirement")!;
    assert.equal(turn.kind, "choice");
    if (turn.kind !== "choice") return;

    const nothingYet = turn.options.find((o) => o.label === "Nothing yet")!;
    const dontKnow = turn.options.find((o) => o.label === "I don't know")!;

    assert.equal(nothingYet.value, dontKnow.value, "same value, by design");
    assert.equal(toAnswer(nothingYet).confidence, "stated");
    assert.equal(toAnswer(dontKnow).confidence, "assumed");

    const p = buildProfile({ ...CLEAN, retirement: toAnswer(dontKnow) }, NOW);
    assert.equal(p.retirementBps.value, 0);
    assert.equal(p.retirementBps.confidence, "assumed");
  });
});

/**
 * The seam that matters: what onboarding produces must be something the engine
 * can actually reason over. If these ever diverge, the product has a working
 * conversation that leads nowhere.
 */
describe("onboarding feeds the engine", () => {
  test("a built profile evaluates to a real rung", () => {
    const result = evaluate(buildProfile(CLEAN, NOW), {
      limits: ILLUSTRATIVE_LIMITS,
      now: NOW,
    });

    assert.equal(result.ladder.length, 7);
    assert.equal(result.current?.rung.id, "tax-advantaged");
  });

  test("expensive debt from the conversation reaches rung 3", () => {
    const result = evaluate(buildProfile(WITH_DEBT, NOW), {
      limits: ILLUSTRATIVE_LIMITS,
      now: NOW,
    });

    assert.equal(result.current?.rung.id, "high-interest-debt");
  });

  test("someone with no buffer lands on rung 1, whatever they earn", () => {
    const result = evaluate(
      buildProfile(
        { ...CLEAN, liquid: said(50_000), incomeBand: said("over-400k") },
        NOW,
      ),
      { limits: ILLUSTRATIVE_LIMITS, now: NOW },
    );

    assert.equal(result.current?.rung.id, "liquidity");
  });
});

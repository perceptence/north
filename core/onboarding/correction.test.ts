import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { SQUEEZED, UNADVISED_EARNER } from "../../data/fixtures/personas.ts";
import { evaluate } from "../waterfall/evaluate.ts";
import { ILLUSTRATIVE_LIMITS } from "../waterfall/limits.ts";
import { RUNGS } from "../waterfall/rules.ts";
import { buildProfile } from "./build-profile.ts";
import {
  applyAnswers,
  CORRECTABLE,
  FIELD_BEHIND_RUNG,
  isCorrectable,
  updateGoal,
} from "./correction.ts";
import { SCRIPT, toAnswer, toTextAnswer, type Answers } from "./script.ts";
import type { Goal, SituationProfile } from "../profile/types.ts";
import type { Field } from "../confidence.ts";

const NOW = new Date("2026-09-01T00:00:00.000Z");
const OPTIONS = { limits: ILLUSTRATIVE_LIMITS, now: NOW };

const said = (value: string | number) =>
  ({ value, confidence: "stated" }) as const;

describe("the correctable set", () => {
  test("every correctable field maps to a real turn", () => {
    for (const { turnId } of CORRECTABLE) {
      assert.ok(
        SCRIPT.some((t) => t.id === turnId),
        `${turnId} has no turn to re-ask`,
      );
    }
  });

  test("every correctable turn offers choices — corrections are never free text", () => {
    for (const { turnId } of CORRECTABLE) {
      const turn = SCRIPT.find((t) => t.id === turnId)!;
      assert.equal(turn.kind, "choice", `${turnId} would need a text field`);
    }
  });

  test("the opening concern is not correctable — it is not a fact", () => {
    assert.equal(isCorrectable("openingConcern"), false);
  });

  test("every rung maps to a field or explicitly to nothing", () => {
    for (const rung of RUNGS) {
      assert.ok(
        rung.id in FIELD_BEHIND_RUNG,
        `${rung.id} has no entry — a new rung must decide what it changes`,
      );
      const turnId = FIELD_BEHIND_RUNG[rung.id];
      if (turnId !== null) assert.ok(isCorrectable(turnId));
    }
  });
});

describe("applyAnswers", () => {
  test("changes only the field it was given", () => {
    const patched = applyAnswers(
      UNADVISED_EARNER,
      { liquid: said(2_000_000) },
      NOW,
    );

    assert.equal(patched.liquidCents.value, 2_000_000);
    assert.deepEqual(patched.monthlyOutCents, UNADVISED_EARNER.monthlyOutCents);
    assert.deepEqual(patched.incomeBand, UNADVISED_EARNER.incomeBand);
    assert.deepEqual(patched.horizonMonths, UNADVISED_EARNER.horizonMonths);
  });

  /**
   * Re-stamping untouched fields would quietly claim the user reconfirmed them.
   */
  test("leaves the asOf of untouched fields alone", () => {
    const patched = applyAnswers(
      UNADVISED_EARNER,
      { liquid: said(2_000_000) },
      NOW,
    );

    assert.equal(patched.liquidCents.asOf, NOW.toISOString());
    assert.equal(
      patched.monthlyOutCents.asOf,
      UNADVISED_EARNER.monthlyOutCents.asOf,
    );
  });

  test("does not mutate the profile it is given", () => {
    const snapshot = structuredClone(UNADVISED_EARNER);
    applyAnswers(UNADVISED_EARNER, { liquid: said(1) }, NOW);
    assert.deepEqual(UNADVISED_EARNER, snapshot);
  });

  test("carries the answer’s own confidence across", () => {
    const turn = SCRIPT.find((t) => t.id === "retirement")!;
    assert.equal(turn.kind, "choice");
    if (turn.kind !== "choice") return;

    const dontKnow = turn.options.find((o) => o.label === "I don’t know")!;
    const patched = applyAnswers(
      UNADVISED_EARNER,
      { retirement: toAnswer(dontKnow) },
      NOW,
    );

    assert.equal(patched.retirementBps.confidence, "assumed");
  });

  test("clearing debt empties the obligations", () => {
    const patched = applyAnswers(SQUEEZED, { expensiveDebt: said("none") }, NOW);
    assert.deepEqual(patched.obligations.value, []);
  });

  test("changing the debt kind keeps a balance that was never re-asked", () => {
    const before = SQUEEZED.obligations.value[0].balanceCents;
    const patched = applyAnswers(SQUEEZED, { expensiveDebt: said("card") }, NOW);

    assert.equal(patched.obligations.value[0].balanceCents, before);
    assert.equal(patched.obligations.confidence, "assumed");
  });
});

/**
 * The guarantee that stops correction and onboarding drifting apart: patching a
 * profile with every answer must land exactly where building from scratch does.
 */
describe("correction agrees with onboarding", () => {
  const full: Answers = {
    openingConcern: toTextAnswer("Starting over."),
    confidence: said("confident"),
    incomeBand: said("100k-200k"),
    monthlyOut: said(800_000),
    liquid: said(3_000_000),
    expensiveDebt: said("none"),
    dependents: said(1),
    retirement: said(600),
    employerMatch: said(600),
    horizon: said(240),
  };

  test("applying every answer equals building from them", () => {
    const built = buildProfile(full, NOW);
    const patched = applyAnswers(UNADVISED_EARNER, full, NOW);
    assert.deepEqual(patched, built);
  });
});

describe("the loop closes", () => {
  /**
   * The whole point. Someone raises their contribution after being told about
   * the match; once North knows, the rung is genuinely satisfied rather than
   * merely skipped.
   */
  test("correcting the field resolves the rung that prompted it", () => {
    const under = applyAnswers(
      UNADVISED_EARNER,
      { retirement: said(300), employerMatch: said(600) },
      NOW,
    );
    assert.equal(evaluate(under, OPTIONS).current?.rung.id, "match");

    const raised = applyAnswers(under, { retirement: said(600) }, NOW);
    const ladder = evaluate(raised, OPTIONS).ladder;

    assert.equal(ladder.find((r) => r.id === "match")?.satisfied, true);
    assert.notEqual(evaluate(raised, OPTIONS).current?.rung.id, "match");
  });

  test("clearing the debt resolves the debt rung", () => {
    assert.equal(evaluate(SQUEEZED, OPTIONS).current?.rung.id, "high-interest-debt");

    const cleared = applyAnswers(SQUEEZED, { expensiveDebt: said("none") }, NOW);
    assert.notEqual(
      evaluate(cleared, OPTIONS).current?.rung.id,
      "high-interest-debt",
    );
  });

  test("topping up cash resolves the liquidity rung", () => {
    const thin = applyAnswers(UNADVISED_EARNER, { liquid: said(50_000) }, NOW);
    assert.equal(evaluate(thin, OPTIONS).current?.rung.id, "liquidity");

    const topped = applyAnswers(thin, { liquid: said(10_000_000) }, NOW);
    assert.notEqual(evaluate(topped, OPTIONS).current?.rung.id, "liquidity");
  });
});

describe("changing a goal", () => {
  const goal = (over: Partial<Goal>): Field<Goal> => ({
    value: {
      label: "a sabbatical",
      targetCents: 4_000_000,
      withinMonths: 24,
      savedCents: 900_000,
      ...over,
    },
    confidence: "stated",
    asOf: NOW.toISOString(),
  });

  const withGoals = (): SituationProfile => ({
    ...UNADVISED_EARNER,
    goals: [
      goal({}),
      goal({ label: "a home deposit", targetCents: 9_000_000, withinMonths: 36, savedCents: 0 }),
    ],
  });

  test("a patch changes only the fields it names", () => {
    const moved = updateGoal(withGoals(), 0, { withinMonths: 36 }, NOW);
    const g = moved.goals![0].value;

    assert.equal(g.withinMonths, 36);
    // The whole point: moving a date must not quietly reset what's saved or
    // what it's for. Re-naming the goal was the old workaround and lost both.
    assert.equal(g.savedCents, 900_000);
    assert.equal(g.targetCents, 4_000_000);
    assert.equal(g.label, "a sabbatical");
  });

  test("it touches only the goal addressed", () => {
    const before = withGoals();
    const after = updateGoal(before, 0, { targetCents: 5_000_000 }, NOW);

    assert.deepEqual(after.goals![1], before.goals![1]);
    assert.equal(after.goals!.length, 2);
  });

  test("an adjusted goal is stated — the user just said so", () => {
    const assumed: SituationProfile = {
      ...UNADVISED_EARNER,
      goals: [{ ...goal({}), confidence: "assumed" }],
    };
    const after = updateGoal(assumed, 0, { withinMonths: 60 }, NOW);
    assert.equal(after.goals![0].confidence, "stated");
  });

  test("an out-of-range index returns the profile untouched", () => {
    const before = withGoals();
    assert.equal(updateGoal(before, 7, { withinMonths: 12 }, NOW), before);
    assert.equal(updateGoal(before, -1, { withinMonths: 12 }, NOW), before);
  });

  test("a profile with no goals is left alone rather than given one", () => {
    const none = UNADVISED_EARNER;
    const after = updateGoal(none, 0, { label: "invented" }, NOW);
    assert.equal(after, none);
    assert.equal(after.goals, undefined);
  });

  test("moving a deadline changes what the goal needs each month", () => {
    const need = (p: SituationProfile) => {
      const g = p.goals![0].value;
      return (g.targetCents - g.savedCents) / g.withinMonths;
    };
    assert.ok(
      need(updateGoal(withGoals(), 0, { withinMonths: 12 }, NOW)) >
        need(updateGoal(withGoals(), 0, { withinMonths: 60 }, NOW)),
    );
  });
});

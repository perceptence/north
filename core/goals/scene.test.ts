import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { EARLY, FIXTURE_NOW, UNADVISED_EARNER } from "../../data/fixtures/personas.ts";
import { applyAnswers } from "../onboarding/correction.ts";
import { readToPlainText } from "../waterfall/evaluate.ts";
import { ILLUSTRATIVE_LIMITS } from "../waterfall/limits.ts";
import { composeScene } from "./scene.ts";

const OPTIONS = { limits: ILLUSTRATIVE_LIMITS, now: FIXTURE_NOW };

const spoken = (segments: Parameters<typeof readToPlainText>[0]["segments"]) =>
  readToPlainText({ segments, action: { commit: "", defer: "" } });

const said = (value: string | number) =>
  ({ value, confidence: "stated" }) as const;

/** A profile with a captured goal, built through the real capture path. */
const withGoal = applyAnswers(
  UNADVISED_EARNER,
  {
    goalLabel: said("A home deposit"),
    goalTarget: said(8_000_000),
    goalWhen: said(36),
    goalSaved: said(1_500_000),
  },
  FIXTURE_NOW,
);

describe("the scene", () => {
  test("the headline is the range, abbreviated, never a point", () => {
    const scene = composeScene(UNADVISED_EARNER, OPTIONS);
    const headline = spoken(scene.headline);

    assert.match(headline, /Between \$578K and \$1\.5M by retirement/);
    assert.doesNotMatch(headline, /\$\d{3},\d{3}/, "full-precision figure leaked");
  });

  test("someone with nothing to project gets honesty, not $0", () => {
    const scene = composeScene(EARLY, OPTIONS);
    assert.equal(scene.projection, null);
    assert.match(spoken(scene.headline), /buffer comes first/i);
  });

  test("goal capture through the conversation reaches the scene", () => {
    assert.equal(withGoal.goals?.[0].value.label, "A home deposit");
    const scene = composeScene(withGoal, OPTIONS);
    assert.equal(scene.hasGoal, true);
    assert.equal(scene.goals.length, 1);
    assert.ok(scene.goals[0].pacing);
  });

  test("a coverable goal reads as on time, in clean money", () => {
    // Gap $65k over 36 months ≈ $1,805.56/mo → rounds up to $1,850.
    const pacing = spoken(composeScene(withGoal, OPTIONS).goals[0].pacing);
    assert.match(pacing, /lands a home deposit on time/);
    assert.doesNotMatch(pacing, /\.\d{2}\b/, "cents leaked into prose");
  });

  test("an uncoverable goal names the shortfall, not a failure", () => {
    const tight = applyAnswers(withGoal, { monthlyOut: said(1_500_000) }, FIXTURE_NOW);
    // Income band midpoint $25k/mo, outgoings $15k, retirement ~$1k → surplus ~$9k;
    // make the goal steep: $150k in 24 months ≈ $6.2k/mo... still coverable.
    const steep = applyAnswers(
      tight,
      { goalLabel: said("A home deposit"), goalTarget: said(15_000_000), goalWhen: said(24), goalSaved: said(0) },
      FIXTURE_NOW,
    );
    const scene = composeScene(
      applyAnswers(steep, { incomeBand: said("under-100k") }, FIXTURE_NOW),
      OPTIONS,
    );
    const pacing = spoken(scene.goals[0].pacing);
    assert.match(pacing, /isn't there yet/);
    assert.doesNotMatch(pacing, /fail|behind|missed/i);
  });

  test('"no date yet" degrades the goal to assumed', () => {
    const undated = applyAnswers(
      UNADVISED_EARNER,
      {
        goalLabel: said("A sabbatical"),
        goalTarget: said(5_000_000),
        goalWhen: { value: 60, confidence: "assumed" },
        goalSaved: said(0),
      },
      FIXTURE_NOW,
    );
    assert.equal(undated.goals?.[0].confidence, "assumed");
  });
});

test("both ends of the headline range are openable, or neither is", () => {
  const scene = composeScene(UNADVISED_EARNER, OPTIONS);
  const figures = scene.headline.filter((s) => s.kind === "figure");

  assert.ok(figures.length >= 2, "the headline states a range");
  // One end openable and the other not is a distinction no reader can infer.
  const openable = figures.filter(
    (s) => s.kind === "figure" && s.interrogable,
  ).length;
  assert.equal(openable, figures.length);
});

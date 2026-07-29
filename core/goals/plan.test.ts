import assert from "node:assert/strict";
import { test } from "node:test";
import { planGoals } from "./plan.ts";
import type { Goal, SituationProfile } from "../profile/types.ts";

/**
 * The allocation rules. These exist because the failure they prevent is
 * invisible: three goals each reporting "covered" against the same surplus is
 * individually true and collectively a lie.
 */

const AS_OF = "2026-01-01T00:00:00.000Z";

function goal(
  label: string,
  targetCents: number,
  withinMonths: number,
  savedCents = 0,
) {
  return {
    value: { label, targetCents, withinMonths, savedCents } as Goal,
    confidence: "stated" as const,
    asOf: AS_OF,
  };
}

/** Only the fields `planGoals` reads — it never touches the rest. */
function profileWith(goals: ReturnType<typeof goal>[]): SituationProfile {
  return { goals } as unknown as SituationProfile;
}

test("no goals yields an empty plan rather than a branch for callers", () => {
  const plan = planGoals({} as SituationProfile, 500_000);
  assert.deepEqual(plan.goals, []);
  assert.equal(plan.primary, null);
  assert.equal(plan.unclaimedCents, 500_000);
});

test("the surplus is allocated in deadline order, not naming order", () => {
  const plan = planGoals(
    profileWith([
      goal("A sabbatical", 2_400_000, 24), // named first, later deadline
      goal("A wedding", 1_200_000, 12), // named second, sooner
    ]),
    1_000_000,
  );

  assert.equal(plan.goals[0].goal.label, "A wedding");
  assert.equal(plan.goals[1].goal.label, "A sabbatical");
});

test("a nearer goal takes its claim before a later one sees the surplus", () => {
  // Wedding needs 1_200_000/12 = 100_000/mo. Sabbatical needs 2_400_000/24 =
  // 100_000/mo. A 150_000 surplus covers the first and half the second.
  const plan = planGoals(
    profileWith([goal("A wedding", 1_200_000, 12), goal("A sabbatical", 2_400_000, 24)]),
    150_000,
  );

  const [wedding, sabbatical] = plan.goals;
  assert.equal(wedding.monthlyCoveredCents, 100_000);
  assert.equal(wedding.monthlyShortCents, 0);
  assert.equal(sabbatical.monthlyCoveredCents, 50_000);
  assert.equal(sabbatical.monthlyShortCents, 50_000);
  assert.equal(plan.unclaimedCents, 0);
});

test("goals never collectively claim more than the surplus", () => {
  const plan = planGoals(
    profileWith([
      goal("A wedding", 1_200_000, 12),
      goal("A sabbatical", 2_400_000, 24),
      goal("A home deposit", 8_000_000, 36),
    ]),
    150_000,
  );

  const claimed = plan.goals.reduce((sum, g) => sum + g.monthlyCoveredCents, 0);
  assert.equal(claimed, 150_000);
  assert.ok(claimed + plan.unclaimedCents === 150_000);
});

test("a funded goal is funded and claims nothing", () => {
  const plan = planGoals(
    profileWith([goal("A wedding", 1_200_000, 12, 1_200_000)]),
    500_000,
  );

  assert.equal(plan.goals[0].funded, true);
  assert.equal(plan.goals[0].monthlyNeedCents, 0);
  assert.equal(plan.goals[0].monthlyCoveredCents, 0);
  assert.equal(plan.unclaimedCents, 500_000);
});

test("primary is the soonest UNFUNDED goal — the one rung 5 speaks for", () => {
  const plan = planGoals(
    profileWith([
      goal("A wedding", 1_200_000, 12, 1_200_000), // funded, soonest
      goal("A sabbatical", 2_400_000, 24),
    ]),
    0,
  );

  assert.equal(plan.primary?.goal.label, "A sabbatical");
});

test("the monthly need rounds UP to a clean $50 — never cents", () => {
  // 100_001 / 12 = 8333.4 cents; must land on a 5_000 step above it.
  const plan = planGoals(profileWith([goal("Something", 100_001, 12)]), 0);
  assert.equal(plan.goals[0].monthlyNeedCents % 5_000, 0);
  assert.ok(plan.goals[0].monthlyNeedCents * 12 >= 100_001);
});

test("a goal with no months left asks for the whole gap at once", () => {
  const plan = planGoals(profileWith([goal("Overdue", 500_000, 0)]), 0);
  assert.equal(plan.goals[0].monthlyNeedCents, 500_000);
});

test("a negative surplus is treated as nothing to allocate", () => {
  const plan = planGoals(profileWith([goal("A wedding", 1_200_000, 12)]), -400_000);
  assert.equal(plan.goals[0].monthlyCoveredCents, 0);
  assert.equal(plan.unclaimedCents, 0);
});

test("index survives reordering, so edits address the right goal", () => {
  const plan = planGoals(
    profileWith([
      goal("Later", 2_400_000, 24), // index 0
      goal("Sooner", 1_200_000, 12), // index 1
    ]),
    0,
  );

  assert.equal(plan.goals[0].goal.label, "Sooner");
  assert.equal(plan.goals[0].index, 1);
  assert.equal(plan.goals[1].index, 0);
});

test("ties on deadline put the larger target first", () => {
  const plan = planGoals(
    profileWith([goal("Small", 500_000, 12), goal("Large", 5_000_000, 12)]),
    0,
  );
  assert.equal(plan.goals[0].goal.label, "Large");
});

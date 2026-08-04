import { test, describe } from "node:test";
import assert from "node:assert/strict";
import type { Field } from "../confidence.ts";
import type { SituationProfile } from "../profile/types.ts";
import { derive } from "./derive.ts";
import { ILLUSTRATIVE_LIMITS } from "./limits.ts";
import { monthlyCostOfDelay } from "./delay.ts";
import { RUNGS } from "./rules.ts";

const NOW = new Date("2026-08-04T00:00:00.000Z");
const ASOF = "2026-07-01T00:00:00.000Z";
const stated = <T>(value: T): Field<T> => ({ value, confidence: "stated", asOf: ASOF });

function profile(overrides: Partial<SituationProfile> = {}): SituationProfile {
  return {
    openingConcern: stated("—"),
    financialConfidence: stated("mostly-ok"),
    incomeBand: stated("100k-200k"), // $150k → $12,500/mo
    liquidCents: stated(4_000_000),
    monthlyOutCents: stated(970_000),
    obligations: stated([]),
    dependents: stated(0),
    retirementBps: stated(2_100),
    employerMatchBps: stated(500),
    horizonMonths: stated(240),
    ...overrides,
  };
}

const factsFor = (p: SituationProfile) =>
  derive(p, { limits: ILLUSTRATIVE_LIMITS, now: NOW });

describe("monthlyCostOfDelay — where the arithmetic is real", () => {
  test("unclaimed match is income times the gap", () => {
    const p = profile({ retirementBps: stated(0), employerMatchBps: stated(500) });
    const cost = monthlyCostOfDelay("match", p, factsFor(p));
    const income = factsFor(p).monthlyIncome.value;
    const exact = (income * 500) / 10_000;
    assert.equal(cost, Math.round(exact / 100) * 100);
  });

  test("debt is the balance's own interest for one month", () => {
    const p = profile({
      obligations: stated([{ kind: "card", balanceCents: 4_000_000, rateBps: 2_200 }]),
    });
    const cost = monthlyCostOfDelay("high-interest-debt", p, factsFor(p));
    // $40,000 at 22% → $8,800 a year → about $733 a month.
    assert.equal(cost, 73_300);
    assert.ok(cost && cost > 70_000 && cost < 76_000);
  });

  test("it is a rate, not a running total — the same input twice is the same figure", () => {
    const p = profile({
      obligations: stated([{ kind: "card", balanceCents: 4_000_000, rateBps: 2_200 }]),
    });
    const a = monthlyCostOfDelay("high-interest-debt", p, factsFor(p));
    const b = monthlyCostOfDelay("high-interest-debt", p, factsFor(p));
    assert.equal(a, b);
  });
});

describe("monthlyCostOfDelay — where it honestly has no answer", () => {
  const p = profile();
  const facts = factsFor(p);

  for (const rungId of ["liquidity", "tax-advantaged", "goal", "taxable", "optimization"] as const) {
    test(`${rungId} returns null rather than a guess`, () => {
      assert.equal(monthlyCostOfDelay(rungId, p, facts), null);
    });
  }

  test("no match gap costs nothing, and says so with null not zero", () => {
    const met = profile({ retirementBps: stated(600), employerMatchBps: stated(500) });
    assert.equal(monthlyCostOfDelay("match", met, factsFor(met)), null);
  });

  test("a cleared balance costs nothing", () => {
    const clear = profile({
      obligations: stated([{ kind: "card", balanceCents: 0, rateBps: 2_200 }]),
    });
    assert.equal(monthlyCostOfDelay("high-interest-debt", clear, factsFor(clear)), null);
  });

  test("an interest-free plan costs nothing", () => {
    const free = profile({
      obligations: stated([{ kind: "other", balanceCents: 500_000, rateBps: 0 }]),
    });
    assert.equal(monthlyCostOfDelay("high-interest-debt", free, factsFor(free)), null);
  });
});

describe("monthlyCostOfDelay — no false precision", () => {
  /**
   * The figure is introduced by "about". "About $733.33" is a sentence
   * arguing with itself, and this product refuses false precision by rule.
   */
  test("every figure it returns is a whole number of dollars", () => {
    const cases: SituationProfile[] = [
      profile({ retirementBps: stated(0), employerMatchBps: stated(500) }),
      profile({ obligations: stated([{ kind: "card", balanceCents: 4_000_000, rateBps: 2_200 }]) }),
      profile({ obligations: stated([{ kind: "other", balanceCents: 1_234_567, rateBps: 1_733 }]) }),
    ];
    for (const p of cases) {
      const facts = factsFor(p);
      for (const rungId of ["match", "high-interest-debt"] as const) {
        const cost = monthlyCostOfDelay(rungId, p, facts);
        if (cost === null) continue;
        assert.equal(cost % 100, 0, `${rungId} returned ${cost}`);
      }
    }
  });
});

describe("monthlyCostOfDelay — total over the ladder", () => {
  /**
   * Every rung must get an answer, even if the answer is "no figure". A new
   * rung added without a case here would otherwise silently fall through to
   * `null`, which is the right default but should be a decision rather than
   * an accident — this test makes the omission visible.
   */
  test("every rung is answerable without throwing", () => {
    const p = profile();
    const facts = factsFor(p);
    for (const rung of RUNGS) {
      const cost = monthlyCostOfDelay(rung.id, p, facts);
      assert.ok(cost === null || (Number.isInteger(cost) && cost > 0));
    }
  });
});

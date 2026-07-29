import { test, describe } from "node:test";
import assert from "node:assert/strict";
import {
  EARLY,
  FIXTURE_NOW,
  PERSONAS,
  SETTLED,
  SQUEEZED,
  UNADVISED_EARNER,
} from "../../data/fixtures/personas.ts";
import type { Field } from "../confidence.ts";
import type { SituationProfile } from "../profile/types.ts";
import { evaluate, readToPlainText } from "./evaluate.ts";
import { ILLUSTRATIVE_LIMITS } from "./limits.ts";
import { WATERFALL_LENGTH } from "./rules.ts";
import type { EvaluateOptions } from "./types.ts";

const OPTIONS: EvaluateOptions = {
  limits: ILLUSTRATIVE_LIMITS,
  now: FIXTURE_NOW,
};

const run = (p: SituationProfile) => evaluate(p, OPTIONS);

const stated = <T>(value: T): Field<T> => ({
  value,
  confidence: "stated",
  asOf: "2026-07-01T00:00:00.000Z",
});

describe("where each persona lands", () => {
  test("EARLY → rung 1, liquidity floor", () => {
    const { current } = run(EARLY);
    assert.equal(current?.rung.id, "liquidity");
    assert.equal(current?.rung.index, 1);
  });

  test("SQUEEZED → rung 3, high-interest debt", () => {
    const { current } = run(SQUEEZED);
    assert.equal(current?.rung.id, "high-interest-debt");
  });

  test("UNADVISED_EARNER → rung 4, tax-advantaged space (the hero)", () => {
    const { current } = run(UNADVISED_EARNER);
    assert.equal(current?.rung.id, "tax-advantaged");
  });

  test("SETTLED → nothing to do, the reward state", () => {
    const { current, ladder } = run(SETTLED);
    assert.equal(current, null);
    assert.ok(ladder.every((r) => r.satisfied));
  });
});

describe("the hero read", () => {
  test("frames the cash as the problem and names the unused room", () => {
    const { current } = run(UNADVISED_EARNER);
    const sentence = readToPlainText(current!.read);

    assert.match(sentence, /\$140,000/); // the cash
    assert.match(sentence, /11 months/); // how long it would last
    assert.match(sentence, /\$104,000/); // the excess above the floor
    assert.match(sentence, /\$19,500/); // unused tax-advantaged room
    assert.match(sentence, /problem, not the win/);
  });

  test("names a gap and an action, never a security", () => {
    const { current } = run(UNADVISED_EARNER);
    const all = `${readToPlainText(current!.read)} ${current!.read.action.commit}`;
    // The coaching/advice line: no tickers, no fund names, no "buy"
    // (docs/FOUNDATION.md §9).
    assert.doesNotMatch(all, /\b(VTI|VOO|SPY|buy|purchase|invest in)\b/i);
  });

  test("every figure in the read carries a confidence", () => {
    for (const persona of Object.values(PERSONAS)) {
      const { current } = run(persona);
      if (!current) continue;
      for (const segment of current.read.segments) {
        if (segment.kind !== "figure") continue;
        assert.ok(
          ["stated", "inferred", "assumed"].includes(segment.confidence),
          `${current.rung.id} emitted a figure without a valid confidence`,
        );
      }
    }
  });
});

/**
 * THE PRODUCT CLAIM, AS A TEST.
 *
 * North serves everyone without a persona picker because priority is universal
 * and ordered — only the rung differs (docs/STRATEGY.md §2). If income ever
 * starts selecting the rung, the entire "no persona branching" architecture has
 * silently failed, and this is what catches it.
 */
describe("income does not determine the rung", () => {
  const brokeButHighEarning: SituationProfile = {
    openingConcern: stated("—"),
    financialConfidence: stated("confident"),
    incomeBand: stated("over-400k"),
    liquidCents: stated(100_000), // $1,000
    monthlyOutCents: stated(1_500_000), // $15,000 → 0 months
    obligations: stated([]),
    dependents: stated(0),
    retirementBps: stated(0),
    employerMatchBps: stated(0),
    horizonMonths: stated(240),
  };

  test("a high earner with no buffer lands on the same rung as a low earner", () => {
    assert.equal(run(EARLY).current?.rung.id, "liquidity");
    assert.equal(run(brokeButHighEarning).current?.rung.id, "liquidity");
  });

  test("the same shortfall produces the same rung across all four bands", () => {
    const bands = [
      "under-100k",
      "100k-200k",
      "200k-400k",
      "over-400k",
    ] as const;

    const rungs = bands.map(
      (band) =>
        run({ ...brokeButHighEarning, incomeBand: stated(band) }).current?.rung
          .id,
    );

    assert.deepEqual(rungs, Array(4).fill("liquidity"));
  });
});

describe("deferral", () => {
  /**
   * Without this, waving something off surfaces the identical decision on the
   * next render — which reads as nagging and trains people to stop answering
   * honestly.
   */
  test("a skipped rung is passed over for the next unsatisfied one", () => {
    const withoutSkip = run(SQUEEZED);
    assert.equal(withoutSkip.current?.rung.id, "high-interest-debt");

    const withSkip = evaluate(SQUEEZED, {
      ...OPTIONS,
      skip: ["high-interest-debt"],
    });
    assert.notEqual(withSkip.current?.rung.id, "high-interest-debt");
    assert.ok(withSkip.current, "should surface something else, not nothing");
  });

  test("a skipped rung still reports as unsatisfied in the ladder", () => {
    const { ladder } = evaluate(SQUEEZED, {
      ...OPTIONS,
      skip: ["high-interest-debt"],
    });
    const rung = ladder.find((r) => r.id === "high-interest-debt");
    assert.equal(rung?.satisfied, false, "skipping is not the same as solving");
  });

  test("skipping everything unsatisfied yields the reward state", () => {
    const all = run(SQUEEZED)
      .ladder.filter((r) => !r.satisfied)
      .map((r) => r.id);

    assert.equal(evaluate(SQUEEZED, { ...OPTIONS, skip: all }).current, null);
  });

  test("skipping a satisfied rung changes nothing", () => {
    assert.deepEqual(
      evaluate(SQUEEZED, { ...OPTIONS, skip: ["liquidity"] }).current?.rung.id,
      run(SQUEEZED).current?.rung.id,
    );
  });
});

describe("evaluation contract", () => {
  test("always reports the full ladder, in order", () => {
    for (const persona of Object.values(PERSONAS)) {
      const { ladder } = run(persona);
      assert.equal(ladder.length, WATERFALL_LENGTH);
      ladder.forEach((state, i) => assert.equal(state.index, i + 1));
    }
  });

  test("the current rung is always the FIRST unsatisfied one", () => {
    for (const persona of Object.values(PERSONAS)) {
      const { current, ladder } = run(persona);
      const firstUnsatisfied = ladder.find((r) => !r.satisfied);

      if (firstUnsatisfied === undefined) {
        assert.equal(current, null);
      } else {
        assert.equal(current?.rung.id, firstUnsatisfied.id);
      }
    }
  });

  test("everything below the current rung is satisfied", () => {
    for (const persona of Object.values(PERSONAS)) {
      const { current, ladder } = run(persona);
      if (!current) continue;
      const above = ladder.slice(0, current.rung.index - 1);
      assert.ok(
        above.every((r) => r.satisfied),
        `${current.rung.id} was surfaced with an unmet rung above it`,
      );
    }
  });
});

describe("purity", () => {
  test("same inputs, same output — no clock, no randomness", () => {
    for (const persona of Object.values(PERSONAS)) {
      assert.deepEqual(run(persona), run(persona));
    }
  });

  test("does not mutate the profile it is given", () => {
    const snapshot = structuredClone(UNADVISED_EARNER);
    run(UNADVISED_EARNER);
    assert.deepEqual(UNADVISED_EARNER, snapshot);
  });

  test("`now` only reaches the output as asOf stamps", () => {
    const later = new Date("2027-01-01T00:00:00.000Z");
    const a = evaluate(UNADVISED_EARNER, OPTIONS);
    const b = evaluate(UNADVISED_EARNER, { ...OPTIONS, now: later });

    assert.equal(a.current?.rung.id, b.current?.rung.id);
    assert.equal(a.facts.excessCash.value, b.facts.excessCash.value);
    assert.notEqual(a.facts.excessCash.asOf, b.facts.excessCash.asOf);
  });
});

describe("confidence propagation", () => {
  test("anything downstream of the income band is assumed", () => {
    const { facts } = run(UNADVISED_EARNER);
    // Income comes from a band midpoint — an assumption — and that degradation
    // must survive every derivation built on top of it.
    assert.equal(facts.monthlyIncome.confidence, "assumed");
    assert.equal(facts.annualRetirement.confidence, "assumed");
    assert.equal(facts.unusedTaxAdvantaged.confidence, "assumed");
    assert.equal(facts.monthlySurplus.confidence, "assumed");
  });

  test("figures derived from stated inputs alone are inferred, never stated", () => {
    const { facts } = run(UNADVISED_EARNER);
    // liquidity and excess cash come only from stated cash and stated outgoings
    assert.equal(facts.liquidityMonths.confidence, "inferred");
    assert.equal(facts.excessCash.confidence, "inferred");
  });
});

import { test, describe } from "node:test";
import assert from "node:assert/strict";
import {
  FIXTURE_NOW,
  PERSONAS,
  UNADVISED_EARNER,
} from "../../data/fixtures/personas.ts";
import type { Confidence, Field } from "../confidence.ts";
import type { SituationProfile } from "../profile/types.ts";
import { ILLUSTRATIVE_LIMITS } from "../waterfall/limits.ts";
import type { EvaluateOptions } from "../waterfall/types.ts";
import {
  futureValue,
  project,
  roundForDisplay,
  spreadMultiplier,
  RETURN_RANGE,
  SPREAD,
} from "./horizon.ts";

const OPTIONS: EvaluateOptions = {
  limits: ILLUSTRATIVE_LIMITS,
  now: FIXTURE_NOW,
};

/** Asserts a projection exists — most tests are about a person who has one. */
function run(p: SituationProfile) {
  const result = project(p, OPTIONS);
  assert.ok(result, "expected a projection");
  return result;
}

/** The personas with something to project. EARLY deliberately has nothing. */
const PROJECTABLE = Object.values(PERSONAS).filter(
  (p) => project(p, OPTIONS) !== null,
);

const at = <T>(value: T, confidence: Confidence): Field<T> => ({
  value,
  confidence,
  asOf: "2026-07-01T00:00:00.000Z",
});

describe("futureValue", () => {
  test("no time means no growth", () => {
    assert.equal(futureValue(100_000, 5_000, 500, 0), 100_000);
  });

  test("a zero rate is additive, not a division by zero", () => {
    assert.equal(futureValue(100_000, 1_000, 0, 12), 100_000 + 12_000);
  });

  test("grows monotonically with the rate", () => {
    const low = futureValue(1_000_000, 10_000, RETURN_RANGE.lowBps, 120);
    const mid = futureValue(1_000_000, 10_000, RETURN_RANGE.midBps, 120);
    const high = futureValue(1_000_000, 10_000, RETURN_RANGE.highBps, 120);

    assert.ok(low < mid && mid < high);
  });

  test("grows monotonically with time", () => {
    const ten = futureValue(1_000_000, 10_000, 500, 120);
    const twenty = futureValue(1_000_000, 10_000, 500, 240);
    assert.ok(twenty > ten);
  });

  test("compounds — a principal at 5% for 12 months gains about 5%", () => {
    const result = futureValue(10_000_000, 0, 500, 12);
    assert.ok(Math.abs(result - 10_500_000) < 1_000); // within $10
  });
});

describe("roundForDisplay — no false precision at the source", () => {
  /**
   * "$1,247,832 at 65" is the single fastest way to lose a financially literate
   * user (docs/STRATEGY.md §3, P6). Enforced HERE rather than left to the
   * renderer, so a caller that formats without abbreviating still cannot
   * produce one.
   */
  test("snaps to three significant figures", () => {
    assert.equal(roundForDisplay(124_783_200), 125_000_000); // $1,247,832 → $1.25M
    assert.equal(roundForDisplay(95_712_300), 95_700_000);
  });

  test("never returns a figure below $1,000 granularity", () => {
    assert.equal(roundForDisplay(123_456) % 100_000, 0);
  });

  test("clamps at zero — no negative projections", () => {
    assert.equal(roundForDisplay(-500_000), 0);
    assert.equal(roundForDisplay(0), 0);
  });

  test("output is always an integer number of cents", () => {
    for (const input of [1, 999, 123_456_789, 4_000_000]) {
      assert.ok(Number.isInteger(roundForDisplay(input)));
    }
  });
});

describe("spreadMultiplier — the band width IS the uncertainty", () => {
  test("all-stated inputs draw the narrowest band", () => {
    assert.equal(spreadMultiplier(["stated", "stated", "stated"]), SPREAD.narrowest);
  });

  test("all-assumed inputs draw the widest", () => {
    assert.equal(
      spreadMultiplier(["assumed", "assumed", "assumed"]),
      SPREAD.widest,
    );
  });

  test("knowing more narrows it", () => {
    const less = spreadMultiplier(["assumed", "assumed", "stated"]);
    const more = spreadMultiplier(["inferred", "inferred", "stated"]);
    const most = spreadMultiplier(["stated", "stated", "stated"]);

    assert.ok(less > more && more > most);
  });

  test("blends rather than taking the weakest", () => {
    // If it took the weakest, these would be identical — one `assumed` input
    // would drag both to the widest band.
    assert.notEqual(
      spreadMultiplier(["assumed", "stated", "stated"]),
      spreadMultiplier(["assumed", "assumed", "assumed"]),
    );
  });
});

describe("project", () => {
  test("returns an ordered range, never a point", () => {
    for (const persona of PROJECTABLE) {
      const p = run(persona);
      assert.ok(
        p.lowCents <= p.centralCents && p.centralCents <= p.highCents,
        "range is out of order",
      );
    }
  });

  test("the band is genuinely wide — this is not a point estimate wearing a costume", () => {
    const p = run(UNADVISED_EARNER);
    assert.ok(
      p.highCents > p.lowCents * 1.2,
      "band collapsed to something indistinguishable from a point",
    );
  });

  test("a less-known profile draws a wider band than a well-known one", () => {
    const known: SituationProfile = {
      ...UNADVISED_EARNER,
      liquidCents: at(UNADVISED_EARNER.liquidCents.value, "stated"),
      monthlyOutCents: at(UNADVISED_EARNER.monthlyOutCents.value, "stated"),
      horizonMonths: at(UNADVISED_EARNER.horizonMonths.value, "stated"),
    };
    const guessed: SituationProfile = {
      ...known,
      liquidCents: at(UNADVISED_EARNER.liquidCents.value, "assumed"),
      monthlyOutCents: at(UNADVISED_EARNER.monthlyOutCents.value, "assumed"),
      horizonMonths: at(UNADVISED_EARNER.horizonMonths.value, "assumed"),
    };

    assert.ok(run(guessed).spreadMultiplier > run(known).spreadMultiplier);
  });

  test("confidence is capped at inferred and degrades with its inputs", () => {
    // Retirement contributions derive from an income BAND midpoint, so every
    // real projection is `assumed`. That is the trust model working.
    assert.equal(run(UNADVISED_EARNER).confidence, "assumed");
  });

  test("every figure it hands back is display-safe", () => {
    for (const persona of PROJECTABLE) {
      const p = run(persona);
      for (const cents of [p.lowCents, p.centralCents, p.highCents]) {
        assert.equal(roundForDisplay(cents), cents, "a raw figure leaked out");
      }
    }
  });

  test("horizon passes through untouched", () => {
    assert.equal(
      run(UNADVISED_EARNER).horizonMonths,
      UNADVISED_EARNER.horizonMonths.value,
    );
  });
});

describe("nothing to project", () => {
  /**
   * Someone at the liquidity floor has no deployable cash and no
   * contributions. The arithmetic answer is zero — and "your future: $0 – $0"
   * is exactly the guilt register the product rejects, on top of being a
   * distraction from a decision about next month.
   */
  test("returns null rather than a zeroed band", () => {
    assert.equal(project(PERSONAS.EARLY, OPTIONS), null);
  });

  test("contributions alone are enough to project", () => {
    const contributing: SituationProfile = {
      ...PERSONAS.EARLY,
      retirementBps: at(500, "stated"),
    };
    const result = project(contributing, OPTIONS);
    assert.ok(result, "contributions should be projectable without spare cash");
    assert.ok(result.highCents > 0);
  });

  test("deployable cash alone is enough to project", () => {
    const cashRich: SituationProfile = {
      ...PERSONAS.EARLY,
      liquidCents: at(5_000_000, "stated"),
      retirementBps: at(0, "stated"),
    };
    const result = project(cashRich, OPTIONS);
    assert.ok(result, "spare cash should be projectable without contributions");
    assert.ok(result.highCents > 0);
  });
});

describe("disclosure", () => {
  test("every assumption carries a confidence", () => {
    for (const a of run(UNADVISED_EARNER).assumptions) {
      assert.ok(["stated", "inferred", "assumed"].includes(a.confidence));
    }
  });

  test("states what it cannot see", () => {
    const labels = run(UNADVISED_EARNER)
      .assumptions.map((a) => a.label)
      .join(" | ");

    assert.match(labels, /Excludes anything you haven't told us about/);
    assert.match(labels, /Assumes your income holds/);
  });

  test("discloses the inputs the maths actually used", () => {
    const p = run(UNADVISED_EARNER);
    const byLabel = new Map(p.assumptions.map((a) => [a.label, a.value]));

    assert.equal(byLabel.get("Annual return, after inflation"), RETURN_RANGE.midBps);
    assert.equal(byLabel.get("Time horizon"), UNADVISED_EARNER.horizonMonths.value);
  });
});

describe("purity", () => {
  test("same inputs, same output", () => {
    for (const persona of PROJECTABLE) {
      assert.deepEqual(run(persona), run(persona));
    }
  });

  test("does not mutate the profile", () => {
    const snapshot = structuredClone(UNADVISED_EARNER);
    run(UNADVISED_EARNER);
    assert.deepEqual(UNADVISED_EARNER, snapshot);
  });

  test("`now` does not move the numbers", () => {
    const later = { ...OPTIONS, now: new Date("2030-01-01T00:00:00.000Z") };
    assert.equal(
      run(UNADVISED_EARNER).centralCents,
      project(UNADVISED_EARNER, later)?.centralCents,
    );
  });
});

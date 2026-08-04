import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { parseProfile } from "./parse.ts";

/**
 * The boundary between stored bytes and the engine.
 *
 * These are not type tests — TypeScript already believes the cast. They are
 * tests that the RUNTIME refuses records TypeScript was happy to lie about,
 * which is the only kind of lie `localStorage` can tell.
 */

const ASOF = "2026-07-01T00:00:00.000Z";
const stated = <T>(value: T) => ({ value, confidence: "stated", asOf: ASOF });

/** A record that must always parse, so a failure elsewhere is the change. */
function good(): Record<string, unknown> {
  return {
    openingConcern: stated("The card debt"),
    financialConfidence: stated("mostly-ok"),
    incomeBand: stated("over-400k"),
    liquidCents: stated(500_000),
    monthlyOutCents: stated(500_000),
    obligations: stated([{ kind: "card", balanceCents: 4_000_000, rateBps: 2_200 }]),
    dependents: stated(3),
    retirementBps: stated(0),
    employerMatchBps: stated(0),
    horizonMonths: stated(300),
  };
}

describe("parseProfile — what it accepts", () => {
  test("a complete record round-trips", () => {
    const parsed = parseProfile(good());
    assert.ok(parsed);
    assert.equal(parsed.liquidCents.value, 500_000);
    assert.equal(parsed.incomeBand.value, "over-400k");
    assert.equal(parsed.obligations.value[0]?.rateBps, 2_200);
  });

  test("goals are optional, and absent stays absent", () => {
    const parsed = parseProfile(good());
    assert.ok(parsed);
    assert.equal(parsed.goals, undefined);
  });

  test("a named goal survives with its own confidence", () => {
    const parsed = parseProfile({
      ...good(),
      goals: [
        {
          value: { label: "A deposit", targetCents: 5_000_000, savedCents: 0, withinMonths: 24 },
          confidence: "assumed",
          asOf: ASOF,
        },
      ],
    });
    assert.ok(parsed);
    assert.equal(parsed.goals?.length, 1);
    assert.equal(parsed.goals?.[0]?.confidence, "assumed");
  });
});

describe("parseProfile — what it refuses", () => {
  const rejects = (what: string, mutate: (r: Record<string, unknown>) => void) => {
    test(what, () => {
      const record = good();
      mutate(record);
      assert.equal(parseProfile(record), null);
    });
  };

  rejects("a missing field", (r) => delete r.liquidCents);
  rejects("a bare value with no Field envelope", (r) => {
    r.liquidCents = 500_000;
  });
  rejects("a confidence outside the lattice", (r) => {
    r.liquidCents = { value: 1, confidence: "guessed", asOf: ASOF };
  });
  rejects("an unreadable asOf", (r) => {
    r.liquidCents = { value: 1, confidence: "stated", asOf: "not a date" };
  });

  /**
   * The one that actually happened. `"400k-plus"` is a plausible typo for the
   * real `"over-400k"`, it carries the right version, and it put the running
   * app into its error boundary in a single render.
   */
  rejects("an income band that is not one of the four", (r) => {
    r.incomeBand = stated("400k-plus");
  });

  rejects("a string where cents belong", (r) => {
    r.liquidCents = stated("500000");
  });
  rejects("NaN, which is typeof number", (r) => {
    r.monthlyOutCents = stated(Number.NaN);
  });
  rejects("Infinity", (r) => {
    r.monthlyOutCents = stated(Number.POSITIVE_INFINITY);
  });
  rejects("negative cash", (r) => {
    r.liquidCents = stated(-1);
  });
  rejects("a fraction of a cent", (r) => {
    r.liquidCents = stated(1.5);
  });
  rejects("a rate above 100%", (r) => {
    r.retirementBps = stated(10_001);
  });
  rejects("an obligation with no kind", (r) => {
    r.obligations = stated([{ balanceCents: 1, rateBps: 1 }]);
  });
  rejects("an obligation kind outside the union", (r) => {
    r.obligations = stated([{ kind: "crypto", balanceCents: 1, rateBps: 1 }]);
  });
  rejects("obligations that are not a list", (r) => {
    r.obligations = stated({ kind: "card", balanceCents: 1, rateBps: 1 });
  });
  rejects("a goal with zero months, which would divide by zero", (r) => {
    r.goals = [
      { value: { label: "x", targetCents: 1, savedCents: 0, withinMonths: 0 }, confidence: "stated", asOf: ASOF },
    ];
  });
  rejects("a goal with no label", (r) => {
    r.goals = [
      { value: { targetCents: 1, savedCents: 0, withinMonths: 2 }, confidence: "stated", asOf: ASOF },
    ];
  });

  test("junk that is not an object at all", () => {
    assert.equal(parseProfile(null), null);
    assert.equal(parseProfile(undefined), null);
    assert.equal(parseProfile("{}"), null);
    assert.equal(parseProfile([]), null);
    assert.equal(parseProfile(42), null);
  });
});

describe("parseProfile — all or nothing", () => {
  /**
   * The dangerous case is the record that is ALMOST right. Salvaging it
   * produces a read the engine is confident about and the reader cannot
   * recognise; refusing it routes to onboarding, which is ninety seconds.
   */
  test("nine good fields and one bad is still refused", () => {
    const record = good();
    record.horizonMonths = stated(-1);
    assert.equal(parseProfile(record), null);
  });

  test("one bad goal refuses the whole profile, not just the goal", () => {
    const record = good();
    record.goals = [
      { value: { label: "A deposit", targetCents: 1, savedCents: 0, withinMonths: 12 }, confidence: "stated", asOf: ASOF },
      { value: { label: "Broken", targetCents: -5, savedCents: 0, withinMonths: 12 }, confidence: "stated", asOf: ASOF },
    ];
    assert.equal(parseProfile(record), null);
  });
});

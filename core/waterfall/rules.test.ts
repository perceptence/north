import { test, describe } from "node:test";
import assert from "node:assert/strict";
import type { Field } from "../confidence.ts";
import type { SituationProfile } from "../profile/types.ts";
import { derive, THRESHOLDS } from "./derive.ts";
import { ILLUSTRATIVE_LIMITS, totalTaxAdvantagedCents } from "./limits.ts";
import { RUNGS, rungById, WATERFALL_LENGTH } from "./rules.ts";
import type { RungContext } from "./types.ts";

const NOW = new Date("2026-07-27T00:00:00.000Z");
const ASOF = "2026-07-01T00:00:00.000Z";

const stated = <T>(value: T): Field<T> => ({
  value,
  confidence: "stated",
  asOf: ASOF,
});

/** A deliberately unremarkable profile: every rung satisfied. Override one thing per test. */
function profile(overrides: Partial<SituationProfile> = {}): SituationProfile {
  return {
    openingConcern: stated("—"),
    financialConfidence: stated("mostly-ok"),
    incomeBand: stated("100k-200k"), // $150k → $12,500/mo
    liquidCents: stated(4_000_000), // $40,000 → 4 months
    monthlyOutCents: stated(970_000), // $9,700
    obligations: stated([]),
    dependents: stated(0),
    retirementBps: stated(2_100), // exactly maxes the configured room
    employerMatchBps: stated(500),
    horizonMonths: stated(240),
    ...overrides,
  };
}

function ctxFor(p: SituationProfile): RungContext {
  return {
    profile: p,
    facts: derive(p, { limits: ILLUSTRATIVE_LIMITS, now: NOW }),
    limits: ILLUSTRATIVE_LIMITS,
    now: NOW,
  };
}

const isSatisfied = (id: Parameters<typeof rungById>[0], p: SituationProfile) =>
  rungById(id).satisfied(ctxFor(p));

describe("the ladder itself", () => {
  test("has seven rungs", () => {
    assert.equal(WATERFALL_LENGTH, 7);
  });

  /**
   * Order IS the judgment. Changing it changes what North tells every user, so
   * it is asserted rather than left to convention.
   */
  test("is in the documented priority order", () => {
    assert.deepEqual(
      RUNGS.map((r) => r.id),
      [
        "liquidity",
        "match",
        "high-interest-debt",
        "tax-advantaged",
        "goal",
        "taxable",
        "optimization",
      ],
    );
  });

  test("index matches position, 1-based", () => {
    RUNGS.forEach((rung, i) => assert.equal(rung.index, i + 1));
  });

  test("every rung produces a read with both actions", () => {
    for (const rung of RUNGS) {
      const read = rung.read(ctxFor(profile()));
      assert.ok(read.segments.length > 0, `${rung.id} has no segments`);
      assert.ok(read.action.commit.length > 0, `${rung.id} has no commit`);
      assert.ok(read.action.defer.length > 0, `${rung.id} has no defer`);
    }
  });
});

describe("1 · liquidity floor", () => {
  test("three months of outgoings clears it", () => {
    const out = 100_000;
    assert.equal(
      isSatisfied(
        "liquidity",
        profile({ monthlyOutCents: stated(out), liquidCents: stated(out * 3) }),
      ),
      true,
    );
  });

  test("just under three months does not", () => {
    const out = 100_000;
    assert.equal(
      isSatisfied(
        "liquidity",
        profile({
          monthlyOutCents: stated(out),
          liquidCents: stated(out * 3 - 1),
        }),
      ),
      false,
    );
  });

  test("dependents raise the floor to six", () => {
    const out = 100_000;
    const withFive = profile({
      monthlyOutCents: stated(out),
      liquidCents: stated(out * 5),
      dependents: stated(2),
    });
    const withSix = profile({
      monthlyOutCents: stated(out),
      liquidCents: stated(out * 6),
      dependents: stated(2),
    });

    assert.equal(isSatisfied("liquidity", withFive), false);
    assert.equal(isSatisfied("liquidity", withSix), true);
  });
});

describe("2 · employer match", () => {
  test("vacuously satisfied when no match is offered", () => {
    assert.equal(
      isSatisfied(
        "match",
        profile({ employerMatchBps: stated(0), retirementBps: stated(0) }),
      ),
      true,
    );
  });

  test("unsatisfied while contributing below the match", () => {
    assert.equal(
      isSatisfied(
        "match",
        profile({ employerMatchBps: stated(600), retirementBps: stated(300) }),
      ),
      false,
    );
  });

  test("meeting the match exactly is enough", () => {
    assert.equal(
      isSatisfied(
        "match",
        profile({ employerMatchBps: stated(600), retirementBps: stated(600) }),
      ),
      true,
    );
  });
});

describe("3 · high-interest debt", () => {
  test(`the threshold is ${THRESHOLDS.highInterestBps} bps, inclusive`, () => {
    const at = profile({
      obligations: stated([
        { kind: "card", balanceCents: 500_000, rateBps: THRESHOLDS.highInterestBps },
      ]),
    });
    const below = profile({
      obligations: stated([
        {
          kind: "card",
          balanceCents: 500_000,
          rateBps: THRESHOLDS.highInterestBps - 1,
        },
      ]),
    });

    assert.equal(isSatisfied("high-interest-debt", at), false);
    assert.equal(isSatisfied("high-interest-debt", below), true);
  });

  test("a paid-off obligation is ignored however punitive its rate", () => {
    assert.equal(
      isSatisfied(
        "high-interest-debt",
        profile({
          obligations: stated([
            { kind: "card", balanceCents: 0, rateBps: 2_900 },
          ]),
        }),
      ),
      true,
    );
  });

  test("the costliest obligation is the one surfaced", () => {
    const p = profile({
      obligations: stated([
        { kind: "card", balanceCents: 100_000, rateBps: 1_800 },
        { kind: "other", balanceCents: 100_000, rateBps: 2_400 },
        { kind: "auto", balanceCents: 100_000, rateBps: 900 },
      ]),
    });
    assert.equal(ctxFor(p).facts.costliestObligation.value?.rateBps, 2_400);
  });
});

describe("4 · tax-advantaged space", () => {
  test("satisfied once the configured room is used", () => {
    // $150k × 21% = $31,500 = the illustrative limit exactly.
    assert.equal(
      isSatisfied("tax-advantaged", profile({ retirementBps: stated(2_100) })),
      true,
    );
  });

  test("unsatisfied while any room remains", () => {
    assert.equal(
      isSatisfied("tax-advantaged", profile({ retirementBps: stated(2_000) })),
      false,
    );
  });

  test("over-contributing does not report negative room", () => {
    const facts = ctxFor(profile({ retirementBps: stated(3_000) })).facts;
    assert.equal(facts.unusedTaxAdvantaged.value, 0);
  });

  test("room is read from the injected limits, never hardcoded", () => {
    const doubled = {
      ...ILLUSTRATIVE_LIMITS,
      electiveDeferralCents: ILLUSTRATIVE_LIMITS.electiveDeferralCents * 2,
    };
    const p = profile({ retirementBps: stated(2_100) });
    const facts = derive(p, { limits: doubled, now: NOW });

    assert.equal(
      facts.unusedTaxAdvantaged.value,
      totalTaxAdvantagedCents(doubled) - 3_150_000,
    );
  });
});

describe("5 · goal funding", () => {
  test("satisfied when no goal is defined — the MVP case", () => {
    assert.equal(isSatisfied("goal", profile()), true);
  });

  test("satisfied once the target is met", () => {
    assert.equal(
      isSatisfied(
        "goal",
        profile({
          goals: [
            stated({
              label: "A deposit",
              targetCents: 5_000_000,
              savedCents: 5_000_000,
              withinMonths: 24,
            }),
          ],
        }),
      ),
      true,
    );
  });

  test("unsatisfied while a gap remains", () => {
    assert.equal(
      isSatisfied(
        "goal",
        profile({
          goals: [
            stated({
              label: "A deposit",
              targetCents: 5_000_000,
              savedCents: 1_000_000,
              withinMonths: 24,
            }),
          ],
        }),
      ),
      false,
    );
  });
});

describe("6 · surplus with nowhere to go", () => {
  test("a trivial surplus is not worth surfacing", () => {
    assert.equal(isSatisfied("taxable", profile()), true);
  });

  test("a meaningful surplus is", () => {
    assert.equal(
      isSatisfied("taxable", profile({ monthlyOutCents: stated(200_000) })),
      false,
    );
  });
});

describe("7 · optimization", () => {
  test(`cash within ${THRESHOLDS.idleCashCeilingMonths} months is fine`, () => {
    const out = 100_000;
    assert.equal(
      isSatisfied(
        "optimization",
        profile({
          monthlyOutCents: stated(out),
          liquidCents: stated(out * THRESHOLDS.idleCashCeilingMonths),
        }),
      ),
      true,
    );
  });

  test("beyond the ceiling it is idle", () => {
    const out = 100_000;
    assert.equal(
      isSatisfied(
        "optimization",
        profile({
          monthlyOutCents: stated(out),
          liquidCents: stated(out * (THRESHOLDS.idleCashCeilingMonths + 1)),
        }),
      ),
      false,
    );
  });
});

describe("emphasis — the big number lives inside the sentence", () => {
  test("no read emphasizes more than one figure", () => {
    for (const rung of RUNGS) {
      const read = rung.read(ctxFor(profile()));
      const emphasized = read.segments.filter(
        (s) => s.kind === "figure" && s.emphasis,
      ).length;
      assert.ok(
        emphasized <= 1,
        `${rung.id} emphasizes ${emphasized} figures — two is a dashboard`,
      );
    }
  });

  test("the hero read emphasizes the excess, not the balance", () => {
    const read = rungById("tax-advantaged").read(
      ctxFor(profile({ liquidCents: stated(14_000_000), monthlyOutCents: stated(1_200_000), retirementBps: stated(400) })),
    );
    const emphasized = read.segments.find(
      (s) => s.kind === "figure" && s.emphasis,
    );
    assert.ok(emphasized && emphasized.kind === "figure");
    assert.equal(emphasized.label, "of cash above the floor");
  });
});

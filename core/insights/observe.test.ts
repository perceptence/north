import { test, describe } from "node:test";
import assert from "node:assert/strict";
import {
  EARLY,
  FIXTURE_NOW,
  SETTLED,
  SQUEEZED,
  UNADVISED_EARNER,
} from "../../data/fixtures/personas.ts";
import type { Decision } from "../decisions/types.ts";
import type { SituationProfile } from "../profile/types.ts";
import { readToPlainText } from "../waterfall/evaluate.ts";
import { ILLUSTRATIVE_LIMITS } from "../waterfall/limits.ts";
import type { EvaluateOptions } from "../waterfall/types.ts";
import { observe } from "./observe.ts";
import type { Insight } from "./types.ts";

const OPTIONS: EvaluateOptions = {
  limits: ILLUSTRATIVE_LIMITS,
  now: FIXTURE_NOW,
};

const look = (profile: SituationProfile, decisions: Decision[] = []) =>
  observe(profile, decisions, OPTIONS);

const spoken = (insight: Insight) =>
  readToPlainText({ segments: insight.segments, action: { commit: "", defer: "" } });

const byKind = (report: ReturnType<typeof look>, kind: Insight["kind"]) =>
  report.insights.find((i) => i.kind === kind)!;

const decision = (over: Partial<Decision> = {}): Decision => ({
  id: over.id ?? "d1",
  rungId: over.rungId ?? "tax-advantaged",
  summary: over.summary ?? "Move the excess",
  outcome: over.outcome ?? "held",
  decidedAt: over.decidedAt ?? "2026-07-10T00:00:00.000Z",
  resolvedAt: over.resolvedAt,
  amountCents: over.amountCents,
});

describe("the report", () => {
  test("always carries all four observations, in order", () => {
    assert.deepEqual(
      look(UNADVISED_EARNER).insights.map((i) => i.kind),
      ["position", "record", "next-move", "blind-spot"],
    );
  });

  test("every observation is prose with a label", () => {
    for (const insight of look(UNADVISED_EARNER).insights) {
      assert.ok(insight.label.length > 0);
      assert.ok(spoken(insight).length > 20, `${insight.kind} is too thin`);
    }
  });

  test("ladder progress matches the engine", () => {
    const report = look(UNADVISED_EARNER);
    assert.equal(report.progress.total, 7);
    assert.equal(
      report.progress.cleared,
      report.progress.rungs.filter((r) => r.satisfied).length,
    );
  });
});

describe("buffer completeness", () => {
  /** The brief's own example — and one North can actually compute. */
  test("reads as a percentage of the floor", () => {
    // EARLY: $2,800 cash against $3,200/mo → 0 months against a 3-month floor.
    assert.equal(look(EARLY).bufferPercent, 0);
  });

  test("is capped at 100 — nobody needs to hear 380%", () => {
    // UNADVISED_EARNER holds 11 months against a 3-month floor.
    assert.equal(look(UNADVISED_EARNER).bufferPercent, 100);
  });

  test("renders as a real percentage, not a hundredth of one", () => {
    const said = spoken(byKind(look(UNADVISED_EARNER), "position"));
    assert.match(said, /100%/);
    assert.doesNotMatch(said, /\b1%|0\.\d+%/);
  });
});

describe("the record", () => {
  test("an empty ledger is an invitation, not a zero", () => {
    const said = spoken(byKind(look(UNADVISED_EARNER), "record"));
    assert.match(said, /Nothing yet/);
    assert.doesNotMatch(said, /\b0\b/);
  });

  test("counts what was held", () => {
    const said = spoken(
      byKind(
        look(UNADVISED_EARNER, [
          decision({ id: "a", outcome: "held" }),
          decision({ id: "b", outcome: "deferred", rungId: "taxable" }),
        ]),
        "record",
      ),
    );
    assert.match(said, /2 decisions/);
    assert.match(said, /held 1/);
  });

  /**
   * The tone constraint. A screen that tallies failures is the report card this
   * product exists to avoid.
   */
  test("never counts failures or scolds", () => {
    const said = spoken(
      byKind(
        look(UNADVISED_EARNER, [
          decision({ id: "a", outcome: "deferred" }),
          decision({ id: "b", outcome: "deferred", rungId: "taxable" }),
        ]),
        "record",
      ),
    );
    assert.doesNotMatch(said, /fail|missed|behind|should have|overdue/i);
  });

  test("reports when the record started", () => {
    const report = look(UNADVISED_EARNER, [
      decision({ id: "a", decidedAt: "2026-06-01T00:00:00.000Z" }),
      decision({ id: "b", decidedAt: "2026-07-10T00:00:00.000Z" }),
    ]);
    assert.equal(report.since, "2026-06-01T00:00:00.000Z");
  });
});

describe("the next move", () => {
  test("names a concrete change for whichever rung is current", () => {
    for (const profile of [EARLY, SQUEEZED, UNADVISED_EARNER]) {
      const said = spoken(byKind(look(profile), "next-move"));
      assert.match(said, /\$/, "should name a figure");
    }
  });

  test("someone with nothing outstanding is told so, warmly", () => {
    const said = spoken(byKind(look(SETTLED), "next-move"));
    assert.match(said, /Nothing needs changing/);
  });

  test("it tracks the ladder, not the person", () => {
    assert.match(spoken(byKind(look(EARLY), "next-move")), /buffer/i);
    assert.match(spoken(byKind(look(SQUEEZED), "next-move")), /Clearing/i);
  });
});

describe("what North can't see", () => {
  /**
   * The honest answer to "show me spending trends". North has no transactions
   * and says so rather than inventing a percentage.
   */
  test("states plainly that there is no view of accounts", () => {
    const said = spoken(byKind(look(UNADVISED_EARNER), "blind-spot"));
    assert.match(said, /no view of your accounts/i);
    assert.match(said, /income is a band/i);
  });

  test("confesses the fields the user admitted not knowing", () => {
    const unsure: SituationProfile = {
      ...UNADVISED_EARNER,
      employerMatchBps: { value: 0, confidence: "assumed", asOf: "2026-07-01T00:00:00.000Z" },
    };
    const said = spoken(byKind(look(unsure), "blind-spot"));
    assert.match(said, /what your employer matches/i);
  });

  test("says nothing extra when everything was stated", () => {
    const said = spoken(byKind(look(UNADVISED_EARNER), "blind-spot"));
    assert.doesNotMatch(said, /We are also guessing/);
  });
});

describe("purity", () => {
  test("same inputs, same report", () => {
    assert.deepEqual(look(UNADVISED_EARNER), look(UNADVISED_EARNER));
  });

  test("does not mutate what it is given", () => {
    const snapshot = structuredClone(UNADVISED_EARNER);
    look(UNADVISED_EARNER, [decision()]);
    assert.deepEqual(UNADVISED_EARNER, snapshot);
  });

  test("settled rungs are respected, exactly as on Today", () => {
    const withHeld = look(UNADVISED_EARNER, [
      decision({ rungId: "tax-advantaged", outcome: "held" }),
    ]);
    assert.doesNotMatch(
      spoken(byKind(withHeld, "next-move")),
      /tax-advantaged room/,
    );
  });
});

describe("the three-state ladder", () => {
  /**
   * The contradiction this screen exposed: holding a decision skips the rung
   * but does not satisfy it, so a two-state ladder said "still ahead" directly
   * beneath "nothing needs changing".
   */
  test("a held rung reads as settled, not as satisfied", () => {
    const report = look(UNADVISED_EARNER, [
      decision({ rungId: "tax-advantaged", outcome: "held" }),
    ]);
    const rung = report.progress.rungs.find((r) => r.id === "tax-advantaged")!;

    assert.equal(rung.settled, true, "the user acted on it");
    assert.equal(rung.satisfied, false, "but the profile hasn't caught up");
    assert.equal(report.progress.settled, 1);
  });

  test("settling is not counted as clearing", () => {
    const before = look(UNADVISED_EARNER);
    const after = look(UNADVISED_EARNER, [
      decision({ rungId: "tax-advantaged", outcome: "held" }),
    ]);
    assert.equal(after.progress.cleared, before.progress.cleared);
  });

  test("with nothing outstanding, the all-clear is unqualified", () => {
    assert.match(
      spoken(byKind(look(SETTLED), "next-move")),
      /Nothing needs changing/,
    );
  });

  test("with something settled but unreflected, it says so instead", () => {
    const said = spoken(
      byKind(
        look(UNADVISED_EARNER, [
          decision({ rungId: "tax-advantaged", outcome: "held" }),
          decision({ id: "b", rungId: "taxable", outcome: "held" }),
        ]),
        "next-move",
      ),
    );
    assert.match(said, /Nothing is waiting on you/);
    assert.match(said, /isn't reflected|aren't reflected/);
    assert.doesNotMatch(said, /genuinely unusual/);
  });
});

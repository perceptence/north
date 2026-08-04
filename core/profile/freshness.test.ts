import { test, describe } from "node:test";
import assert from "node:assert/strict";
import type { Field } from "../confidence.ts";
import type { SituationProfile } from "./types.ts";
import { SHELF_LIFE_DAYS, agePhrase, staleAnswer } from "./freshness.ts";

const NOW = new Date("2026-08-04T00:00:00.000Z");
const DAY = 86_400_000;

/** An answer given `days` before NOW. */
const aged = <T>(value: T, days: number): Field<T> => ({
  value,
  confidence: "stated",
  asOf: new Date(NOW.getTime() - days * DAY).toISOString(),
});

/** Everything answered yesterday — nothing stale unless a test ages it. */
function profile(overrides: Partial<SituationProfile> = {}): SituationProfile {
  return {
    openingConcern: aged("—", 1),
    financialConfidence: aged("mostly-ok", 1),
    incomeBand: aged("100k-200k", 1),
    liquidCents: aged(4_000_000, 1),
    monthlyOutCents: aged(970_000, 1),
    obligations: aged([], 1),
    dependents: aged(0, 1),
    retirementBps: aged(2_100, 1),
    employerMatchBps: aged(500, 1),
    horizonMonths: aged(240, 1),
    ...overrides,
  };
}

describe("staleAnswer — the coach's own clock", () => {
  test("a fresh picture asks nothing", () => {
    assert.equal(staleAnswer(profile(), NOW), null);
  });

  test("an answer one day inside its shelf life is still fresh", () => {
    const p = profile({ liquidCents: aged(1, SHELF_LIFE_DAYS.liquid - 1) });
    assert.equal(staleAnswer(p, NOW), null);
  });

  test("an answer exactly at its shelf life is due", () => {
    const p = profile({ liquidCents: aged(1, SHELF_LIFE_DAYS.liquid) });
    assert.equal(staleAnswer(p, NOW)?.turnId, "liquid");
  });

  test("it reports the real age, not the shelf life", () => {
    const p = profile({ liquidCents: aged(1, 400) });
    assert.equal(staleAnswer(p, NOW)?.ageDays, 400);
  });
});

describe("staleAnswer — one question, and the right one", () => {
  /**
   * The reason overdue-ness is the comparison rather than raw age. `horizon`
   * is allowed to be two years old; cash is not allowed to be four months
   * old. A 200-day-old horizon is FINE and a 200-day-old cash figure is
   * badly overdue, so sorting by age would ask the wrong question.
   */
  test("the most overdue wins, not the oldest", () => {
    const p = profile({
      horizonMonths: aged(240, 700), // 700 of 730 — still fresh
      liquidCents: aged(1, 200), // 200 of 120 — 80 days overdue
    });
    assert.equal(staleAnswer(p, NOW)?.turnId, "liquid");
  });

  test("only ever one question, however much has aged", () => {
    const p = profile({
      liquidCents: aged(1, 900),
      monthlyOutCents: aged(1, 900),
      incomeBand: aged("100k-200k", 900),
      dependents: aged(0, 900),
    });
    const due = staleAnswer(p, NOW);
    assert.ok(due);
    // A single TurnId, not a list — the type enforces it, this documents it.
    assert.equal(typeof due.turnId, "string");
  });

  test("answering re-stamps asOf, and the question goes away", () => {
    const stale = profile({ liquidCents: aged(1, 900) });
    assert.equal(staleAnswer(stale, NOW)?.turnId, "liquid");

    const confirmed = profile({ liquidCents: aged(1, 0) });
    assert.equal(staleAnswer(confirmed, NOW), null);
  });
});

describe("staleAnswer — refusing to invent a question", () => {
  test("an unreadable asOf is skipped, not treated as ancient", () => {
    const p = profile({
      liquidCents: { value: 1, confidence: "stated", asOf: "not a date" },
    });
    assert.equal(staleAnswer(p, NOW), null);
  });

  test("a future asOf is not stale", () => {
    const p = profile({ liquidCents: aged(1, -30) });
    assert.equal(staleAnswer(p, NOW), null);
  });
});

describe("agePhrase — vague on purpose", () => {
  test("recent answers count days", () => {
    assert.equal(agePhrase(12), "12 days ago");
  });

  test("a month is a month", () => {
    assert.equal(agePhrase(35), "about a month ago");
  });

  test("months round rather than enumerate", () => {
    assert.equal(agePhrase(120), "about 4 months ago");
  });

  test("a year stops counting", () => {
    assert.equal(agePhrase(400), "over a year ago");
    assert.equal(agePhrase(800), "over 2 years ago");
  });

  test("no false precision anywhere in it", () => {
    for (const days of [1, 29, 30, 59, 60, 364, 365, 1000]) {
      assert.doesNotMatch(agePhrase(days), /\d{3,}/);
    }
  });
});

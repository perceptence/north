import { test, describe } from "node:test";
import assert from "node:assert/strict";
import {
  DEADLINE_SPEAKS_WITHIN_DAYS,
  ILLUSTRATIVE_LIMITS,
  daysLeftInTaxYear,
  totalTaxAdvantagedCents,
} from "./limits.ts";

const LIMITS = { ...ILLUSTRATIVE_LIMITS, year: 2026 };

describe("totalTaxAdvantagedCents", () => {
  test("is both vehicles together", () => {
    assert.equal(
      totalTaxAdvantagedCents(LIMITS),
      LIMITS.electiveDeferralCents + LIMITS.iraCents,
    );
  });
});

describe("daysLeftInTaxYear", () => {
  test("counts to midnight on 1 January of the next year", () => {
    assert.equal(
      daysLeftInTaxYear(LIMITS, new Date("2026-12-31T00:00:00.000Z")),
      1,
    );
    assert.equal(
      daysLeftInTaxYear(LIMITS, new Date("2026-12-01T00:00:00.000Z")),
      31,
    );
  });

  test("a full year has its full length", () => {
    assert.equal(
      daysLeftInTaxYear(LIMITS, new Date("2026-01-01T00:00:00.000Z")),
      365,
    );
  });

  /**
   * The room belongs to a TAX YEAR, not to whatever year the clock is in.
   * Running the demo in 2027 against 2026 limits must not produce a countdown
   * against the wrong year's room — the honest answer is that it is gone.
   */
  test("a year that is over has no days left, never a negative", () => {
    assert.equal(
      daysLeftInTaxYear(LIMITS, new Date("2027-01-01T00:00:00.000Z")),
      0,
    );
    assert.equal(
      daysLeftInTaxYear(LIMITS, new Date("2029-06-01T00:00:00.000Z")),
      0,
    );
  });

  test("it does not shift with the reader's timezone", () => {
    // Same instant, two ways of writing it. UTC throughout, so both agree.
    const utc = daysLeftInTaxYear(LIMITS, new Date("2026-10-05T00:00:00.000Z"));
    const offset = daysLeftInTaxYear(
      LIMITS,
      new Date("2026-10-04T20:00:00.000-04:00"),
    );
    assert.equal(utc, offset);
  });
});

describe("the deadline only speaks when it means something", () => {
  test("the window is a quarter, not a year", () => {
    assert.ok(DEADLINE_SPEAKS_WITHIN_DAYS > 0);
    assert.ok(DEADLINE_SPEAKS_WITHIN_DAYS < 180);
  });

  /**
   * "320 days to use it" in January is padding, not urgency, and this product
   * spends its words carefully. These two dates are the boundary either side.
   */
  test("January is outside it and October is inside it", () => {
    const january = daysLeftInTaxYear(LIMITS, new Date("2026-01-15T00:00:00.000Z"));
    const october = daysLeftInTaxYear(LIMITS, new Date("2026-10-15T00:00:00.000Z"));
    assert.ok(january > DEADLINE_SPEAKS_WITHIN_DAYS);
    assert.ok(october <= DEADLINE_SPEAKS_WITHIN_DAYS);
  });
});

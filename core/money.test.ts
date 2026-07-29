import { test, describe } from "node:test";
import assert from "node:assert/strict";
import {
  formatCount,
  formatCurrency,
  formatMonths,
  formatPercent,
} from "./money.ts";

describe("money — integer discipline", () => {
  /**
   * Float drift in a financial product is an instant credibility kill and it is
   * unrecoverable once a user notices. The guard is loud on purpose.
   */
  test("throws rather than silently formatting a float", () => {
    assert.throws(() => formatCurrency(1234.5), TypeError);
    assert.throws(() => formatPercent(6.5), TypeError);
    assert.throws(() => formatMonths(1.5), TypeError);
  });

  test("accepts zero and negatives", () => {
    assert.equal(formatCurrency(0), "$0");
    assert.equal(formatCurrency(-450_000), "−$4,500");
  });
});

describe("formatCurrency", () => {
  test("renders whole dollars without decimals", () => {
    assert.equal(formatCurrency(4_000_000), "$40,000");
    assert.equal(formatCurrency(100), "$1");
  });

  test("renders cents when they are non-zero", () => {
    assert.equal(formatCurrency(123_456), "$1,234.56");
  });

  test("abbreviates only when asked", () => {
    assert.equal(formatCurrency(124_000_000), "$1,240,000");
    assert.equal(formatCurrency(124_000_000, { abbreviate: true }), "$1.2M");
    assert.equal(formatCurrency(4_000_000, { abbreviate: true }), "$40K");
  });

  test("trims a trailing zero in abbreviations", () => {
    assert.equal(formatCurrency(100_000_000, { abbreviate: true }), "$1M");
  });
});

describe("formatPercent", () => {
  test("reads basis points", () => {
    assert.equal(formatPercent(600), "6%");
    assert.equal(formatPercent(675), "6.75%");
    assert.equal(formatPercent(2_200), "22%");
    assert.equal(formatPercent(0), "0%");
  });
});

describe("formatMonths", () => {
  test("pluralises months", () => {
    assert.equal(formatMonths(1), "1 month");
    assert.equal(formatMonths(11), "11 months");
    assert.equal(formatMonths(0), "0 months");
  });

  test("collapses whole years", () => {
    assert.equal(formatMonths(12), "1 year");
    assert.equal(formatMonths(24), "2 years");
  });

  test("keeps months when the span is not a whole number of years", () => {
    assert.equal(formatMonths(18), "18 months");
  });
});

describe("formatCount", () => {
  test("groups thousands", () => {
    assert.equal(formatCount(1_284), "1,284");
  });
});

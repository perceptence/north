import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { derived, weakest, type Confidence } from "./confidence.ts";

describe("confidence lattice", () => {
  test("weakest picks the lowest of the set", () => {
    assert.equal(weakest("stated", "stated"), "stated");
    assert.equal(weakest("stated", "inferred"), "inferred");
    assert.equal(weakest("inferred", "assumed"), "assumed");
    assert.equal(weakest("stated", "inferred", "assumed"), "assumed");
  });

  test("weakest of nothing is stated", () => {
    assert.equal(weakest(), "stated");
  });

  test("weakest is order-independent", () => {
    assert.equal(
      weakest("assumed", "stated", "inferred"),
      weakest("inferred", "assumed", "stated"),
    );
  });

  /**
   * The rule that stops a computed figure from presenting itself with more
   * authority than it has earned. Everything else in the trust model rests on
   * this holding.
   */
  test("derived NEVER returns stated, even from all-stated inputs", () => {
    assert.equal(derived("stated"), "inferred");
    assert.equal(derived("stated", "stated", "stated"), "inferred");
    assert.equal(derived(), "inferred");
  });

  test("derived still degrades to the weakest input", () => {
    assert.equal(derived("stated", "assumed"), "assumed");
    assert.equal(derived("inferred", "assumed"), "assumed");
  });

  test("derived is idempotent", () => {
    const levels: Confidence[] = ["stated", "inferred", "assumed"];
    for (const level of levels) {
      assert.equal(derived(derived(level)), derived(level));
    }
  });
});

import { test, describe } from "node:test";
import assert from "node:assert/strict";

import { BASELINE_MIN_DAYS, pickBaseline } from "./baseline.ts";

const NOW = new Date("2026-08-03T12:00:00.000Z");
const DAY = 86_400_000;
const at = (daysAgo: number) => ({
  at: new Date(NOW.getTime() - daysAgo * DAY).toISOString(),
});

describe("what the letter measures against", () => {
  test("nothing on file is no baseline", () => {
    assert.equal(pickBaseline([], NOW), null);
  });

  test("picks the most recent state old enough to report on", () => {
    // Oldest first, as the store keeps them.
    const history = [at(40), at(12), at(5), at(0)];
    assert.deepEqual(pickBaseline(history, NOW), at(5));
  });

  /**
   * The regression this exists for.
   *
   * The store appends a snapshot on every write, so "the previous profile" is
   * the state from immediately before the last edit. Correcting one number
   * turned Insights from "5 WEEKS · four things moved" into "1 DAYS · Nothing
   * changed. That's fine" and hid the only link to the story — punishing the
   * reviewer for using the correction loop.
   */
  test("a correction seconds ago does not become the baseline", () => {
    const history = [at(35), at(0)];
    assert.deepEqual(
      pickBaseline(history, NOW),
      at(35),
      "should reach past the fresh write",
    );
  });

  test("several corrections in a row still reach past all of them", () => {
    const history = [at(35), at(0), at(0), at(0)];
    assert.deepEqual(pickBaseline(history, NOW), at(35));
  });

  test("when everything on file is recent, the oldest is the honest answer", () => {
    // "Since we started" is true. "Since two seconds ago" is not.
    const history = [at(2), at(1), at(0)];
    assert.deepEqual(pickBaseline(history, NOW), at(2));
  });

  test("the boundary is inclusive, so a state exactly old enough counts", () => {
    const history = [at(BASELINE_MIN_DAYS), at(0)];
    assert.deepEqual(pickBaseline(history, NOW), at(BASELINE_MIN_DAYS));
  });

  test("one state on file is that state, whatever its age", () => {
    assert.deepEqual(pickBaseline([at(0)], NOW), at(0));
    assert.deepEqual(pickBaseline([at(90)], NOW), at(90));
  });
});

import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

import {
  FREE_SCENARIOS,
  TIER_LINES,
  NEVER_GATED,
  PLUS_PRICE_CENTS,
  canOpenScenario,
  goalLimit,
  scenarioTier,
  storyIncluded,
  voiceIncluded,
} from "./rules.ts";
import { SCENARIOS } from "../navigator/scenarios.ts";

describe("the line between free and plus", () => {
  /**
   * THE ETHICS PIN. The scenario that tells you to stop losing money is
   * never sold back to you. If Plus ever widens to take it, this fails —
   * loudly, and on purpose: the product would have started charging for
   * the warning.
   */
  it("never charges for the warning", () => {
    assert.ok(FREE_SCENARIOS.has("debt-first"));
    assert.ok(canOpenScenario("free", "debt-first"));
  });

  it("keeps one real scenario free, so free demonstrates what one is", () => {
    assert.ok(FREE_SCENARIOS.size >= 2, "free is a locked showroom");
  });

  it("classifies every scenario the engine can actually run", () => {
    // Driven off the real list, not a hand-copied one — a new scenario must
    // land on a tier the day it exists.
    for (const scenario of SCENARIOS) {
      const tier = scenarioTier(scenario.id);
      assert.ok(tier === "free" || tier === "plus", scenario.id);
      assert.equal(canOpenScenario("plus", scenario.id), true);
    }
  });

  it("the first goal is always discussable", () => {
    assert.equal(goalLimit("free"), 1);
    assert.ok(goalLimit("plus") > goalLimit("free"));
  });

  it("plus buys the modality and the replay, not the knowledge", () => {
    assert.equal(voiceIncluded("free"), false);
    assert.equal(voiceIncluded("plus"), true);
    assert.equal(storyIncluded("free"), false);
    assert.equal(storyIncluded("plus"), true);
  });

  it("the price is integer cents, like every other amount", () => {
    assert.equal(PLUS_PRICE_CENTS, Math.round(PLUS_PRICE_CENTS));
    assert.equal(PLUS_PRICE_CENTS, 499);
  });

  it("the honesty sentence still tells the truth", () => {
    // The copy promises the read is never gated. The read lives on Today and
    // in the letter, which have no tier parameter at all — but the sentence
    // also implies the warning stays free, which IS a gateable surface.
    assert.match(NEVER_GATED, /never buys: the read/);
    assert.ok(FREE_SCENARIOS.has("debt-first"), "the copy just became a lie");
  });
});

describe("the comparison a reader is shown", () => {
  /**
   * The paywall has to show what free ALREADY gives, or it is an
   * advertisement. This is also the honest claim about this product: most
   * rows say yes on both sides, and hiding that would misrepresent it.
   */
  it("says what both tiers hold, on every line", () => {
    assert.ok(TIER_LINES.length >= 6, "too thin to be a comparison");
    for (const line of TIER_LINES) {
      assert.ok(line.what.length > 0);
      assert.ok(line.free === true || line.free.length > 0, line.what);
      assert.ok(line.plus === true || line.plus.length > 0, line.what);
    }
  });

  it("free is a complete coach, not a teaser", () => {
    // The majority of the table is already yours. If a change ever tips this
    // the other way, the product has become a trial rather than a tier.
    const whole = TIER_LINES.filter((line) => line.free === true).length;
    assert.ok(
      whole > TIER_LINES.length / 2,
      `only ${whole} of ${TIER_LINES.length} lines are free in full`,
    );
  });

  it("the read is one of the lines free holds in full", () => {
    const read = TIER_LINES.find((line) => /daily read/i.test(line.what));
    assert.ok(read, "the comparison stopped naming the read");
    assert.equal(read.free, true);
  });
});

describe("the engine has never heard of money", () => {
  /**
   * The structural version of the promise: nothing in the reasoning core
   * imports membership. `evaluate()` cannot give a poorer read to a free
   * user because it cannot ASK who is asking.
   *
   * A source-level guard, in the spirit of the repo's `grep -rE` purity
   * check — types can't express "this module is never imported over there",
   * so the test reads the files.
   */
  it("no reasoning module imports membership", () => {
    const root = join(import.meta.dirname, "..");
    for (const dir of ["waterfall", "insights", "decisions", "coach", "goals"]) {
      for (const file of readdirSync(join(root, dir))) {
        if (!file.endsWith(".ts") || file.endsWith(".test.ts")) continue;
        const source = readFileSync(join(root, dir, file), "utf8");
        assert.ok(
          !source.includes("membership"),
          `${dir}/${file} knows about tiers — the read is no longer safe`,
        );
      }
    }
  });
});

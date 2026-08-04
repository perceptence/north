import { describe, it } from "node:test";
import assert from "node:assert/strict";

import { explain, type DerivationKey } from "./explain.ts";
import { UNADVISED_EARNER, FIXTURE_NOW } from "../../data/fixtures/personas.ts";
import { derive } from "../waterfall/derive.ts";
import { ILLUSTRATIVE_LIMITS } from "../waterfall/limits.ts";
import { RUNGS } from "../waterfall/rules.ts";
import type { ReadSegment } from "../waterfall/types.ts";

const OPTIONS = { limits: ILLUSTRATIVE_LIMITS, now: FIXTURE_NOW };
const FACTS = derive(UNADVISED_EARNER, OPTIONS);

const KEYS: DerivationKey[] = [
  "liquidityMonths",
  "excessCash",
  "unusedTaxAdvantaged",
  "monthlySurplus",
  "monthlyIncome",
  "annualRetirement",
];

const said = (segments: ReadSegment[]) =>
  segments.map((s) => (s.kind === "text" ? s.value : "⟨fig⟩")).join("");

describe("showing the working", () => {
  it("explains every figure the engine says it can", () => {
    for (const key of KEYS) {
      const working = explain(key, UNADVISED_EARNER, FACTS, OPTIONS);
      assert.ok(working.title.length > 0, key);
      assert.ok(working.steps.length > 0, `${key} has no working`);
      assert.ok(working.result.length > 0, `${key} reaches no conclusion`);
    }
  });

  /**
   * The point of the rewrite. A table of values is what this replaced; a
   * chain that does not SAY anything would be the same thing with different
   * markup.
   */
  it("is sentences, not a list of values", () => {
    for (const key of KEYS) {
      const working = explain(key, UNADVISED_EARNER, FACTS, OPTIONS);
      for (const step of working.steps) {
        const prose = said(step.segments).replace(/⟨fig⟩/g, "").trim();
        assert.ok(prose.length > 12, `${key}: bare figure with no sentence`);
      }
      assert.match(said(working.result), /[a-z]{4,}/, `${key}: result is bare`);
    }
  });

  it("lands on the figure that was tapped", () => {
    // The conclusion must restate the actual derived value — an explanation
    // that ends somewhere else has explained the wrong thing.
    const cases: Array<[DerivationKey, number]> = [
      ["liquidityMonths", FACTS.liquidityMonths.value],
      ["excessCash", FACTS.excessCash.value],
      ["unusedTaxAdvantaged", FACTS.unusedTaxAdvantaged.value],
      ["monthlySurplus", FACTS.monthlySurplus.value],
      ["monthlyIncome", FACTS.monthlyIncome.value],
      ["annualRetirement", FACTS.annualRetirement.value],
    ];
    for (const [key, expected] of cases) {
      const { result } = explain(key, UNADVISED_EARNER, FACTS, OPTIONS);
      const values = result
        .filter((s) => s.kind === "figure")
        .map((s) => (s.kind === "figure" ? s.value : null));
      assert.ok(values.includes(expected), `${key} did not land on ${expected}`);
    }
  });

  it("every figure carries a confidence, like every other number", () => {
    for (const key of KEYS) {
      const working = explain(key, UNADVISED_EARNER, FACTS, OPTIONS);
      const all = [...working.steps.flatMap((s) => s.segments), ...working.result];
      for (const segment of all) {
        if (segment.kind !== "figure") continue;
        assert.ok(segment.confidence, `${key}: bare figure with no confidence`);
      }
    }
  });

  it("offers a correction only where the input is the user's to change", () => {
    // The room the tax code allows is not a thing anyone can correct, and
    // offering it would be a lie about what the tap does.
    const room = explain("unusedTaxAdvantaged", UNADVISED_EARNER, FACTS, OPTIONS);
    assert.equal(room.steps[0].from, undefined, "offered to edit the tax code");
    assert.ok(
      room.steps.some((s) => s.from === "retirement"),
      "never offers the input that IS correctable",
    );
  });

  /**
   * The guard that keeps the two in step. Every figure the engine marks
   * `explains` must name a derivation this module can actually compose —
   * `explains` is a string on the segment (importing the union back would be
   * a cycle), so nothing else checks the spelling.
   */
  it("every `explains` the engine declares can be explained", () => {
    const declared = new Set<string>();
    for (const rung of RUNGS) {
      const read = rung.read({
        profile: UNADVISED_EARNER,
        facts: FACTS,
        limits: ILLUSTRATIVE_LIMITS,
        now: FIXTURE_NOW,
      });
      for (const segment of read.segments) {
        if (segment.kind === "figure" && segment.explains) {
          declared.add(segment.explains);
        }
      }
    }
    assert.ok(declared.size > 0, "no figure declares its working");
    for (const key of declared) {
      assert.ok(
        (KEYS as string[]).includes(key),
        `the engine declares "${key}" but nothing explains it`,
      );
    }
  });
});

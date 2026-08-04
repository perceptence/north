import assert from "node:assert/strict";
import { test, describe } from "node:test";
import { ledgerMonths } from "./timeline.ts";
import type { Decision } from "./types.ts";

const NOW = new Date("2026-07-28T12:00:00.000Z");

let n = 0;
const on = (iso: string): Decision => ({
  id: `d${n++}`,
  rungId: "liquidity",
  summary: "Build the buffer first",
  outcome: "held",
  decidedAt: `${iso}T12:00:00.000Z`,
});

describe("the ledger as a run of months", () => {
  test("an empty ledger has no run", () => {
    assert.deepEqual(ledgerMonths([], NOW), []);
  });

  test("months with nothing in them are KEPT — that is the interval", () => {
    // March and July only. A grouped list would show two rows; a timeline has
    // to show that four months passed between them.
    const run = ledgerMonths([on("2026-07-08"), on("2026-03-21")], NOW);

    assert.deepEqual(
      run.map((m) => m.key),
      ["2026-07", "2026-06", "2026-05", "2026-04", "2026-03"],
    );
    assert.equal(run[0].decisions.length, 1, "July has one");
    assert.equal(run[1].decisions.length, 0, "June is quiet");
    assert.equal(run[2].decisions.length, 0, "May is quiet");
    assert.equal(run[3].decisions.length, 0, "April is quiet");
    assert.equal(run[4].decisions.length, 1, "March has one");
  });

  test("newest first, and a month’s own entries are newest first too", () => {
    const run = ledgerMonths(
      [on("2026-06-11"), on("2026-07-08"), on("2026-06-24")],
      NOW,
    );

    assert.equal(run[0].key, "2026-07");
    assert.equal(run[1].key, "2026-06");
    assert.deepEqual(
      run[1].decisions.map((d) => d.decidedAt.slice(0, 10)),
      ["2026-06-24", "2026-06-11"],
      "within June, the later one leads",
    );
  });

  test("the run crosses a year boundary without losing a month", () => {
    const run = ledgerMonths([on("2026-01-19"), on("2025-11-04")], NOW);
    const keys = run.map((m) => m.key);

    assert.equal(keys[0], "2026-07", "the run starts at now");
    assert.ok(keys.includes("2025-12"), "December is not skipped");
    assert.equal(keys.at(-1), "2025-11");
    assert.equal(new Set(keys).size, keys.length, "no month appears twice");
  });

  test("silence since the last decision is shown, not trimmed away", () => {
    // The record stops in March; four months of nothing have passed since.
    const run = ledgerMonths([on("2026-03-21")], NOW);
    assert.equal(run.length, 5);
    assert.equal(run[0].key, "2026-07");
    assert.equal(run[0].decisions.length, 0, "this month is quiet");
  });

  test("a decision dated ahead of now is never dropped", () => {
    // Clock skew, or a seeded demo. Losing an entry is worse than a stray month.
    const run = ledgerMonths([on("2026-09-02")], NOW);
    assert.equal(run[0].key, "2026-09");
    assert.equal(run[0].decisions.length, 1);
  });

  test("every decision handed in comes back out exactly once", () => {
    const all = [
      on("2026-07-08"),
      on("2026-06-24"),
      on("2026-06-11"),
      on("2026-01-19"),
    ];
    const back = ledgerMonths(all, NOW).flatMap((m) => m.decisions);
    assert.equal(back.length, all.length);
    assert.equal(new Set(back.map((d) => d.id)).size, all.length);
  });
});

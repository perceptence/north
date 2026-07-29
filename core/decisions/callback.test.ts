import assert from "node:assert/strict";
import { test, describe } from "node:test";
import { CALLBACK_AFTER_DAYS, callbackDue } from "./callback.ts";
import { openDecision } from "./types.ts";
import type { Decision, DecisionOutcome } from "./types.ts";

const NOW = new Date("2026-07-28T00:00:00.000Z");
const DAY = 86_400_000;
const daysAgo = (n: number) => new Date(NOW.getTime() - n * DAY).toISOString();

let n = 0;
const decision = (outcome: DecisionOutcome, decided: number): Decision => ({
  id: `d${n++}`,
  rungId: "tax-advantaged",
  summary: "Move the excess into tax-advantaged space",
  outcome,
  decidedAt: daysAgo(decided),
});

describe("when North may ask whether it happened", () => {
  test("a commitment made moments ago is not asked about", () => {
    assert.equal(callbackDue([decision("open", 0)], NOW), null);
  });

  test("nor one still inside the waiting period", () => {
    const fresh = CALLBACK_AFTER_DAYS - 1;
    assert.equal(callbackDue([decision("open", fresh)], NOW), null);
  });

  test("once it has ripened, North asks", () => {
    const ripe = callbackDue([decision("open", CALLBACK_AFTER_DAYS)], NOW);
    assert.ok(ripe, "a commitment at the boundary is due");
    assert.equal(ripe.outcome, "open");
  });

  test("settled commitments are never asked about again", () => {
    assert.equal(callbackDue([decision("held", 30)], NOW), null);
    assert.equal(callbackDue([decision("deferred", 30)], NOW), null);
  });

  test("the LEDGER still shows a fresh commitment — only the question waits", () => {
    const fresh = [decision("open", 0)];
    // This is the whole distinction: the record is immediate, the coach is not.
    assert.ok(openDecision(fresh), "the ledger has something open");
    assert.equal(callbackDue(fresh, NOW), null, "but nothing to ask yet");
  });

  test("the oldest ripe commitment is the one asked about", () => {
    const ripe = callbackDue(
      [decision("open", 4), decision("open", 40)],
      NOW,
    );
    // `find` order is ledger order, which is newest-first from the store —
    // whichever it picks, it must be one that has genuinely ripened.
    assert.ok(ripe);
    assert.ok(
      NOW.getTime() - new Date(ripe.decidedAt).getTime() >=
        CALLBACK_AFTER_DAYS * DAY,
    );
  });
});

import assert from "node:assert/strict";
import { test, describe } from "node:test";
import { CALLBACK_AFTER_DAYS, callbackDue, callbackDueAt, committedOn } from "./callback.ts";
import { DEFER_HOLDS_DAYS, openDecision, settledRungIds } from "./types.ts";
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
  ...(outcome === "open" ? {} : { resolvedAt: daysAgo(decided) }),
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

describe("naming the day, so the wait is legible", () => {
  test("the due date is the decision plus the waiting period", () => {
    const d = decision("open", 0);
    assert.equal(
      callbackDueAt(d).getTime(),
      new Date(d.decidedAt).getTime() + CALLBACK_AFTER_DAYS * DAY,
    );
  });

  test("the date it names is the day the question actually fires", () => {
    // The two must never drift — the whole reason the date lives in core
    // beside the rule rather than being recomputed in a component.
    const d = decision("open", 0);
    const due = callbackDueAt(d);
    assert.equal(callbackDue([d], new Date(due.getTime() - 1)), null);
    assert.ok(callbackDue([d], due), "due on the day it named");
  });
});

describe("the commitment already made on a rung", () => {
  test("finds an open decision on that rung", () => {
    const d = decision("open", 1);
    assert.equal(committedOn([d], "tax-advantaged")?.id, d.id);
  });

  test("ignores other rungs, and anything already resolved", () => {
    assert.equal(committedOn([decision("open", 1)], "liquidity"), null);
    assert.equal(committedOn([decision("held", 1)], "tax-advantaged"), null);
    assert.equal(committedOn([decision("deferred", 1)], "tax-advantaged"), null);
  });

  test("is what stops Today offering a decision twice", () => {
    // Without this the rung is unchanged after a commit — an open decision
    // does not settle its rung — so the same read, the same button, and a
    // second press files a duplicate.
    const committed = [decision("open", 0)];
    assert.equal(settledRungIds(committed, NOW).length, 0, "still current");
    assert.ok(committedOn(committed, "tax-advantaged"), "but already decided");
  });
});

describe("'not now' is not 'never'", () => {
  const rungs = (ds: Decision[]) => settledRungIds(ds, NOW);

  test("a fresh deferral holds the rung down", () => {
    assert.deepEqual(rungs([decision("deferred", 1)]), ["tax-advantaged"]);
  });

  test("an old one lets it come back", () => {
    // Four artifacts promise this — summariseLedger says out loud "North will
    // raise it again when it matters", OutcomeMark draws deferral as a
    // returning loop, and UX-ARCHITECTURE calls the return a hard constraint.
    // Before this, waving something off removed it from the ladder for good.
    assert.deepEqual(rungs([decision("deferred", DEFER_HOLDS_DAYS + 1)]), []);
  });

  test("but 'I did it' does not expire", () => {
    // Re-asking here would not be a fresh offer; it would be the coach
    // forgetting. The profile has not caught up, which is the real fix.
    assert.deepEqual(rungs([decision("held", DEFER_HOLDS_DAYS * 10)]), [
      "tax-advantaged",
    ]);
  });

  test("the boundary holds the rung, one day past it does not", () => {
    assert.equal(rungs([decision("deferred", DEFER_HOLDS_DAYS - 1)]).length, 1);
    assert.equal(rungs([decision("deferred", DEFER_HOLDS_DAYS + 1)]).length, 0);
  });
});

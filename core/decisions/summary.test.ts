import assert from "node:assert/strict";
import { test, describe } from "node:test";
import { summariseLedger } from "./summary.ts";
import type { Decision, DecisionOutcome } from "./types.ts";

/**
 * The tone constraint is the spec here. A ledger summary that can be read as a
 * scoreboard has reintroduced the guilt the screen exists to remove.
 */

let n = 0;
const decision = (outcome: DecisionOutcome): Decision => ({
  id: `d${n++}`,
  rungId: "liquidity",
  summary: "Build the buffer",
  outcome,
  decidedAt: "2026-06-01T00:00:00.000Z",
});

const words = (decisions: Decision[]) =>
  summariseLedger(decisions)
    .read.map((s) => (s.kind === "text" ? s.value : String(s.value)))
    .join("");

describe("the ledger summary", () => {
  test("an empty ledger has nothing to say, and says so", () => {
    const summary = summariseLedger([]);
    assert.equal(summary.empty, true);
    assert.deepEqual(summary.read, []);
  });

  test("all held is stated plainly, not celebrated", () => {
    const said = words([decision("held"), decision("held")]);
    assert.match(said, /held every decision/);
    // No scoreboard vocabulary, ever.
    assert.doesNotMatch(said, /streak|100%|perfect|congrat|well done|score/i);
  });

  test("deferrals are a second kind of thing, never a shortfall", () => {
    const said = words([decision("held"), decision("deferred")]);
    assert.match(said, /set/);
    assert.match(said, /aside for later/);
    // "1 of 2" implies one that got away. A deferral is a decision.
    assert.doesNotMatch(said, /\bof 2\b|out of|hit rate|missed|failed/i);
  });

  test("a ledger of only deferrals is not a failure state", () => {
    const said = words([decision("deferred"), decision("deferred")]);
    assert.match(said, /Nothing is overdue/);
    assert.doesNotMatch(said, /missed|failed|behind|should have/i);
  });

  test("open commitments are named as waiting, not as debt", () => {
    const said = words([decision("held"), decision("open")]);
    assert.match(said, /waiting on you/);
    assert.doesNotMatch(said, /owe|overdue|outstanding|pending action/i);
  });

  test("every count in the sentence is a Figure, never raw text", () => {
    const summary = summariseLedger([
      decision("held"),
      decision("deferred"),
      decision("open"),
    ]);
    const figures = summary.read.filter((s) => s.kind === "figure");
    assert.equal(figures.length, 3, "held, deferred and open each carry one");
    for (const f of figures) {
      assert.equal(f.kind === "figure" && f.format, "count");
      assert.equal(f.kind === "figure" && f.confidence, "stated");
    }
  });

  test("singular and plural both read as English", () => {
    assert.match(words([decision("held")]), /1 of them so far/);
    assert.match(words([decision("open")]), /1 decision is waiting/);
    assert.match(
      words([decision("open"), decision("open")]),
      /2 decisions are waiting/,
    );
  });
});

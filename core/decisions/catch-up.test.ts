import { test, describe } from "node:test";
import assert from "node:assert/strict";

import { catchUpDue } from "./catch-up.ts";
import type { Decision } from "./types.ts";
import { UNADVISED_EARNER } from "../../data/fixtures/personas.ts";
import type { SituationProfile } from "../profile/types.ts";
import type { RungId } from "../waterfall/types.ts";

const NOW = new Date("2026-08-03T00:00:00.000Z");
const DAY = 86_400_000;
const daysAgo = (n: number) => new Date(NOW.getTime() - n * DAY).toISOString();

let n = 0;
const held = (rungId: RungId, resolved: number): Decision => ({
  id: `d${n++}`,
  rungId,
  summary: "Did the thing",
  outcome: "held",
  decidedAt: daysAgo(resolved + 2),
  resolvedAt: daysAgo(resolved),
});

/** The hero, with one field's `asOf` moved. */
const stamped = (
  field: keyof SituationProfile,
  days: number,
): SituationProfile =>
  ({
    ...UNADVISED_EARNER,
    [field]: {
      ...(UNADVISED_EARNER[field] as { value: unknown; confidence: string }),
      asOf: daysAgo(days),
    },
  }) as SituationProfile;

describe("the question North owes you after you acted", () => {
  test("asks when the field is older than the commitment behind it", () => {
    // Buffer built 10 days ago; North last heard about the cash 30 days ago.
    const profile = stamped("liquidCents", 30);
    assert.equal(catchUpDue(profile, [held("liquidity", 10)]), "liquid");
  });

  test("says nothing once the field has caught up", () => {
    // The correction was answered — `applyAnswers` re-stamps `asOf` to now,
    // which is what makes this self-clearing rather than a flag to reset.
    const profile = stamped("liquidCents", 1);
    assert.equal(catchUpDue(profile, [held("liquidity", 10)]), null);
  });

  test("the boundary counts as caught up, not behind", () => {
    const profile = stamped("liquidCents", 10);
    assert.equal(catchUpDue(profile, [held("liquidity", 10)]), null);
  });

  test("maps each rung to the field that rung is about", () => {
    assert.equal(
      catchUpDue(stamped("retirementBps", 30), [held("match", 5)]),
      "retirement",
    );
    assert.equal(
      catchUpDue(stamped("obligations", 30), [held("high-interest-debt", 5)]),
      "expensiveDebt",
    );
    assert.equal(
      catchUpDue(stamped("retirementBps", 30), [held("tax-advantaged", 5)]),
      "retirement",
    );
  });

  test("stays quiet for rungs where acting changes nothing North asked about", () => {
    // `goal` and `taxable` map to null in FIELD_BEHIND_RUNG — re-asking would
    // be interrupting someone to hear the same answer.
    assert.equal(catchUpDue(stamped("liquidCents", 30), [held("goal", 5)]), null);
    assert.equal(catchUpDue(stamped("liquidCents", 30), [held("taxable", 5)]), null);
  });

  test("only 'I did it' implies the situation moved", () => {
    const profile = stamped("liquidCents", 30);
    const deferred: Decision = { ...held("liquidity", 5), outcome: "deferred" };
    const open: Decision = { ...held("liquidity", 5), outcome: "open" };
    assert.equal(catchUpDue(profile, [deferred]), null);
    assert.equal(catchUpDue(profile, [open]), null);
  });

  test("asks about the most recent thing, not all of them at once", () => {
    // Decisions arrive newest-first from the store. A coach that opens with
    // four questions because you had a productive month is a form.
    const profile = {
      ...stamped("liquidCents", 30),
      retirementBps: {
        ...UNADVISED_EARNER.retirementBps,
        asOf: daysAgo(30),
      },
    } as SituationProfile;
    const turn = catchUpDue(profile, [held("match", 2), held("liquidity", 20)]);
    assert.equal(turn, "retirement", "the newer commitment wins");
  });

  test("nothing on the ledger is nothing to ask", () => {
    assert.equal(catchUpDue(UNADVISED_EARNER, []), null);
  });

  /**
   * The promise this exists to keep, stated as a test.
   *
   * DecisionsScreen prints "North will ask what changed next time you're on
   * Today". Nothing recorded that intent — only a click handler inside
   * Today's own callback branch ever opened the sheet, so resolving from the
   * ledger dropped the promise silently. Derived from the data, it holds
   * whichever screen did the resolving.
   */
  test("holds regardless of which screen resolved the commitment", () => {
    const profile = stamped("liquidCents", 30);
    // No UI state involved — the same decision list is the whole input.
    assert.equal(catchUpDue(profile, [held("liquidity", 0)]), "liquid");
  });
});

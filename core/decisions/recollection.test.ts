import { test, describe } from "node:test";
import assert from "node:assert/strict";

import { profileWhen, recollect } from "./recollection.ts";
import type { Decision } from "./types.ts";
import { ILLUSTRATIVE_LIMITS } from "../waterfall/limits.ts";
import {
  FIXTURE_NOW,
  SQUEEZED,
  UNADVISED_EARNER,
} from "../../data/fixtures/personas.ts";
import type { SituationProfile } from "../profile/types.ts";
import type { RungId } from "../waterfall/types.ts";

const OPTIONS = { limits: ILLUSTRATIVE_LIMITS, now: FIXTURE_NOW };

const decision = (rungId: RungId, decidedAt = "2026-07-01T00:00:00.000Z"): Decision => ({
  id: "d1",
  rungId,
  summary: "Do the thing",
  outcome: "open",
  decidedAt,
});

const said = (segments: ReturnType<typeof recollect>) =>
  (segments ?? []).map((s) => (s.kind === "text" ? s.value : "⟨fig⟩")).join("");

describe("the recollection — the second sentence of the return", () => {
  test("recalls months of cover for a liquidity decision", () => {
    const out = recollect(decision("liquidity"), UNADVISED_EARNER, OPTIONS);
    assert.ok(out, "the hero has cash, so there is something to recall");
    assert.match(said(out), /^Last time we spoke you were holding ⟨fig⟩ of cover/);
    assert.match(said(out), /Let's see where you landed\.$/);
  });

  test("recalls the debt and its rate for a debt decision", () => {
    const out = recollect(decision("high-interest-debt"), SQUEEZED, OPTIONS);
    assert.ok(out);
    // "carrying $3,400 at 22%" — the unit rides on the figure's own format,
    // and "of expensive debt" is its accessible label rather than visible
    // prose, matching how every other read in the engine is built.
    assert.match(said(out), /carrying ⟨fig⟩ at ⟨fig⟩/);
    const figures = out.filter((s) => s.kind === "figure");
    assert.equal(figures.length, 2, "the balance and the rate");
    assert.equal(figures[0].kind === "figure" && figures[0].format, "currency");
    assert.equal(figures[1].kind === "figure" && figures[1].format, "percent");
  });

  test("recalls unused room for a tax-advantaged decision", () => {
    const out = recollect(decision("tax-advantaged"), UNADVISED_EARNER, OPTIONS);
    assert.ok(out);
    assert.match(said(out), /leaving ⟨fig⟩ of tax-advantaged room unused/);
  });

  /**
   * A recollection that has to reach is worse than none. The caller renders
   * the question alone in that case, which is exactly what shipped before
   * this existed.
   */
  test("says nothing rather than reaching, when there is nothing to recall", () => {
    // No expensive debt on file — the hero's only obligation is a mortgage.
    assert.equal(
      recollect(decision("high-interest-debt"), UNADVISED_EARNER, OPTIONS),
      null,
    );
  });

  test("every figure carries a confidence, like every other number", () => {
    const out = recollect(decision("liquidity"), UNADVISED_EARNER, OPTIONS);
    const figures = (out ?? []).filter((s) => s.kind === "figure");
    assert.ok(figures.length > 0);
    for (const f of figures) {
      assert.ok(f.kind === "figure" && f.confidence, "no bare figure");
    }
  });

  test("is derived, so it cannot contradict the engine it came from", () => {
    // Same profile, same options, same answer — nothing is stored at commit
    // time and read back, so a recollection can never quote a stale rule.
    const a = recollect(decision("liquidity"), UNADVISED_EARNER, OPTIONS);
    const b = recollect(decision("liquidity"), UNADVISED_EARNER, OPTIONS);
    assert.deepEqual(a, b);
  });
});

describe("the profile of the day it was decided", () => {
  const older = { ...UNADVISED_EARNER } as SituationProfile;
  const newer = { ...SQUEEZED } as SituationProfile;
  const history = [
    { at: "2026-06-01T00:00:00.000Z", profile: older },
    { at: "2026-07-15T00:00:00.000Z", profile: newer },
  ];

  test("picks the state in force at that moment, not the newest", () => {
    // A decision made on 1 July was made under the state superseded on 15
    // July — the second snapshot, not the first.
    assert.equal(profileWhen(history, "2026-07-01T00:00:00.000Z", SQUEEZED), newer);
  });

  test("reaches back for a decision older than every snapshot", () => {
    assert.equal(profileWhen(history, "2026-05-01T00:00:00.000Z", SQUEEZED), older);
  });

  test("falls back to the current profile when nothing superseded it", () => {
    // Nothing has been superseded since, so today's state IS that day's.
    assert.equal(
      profileWhen(history, "2026-08-01T00:00:00.000Z", UNADVISED_EARNER),
      UNADVISED_EARNER,
    );
  });

  test("an empty history is just the current profile", () => {
    assert.equal(profileWhen([], "2026-07-01T00:00:00.000Z", SQUEEZED), SQUEEZED);
  });
});

import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { FIXTURE_NOW, UNADVISED_EARNER } from "../../data/fixtures/personas.ts";
import type { Decision } from "../decisions/types.ts";
import { applyAnswers } from "../onboarding/correction.ts";
import { readToPlainText } from "../waterfall/evaluate.ts";
import { ILLUSTRATIVE_LIMITS } from "../waterfall/limits.ts";
import { composeLetter } from "./letter.ts";

const OPTIONS = { limits: ILLUSTRATIVE_LIMITS, now: FIXTURE_NOW };
const SINCE = "2026-06-01T00:00:00.000Z";

const spoken = (segments: Parameters<typeof readToPlainText>[0]["segments"]) =>
  readToPlainText({ segments, action: { commit: "", defer: "" } });

const whole = (letter: ReturnType<typeof composeLetter>) =>
  [
    letter.opening,
    ...letter.entries.flatMap((e) => [e.segments, e.meaning]),
    letter.closing,
  ]
    .map(spoken)
    .join(" ");

const said = (value: string | number) =>
  ({ value, confidence: "stated" }) as const;

describe("the letter", () => {
  test("no previous snapshot opens the record, without pretending", () => {
    const letter = composeLetter(null, null, UNADVISED_EARNER, [], OPTIONS);
    assert.match(whole(letter), /start of the record/i);
    assert.equal(letter.quiet, false);
  });

  test("an unchanged month is allowed to say so", () => {
    const letter = composeLetter(
      UNADVISED_EARNER,
      SINCE,
      UNADVISED_EARNER,
      [],
      OPTIONS,
    );
    assert.equal(letter.quiet, true);
    assert.match(whole(letter), /Nothing changed\. That’s fine/);
  });

  test("a buffer that moved is named with both figures", () => {
    // $140k → $60k of cash: 11 months of cover down to 5.
    const slimmer = applyAnswers(UNADVISED_EARNER, { liquid: said(6_000_000) }, FIXTURE_NOW);
    const letter = composeLetter(UNADVISED_EARNER, SINCE, slimmer, [], OPTIONS);
    const text = whole(letter);

    assert.match(text, /came down from/);
    assert.match(text, /11 months/);
    assert.match(text, /5 months/);
  });

  test("a rung cleared since the snapshot is celebrated in words, once", () => {
    const before = applyAnswers(
      UNADVISED_EARNER,
      { retirement: said(300), employerMatch: said(600) },
      FIXTURE_NOW,
    );
    const after = applyAnswers(before, { retirement: said(600) }, FIXTURE_NOW);
    const letter = composeLetter(before, SINCE, after, [], OPTIONS);

    assert.match(whole(letter), /put the employer match behind you/);
  });

  test("held decisions since the snapshot are counted; older ones are not", () => {
    const decisions: Decision[] = [
      {
        id: "old", rungId: "match", summary: "…", outcome: "held",
        decidedAt: "2026-05-01T00:00:00.000Z", resolvedAt: "2026-05-02T00:00:00.000Z",
      },
      {
        id: "new", rungId: "taxable", summary: "…", outcome: "held",
        decidedAt: "2026-07-01T00:00:00.000Z", resolvedAt: "2026-07-02T00:00:00.000Z",
      },
    ];
    const letter = composeLetter(
      UNADVISED_EARNER, SINCE, UNADVISED_EARNER, decisions, OPTIONS,
    );
    assert.match(whole(letter), /held 1 decision you’d made/);
  });

  test("never scolds — no failure vocabulary in any letter", () => {
    for (const decisions of [[], [{
      id: "d", rungId: "taxable" as const, summary: "…", outcome: "deferred" as const,
      decidedAt: "2026-07-01T00:00:00.000Z",
    }]]) {
      const letter = composeLetter(
        UNADVISED_EARNER, SINCE, UNADVISED_EARNER, decisions, OPTIONS,
      );
      assert.doesNotMatch(
        `${whole(letter)} ${spoken(letter.footnote)}`,
        /fail|missed|behind schedule|overdue|should have/i,
      );
    }
  });

  test("naming a goal is a change the letter notices", () => {
    const named = applyAnswers(
      UNADVISED_EARNER,
      {
        goalLabel: said("A home deposit"),
        goalTarget: said(8_000_000),
        goalWhen: said(36),
        goalSaved: said(1_500_000),
      },
      FIXTURE_NOW,
    );
    const letter = composeLetter(UNADVISED_EARNER, SINCE, named, [], OPTIONS);
    assert.equal(letter.quiet, false);
    assert.match(whole(letter), /named where you’re going — a home deposit/);
  });

  test("every letter closes on the current position", () => {
    const letter = composeLetter(null, null, UNADVISED_EARNER, [], OPTIONS);
    assert.match(whole(letter), /tax-advantaged space/);
  });
});

import { describe, it } from "node:test";
import assert from "node:assert/strict";

import { behind } from "./behind.ts";
import { composeLetter } from "./letter.ts";
import type { LetterEntry } from "./letter.ts";
import {
  FIXTURE_ASOF,
  FIXTURE_NOW,
  SQUEEZED,
  UNADVISED_EARNER,
} from "../../data/fixtures/personas.ts";
import { ILLUSTRATIVE_LIMITS } from "../waterfall/limits.ts";
import type { Decision } from "../decisions/types.ts";
import type { SituationProfile } from "../profile/types.ts";
import type { ReadSegment } from "../waterfall/types.ts";

const OPTIONS = { limits: ILLUSTRATIVE_LIMITS, now: FIXTURE_NOW };

const DECISIONS: Decision[] = [
  {
    id: "d1",
    rungId: "liquidity",
    summary: "Build the buffer first",
    outcome: "held",
    decidedAt: "2026-06-25T00:00:00.000Z",
  } as Decision,
  {
    id: "d2",
    rungId: "tax-advantaged",
    summary: "Move the excess into tax-advantaged space",
    outcome: "open",
    decidedAt: "2026-07-20T00:00:00.000Z",
  } as Decision,
];

/**
 * The hero, plus a named goal.
 *
 * `UNADVISED_EARNER` has none, and a `goal` dispatch honestly returns null
 * without one — which is correct behaviour and exactly why the goal case
 * needs its own profile rather than being asserted against a fixture that
 * cannot produce it.
 */
const WITH_GOAL: SituationProfile = {
  ...UNADVISED_EARNER,
  goals: [
    {
      value: {
        label: "a sabbatical",
        targetCents: 4_000_000,
        withinMonths: 24,
        savedCents: 500_000,
      },
      confidence: "stated",
      asOf: FIXTURE_ASOF,
    },
  ],
} as SituationProfile;

const said = (segments: ReadSegment[]) =>
  segments.map((s) => (s.kind === "text" ? s.value : "⟨fig⟩")).join("");

const entry = (kind: LetterEntry["kind"]): LetterEntry => ({
  kind,
  label: kind,
  segments: [],
  meaning: [],
  direction: "steady",
});

describe("what is behind a dispatch", () => {
  it("opens every kind the letter can actually produce", () => {
    // Not a hand-written list of kinds: the guard is that whatever
    // `composeLetter` emits, something can be opened behind it. A new kind
    // added to the letter fails here rather than shipping a dead tap.
    const letter = composeLetter(
      SQUEEZED,
      "2026-06-01T00:00:00.000Z",
      UNADVISED_EARNER,
      DECISIONS,
      OPTIONS,
    );
    assert.ok(letter.entries.length > 0, "the fixture letter is empty");

    for (const e of letter.entries) {
      const detail = behind(e, SQUEEZED, UNADVISED_EARNER, DECISIONS, OPTIONS);
      assert.ok(detail, `nothing behind a "${e.kind}" dispatch`);
      assert.ok(detail.thesis.length > 0, e.kind);
      assert.ok(detail.sections.length > 0, `${e.kind} opened onto nothing`);
      // The words on the surface that say it opens at all. Without one the
      // dispatch is a tap target nobody knows is there.
      assert.ok(detail.cue.length > 0, `${e.kind} has no cue`);
    }
  });

  it("says something the dispatch did not already say", () => {
    // The whole point. A room that repeats the sentence you tapped is the
    // repeated-elaboration failure in a different surface.
    const letter = composeLetter(
      SQUEEZED,
      "2026-06-01T00:00:00.000Z",
      UNADVISED_EARNER,
      DECISIONS,
      OPTIONS,
    );
    for (const e of letter.entries) {
      const detail = behind(e, SQUEEZED, UNADVISED_EARNER, DECISIONS, OPTIONS)!;
      const surface = said(e.segments) + said(e.meaning);
      const inside = detail.sections.map((s) => said(s.segments)).join(" ");
      assert.notEqual(inside, surface, `${e.kind} just repeated itself`);
      assert.ok(inside.length > 0, e.kind);
    }
  });

  it("every section is prose, not a bare figure", () => {
    for (const kind of ["buffer", "ladder", "record", "goal"] as const) {
      const detail = behind(
        entry(kind),
        SQUEEZED,
        UNADVISED_EARNER,
        DECISIONS,
        OPTIONS,
      );
      if (!detail) continue;
      for (const section of detail.sections) {
        assert.ok(section.heading.length > 0, `${kind}: unlabelled section`);
        const prose = said(section.segments).replace(/⟨fig⟩/g, "").trim();
        assert.ok(prose.length > 8, `${kind}: bare figures, no sentence`);
      }
    }
  });

  it("every figure carries a confidence, like every other number", () => {
    for (const kind of ["buffer", "ladder", "record", "goal"] as const) {
      const detail = behind(
        entry(kind),
        SQUEEZED,
        UNADVISED_EARNER,
        DECISIONS,
        OPTIONS,
      );
      if (!detail) continue;
      for (const section of detail.sections) {
        for (const segment of section.segments) {
          if (segment.kind !== "figure") continue;
          assert.ok(segment.confidence, `${kind}: bare figure`);
        }
      }
    }
  });

  /**
   * `null` rather than a room that opens onto an apology. An empty ledger has
   * nothing behind it, and offering to show it anyway is worse than not
   * offering.
   */
  it("refuses to open a record that does not exist yet", () => {
    assert.equal(
      behind(entry("record"), null, UNADVISED_EARNER, [], OPTIONS),
      null,
    );
    assert.ok(behind(entry("record"), null, UNADVISED_EARNER, DECISIONS, OPTIONS));
  });

  /**
   * A first reading is not a change. Without a previous profile there is
   * nothing to say about what moved, so the room says less rather than
   * inventing a comparison.
   */
  it("only claims what moved when there is something to compare to", () => {
    const withPast = behind(
      entry("buffer"),
      SQUEEZED,
      UNADVISED_EARNER,
      DECISIONS,
      OPTIONS,
    )!;
    const firstRun = behind(
      entry("buffer"),
      null,
      UNADVISED_EARNER,
      DECISIONS,
      OPTIONS,
    )!;
    const headings = (d: typeof withPast) => d.sections.map((s) => s.heading);
    assert.ok(headings(withPast).includes("What moved"));
    assert.ok(!headings(firstRun).includes("What moved"));
  });

  it("offers a way onward, and it is a name rather than a URL", () => {
    for (const kind of ["buffer", "ladder", "record", "goal"] as const) {
      const detail = behind(
        entry(kind),
        SQUEEZED,
        UNADVISED_EARNER,
        DECISIONS,
        OPTIONS,
      );
      if (!detail?.goes) continue;
      assert.ok(
        ["today", "decisions", "goals", "insights"].includes(detail.goes),
        `${kind}: ${detail.goes} is not a destination`,
      );
      assert.ok(detail.goesLabel, `${kind}: a door with no label`);
      assert.ok(!detail.goesLabel!.includes("/"), `${kind}: label is a path`);
    }
  });
});

describe("the cue on the surface", () => {
  /**
   * Named per kind, not one phrase reused four times. "See the working" is
   * true of the buffer and meaningless of the record — a cue that does not
   * describe what is actually behind it is a label, not an offer.
   */
  it("says something different for each kind", () => {
    const cues = (["buffer", "ladder", "record", "goal"] as const)
      .map((kind) =>
        behind(entry(kind), SQUEEZED, WITH_GOAL, DECISIONS, OPTIONS),
      )
      .filter((d) => d !== null)
      .map((d) => d!.cue);

    assert.equal(cues.length, 4, "a kind stopped opening");
    assert.equal(new Set(cues).size, 4, `two kinds share a cue: ${cues.join(" / ")}`);
    // A phrase you could tap, not a heading. Every one names an action.
    for (const cue of cues) {
      assert.match(cue, /^See /, cue);
    }
  });
});

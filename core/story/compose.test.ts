import assert from "node:assert/strict";
import { test } from "node:test";
import { composeStory } from "./compose.ts";
import { ILLUSTRATIVE_LIMITS } from "../waterfall/index.ts";
import type { Decision } from "../decisions/types.ts";
import type { SituationProfile } from "../profile/types.ts";

/**
 * What matters here is that the story cannot manufacture a narrative: every
 * middle beat has to correspond to something that really changed.
 */

const NOW = new Date("2026-07-28T00:00:00.000Z");
const OPTIONS = { limits: ILLUSTRATIVE_LIMITS, now: NOW };
const AS_OF = "2026-06-01T00:00:00.000Z";

const stated = <T,>(value: T) => ({ value, confidence: "stated" as const, asOf: AS_OF });

function profile(over: Partial<SituationProfile> = {}): SituationProfile {
  return {
    openingConcern: stated("Cash piling up"),
    financialConfidence: stated("mostly-ok"),
    incomeBand: stated("200k-400k"),
    liquidCents: stated(5_000_000),
    monthlyOutCents: stated(1_200_000),
    obligations: stated([]),
    dependents: stated(0),
    retirementBps: stated(200),
    employerMatchBps: stated(400),
    horizonMonths: stated(300),
    ...over,
  } as SituationProfile;
}

test("with no prior snapshot there is no story to tell", () => {
  const story = composeStory(null, null, profile(), [], OPTIONS);
  assert.equal(story.tooEarly, true);
  assert.deepEqual(story.beats, []);
});

test("a stretch where nothing moved is too early, not a padded story", () => {
  const same = profile();
  const story = composeStory(same, AS_OF, same, [], OPTIONS);
  assert.equal(story.tooEarly, true);
  assert.equal(story.beats.length, 0);
});

test("a real change produces an opening, that change, and a closing", () => {
  const story = composeStory(
    profile(),
    AS_OF,
    profile({ liquidCents: stated(14_000_000) }),
    [],
    OPTIONS,
  );

  assert.equal(story.tooEarly, false);
  assert.equal(story.beats[0].id, "opening");
  assert.equal(story.beats.at(-1)?.id, "closing");
  // Opening + closing are orientation; everything between is a real diff.
  assert.ok(story.beats.length >= 3);
});

test("more real changes make a longer story — never a fixed length", () => {
  const one = composeStory(
    profile(),
    AS_OF,
    profile({ liquidCents: stated(14_000_000) }),
    [],
    OPTIONS,
  );
  const held: Decision[] = [
    {
      id: "d1",
      rungId: "liquidity",
      summary: "Build the buffer",
      outcome: "held",
      decidedAt: "2026-06-10T00:00:00.000Z",
      resolvedAt: "2026-06-20T00:00:00.000Z",
    } as Decision,
  ];
  const two = composeStory(
    profile(),
    AS_OF,
    profile({ liquidCents: stated(14_000_000) }),
    held,
    OPTIONS,
  );

  assert.ok(two.beats.length > one.beats.length);
});

test("the opening carries the OLD horizon and the closing today's", () => {
  const story = composeStory(
    profile(),
    AS_OF,
    profile({ liquidCents: stated(14_000_000) }),
    [],
    OPTIONS,
  );
  const opening = story.beats[0].projection;
  const closing = story.beats.at(-1)?.projection;

  assert.ok(opening && closing);
  // More cash invested means a higher band — the field visibly widens.
  assert.ok(closing.highCents > opening.highCents);
});

test("every beat carries a glyph, so the mark always has somewhere to morph", () => {
  const story = composeStory(
    profile(),
    AS_OF,
    profile({ liquidCents: stated(14_000_000) }),
    [],
    OPTIONS,
  );
  for (const beat of story.beats) {
    assert.ok(typeof beat.glyph === "string" && beat.glyph.length > 0);
  }
});

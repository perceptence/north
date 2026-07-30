import assert from "node:assert/strict";
import { test, describe } from "node:test";
import { SCRIPT, type ChoiceTurn, type TurnId } from "./script.ts";
import { extractNumber, matchChoice, rankChoices } from "./voice-match.ts";

/**
 * Turns pulled from the REAL script, never hand-copied — a test suite that
 * keeps its own paraphrase of the options would silently stop testing the
 * thing it claims to test the moment someone edits script.ts.
 */
function turn(id: TurnId): ChoiceTurn {
  const found = SCRIPT.find((t) => t.id === id);
  assert.ok(found, `no turn named ${id} in the script`);
  assert.equal(found.kind, "choice", `${id} is not a choice turn`);
  return found as ChoiceTurn;
}

describe("extractNumber", () => {
  test("digit form, with and without punctuation", () => {
    assert.equal(extractNumber("$20,000"), 20_000);
    assert.equal(extractNumber("20000"), 20_000);
    assert.equal(extractNumber("about 3.5%"), 3.5);
  });

  test("k and m suffixes", () => {
    assert.equal(extractNumber("20k"), 20_000);
    assert.equal(extractNumber("$100k"), 100_000);
    assert.equal(extractNumber("1.2 million"), 1_200_000);
  });

  test("word form, single and chained", () => {
    assert.equal(extractNumber("ten"), 10);
    assert.equal(extractNumber("twenty thousand"), 20_000);
    assert.equal(extractNumber("two hundred thousand"), 200_000);
    assert.equal(extractNumber("three percent"), 3);
  });

  test("a trailing unit word is ignored, not mistaken for part of the number", () => {
    assert.equal(extractNumber("ten years"), 10);
    assert.equal(extractNumber("about $2,000 a month"), 2_000);
  });

  test("no number present returns null rather than a wrong guess", () => {
    assert.equal(extractNumber("honestly pretty lost"), null);
    assert.equal(extractNumber("mostly fine"), null);
  });

  test("zero-ish words all read as 0", () => {
    assert.equal(extractNumber("no"), 0);
    assert.equal(extractNumber("nothing"), 0);
    assert.equal(extractNumber("none"), 0);
  });
});

describe("matching a purely qualitative turn (confidence)", () => {
  const t = turn("confidence");

  test("a close paraphrase matches", () => {
    const m = matchChoice(t, "I'd say mostly fine");
    assert.equal(m?.value, "mostly-ok");
  });

  test("a hedge word doesn't stop the match", () => {
    const m = matchChoice(t, "honestly, I'm pretty lost");
    assert.equal(m?.value, "lost");
  });

  test("the longer, more specific phrase wins over a shorter partial echo", () => {
    // "I've got a handle on it" shares no words with "unsure" at all, and
    // shares only "I" (stopworded) with nothing else — should resolve clean.
    const m = matchChoice(t, "I've got a handle on it, mostly");
    assert.equal(m?.value, "confident");
  });

  test("silence about the actual content refuses rather than guessing", () => {
    assert.equal(matchChoice(t, "what was the question again"), null);
  });
});

describe("matching a range turn (incomeBand)", () => {
  const t = turn("incomeBand");

  test("a number inside a closed range matches that range", () => {
    const m = matchChoice(t, "around one hundred fifty thousand");
    assert.equal(m?.value, "100k-200k");
  });

  test("digit-form dictation of the same amount matches identically", () => {
    const m = matchChoice(t, "about $150,000");
    assert.equal(m?.value, "100k-200k");
  });

  test("an open-ended 'under' phrase matches the open-ended option", () => {
    const m = matchChoice(t, "under 100k");
    assert.equal(m?.value, "under-100k");
  });

  test("an open-ended 'over' phrase matches the open-ended option", () => {
    const m = matchChoice(t, "over 400 thousand");
    assert.equal(m?.value, "over-400k");
  });

  test("'over' wins the tie at a shared boundary against the closed range ending there", () => {
    // $400,000 is simultaneously the top of "$200k – $400k" and the anchor of
    // "Over $400k" — both score a perfect numeric hit. The spoken word "over"
    // is what has to break it, not the numbers alone.
    const m = matchChoice(t, "over four hundred thousand");
    assert.equal(m?.value, "over-400k");
  });

  test("a number near the edge of a range still lands in it", () => {
    const m = matchChoice(t, "two hundred ten thousand or so");
    // 210k is just past the 100k-200k band and inside 200k-400k.
    assert.equal(m?.value, "200k-400k");
  });
});

describe("matching a dollar-amount turn with qualitative outliers (liquid)", () => {
  const t = turn("liquid");

  test("a point estimate favours the nearest labelled amount", () => {
    const m = matchChoice(t, "about nineteen thousand dollars");
    assert.equal(m?.value, 1_500_000); // "About $15,000"
  });

  test("a qualitative phrase matches without any number spoken", () => {
    const m = matchChoice(t, "almost nothing, basically");
    assert.equal(m?.value, 50_000); // "Almost nothing"
  });

  test("a large, imprecise amount is not silently forced onto the wrong option", () => {
    // A genuinely ambiguous case between "About $100,000" and "More than
    // that" — refusing is the correct behaviour, not a coin flip.
    const m = matchChoice(t, "quite a lot, I don't really know");
    const ranked = rankChoices(t, "quite a lot, I don't really know");
    assert.equal(m, null, `expected no confident match, ranked: ${JSON.stringify(ranked)}`);
  });
});

describe("matching short, easily-confused answers (dependents)", () => {
  const t = turn("dependents");

  test("a bare 'no' matches the 'No' option, not a longer label containing similar letters", () => {
    const m = matchChoice(t, "no");
    assert.equal(m?.value, 0);
  });

  test("a spoken number word matches the corresponding count", () => {
    assert.equal(matchChoice(t, "one")?.value, 1);
    assert.equal(matchChoice(t, "two kids")?.value, 2);
  });

  test("'three or more' matches on the open-ended phrase", () => {
    const m = matchChoice(t, "three or more");
    assert.equal(m?.value, 3);
  });
});

describe("matching percent-based turns with a qualitative escape hatch (retirement)", () => {
  const t = turn("retirement");

  test("a spoken percent matches its labelled percent", () => {
    const m = matchChoice(t, "about six percent");
    assert.equal(m?.value, 600);
  });

  test("'I don't know' matches the assumed-confidence option, not a 0% guess", () => {
    const m = matchChoice(t, "I don't know");
    assert.equal(m?.value, 0);
    assert.equal(m?.confidence, "assumed");
  });

  test("'nothing yet' is distinguished from 'I don't know' even though both are 0", () => {
    // Both options share value 0 — the label text is the only signal.
    const m = matchChoice(t, "nothing yet");
    assert.equal(m?.label, "Nothing yet");
    assert.equal(m?.confidence, undefined); // defaults to "stated" at toAnswer()
  });
});

describe("matching duration-in-years turns (horizon)", () => {
  const t = turn("horizon");

  test("a spoken year count matches the nearest option", () => {
    const m = matchChoice(t, "about ten years");
    assert.equal(m?.value, 120);
  });

  test("a pure phrase with no number still matches", () => {
    const m = matchChoice(t, "retirement, whenever that ends up being");
    assert.equal(m?.value, 300);
  });
});

describe("matching a mixed digit/word phrasing (goalWhen)", () => {
  const t = turn("goalWhen");

  test("the digit inside the label matches a spelled-out spoken number", () => {
    const m = matchChoice(t, "in two years");
    assert.equal(m?.value, 24);
  });

  test("'no date yet' does not collide with the numbered options", () => {
    const m = matchChoice(t, "no date yet");
    assert.equal(m?.value, 60);
    assert.equal(m?.confidence, "assumed");
  });
});

describe("the decisive-margin gate", () => {
  test("two options tied on the same shared word both refuse to win alone", () => {
    // "employerMatch" options "Up to 3%" / "Up to 4%" / "Up to 6%" all share
    // the words "up to" — an utterance with no number must not pick one.
    const t = turn("employerMatch");
    const m = matchChoice(t, "up to some percent, not sure how much");
    assert.equal(m, null);
  });

  test("adding the number breaks the tie decisively", () => {
    const t = turn("employerMatch");
    const m = matchChoice(t, "up to four percent");
    assert.equal(m?.value, 400);
  });
});

describe("every choice turn in the live script can be matched from its own label", () => {
  // The strongest possible regression guard: read a turn's option label back
  // to the matcher as if it were dictated, and it must recover that exact
  // option. If this ever fails after an edit to script.ts, the matcher (or
  // the new label) needs attention before it ships.
  for (const t of SCRIPT.filter((x): x is ChoiceTurn => x.kind === "choice")) {
    test(`${t.id}: every option is recoverable from its own label`, () => {
      for (const option of t.options) {
        const m = matchChoice(t, option.label);
        assert.equal(
          m?.label,
          option.label,
          `speaking "${option.label}" back for turn "${t.id}" should match itself`,
        );
      }
    });
  }
});

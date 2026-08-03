import { describe, it } from "node:test";
import assert from "node:assert/strict";

import { numberToWords, spoken } from "./spoken.ts";
import type { Confidence } from "../confidence.ts";
import type { FigureFormat } from "../money.ts";
import type { ReadSegment } from "../waterfall/types.ts";

const text = (value: string): ReadSegment => ({ kind: "text", value });

const fig = (
  value: number,
  format: FigureFormat,
  confidence: Confidence = "stated",
  extra: { abbreviate?: boolean } = {},
): ReadSegment => ({ kind: "figure", value, format, confidence, ...extra });

describe("numberToWords", () => {
  it("covers the teens, which are irregular", () => {
    assert.equal(numberToWords(0), "zero");
    assert.equal(numberToWords(11), "eleven");
    assert.equal(numberToWords(19), "nineteen");
  });

  it("hyphenates compound tens", () => {
    assert.equal(numberToWords(21), "twenty-one");
    assert.equal(numberToWords(40), "forty");
    assert.equal(numberToWords(99), "ninety-nine");
  });

  it("builds hundreds without an 'and'", () => {
    assert.equal(numberToWords(100), "one hundred");
    assert.equal(numberToWords(140), "one hundred forty");
    assert.equal(numberToWords(365), "three hundred sixty-five");
  });

  it("scales through thousands and millions", () => {
    assert.equal(numberToWords(1_000), "one thousand");
    assert.equal(numberToWords(140_000), "one hundred forty thousand");
    assert.equal(numberToWords(1_500_000), "one million five hundred thousand");
  });
});

describe("spoken — the full register", () => {
  it("says a currency figure in words", () => {
    const out = spoken([text("You have "), fig(14_000_000, "currency"), text(" set aside.")], "full");
    assert.equal(out, "You have one hundred forty thousand dollars set aside.");
  });

  it("keeps the screen's abbreviation when the figure carries it", () => {
    // $1.5M on screen should be "one point five million" in the ear — the
    // reader is looking at the abbreviated form while hearing this.
    const out = spoken([fig(150_000_000, "currency", "assumed", { abbreviate: true })], "full");
    assert.match(out, /one point five million dollars/);
  });

  it("rounds to the SAME decimal the screen shows", () => {
    // 147,000,000c abbreviates to "$1.5M" on screen. Speaking the unrounded
    // 1.47 had the eye and the ear disagreeing about one figure — caught in
    // the live conversation, not here.
    const out = spoken(
      [fig(147_000_000, "currency", "assumed", { abbreviate: true })],
      "full",
    );
    assert.match(out, /one point five million dollars/);
    assert.ok(!out.includes("four seven"), out);
  });

  it("hedges a range once, not at both ends", () => {
    // "between roughly X and roughly Y" states one uncertainty twice; the
    // width of the range is already how this product says it.
    const out = spoken(
      [
        text("Between "),
        fig(57_800_000, "currency", "assumed", { abbreviate: true }),
        text(" and "),
        fig(150_000_000, "currency", "assumed", { abbreviate: true }),
        text(" by retirement."),
      ],
      "full",
    );
    assert.equal(out.match(/roughly/g)?.length, 1, out);
  });

  it("resumes hedging after the range closes", () => {
    const out = spoken(
      [
        text("Between "),
        fig(100, "duration", "assumed"),
        text(" and "),
        fig(200, "duration", "assumed"),
        text(". The floor is "),
        fig(3, "duration", "assumed"),
        text("."),
      ],
      "full",
    );
    assert.equal(out.match(/roughly/g)?.length, 2, out);
  });

  it("says a whole percent without a decimal", () => {
    assert.equal(spoken([fig(400, "percent")], "full"), "four percent");
  });

  it("says a fractional percent digit by digit after the point", () => {
    assert.equal(spoken([fig(425, "percent")], "full"), "four point two five percent");
  });

  it("mirrors formatMonths — whole years are years, not months", () => {
    assert.equal(spoken([fig(11, "duration")], "full"), "eleven months");
    assert.equal(spoken([fig(24, "duration")], "full"), "two years");
    assert.equal(spoken([fig(1, "duration")], "full"), "one month");
  });

  it("hedges an assumed figure, because a dashed rule cannot be spoken", () => {
    const out = spoken([text("The floor is "), fig(3, "duration", "assumed"), text(".")], "full");
    assert.equal(out, "The floor is roughly three months.");
  });

  it("does NOT hedge stated or inferred figures", () => {
    assert.ok(!spoken([fig(3, "duration", "stated")], "full").includes("roughly"));
    assert.ok(!spoken([fig(3, "duration", "inferred")], "full").includes("roughly"));
  });

  it("does not double a hedge the copy already wrote", () => {
    // Caught reading real engine output: "needs about ⟨assumed⟩" was coming
    // out as "about roughly one thousand four hundred fifty dollars".
    const out = spoken(
      [text("A sabbatical needs about "), fig(145_000, "currency", "assumed")],
      "full",
    );
    assert.ok(!out.includes("about roughly"), out);
    assert.match(out, /about one thousand four hundred fifty dollars/);
  });

  it("still hedges when the copy did not", () => {
    const out = spoken(
      [text("The floor is "), fig(3, "duration", "assumed")],
      "full",
    );
    assert.match(out, /roughly three months/);
  });

  it("recognises every hedge word the copy actually uses", () => {
    for (const lead of ["about", "around", "roughly", "approximately", "nearly", "almost", "up to"]) {
      const out = spoken(
        [text(`Costs ${lead} `), fig(500, "currency", "assumed")],
        "full",
      );
      assert.ok(!out.includes(`${lead} roughly`), `doubled after "${lead}": ${out}`);
    }
  });

  it("never points at the screen — nothing was withheld", () => {
    const out = spoken([text("You have "), fig(14_000_000, "currency")], "full");
    assert.ok(!out.includes("on screen"));
  });
});

describe("spoken — the discreet register", () => {
  const read: ReadSegment[] = [
    text("You have "),
    fig(14_000_000, "currency"),
    text(" set aside — about "),
    fig(11, "duration", "inferred"),
    text(" of outgoings."),
  ];

  it("says no figure at all", () => {
    const out = spoken(read, "discreet");
    assert.ok(!/\d/.test(out), `a digit survived: ${out}`);
    assert.ok(!out.includes("one hundred forty thousand"));
    assert.ok(!out.includes("eleven"));
  });

  it("stays grammatical against the engine's real copy", () => {
    const out = spoken(read, "discreet");
    assert.equal(
      out,
      "You have that much set aside, about that long of outgoings. The numbers are on screen.",
    );
  });

  it("points at the screen exactly once", () => {
    const out = spoken(read, "discreet");
    assert.equal(out.match(/The numbers are on screen/g)?.length, 1);
  });

  it("does not point at the screen when the read has no figures", () => {
    const out = spoken([text("Nothing needs you today.")], "discreet");
    assert.equal(out, "Nothing needs you today.");
  });

  it("elides each format with a phrase that fits its slot", () => {
    assert.match(spoken([text("Contributing "), fig(400, "percent")], "discreet"), /Contributing that much/);
    assert.match(spoken([text("Held "), fig(6, "count")], "discreet"), /Held that many/);
  });
});

describe("spoken — punctuation a speaker can hear", () => {
  it("turns an em-dash into a pause, never the word 'dash'", () => {
    const out = spoken([text("Cash is the problem — not the win.")], "full");
    assert.equal(out, "Cash is the problem, not the win.");
    assert.ok(!out.includes("—"));
  });

  it("does not leave doubled punctuation where a figure was elided", () => {
    const out = spoken([text("About "), fig(11, "duration"), text(" — that's the floor.")], "discreet");
    assert.ok(!out.includes(", ,"));
    assert.ok(!out.includes(" ,"));
    assert.ok(!out.includes("  "));
  });

  it("collapses whitespace rather than leaving gaps", () => {
    const out = spoken([text("A   b")], "full");
    assert.equal(out, "A b");
  });
});

describe("spoken — totality", () => {
  it("returns empty string for an empty read, not a placeholder", () => {
    assert.equal(spoken([], "full"), "");
    assert.equal(spoken([], "discreet"), "");
  });

  it("returns empty string when the read is only whitespace", () => {
    assert.equal(spoken([text("   ")], "full"), "");
  });

  it("handles every format in both registers without throwing", () => {
    const formats = ["currency", "percent", "duration", "count"] as const;
    const confidences = ["stated", "inferred", "assumed"] as const;
    for (const format of formats) {
      for (const confidence of confidences) {
        for (const register of ["full", "discreet"] as const) {
          const out = spoken([fig(1200, format, confidence)], register);
          assert.equal(typeof out, "string");
          assert.ok(out.length > 0);
        }
      }
    }
  });

  it("never lets a digit reach the discreet register, across every format", () => {
    const formats = ["currency", "percent", "duration", "count"] as const;
    for (const format of formats) {
      const out = spoken([text("Value: "), fig(987_654, format)], "discreet");
      assert.ok(!/\d/.test(out), `${format} leaked a digit: ${out}`);
    }
  });
});

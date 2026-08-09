import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { describe, it } from "node:test";

/**
 * The case study prints counts. This checks they are still true.
 *
 * ── WHY THIS EXISTS ───────────────────────────────────────────────────────
 * `/case-study` states "9 product screens" and "25 design-system components"
 * as evidence of scope. Both are counted from the repository rather than
 * estimated — which is only a virtue while they stay counted. Add a route or
 * a component and the page keeps asserting the old number, silently, in the
 * one document whose entire credibility rests on its figures being real.
 *
 * So the numbers are pinned the same way the product pins its own promises
 * (see `core/membership/rules.test.ts`): a source-reading guard that fails
 * loudly, naming what to do, rather than a comment asking people to remember.
 *
 * ── WHY IT LIVES HERE, NOT IN core/ ───────────────────────────────────────
 * `core/` is the reasoning layer and may not know about the app, let alone
 * about a portfolio page. A guard for marketing copy inside the domain model
 * would be exactly the kind of leak the purity test next door exists to stop.
 */

const root = join(import.meta.dirname, "..");
const page = readFileSync(join(root, "app/case-study/CaseStudy.tsx"), "utf8");

/** The value the page prints for a given stat label. */
function printedStat(label: string): string {
  const row = new RegExp(
    `\\{\\s*value:\\s*"([^"]+)",\\s*label:\\s*"${label}"\\s*\\}`,
  ).exec(page);
  assert.ok(row, `the case study no longer prints a "${label}" stat`);
  return row[1];
}

describe("the case study's figures are counted, not remembered", () => {
  it("prints the real number of product screens", () => {
    /**
     * Product surfaces only. `/design`, `/demo`, `/preview` and the case
     * study itself are tooling and pitch — they are not places a user of
     * North goes, and counting them would inflate the claim.
     */
    const destinations = readdirSync(join(root, "app/(product)"), {
      withFileTypes: true,
    }).filter((entry) => entry.isDirectory()).length;

    /** Arrival, onboarding, and the story replay sit outside the dock. */
    const flowScreens = ["app/page.tsx", "app/start/page.tsx", "app/story/page.tsx"]
      .filter((path) => {
        try {
          readFileSync(join(root, path));
          return true;
        } catch {
          return false;
        }
      }).length;

    const actual = destinations + flowScreens;
    assert.equal(
      printedStat("product screens"),
      String(actual),
      `the case study says ${printedStat("product screens")} product screens; there are ${actual}`,
    );
  });

  it("prints the real number of design-system components", () => {
    /**
     * `MotionProvider` is excluded on purpose: it is the LazyMotion wiring,
     * not something a screen composes with. If it were counted the number
     * would be true but the claim would not.
     */
    const components = readdirSync(join(root, "components/nds"))
      .filter((file) => file.endsWith(".tsx") && file !== "MotionProvider.tsx")
      .length;

    assert.equal(
      printedStat("design-system components"),
      String(components),
      `the case study says ${printedStat("design-system components")} components; there are ${components}`,
    );
  });

  it("makes no claim about commits or elapsed days", () => {
    /**
     * These were cut deliberately: they measure the repository rather than
     * the product, and the elapsed-day figure could not be derived from
     * anything. The repository is public, so a stated duration that
     * disagrees with `git log` is a contradiction a reader can check.
     */
    for (const banned of ["fourteen days", "14 days", "seventy-plus"]) {
      const body = page.replace(/\/\*[\s\S]*?\*\//g, "");
      assert.ok(
        !body.includes(banned),
        `"${banned}" is back on the case study — it is not derivable`,
      );
    }
  });
});

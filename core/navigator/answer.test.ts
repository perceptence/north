import { test, describe } from "node:test";
import assert from "node:assert/strict";
import {
  FIXTURE_NOW,
  SQUEEZED,
  UNADVISED_EARNER,
} from "../../data/fixtures/personas.ts";
import { readToPlainText } from "../waterfall/evaluate.ts";
import { ILLUSTRATIVE_LIMITS } from "../waterfall/limits.ts";
import type { EvaluateOptions } from "../waterfall/types.ts";
import { answerScenario } from "./answer.ts";
import { availableScenarios, SCENARIOS, scenarioById } from "./scenarios.ts";

const OPTIONS: EvaluateOptions = {
  limits: ILLUSTRATIVE_LIMITS,
  now: FIXTURE_NOW,
};

const ask = (
  id: Parameters<typeof scenarioById>[0],
  profile = UNADVISED_EARNER,
  params: Record<string, number | string> = {},
) => answerScenario(scenarioById(id), profile, params, OPTIONS);

/** Everything the answer says, as one string. */
const spoken = (answer: ReturnType<typeof ask>): string =>
  [
    readToPlainText({ segments: answer.understanding, action: { commit: "", defer: "" } }),
    ...answer.analysis.map((a) =>
      readToPlainText({ segments: a.segments, action: { commit: "", defer: "" } }),
    ),
    answer.recommendation.headline,
    answer.recommendation.tradeoff,
  ].join(" ");

describe("the scenario set", () => {
  test("every scenario has a question and defaults for its params", () => {
    for (const scenario of SCENARIOS) {
      assert.ok(scenario.question.endsWith("?"), `${scenario.id} isn't a question`);
      for (const param of scenario.params) {
        const fallback = scenario.defaults[param.id];
        assert.ok(
          fallback !== undefined,
          `${scenario.id} has no default for ${param.id}`,
        );

        if (param.kind === "choice") {
          assert.ok(
            param.options.some((o) => o.value === fallback),
            `${scenario.id}'s default for ${param.id} isn't one of its options`,
          );
        } else {
          const value = Number(fallback);
          assert.ok(
            value >= param.min && value <= param.max,
            `${scenario.id}'s default for ${param.id} is outside its range`,
          );
          assert.equal(
            (value - param.min) % param.step,
            0,
            `${scenario.id}'s default for ${param.id} isn't on a step`,
          );
        }
      }
    }
  });

  /**
   * A question the product cannot answer honestly should not be offered.
   * Asking "should I clear my debt?" of someone with no debt produces a
   * confident answer about nothing.
   */
  test("debt questions are hidden from people with no expensive debt", () => {
    const ids = availableScenarios(UNADVISED_EARNER).map((s) => s.id);
    assert.ok(!ids.includes("debt-first"));
  });

  test("and offered to people who have some", () => {
    const ids = availableScenarios(SQUEEZED).map((s) => s.id);
    assert.ok(ids.includes("debt-first"));
  });
});

describe("answers are computed, not written", () => {
  test("the before side matches what Today would say", () => {
    const answer = ask("home");
    assert.equal(answer.impact.before.rungId, "tax-advantaged");
  });

  test("a bigger deposit leaves less behind", () => {
    const small = ask("home", UNADVISED_EARNER, { deposit: 4_000_000 });
    const large = ask("home", UNADVISED_EARNER, { deposit: 12_000_000 });

    assert.ok(
      (large.impact.after.projection?.centralCents ?? 0) <
        (small.impact.after.projection?.centralCents ?? 0),
      "spending more should lower the trajectory",
    );
  });

  test("a decision that breaks the buffer shows up as a rung change", () => {
    // $140k cash, $12k/mo outgoings. Buying TODAY, a $120k deposit leaves under
    // two months of cover. `months: 0` matters — with the default three-year
    // timeline the surplus has time to rebuild it, which is the whole point of
    // the timeline being an input.
    const answer = ask("home", UNADVISED_EARNER, {
      deposit: 12_000_000,
      months: 0,
    });
    assert.equal(answer.impact.before.rungId, "tax-advantaged");
    assert.equal(answer.impact.after.rungId, "liquidity");
  });

  test("a longer break costs more and leaves less", () => {
    const short = ask("career-break", UNADVISED_EARNER, { months: 3 });
    const long = ask("career-break", UNADVISED_EARNER, { months: 12 });

    assert.ok(
      (long.impact.after.projection?.centralCents ?? 0) <
        (short.impact.after.projection?.centralCents ?? 0),
    );
  });

  test("clearing debt removes it from the situation", () => {
    const answer = ask("debt-first", SQUEEZED);
    assert.equal(answer.impact.before.rungId, "high-interest-debt");
    assert.notEqual(answer.impact.after.rungId, "high-interest-debt");
  });
});

describe("the impact is honestly drawn", () => {
  /**
   * Two bands on separate scales look like a rigorous chart while lying about
   * the comparison — the exact caveat HorizonBand documents.
   */
  test("both sides share one domain ceiling", () => {
    const answer = ask("home");
    const { before, after, domainMaxCents } = answer.impact;

    assert.ok(domainMaxCents > 0);
    assert.ok((before.projection?.highCents ?? 0) <= domainMaxCents);
    assert.ok((after.projection?.highCents ?? 0) <= domainMaxCents);
  });

  test("projections stay ranges, never points", () => {
    for (const side of [ask("home").impact.before, ask("home").impact.after]) {
      if (!side.projection) continue;
      assert.ok(side.projection.highCents > side.projection.lowCents);
    }
  });
});

describe("the coaching line holds", () => {
  test("no scenario names a security, a fund, or a purchase", () => {
    for (const scenario of SCENARIOS) {
      const profile = scenario.applies(UNADVISED_EARNER)
        ? UNADVISED_EARNER
        : SQUEEZED;
      const said = spoken(ask(scenario.id, profile));

      assert.doesNotMatch(
        said,
        /\b(VTI|VOO|SPY|S&P|index fund|ETF|stocks?|bonds?)\b/i,
        `${scenario.id} strayed past the coaching line`,
      );
    }
  });

  test("every recommendation states a tradeoff", () => {
    for (const scenario of SCENARIOS) {
      const profile = scenario.applies(UNADVISED_EARNER)
        ? UNADVISED_EARNER
        : SQUEEZED;
      const { recommendation } = ask(scenario.id, profile);

      assert.ok(
        recommendation.headline.length > 0,
        `${scenario.id} has no headline`,
      );
      assert.ok(
        recommendation.tradeoff.length > 0,
        `${scenario.id} recommends something with no cost — that isn't a recommendation`,
      );
    }
  });

  test("an unaffordable decision is not waved through", () => {
    const answer = ask("career-break", SQUEEZED, { months: 12 });
    assert.equal(answer.recommendation.verdict, "not-yet");
  });
});

describe("purity", () => {
  test("same inputs, same answer", () => {
    assert.deepEqual(ask("home"), ask("home"));
  });

  test("does not mutate the profile it is given", () => {
    const snapshot = structuredClone(UNADVISED_EARNER);
    ask("home", UNADVISED_EARNER, { deposit: 12_000_000 });
    assert.deepEqual(UNADVISED_EARNER, snapshot);
  });

  test("falls back to defaults when no params are supplied", () => {
    assert.deepEqual(ask("home"), ask("home", UNADVISED_EARNER, { deposit: 6_000_000 }));
  });
});

describe("the simulator's inputs", () => {
  /** The brief's four input types, each reachable from some scenario. */
  test("timeline, major expense, monthly savings and income are all adjustable", () => {
    const paramIds = SCENARIOS.flatMap((s) => s.params.map((p) => `${s.id}.${p.id}`));

    assert.ok(paramIds.includes("home.months"), "no purchase timeline");
    assert.ok(paramIds.includes("home.deposit"), "no major expense");
    assert.ok(paramIds.includes("contribute-more.rateBps"), "no monthly savings");
    assert.ok(paramIds.includes("pay-cut.band"), "no income change");
  });

  /**
   * The timeline has to change the answer, or it is decoration. Waiting is not
   * passive — the surplus keeps landing.
   */
  test("waiting longer makes the same deposit easier", () => {
    const now = ask("home", UNADVISED_EARNER, { deposit: 16_000_000, months: 0 });
    const later = ask("home", UNADVISED_EARNER, { deposit: 16_000_000, months: 84 });

    assert.equal(now.recommendation.verdict, "not-yet");
    assert.notEqual(later.recommendation.verdict, "not-yet");
  });

  test("contributing more raises the trajectory", () => {
    const low = ask("contribute-more", UNADVISED_EARNER, { rateBps: 0 });
    const high = ask("contribute-more", UNADVISED_EARNER, { rateBps: 2_000 });

    assert.ok(
      (high.impact.after.projection?.centralCents ?? 0) >
        (low.impact.after.projection?.centralCents ?? 0),
    );
  });

  test("contributing under the match is flagged as leaving money behind", () => {
    const under = ask("contribute-more", UNADVISED_EARNER, { rateBps: 100 });
    assert.equal(under.recommendation.verdict, "yes-with-changes");
    assert.match(under.recommendation.tradeoff, /match/i);
  });

  test("a pay cut below what you spend is refused", () => {
    const cut = ask("pay-cut", UNADVISED_EARNER, { band: "under-100k" });
    assert.equal(cut.recommendation.verdict, "not-yet");
  });

  test("a pay cut you can absorb is not", () => {
    const cut = ask("pay-cut", UNADVISED_EARNER, { band: "200k-400k" });
    assert.notEqual(cut.recommendation.verdict, "not-yet");
  });

  test("every range default sits on a step within its bounds", () => {
    for (const scenario of SCENARIOS) {
      for (const param of scenario.params) {
        if (param.kind !== "range") continue;
        const value = Number(scenario.defaults[param.id]);
        assert.ok(value >= param.min && value <= param.max);
      }
    }
  });
});

describe("before and after stand at the same moment", () => {
  /**
   * The bug this guards: crediting the "after" side with years of saving while
   * the baseline stays anchored at today made buying a house look like it made
   * you richer. Any scenario that moves through time must move both sides.
   */
  test("buying never raises the trajectory above not buying", () => {
    for (const months of [0, 12, 36, 84]) {
      for (const deposit of [2_000_000, 8_000_000, 20_000_000]) {
        const { impact } = ask("home", UNADVISED_EARNER, { deposit, months });
        const before = impact.before.projection?.centralCents ?? 0;
        const after = impact.after.projection?.centralCents ?? 0;

        assert.ok(
          after <= before,
          `spending ${deposit} at ${months}mo made the trajectory better (${after} > ${before})`,
        );
      }
    }
  });

  test("a bigger deposit costs more trajectory, at any date", () => {
    for (const months of [0, 36, 84]) {
      const small = ask("home", UNADVISED_EARNER, { deposit: 2_000_000, months });
      const large = ask("home", UNADVISED_EARNER, { deposit: 20_000_000, months });

      assert.ok(
        (large.impact.after.projection?.centralCents ?? 0) <=
          (small.impact.after.projection?.centralCents ?? 0),
      );
    }
  });

  test("scenarios that don't move through time leave the baseline alone", () => {
    const answer = ask("career-break", UNADVISED_EARNER, { months: 6 });
    const plain = ask("debt-first", SQUEEZED);
    assert.ok(answer.impact.before.projection);
    assert.ok(plain.impact.before.projection);
  });
});

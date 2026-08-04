import type { Confidence } from "../confidence.ts";
import type { Decision } from "../decisions/types.ts";
import { settledRungIds } from "../decisions/types.ts";
import { planGoals } from "../goals/plan.ts";
import type { Cents } from "../money.ts";
import { fig, from, text } from "../prose.ts";
import type { SituationProfile } from "../profile/types.ts";
import { evaluate } from "../waterfall/evaluate.ts";
import type {
  DerivedFacts,
  EvaluateOptions,
  ReadSegment,
  RungId,
} from "../waterfall/types.ts";
import type { Insight, InsightsReport, LadderRung } from "./types.ts";

/**
 * What North can say about someone, honestly.
 *
 * Every observation here is COMPUTED from the profile, the ladder, or the
 * decision ledger. Nothing is generated, and nothing claims knowledge North
 * does not have — see types.ts for what that rules out.
 */

/* ── The single highest-leverage change ────────────────────────────────── */

function nextMove(
  rungId: RungId | null,
  profile: SituationProfile,
  facts: DerivedFacts,
  settledOutstanding: number,
): ReadSegment[] {
  if (rungId === null) {
    // Distinguish genuinely finished from "you acted, we haven't caught up".
    // Claiming the first when it is the second is the contradiction this
    // screen made visible.
    if (settledOutstanding > 0) {
      return [
        text("Nothing is waiting on you. "),
        fig(settledOutstanding, "count", "inferred", { label: "decisions" }),
        text(
          settledOutstanding === 1
            ? " thing you handled isn't reflected in what North knows yet — tell it what changed and the picture sharpens."
            : " things you handled aren't reflected in what North knows yet — tell it what changed and the picture sharpens.",
        ),
      ];
    }
    return [
      text(
        "Nothing needs changing. That is a genuinely unusual place to be standing.",
      ),
    ];
  }

  switch (rungId) {
    case "liquidity": {
      const target = facts.liquidityFloorMonths * profile.monthlyOutCents.value;
      const shortfall: Cents = Math.max(0, target - profile.liquidCents.value);
      return [
        fig(shortfall, "currency", facts.excessCash.confidence, {
          label: "more in cash",
          interrogable: true,
        }),
        text(" more in cash puts your buffer where it should be. Nothing else moves the needle until it is."),
      ];
    }

    case "match": {
      const gapBps =
        profile.employerMatchBps.value - profile.retirementBps.value;
      const missed: Cents = Math.round(
        (facts.monthlyIncome.value * 12 * gapBps) / 10_000,
      );
      return [
        text("Raising your contribution to "),
        from(profile.employerMatchBps, "percent", { label: "of your income" }),
        text(" claims about "),
        fig(missed, "currency", facts.monthlyIncome.confidence, {
          label: "a year in unclaimed match",
          interrogable: true,
        }),
        text(" a year you are currently declining."),
      ];
    }

    case "high-interest-debt": {
      const worst = facts.costliestObligation.value;
      if (!worst) return [text("Nothing expensive is left.")];
      return [
        text("Clearing "),
        fig(worst.balanceCents, "currency", facts.costliestObligation.confidence, {
          label: "of debt",
          interrogable: true,
        }),
        text(" at "),
        fig(worst.rateBps, "percent", facts.costliestObligation.confidence, {
          label: "annual interest",
        }),
        text(" is the highest guaranteed return available to you."),
      ];
    }

    case "tax-advantaged":
      return [
        from(facts.unusedTaxAdvantaged, "currency", {
          label: "of unused room",
          interrogable: true,
        }),
        text(" of tax-advantaged room is going unused this year, and it does not roll over."),
      ];

    case "goal": {
      // The soonest unfunded goal, measured against what is left for it once
      // nearer goals have taken theirs (core/goals/plan.ts).
      const primary = planGoals(profile, facts.monthlySurplus.value).primary;
      if (!primary) return [text("Nothing is waiting on funding.")];
      return [
        fig(primary.monthlyNeedCents, "currency", primary.confidence, {
          label: "a month",
          interrogable: true,
        }),
        text(` a month funds ${primary.goal.label.toLowerCase()} on time.`),
      ];
    }

    case "taxable":
      return [
        from(facts.monthlySurplus, "currency", {
          label: "spare each month",
          interrogable: true,
        }),
        text(" a month is arriving with nowhere to go."),
      ];

    case "optimization":
      return [
        from(facts.excessCash, "currency", {
          label: "sitting idle",
          interrogable: true,
        }),
        text(" is sitting still with everything else already handled."),
      ];
  }
}

/* ── What North cannot see ─────────────────────────────────────────────── */

/** Profile fields whose confidence is worth confessing when it is `assumed`. */
const CONFESSABLE: Array<{
  read: (p: SituationProfile) => Confidence;
  phrase: string;
}> = [
  { read: (p) => p.retirementBps.confidence, phrase: "how much you contribute" },
  {
    read: (p) => p.employerMatchBps.confidence,
    phrase: "what your employer matches",
  },
  { read: (p) => p.obligations.confidence, phrase: "what your debt charges" },
  { read: (p) => p.liquidCents.confidence, phrase: "how much cash you hold" },
  {
    read: (p) => p.monthlyOutCents.confidence,
    phrase: "what you spend in a month",
  },
];

export function blindSpots(profile: SituationProfile): ReadSegment[] {
  const guessed = CONFESSABLE.filter((f) => f.read(profile) === "assumed").map(
    (f) => f.phrase,
  );

  const parts: string[] = [
    "North has no view of your accounts, so nothing here comes from your spending — only from what you told us.",
    // Income is always a band midpoint, which is why every figure built on it
    // reads as an assumption.
    "Your income is a band rather than a figure, so anything resting on it is an estimate.",
  ];

  if (guessed.length > 0) {
    parts.push(
      `We are also guessing at ${listOut(guessed)} — correct any of those and the numbers sharpen.`,
    );
  }

  return [text(parts.join(" "))];
}

function listOut(items: string[]): string {
  if (items.length === 1) return items[0];
  return `${items.slice(0, -1).join(", ")} and ${items[items.length - 1]}`;
}

/* ── The record ────────────────────────────────────────────────────────── */

/**
 * Note the tone constraint: nothing here counts failures. Deferrals are named
 * as a later date, never as a lapse. A screen that tallies what you didn't do
 * is the report card this product exists to avoid (docs/STRATEGY.md §3, P3).
 */
function recordSegments(
  total: number,
  resolved: number,
  held: number,
): ReadSegment[] {
  if (total === 0) {
    return [
      text(
        "Nothing yet — you haven't made a decision with North. The first one starts the record.",
      ),
    ];
  }

  const opener: ReadSegment[] = [
    text("You've made "),
    fig(total, "count", "stated", { label: "decisions with North" }),
    text(total === 1 ? " decision" : " decisions"),
  ];

  if (resolved === 0) {
    return [...opener, text(", and one is still waiting on you.")];
  }

  return [
    ...opener,
    text(" and held "),
    fig(held, "count", "stated", { label: "held" }),
    text(
      held === 1
        ? " of them. Anything you put off is just a later date, not a miss."
        : " of them. Anything you put off is just a later date, not a miss.",
    ),
  ];
}

/* ── The report ────────────────────────────────────────────────────────── */

export function observe(
  profile: SituationProfile,
  decisions: Decision[],
  options: EvaluateOptions,
): InsightsReport {
  const evaluation = evaluate(profile, {
    ...options,
    skip: settledRungIds(decisions, options.now),
  });
  const facts = evaluation.facts;

  const settledIds = new Set(settledRungIds(decisions, options.now));
  const rungs: LadderRung[] = evaluation.ladder.map((rung) => ({
    ...rung,
    settled: settledIds.has(rung.id),
  }));

  const cleared = rungs.filter((r) => r.satisfied).length;
  // Decided, but the profile hasn't caught up.
  const settledOutstanding = rungs.filter(
    (r) => r.settled && !r.satisfied,
  ).length;

  const bufferPercent =
    profile.monthlyOutCents.value > 0
      ? Math.min(
          100,
          Math.round(
            (facts.liquidityMonths.value / facts.liquidityFloorMonths) * 100,
          ),
        )
      : null;

  const held = decisions.filter((d) => d.outcome === "held").length;
  const resolved = decisions.filter((d) => d.outcome !== "open").length;

  const earliest = decisions.reduce<string | null>(
    (oldest, d) => (oldest === null || d.decidedAt < oldest ? d.decidedAt : oldest),
    null,
  );

  const insights: Insight[] = [
    {
      kind: "position",
      label: "Where you are",
      segments: [
        text("You have cleared "),
        fig(cleared, "count", "inferred", { label: "rungs" }),
        text(" of "),
        fig(evaluation.ladder.length, "count", "stated", { label: "in total" }),
        text(". Your buffer is "),
        // `percent` reads BASIS POINTS. A raw 82 would render as "0.82%".
        fig(
          (bufferPercent ?? 0) * 100,
          "percent",
          facts.liquidityMonths.confidence,
          { label: "of where it should be" },
        ),
        text(" of where it should be."),
      ],
    },
    {
      kind: "record",
      label: "What you've done",
      segments: recordSegments(decisions.length, resolved, held),
    },
    {
      kind: "next-move",
      label: "What would move you most",
      segments: nextMove(
        evaluation.current?.rung.id ?? null,
        profile,
        facts,
        settledOutstanding,
      ),
    },
    {
      kind: "blind-spot",
      label: "What North can't see",
      segments: blindSpots(profile),
    },
  ];

  return {
    progress: {
      cleared,
      settled: settledOutstanding,
      total: rungs.length,
      rungs,
    },
    bufferPercent,
    since: earliest,
    insights,
  };
}

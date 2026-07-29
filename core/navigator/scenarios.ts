import { derived, type Field } from "../confidence.ts";
import {
  formatCurrency,
  formatMonths,
  type BasisPoints,
  type Cents,
} from "../money.ts";
import { fig, from, text } from "../prose.ts";
import type {
  IncomeBand,
  Obligation,
  SituationProfile,
} from "../profile/types.ts";
import { RETURN_RANGE } from "../projection/horizon.ts";
import { BAND_ANNUAL_CENTS, THRESHOLDS } from "../waterfall/derive.ts";
import { totalTaxAdvantagedCents } from "../waterfall/limits.ts";
import type {
  AnalysisPoint,
  ParamSet,
  Recommendation,
  Scenario,
  ScenarioContext,
} from "./types.ts";

/**
 * The curated scenarios.
 *
 * Between them they cover the four things a simulator needs to vary: a
 * purchase timeline, a major expense, what you put away each month, and a
 * change of income. Each is a real transformation of the profile, run through
 * the same engine that produces Today.
 *
 * Every recommendation NAMES A GAP AND A TRADEOFF, and none names a security,
 * a fund, or a ticker — the coaching/advice line holds here exactly as it does
 * in the Waterfall (docs/FOUNDATION.md §9).
 */

/** A hypothetical value is derived from a stated one — never stated itself. */
function hypothetical<T>(field: Field<T>, value: T): Field<T> {
  return { value, confidence: derived(field.confidence), asOf: field.asOf };
}

/** Months of outgoings a given pile of cash would cover. */
function monthsOfCover(cash: Cents, monthlyOut: Cents): number {
  return monthlyOut > 0 ? Math.floor(cash / monthlyOut) : 0;
}

const num = (params: ParamSet, id: string): number => Number(params[id]);

/* ── Can I buy a home? ─────────────────────────────────────────────────── */

/**
 * Cash on the day, if the current surplus keeps landing until then.
 *
 * The timeline is the point: waiting is not passive. Someone two years out
 * saves two years of surplus first, which is why the same deposit can be
 * unaffordable now and comfortable later.
 */
function cashAtPurchase(context: ScenarioContext, months: number): Cents {
  const surplus = Math.max(0, context.facts.monthlySurplus.value);
  return context.profile.liquidCents.value + surplus * months;
}

/** The profile as it would stand on the purchase date, holding `cash`. */
function atPurchaseDate(
  context: ScenarioContext,
  months: number,
  cash: Cents,
): SituationProfile {
  const { profile } = context;
  return {
    ...profile,
    liquidCents: hypothetical(profile.liquidCents, cash),
    horizonMonths: hypothetical(
      profile.horizonMonths,
      Math.max(0, profile.horizonMonths.value - months),
    ),
  };
}

const home: Scenario = {
  id: "home",
  question: "Can I buy a home?",
  applies: () => true,

  params: [
    {
      kind: "range",
      id: "deposit",
      label: "Deposit",
      min: 2_000_000,
      max: 20_000_000,
      step: 500_000,
      format: "currency",
    },
    {
      kind: "range",
      id: "months",
      label: "How far out",
      min: 0,
      max: 84,
      step: 6,
      format: "duration",
    },
  ],
  defaults: { deposit: 6_000_000, months: 36 },

  /**
   * Both sides advance to the purchase date and then run for whatever is left
   * of the horizon. Waiting is not free on either side: the money that would
   * have compounded for the full span only compounds for the rest of it.
   */
  transform: (context) => {
    const months = num(context.params, "months");
    const left = Math.max(
      0,
      cashAtPurchase(context, months) - num(context.params, "deposit"),
    );
    return atPurchaseDate(context, months, left);
  },

  baseline: (context) => {
    const months = num(context.params, "months");
    // Same date, same saving — simply without the deposit leaving.
    return atPurchaseDate(context, months, cashAtPurchase(context, months));
  },

  understanding: ({ profile, facts }) => [
    text("You're holding "),
    from(profile.liquidCents, "currency", { label: "in cash" }),
    text(" and putting aside roughly "),
    from(facts.monthlySurplus, "currency", { label: "spare each month" }),
    text(" a month."),
  ],

  analysis: (context): AnalysisPoint[] => {
    const { profile, facts, params } = context;
    const months = num(params, "months");
    const deposit = num(params, "deposit");
    const byThen = cashAtPurchase(context, months);
    const left = Math.max(0, byThen - deposit);
    const c = derived(profile.liquidCents.confidence);

    return [
      {
        label: "Cash by then",
        segments: [
          fig(byThen, "currency", "assumed", { label: "cash by then" }),
          text(months > 0 ? " after " : " — buying now"),
          ...(months > 0
            ? [fig(months, "duration", "stated", { label: "of saving" }), text(" of saving")]
            : []),
        ],
      },
      {
        label: "Left after the deposit",
        segments: [
          fig(left, "currency", c, { label: "remaining cash" }),
          text(" — "),
          fig(monthsOfCover(left, profile.monthlyOutCents.value), "duration", c, {
            label: "of outgoings",
          }),
          text(" of outgoings"),
        ],
      },
      {
        label: "Buffer we'd want you to keep",
        segments: [
          fig(facts.liquidityFloorMonths, "duration", "assumed", {
            label: "the buffer floor",
          }),
        ],
      },
    ];
  },

  recommendation: (context): Recommendation => {
    const { profile, facts, params } = context;
    const months = num(params, "months");
    const deposit = num(params, "deposit");
    const byThen = cashAtPurchase(context, months);
    const left = Math.max(0, byThen - deposit);
    const cover = monthsOfCover(left, profile.monthlyOutCents.value);
    const floor = facts.liquidityFloorMonths;
    const when = months === 0 ? "today" : `in ${formatMonths(months)}`;

    if (deposit > byThen) {
      return {
        verdict: "not-yet",
        headline: `Not ${when} — the deposit is more than you'd have.`,
        tradeoff:
          "Waiting longer or putting less down closes it. Nothing here says never; it says not on this timeline.",
      };
    }

    if (cover >= floor) {
      return {
        verdict: "yes",
        headline: `Yes ${when}, and your buffer survives it.`,
        tradeoff: `You'd still have ${formatMonths(cover)} of outgoings in reach. What you give up is the head start that cash was building.`,
      };
    }

    return {
      verdict: "yes-with-changes",
      headline: `Affordable ${when}, but it would clear out your buffer.`,
      tradeoff: `You'd drop to ${formatMonths(cover)} of cover against a ${floor}-month floor. A smaller deposit or a later date puts that back.`,
    };
  },
};

/* ── Can I afford a career break? ──────────────────────────────────────── */

const careerBreak: Scenario = {
  id: "career-break",
  question: "Can I afford a career break?",
  applies: () => true,

  params: [
    {
      // Discrete on purpose: people think in named spans, not in a continuum.
      kind: "choice",
      id: "months",
      label: "Time off",
      options: [
        { label: "3 months", value: 3 },
        { label: "6 months", value: 6 },
        { label: "12 months", value: 12 },
      ],
    },
  ],
  defaults: { months: 6 },

  transform: ({ profile, params }) => ({
    ...profile,
    liquidCents: hypothetical(
      profile.liquidCents,
      Math.max(
        0,
        profile.liquidCents.value -
          profile.monthlyOutCents.value * num(params, "months"),
      ),
    ),
  }),

  understanding: ({ profile, facts }) => [
    text("Living costs you "),
    from(profile.monthlyOutCents, "currency", { label: "a month" }),
    text(" a month, and you're holding "),
    from(profile.liquidCents, "currency", { label: "in cash" }),
    text(" — "),
    from(facts.liquidityMonths, "duration", { label: "of outgoings" }),
    text(" of that."),
  ],

  analysis: ({ profile, params }): AnalysisPoint[] => {
    const months = num(params, "months");
    const cost = profile.monthlyOutCents.value * months;
    const left = Math.max(0, profile.liquidCents.value - cost);
    const c = derived(profile.liquidCents.confidence);

    return [
      {
        label: "What the time off costs",
        segments: [fig(cost, "currency", c, { label: "total living costs" })],
      },
      {
        label: "Cash on the other side",
        segments: [
          fig(left, "currency", c, { label: "remaining cash" }),
          text(" — "),
          fig(monthsOfCover(left, profile.monthlyOutCents.value), "duration", c, {
            label: "of outgoings",
          }),
          text(" of outgoings"),
        ],
      },
      {
        label: "Not counted here",
        segments: [
          text(
            "Any income during the break, and the contributions that stop while you're off.",
          ),
        ],
      },
    ];
  },

  recommendation: ({ profile, facts, params }): Recommendation => {
    const months = num(params, "months");
    const cost = profile.monthlyOutCents.value * months;
    const left = Math.max(0, profile.liquidCents.value - cost);
    const cover = monthsOfCover(left, profile.monthlyOutCents.value);
    const floor = facts.liquidityFloorMonths;

    if (cost >= profile.liquidCents.value) {
      return {
        verdict: "not-yet",
        headline: `${formatMonths(months)} is longer than your cash lasts.`,
        tradeoff:
          "A shorter break, or some income during it, is what makes this work. The shape is right; the length isn't.",
      };
    }

    if (cover >= floor) {
      return {
        verdict: "yes",
        headline: "Yes — you can cover it and still land with a buffer.",
        tradeoff: `You'd come back with ${formatMonths(cover)} of cover. The cost is the compounding those months would have done.`,
      };
    }

    return {
      verdict: "yes-with-changes",
      headline: "Possible, but you'd come back with nothing behind you.",
      tradeoff: `${formatMonths(cover)} of cover against a ${floor}-month floor means any surprise on the way back becomes debt.`,
    };
  },
};

/* ── What if I put more away each month? ───────────────────────────────── */

const contributeMore: Scenario = {
  id: "contribute-more",
  question: "What if I put more away each month?",
  applies: () => true,

  params: [
    {
      kind: "range",
      id: "rateBps",
      label: "Of your pay, to retirement",
      min: 0,
      max: 2_500,
      step: 100,
      format: "percent",
    },
  ],
  defaults: { rateBps: 1_000 },

  transform: ({ profile, params }) => ({
    ...profile,
    retirementBps: hypothetical(
      profile.retirementBps,
      num(params, "rateBps") as BasisPoints,
    ),
  }),

  understanding: ({ profile, facts }) => [
    text("You're putting "),
    from(profile.retirementBps, "percent", { label: "of your income" }),
    text(" away, on an assumed "),
    from(facts.monthlyIncome, "currency", { label: "a month" }),
    text(" a month."),
  ],

  analysis: ({ profile, facts, params, limits }): AnalysisPoint[] => {
    const rate = num(params, "rateBps");
    const annual = Math.round((facts.monthlyIncome.value * 12 * rate) / 10_000);
    const monthly = Math.round(annual / 12);
    const out = profile.monthlyOutCents.value;
    const room = totalTaxAdvantagedCents(limits);

    return [
      {
        label: "Going away each month",
        segments: [fig(monthly, "currency", "assumed", { label: "a month" })],
      },
      {
        label: "Against this year's tax-advantaged room",
        segments: [
          fig(Math.min(annual, room), "currency", "assumed", { label: "used" }),
          text(" of "),
          fig(room, "currency", "assumed", { label: "available" }),
        ],
      },
      {
        label: "Left over after that",
        segments: [
          fig(facts.monthlyIncome.value - out - monthly, "currency", "assumed", {
            label: "a month left over",
          }),
          text(" a month, once your outgoings and this are covered."),
        ],
      },
    ];
  },

  recommendation: ({ profile, facts, params, limits }): Recommendation => {
    const rate = num(params, "rateBps");
    const annual = Math.round((facts.monthlyIncome.value * 12 * rate) / 10_000);
    const monthly = Math.round(annual / 12);
    const surplusAfter =
      facts.monthlyIncome.value - profile.monthlyOutCents.value - monthly;
    const match = profile.employerMatchBps.value;

    if (surplusAfter < 0) {
      return {
        verdict: "not-yet",
        headline: "That's more than your month can carry.",
        tradeoff:
          "At this rate you'd be drawing on savings to fund savings, which is just a slower way to stand still.",
      };
    }

    if (match > 0 && rate < match) {
      return {
        verdict: "yes-with-changes",
        headline: "Worth doing, but you're still under the match.",
        tradeoff:
          "Everything below your employer's match is money being declined. Clear that line first, then keep going.",
      };
    }

    if (annual >= totalTaxAdvantagedCents(limits)) {
      return {
        verdict: "yes",
        headline: "That fills this year's tax-advantaged room.",
        // Formatting goes through the money layer — never hand-rolled.
        tradeoff: `About ${formatCurrency(monthly)} a month stops being spendable. Anything beyond this has to go somewhere with less shelter.`,
      };
    }

    return {
      verdict: "yes",
      headline: "Affordable, and it uses room that expires.",
      tradeoff:
        "It comes straight out of what you'd otherwise have to spend. The room doesn't roll over, which is what makes the trade worth it.",
    };
  },
};

/* ── Could I take a pay cut? ───────────────────────────────────────────── */

const BAND_LABEL: Record<IncomeBand, string> = {
  "under-100k": "Under $100k",
  "100k-200k": "$100k – $200k",
  "200k-400k": "$200k – $400k",
  "over-400k": "Over $400k",
};

const payCut: Scenario = {
  id: "pay-cut",
  question: "Could I take a pay cut?",
  applies: () => true,

  params: [
    {
      // Income is collected as a band, so there is nothing between the steps.
      kind: "choice",
      id: "band",
      label: "New income",
      options: (Object.keys(BAND_LABEL) as IncomeBand[]).map((band) => ({
        label: BAND_LABEL[band],
        value: band,
      })),
    },
  ],
  defaults: { band: "100k-200k" },

  transform: ({ profile, params }) => ({
    ...profile,
    incomeBand: hypothetical(
      profile.incomeBand,
      String(params.band) as IncomeBand,
    ),
  }),

  understanding: ({ profile, facts }) => [
    text("On "),
    fig(facts.monthlyIncome.value, "currency", "assumed", { label: "a month" }),
    text(" a month you're spending "),
    from(profile.monthlyOutCents, "currency", { label: "a month" }),
    text(" and keeping the rest."),
  ],

  analysis: ({ profile, params }): AnalysisPoint[] => {
    const band = String(params.band) as IncomeBand;
    const monthlyAfter = Math.round(BAND_ANNUAL_CENTS[band] / 12);
    const out = profile.monthlyOutCents.value;

    return [
      {
        label: "New monthly income",
        segments: [
          fig(monthlyAfter, "currency", "assumed", { label: "a month" }),
          text(" — the middle of that band"),
        ],
      },
      {
        label: "Against what you spend",
        segments: [
          fig(out, "currency", profile.monthlyOutCents.confidence, {
            label: "a month",
          }),
          text(" a month goes out"),
        ],
      },
      {
        label: "What's left",
        segments: [
          fig(monthlyAfter - out, "currency", "assumed", {
            label: "a month left over",
          }),
          text(" a month, before anything goes to retirement."),
        ],
      },
    ];
  },

  recommendation: ({ profile, facts, params }): Recommendation => {
    const band = String(params.band) as IncomeBand;
    const monthlyAfter = Math.round(BAND_ANNUAL_CENTS[band] / 12);
    const out = profile.monthlyOutCents.value;
    const left = monthlyAfter - out;

    if (monthlyAfter >= facts.monthlyIncome.value) {
      return {
        verdict: "yes",
        headline: "That isn't a cut — it's the same or more.",
        tradeoff: "Nothing to weigh up. Pick a lower band to see the tradeoff.",
      };
    }

    if (left < 0) {
      return {
        verdict: "not-yet",
        headline: "Not at what you currently spend.",
        tradeoff:
          "The gap has to come from somewhere — either outgoings drop or savings do. Neither is free.",
      };
    }

    if (left < THRESHOLDS.meaningfulSurplusCents) {
      return {
        verdict: "yes-with-changes",
        headline: "Survivable, but there'd be nothing spare.",
        tradeoff:
          "You'd cover your month and no more, so anything unexpected lands on your buffer instead of your income.",
      };
    }

    return {
      verdict: "yes",
      headline: "Yes — your month still balances.",
      tradeoff:
        "What shrinks is the surplus, and with it how fast everything else moves. It costs you speed, not stability.",
    };
  },
};

/* ── Should I clear the debt first? ────────────────────────────────────── */

const debtFirst: Scenario = {
  id: "debt-first",
  question: "Should I clear my debt before saving?",

  // Hidden entirely when there is nothing expensive to clear. A question the
  // product cannot answer honestly should not be offered.
  applies: (profile) =>
    profile.obligations.value.some(
      (o) => o.balanceCents > 0 && o.rateBps >= THRESHOLDS.highInterestBps,
    ),

  params: [],
  defaults: {},

  transform: ({ profile }) => {
    const worst = costliest(profile.obligations.value);
    if (!worst) return profile;

    return {
      ...profile,
      liquidCents: hypothetical(
        profile.liquidCents,
        Math.max(0, profile.liquidCents.value - worst.balanceCents),
      ),
      obligations: hypothetical(
        profile.obligations,
        profile.obligations.value.filter((o) => o !== worst),
      ),
    };
  },

  understanding: ({ profile }) => {
    const worst = costliest(profile.obligations.value);
    if (!worst) return [text("Nothing is costing you more than it earns.")];

    return [
      text("You're carrying "),
      fig(worst.balanceCents, "currency", profile.obligations.confidence, {
        label: `of ${worst.kind} debt`,
      }),
      text(" at "),
      fig(worst.rateBps, "percent", profile.obligations.confidence, {
        label: "annual interest",
      }),
      text("."),
    ];
  },

  analysis: ({ profile }): AnalysisPoint[] => {
    const worst = costliest(profile.obligations.value);
    if (!worst) return [];

    const annualCost = Math.round((worst.balanceCents * worst.rateBps) / 10_000);
    const c = profile.obligations.confidence;

    return [
      {
        label: "What the debt costs each year",
        segments: [
          fig(annualCost, "currency", c, { label: "in interest a year" }),
          text(" at "),
          fig(worst.rateBps, "percent", c, { label: "annual interest" }),
        ],
      },
      {
        label: "What saving is expected to return",
        segments: [
          fig(RETURN_RANGE.lowBps, "percent", "assumed", { label: "low end" }),
          text(" to "),
          fig(RETURN_RANGE.highBps, "percent", "assumed", { label: "high end" }),
          text(" a year, after inflation — and not reliably."),
        ],
      },
      {
        label: "Clearing it costs you",
        segments: [
          fig(worst.balanceCents, "currency", c, { label: "from your cash" }),
          text(" of the cash you're holding."),
        ],
      },
    ];
  },

  recommendation: ({ profile }): Recommendation => {
    const worst = costliest(profile.obligations.value);
    if (!worst) {
      return {
        verdict: "yes",
        headline: "There's nothing expensive left to clear.",
        tradeoff: "Nothing to trade off.",
      };
    }

    return {
      verdict: "yes",
      headline: "Clear it first. It costs more than saving is expected to make.",
      tradeoff:
        "Paying it down uses cash you'd rather keep, so do it after your buffer is intact — not before.",
    };
  },
};

function costliest(obligations: Obligation[]): Obligation | null {
  return obligations
    .filter((o) => o.balanceCents > 0 && o.rateBps >= THRESHOLDS.highInterestBps)
    .reduce<Obligation | null>(
      (worst, o) => (worst === null || o.rateBps > worst.rateBps ? o : worst),
      null,
    );
}

export const SCENARIOS: readonly Scenario[] = [
  home,
  contributeMore,
  careerBreak,
  payCut,
  debtFirst,
] as const;

/** The questions worth offering this person. */
export function availableScenarios(profile: SituationProfile): Scenario[] {
  return SCENARIOS.filter((s) => s.applies(profile));
}

export function scenarioById(id: Scenario["id"]): Scenario {
  const found = SCENARIOS.find((s) => s.id === id);
  if (!found) throw new Error(`Unknown scenario: ${id}`);
  return found;
}

export type { ScenarioContext };

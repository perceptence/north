import { derived } from "../confidence.ts";
import { planGoals } from "../goals/plan.ts";
import type { Cents } from "../money.ts";
import { fig, from, text } from "../prose.ts";
import { THRESHOLDS } from "./derive.ts";
import type { Read, Rung, RungContext } from "./types.ts";

/**
 * The seven rungs, in order.
 *
 * This file is DATA. There is no branch on user type anywhere in it — the only
 * control flow is "is this rung satisfied?", which is what allows one code path
 * to serve a 26-year-old with $2,000 and a 45-year-old surgeon
 * (docs/FOUNDATION.md §4).
 *
 * A read NAMES A GAP and frames a tradeoff. It never recommends a specific
 * security and never tells anyone what to buy — that is the coaching/advice
 * line, and it is a hard product boundary (docs/FOUNDATION.md §9).
 */

/* ── 1 · Liquidity floor ──────────────────────────────────────────────── */

const liquidity: Rung = {
  id: "liquidity",
  index: 1,
  label: "liquidity floor",

  satisfied: ({ facts }) =>
    facts.liquidityMonths.value >= facts.liquidityFloorMonths,

  read: ({ profile, facts }): Read => ({
    segments: [
      text("You have "),
      from(profile.liquidCents, "currency", { label: "in cash" }),
      text(" set aside — about "),
      from(facts.liquidityMonths, "duration", {
        label: "of outgoings",
        interrogable: true,
      }),
      text(" of outgoings. "),
      fig(facts.liquidityFloorMonths, "duration", "assumed", {
        label: "the buffer floor",
      }),
      text(" is the floor, and everything else can wait until it's there."),
    ],
    action: { commit: "Build the buffer first", defer: "Not now" },
  }),
};

/* ── 2 · Employer match ───────────────────────────────────────────────── */

const match: Rung = {
  id: "match",
  index: 2,
  label: "employer match",

  // Vacuously satisfied when no match is offered — there is nothing to leave
  // on the table.
  satisfied: ({ profile }) =>
    profile.employerMatchBps.value === 0 ||
    profile.retirementBps.value >= profile.employerMatchBps.value,

  read: ({ profile, facts }): Read => {
    const missedBps =
      profile.employerMatchBps.value - profile.retirementBps.value;
    const missedCents: Cents = Math.round(
      (facts.monthlyIncome.value * 12 * missedBps) / 10_000,
    );

    return {
      segments: [
        text("You're contributing "),
        from(profile.retirementBps, "percent", { label: "of your income" }),
        text(" and your employer matches up to "),
        from(profile.employerMatchBps, "percent", { label: "of your income" }),
        text(". That gap is about "),
        fig(
          missedCents,
          "currency",
          derived(
            facts.monthlyIncome.confidence,
            profile.retirementBps.confidence,
            profile.employerMatchBps.confidence,
          ),
          { label: "a year in unclaimed match", interrogable: true, emphasis: true },
        ),
        text(" a year you're leaving behind."),
      ],
      action: { commit: "Raise it to the match", defer: "Not now" },
    };
  },
};

/* ── 3 · High-interest debt ───────────────────────────────────────────── */

const highInterestDebt: Rung = {
  id: "high-interest-debt",
  index: 3,
  label: "high-interest debt",

  satisfied: ({ facts }) => facts.costliestObligation.value === null,

  read: ({ facts }): Read => {
    const obligation = facts.costliestObligation.value;

    // Unreachable via `evaluate`, which only calls `read` on an unsatisfied
    // rung. Guarded so the function is total rather than relying on that.
    if (obligation === null) {
      return {
        segments: [text("Nothing is costing you more than it earns.")],
        action: { commit: "Keep going", defer: "Not now" },
      };
    }

    const confidence = facts.costliestObligation.confidence;

    return {
      segments: [
        text("You're carrying "),
        fig(obligation.balanceCents, "currency", confidence, {
          label: `of ${obligation.kind} debt`,
          interrogable: true,
        }),
        text(" at "),
        fig(obligation.rateBps, "percent", confidence, {
          label: "annual interest",
        }),
        text(
          ". That costs more, reliably, than investing is expected to return — so it comes first.",
        ),
      ],
      action: { commit: "Clear the expensive debt first", defer: "Not now" },
    };
  },
};

/* ── 4 · Tax-advantaged space ─────────────────────────────────────────── */

const taxAdvantaged: Rung = {
  id: "tax-advantaged",
  index: 4,
  label: "tax-advantaged space",

  satisfied: ({ facts }) => facts.unusedTaxAdvantaged.value <= 0,

  read: ({ profile, facts, limits }): Read => {
    const space = from(facts.unusedTaxAdvantaged, "currency", {
      label: `of unused tax-advantaged room for ${limits.year}`,
      interrogable: true,
    });

    // Two phrasings of the SAME rung, chosen by situation rather than by user
    // type. Idle cash is the sharper framing when it's there.
    if (facts.excessCash.value > 0) {
      return {
        segments: [
          text("Your "),
          from(profile.liquidCents, "currency", { label: "in cash" }),
          text(" in cash is the problem, not the win. You're holding "),
          from(facts.liquidityMonths, "duration", { label: "of outgoings" }),
          text(" of outgoings — "),
          fig(facts.liquidityFloorMonths, "duration", "assumed", {
            label: "the buffer floor",
          }),
          text(" is the floor. The other "),
          from(facts.excessCash, "currency", {
            label: "of cash above the floor",
            interrogable: true,
            emphasis: true,
          }),
          text(" is sitting still while you have "),
          space,
          text(" of unused tax-advantaged room this year."),
        ],
        action: {
          commit: "Move the excess into tax-advantaged space",
          defer: "Not now",
        },
      };
    }

    return {
      segments: [
        text("You have "),
        space,
        text(
          " of tax-advantaged room going unused this year. It doesn't roll over.",
        ),
      ],
      action: { commit: "Use the room before it expires", defer: "Not now" },
    };
  },
};

/* ── 5 · Goal funding ─────────────────────────────────────────────────── */

const goal: Rung = {
  id: "goal",
  index: 5,
  label: "goal funding",

  // Onboarding collects no goal, so this is satisfied until the Goals surface
  // names one. With several named, the rung speaks for the SOONEST unfunded
  // one — the surplus is allocated in deadline order (core/goals/plan.ts), so
  // the rung and the Goals screen can never disagree about who is short.
  satisfied: ({ profile, facts }) =>
    planGoals(profile, facts.monthlySurplus.value).primary === null,

  read: ({ profile, facts }): Read => {
    const plan = planGoals(profile, facts.monthlySurplus.value);
    const primary = plan.primary;

    if (!primary) {
      return {
        segments: [text("Nothing is waiting on funding.")],
        action: { commit: "Keep going", defer: "Not now" },
      };
    }

    const { label, withinMonths } = primary.goal;
    // What the surplus can genuinely give this goal, once nearer goals have
    // taken theirs — never the whole surplus restated per goal.
    const others = plan.goals.filter((g) => !g.funded).length - 1;

    return {
      segments: [
        text(`${label} needs about `),
        fig(primary.monthlyNeedCents, "currency", derived(primary.confidence), {
          label: "a month to land on time",
          interrogable: true,
        }),
        text(" a month to land in "),
        fig(withinMonths, "duration", primary.confidence, { label: "from now" }),
        text(
          others > 0
            ? `. After what your other ${others === 1 ? "goal takes" : "goals take"}, about `
            : ". You have about ",
        ),
        fig(
          others > 0 ? primary.monthlyCoveredCents : facts.monthlySurplus.value,
          "currency",
          derived(facts.monthlySurplus.confidence),
          { label: "spare each month" },
        ),
        text(others > 0 ? " of that is there." : " spare."),
      ],
      action: { commit: "Start funding it", defer: "Not now" },
    };
  },
};

/* ── 6 · Taxable investing ────────────────────────────────────────────── */

const taxable: Rung = {
  id: "taxable",
  index: 6,
  label: "surplus with nowhere to go",

  satisfied: ({ facts }) =>
    facts.monthlySurplus.value < THRESHOLDS.meaningfulSurplusCents,

  read: ({ facts }): Read => ({
    segments: [
      text("You have about "),
      from(facts.monthlySurplus, "currency", {
        label: "spare each month",
        interrogable: true,
      }),
      text(
        " a month with nowhere to go — every tax-advantaged route is already full.",
      ),
    ],
    action: { commit: "Put the surplus to work", defer: "Not now" },
  }),
};

/* ── 7 · Optimization ─────────────────────────────────────────────────── */

const optimization: Rung = {
  id: "optimization",
  index: 7,
  label: "optimization",

  satisfied: ({ facts }) =>
    facts.liquidityMonths.value <= THRESHOLDS.idleCashCeilingMonths,

  read: ({ facts }): Read => ({
    segments: [
      text("Everything else is handled, and you're still holding "),
      from(facts.liquidityMonths, "duration", { label: "of outgoings" }),
      text(" of outgoings in cash. About "),
      from(facts.excessCash, "currency", {
        label: "above the buffer floor",
        interrogable: true,
      }),
      text(" of it is doing nothing."),
    ],
    action: { commit: "Move the idle cash", defer: "Not now" },
  }),
};

/**
 * The ladder, in priority order.
 *
 * Order is the entire mechanism. Changing it changes what North tells everyone,
 * so it is asserted in the test suite rather than left to convention.
 */
export const RUNGS: readonly Rung[] = [
  liquidity,
  match,
  highInterestDebt,
  taxAdvantaged,
  goal,
  taxable,
  optimization,
] as const;

export const WATERFALL_LENGTH = RUNGS.length;

/** Convenience for tests and for the derivation sheet. */
export function rungById(id: Rung["id"]): Rung {
  const found = RUNGS.find((r) => r.id === id);
  if (!found) throw new Error(`Unknown rung: ${id}`);
  return found;
}

export type { RungContext };

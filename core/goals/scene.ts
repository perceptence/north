import { fig, text } from "../prose.ts";
import { planGoals, type GoalPlan, type PlannedGoal } from "./plan.ts";
import type { SituationProfile } from "../profile/types.ts";
import { project } from "../projection/horizon.ts";
import type { Projection } from "../projection/types.ts";
import { derive } from "../waterfall/derive.ts";
import type { EvaluateOptions, ReadSegment } from "../waterfall/types.ts";

/**
 * The Goals scene — "Where am I going?" as a view, not a tracker.
 *
 * One horizon, honestly wide, under the sky. When a goal exists it gets ONE
 * pacing sentence computed from the same facts the engine uses — never a
 * progress bar, never a grid (docs/UX-ARCHITECTURE.md, the redesign).
 */

/** One named goal, with the sentence that says where it stands. */
export interface GoalLine {
  planned: PlannedGoal;
  /** The pacing sentence — this goal measured against what is left for it. */
  pacing: ReadSegment[];
  /**
   * The projection AT THIS GOAL'S HORIZON.
   *
   * Every goal gets the same grammar the screen's own headline gets — a
   * statement and a wordless mark — rather than the top block having a
   * graphic and the goals being bare rows. It is the same engine call the
   * horizon scrub already makes, just at the goal's date, so it introduces
   * no new claim: "here is where the whole picture lands by the time this
   * one is due."
   */
  projection: Projection | null;
}

export interface GoalScene {
  /** The horizon sentence — the largest thing on the screen. */
  headline: ReadSegment[];
  /** Every named goal, in deadline order. Empty until one is named. */
  goals: GoalLine[];
  /** The whole plan, for callers that need the totals. */
  plan: GoalPlan;
  projection: Projection | null;
  hasGoal: boolean;
}

function horizonPhrase(months: number): string {
  if (months >= 300) return "by retirement";
  if (months % 12 === 0) return `in ${months / 12} years`;
  return `in ${months} months`;
}

export function composeScene(
  profile: SituationProfile,
  options: EvaluateOptions,
): GoalScene {
  const projection = project(profile, options);
  const facts = derive(profile, options);

  const headline: ReadSegment[] = projection
    ? [
        text("Between "),
        // BOTH ends open the same panel. Marking only the high one meant one
        // half of a range was openable and the other half was not, in the same
        // sentence, for no reason a reader could infer.
        fig(projection.lowCents, "currency", projection.confidence, {
          abbreviate: true,
          label: "low end of the projection",
          interrogable: true,
        }),
        text(" and "),
        fig(projection.highCents, "currency", projection.confidence, {
          abbreviate: true,
          label: "high end of the projection",
          interrogable: true,
        }),
        text(` ${horizonPhrase(projection.horizonMonths)}, on what North can see.`),
      ]
    : [
        text(
          "The horizon sits close to the ground right now. The buffer comes first — then this view opens up.",
        ),
      ];

  // One surplus, allocated once in deadline order — so no two goals report
  // that the same dollar covers them (core/goals/plan.ts).
  const plan = planGoals(profile, facts.monthlySurplus.value);

  const goals: GoalLine[] = plan.goals.map((planned) => {
    const { goal: g, confidence } = planned;
    const name = g.label.toLowerCase();
    // The same projection the scrub uses, asked at this goal's date.
    const atGoal = project(
      {
        ...profile,
        horizonMonths: { ...profile.horizonMonths, value: g.withinMonths },
      },
      options,
    );

    if (planned.funded) {
      return {
        planned,
        projection: atGoal,
        pacing: [text(`${g.label} is funded. That part is done.`)],
      };
    }

    if (planned.monthlyShortCents === 0) {
      return {
        planned,
        projection: atGoal,
        pacing: [
          text("About "),
          fig(planned.monthlyNeedCents, "currency", confidence, {
            label: "a month",
          }),
          text(` a month lands ${name} on time, and that much is spare.`),
        ],
      };
    }

    return {
      planned,
      projection: atGoal,
      pacing: [
        text(`${g.label} asks about `),
        fig(planned.monthlyNeedCents, "currency", confidence, {
          label: "a month",
        }),
        text(" a month; about "),
        fig(
          planned.monthlyShortCents,
          "currency",
          facts.monthlySurplus.confidence,
          { label: "a month short" },
        ),
        text(" of that isn’t there yet."),
      ],
    };
  });

  return {
    headline,
    goals,
    plan,
    projection,
    hasGoal: goals.length > 0,
  };
}

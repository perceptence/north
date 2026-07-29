import type { Cents } from "../money.ts";
import type { SituationProfile } from "../profile/types.ts";
import { project } from "../projection/horizon.ts";
import { derive } from "../waterfall/derive.ts";
import { evaluate } from "../waterfall/evaluate.ts";
import type { EvaluateOptions } from "../waterfall/types.ts";
import type {
  ParamSet,
  Scenario,
  ScenarioAnswer,
  ScenarioContext,
  Side,
} from "./types.ts";

/**
 * Answer a scenario.
 *
 * The whole method: apply the decision to the profile, then run BOTH the
 * original and the result through the same engine that produces Today. The
 * answer is a comparison, not a generation — which is why it can be trusted,
 * and why it cannot drift from what the rest of the product says.
 */

function sideOf(
  profile: SituationProfile,
  options: EvaluateOptions,
): Side {
  const evaluation = evaluate(profile, options);
  return {
    rungId: evaluation.current?.rung.id ?? null,
    rungIndex: evaluation.current?.rung.index ?? null,
    rungLabel: evaluation.current?.rung.label ?? null,
    projection: project(profile, options),
  };
}

export function answerScenario(
  scenario: Scenario,
  profile: SituationProfile,
  params: ParamSet,
  options: EvaluateOptions,
): ScenarioAnswer {
  const context: ScenarioContext = {
    profile,
    facts: derive(profile, options),
    params: { ...scenario.defaults, ...params },
    limits: options.limits,
    now: options.now,
  };

  const after = scenario.transform(context);
  // Both sides stand at the same moment — see Scenario.baseline.
  const before = sideOf(scenario.baseline?.(context) ?? profile, options);
  const afterSide = sideOf(after, options);

  // One ceiling for both bands. Drawn to separate scales the comparison would
  // be meaningless — worse, it would look like a rigorous chart while lying.
  const highest = Math.max(
    before.projection?.highCents ?? 0,
    afterSide.projection?.highCents ?? 0,
  );
  const domainMaxCents: Cents = Math.max(
    100_000,
    Math.round(highest * 1.1),
  );

  return {
    scenarioId: scenario.id,
    question: scenario.question,
    understanding: scenario.understanding(context),
    analysis: scenario.analysis(context),
    recommendation: scenario.recommendation(context),
    impact: { before, after: afterSide, domainMaxCents },
  };
}

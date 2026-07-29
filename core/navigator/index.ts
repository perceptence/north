/**
 * The Navigator — "what if?" answered by transformation, not generation.
 *
 * See core/navigator/types.ts for why this is not a chat box.
 */

export { answerScenario } from "./answer.ts";
export { isDecisive, matchQuestion } from "./match.ts";
export type { QuestionMatch } from "./match.ts";
export {
  SCENARIOS,
  availableScenarios,
  scenarioById,
} from "./scenarios.ts";
export type {
  AnalysisPoint,
  Impact,
  ParamSet,
  ParamValue,
  Recommendation,
  Scenario,
  ScenarioAnswer,
  ScenarioContext,
  ScenarioId,
  ScenarioParam,
  Side,
  Verdict,
} from "./types.ts";

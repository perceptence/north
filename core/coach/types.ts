import type { ScenarioId } from "../navigator/types.ts";
import type { ReadSegment } from "../waterfall/types.ts";

/**
 * What the coach understood you to be asking.
 *
 * ── THE WHOLE POINT OF A TYPED INTENT ─────────────────────────────────────
 * The router's output is one of these and nothing else — never a sentence,
 * never a number, never prose (docs/VOICE.md §5). Every answer is composed
 * afterwards by `core/`, from the same engine that produces Today. That is
 * what makes a talking North safe: if routing goes wrong the worst case is
 * the coach saying it didn't follow, because it was never given the chance
 * to invent an answer in the first place.
 *
 * It is also why the router can later become a model call without any of the
 * safety properties changing. A model that returns `{ kind: "goals" }` is
 * exactly as incapable of hallucinating your balance as the keyword matcher
 * is today.
 */
export type Intent =
  /** One of the five scenarios the engine can actually model. */
  | { kind: "scenario"; id: ScenarioId }
  /** "How am I doing?" — the current read off the waterfall. */
  | { kind: "standing" }
  /** "Why that?" / "What's next?" — position on the ladder. */
  | { kind: "ladder" }
  /** "What have I decided?" — the ledger, summarised. */
  | { kind: "decisions" }
  /** "What am I working toward?" — named goals and their pacing. */
  | { kind: "goals" }
  /** "Where does this leave me?" — the long-range projection. */
  | { kind: "horizon" }
  /** "What's changed?" — the letter, which is what Insights already is. */
  | { kind: "changes" }
  /**
   * "What can you do?" — the first thing anyone asks a coach they have just
   * met, and the one question a refusal is the worst possible answer to.
   */
  | { kind: "capabilities" }
  /** "Say that again." Handled by the caller, which holds the last turn. */
  | { kind: "repeat" }
  /** "Stop." Also the caller's to act on. */
  | { kind: "stop" }
  /** Understood as nothing the engine can answer. Refused out loud. */
  | { kind: "unknown" };

export type IntentKind = Intent["kind"];

/** One thing the coach says back. */
export interface CoachReply {
  /** The answer, as engine segments — rendered AND spoken from one source. */
  segments: ReadSegment[];
  /**
   * A scenario this answer belongs to, which the caller may offer to open in
   * full. The conversation gives the verdict; the scenario view gives the
   * sliders, because "what if the deposit were bigger" is a thing you drag,
   * not a thing you say.
   */
  opens?: ScenarioId;
  /**
   * Two or three follow-ups, phrased as the user would say them.
   *
   * A tap sends the sentence itself back through the router, so tapping and
   * speaking reach the same answer by the same path — there is no second code
   * route, and no offer that can lead somewhere speaking could not. See
   * `./offers.ts` for why they are conditioned on the profile rather than
   * fixed.
   */
  asks?: string[];
}

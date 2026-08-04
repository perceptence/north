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
  /**
   * "Why?" / "How do I bring it down?" — go a layer deeper on the last
   * answer, rather than repeating it.
   *
   * `of` is what was just answered, so the elaboration knows what it is
   * elaborating. A continuation means nothing on its own, which is exactly
   * why it used to fall through to the default and return the same read.
   */
  | {
      kind: "elaborate";
      of: IntentKind;
      /**
       * How many times in a row they have asked to go deeper.
       *
       * Without it, "why" and then "tell me more" both landed on layer one
       * and said the same thing twice — the exact repetition this intent was
       * added to stop, one level down. There are a finite number of honest
       * layers, and past the last one the coach says so rather than looping.
       */
      depth: number;
    }
  /** "Say that again." Handled by the caller, which holds the last turn. */
  | { kind: "repeat" }
  /** "Stop." Also the caller's to act on. */
  | { kind: "stop" }
  /** Understood as nothing the engine can answer. Refused out loud. */
  | { kind: "unknown" };

export type IntentKind = Intent["kind"];

/**
 * A screen an answer belongs to.
 *
 * A NAME, never a URL: `core/` does not know what this app's routes are, and
 * the day one moves is not a day the engine should have an opinion about. The
 * caller maps these four to paths.
 */
export type Destination = "today" | "decisions" | "goals" | "insights";

/**
 * The way onward from an answer.
 *
 * ── WHY AN ANSWER NEEDS A DOOR ────────────────────────────────────────────
 * The conversation gives the verdict and the screens give you something to do
 * about it, and until now only a SCENARIO answer said so. Ask "how am I
 * doing?" and North returned Today's exact read — same verdict, same figures —
 * with nothing to act on. "What have I decided?" returned the ledger sentence
 * with no ledger. "What's changed?" returned the letter with no letter. That
 * is a text box, and the line docs/STRATEGY.md §9 draws between a coach and
 * "every GPT wrapper" is on the other side of it.
 *
 * The label rides along rather than being derived from `to`, because what you
 * will find depends on what was just said: `horizon` and `goals` both land on
 * Goals and should not promise the same thing. It is copy in the coach's
 * voice, which is what `core/` writes anyway.
 */
export interface CoachDoor {
  to: Destination;
  /** In the coach's voice, naming what is through it. */
  label: string;
}

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
  /**
   * The screen this answer belongs to, offered as one way onward.
   *
   * Absent where there is nothing better to offer than the conversation
   * itself — `capabilities` is a set of questions, not a place, and a scenario
   * answer already has `opens`, which is a more specific door than any tab.
   */
  goes?: CoachDoor;
}

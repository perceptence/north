import type { Decision } from "../decisions/types.ts";
import { summariseLedger } from "../decisions/summary.ts";
import { composeScene } from "../goals/scene.ts";
import { composeLetter, letterSegments } from "../insights/letter.ts";
import { answerScenario } from "../navigator/answer.ts";
import { scenarioById } from "../navigator/scenarios.ts";
import type { SituationProfile } from "../profile/types.ts";
import { text } from "../prose.ts";
import { evaluate } from "../waterfall/evaluate.ts";
import type { EvaluateOptions, ReadSegment } from "../waterfall/types.ts";
import type { CoachReply, Intent } from "./types.ts";

/**
 * What the coach says back.
 *
 * ── EVERY ANSWER COMES OUT OF THE ENGINE ──────────────────────────────────
 * Nothing here writes a claim about someone's money. Each branch calls the
 * same function the corresponding SCREEN calls — `evaluate()` for standing,
 * `summariseLedger()` for the record, `composeScene()` for goals,
 * `answerScenario()` for a scenario — and hands back its segments. So the
 * spoken answer and the rendered answer are the same object, and a
 * discrepancy between what North says and what North shows is not merely
 * unlikely, it is unrepresentable.
 *
 * The only prose this file owns is connective tissue and the refusals, which
 * contain no figures at all.
 *
 * Pure and total: no clock of its own, no store, no I/O.
 */

export interface CoachContext {
  profile: SituationProfile;
  decisions: Decision[];
  options: EvaluateOptions;
  /** The profile as it stood last time, for "what's changed?". Null on a
   *  first run, which the answer says plainly rather than inventing a diff. */
  previousProfile?: SituationProfile | null;
  previousAt?: string | null;
}

/**
 * What this coach can actually be asked.
 *
 * The first thing anyone says to a coach they have just met is some form of
 * "what can you do" — and a refusal is the worst possible answer to it. It
 * used to be exactly that, because there was no intent for the question.
 *
 * Written as an OFFER rather than a menu: each line is a question in the
 * user's own words, so it doubles as a script for what to say next.
 */
const CAPABILITIES: ReadSegment[] = [
  text(
    "I work from your situation — everything I say comes from what you've " +
      "told me and what the engine works out from it. Ask me how you're " +
      "doing, or what you should focus on. What you're working toward, and " +
      "whether it's on track. What you've decided with me before. What's " +
      "changed lately. Or think a decision through out loud — buying a " +
      "home, a career break, putting more away, taking a pay cut, clearing " +
      "debt first.",
  ),
];

/**
 * The honest refusal.
 *
 * Shorter than it was, and it leads with what it CAN do rather than a
 * paragraph of apology. The old version listed every capability inline,
 * which made a refusal read as a wall — and it was firing on 41% of
 * perfectly answerable questions, so most people met it first.
 */
const REFUSAL: ReadSegment[] = [
  text(
    "That one I can't answer honestly — I work from your situation, not " +
      "from markets or particular investments. Ask me what you can ask, and " +
      "I'll tell you.",
  ),
];

export function respond(intent: Intent, context: CoachContext): CoachReply {
  const { profile, decisions, options, previousProfile, previousAt } =
    context;

  switch (intent.kind) {
    case "standing": {
      const evaluation = evaluate(profile, options);
      if (evaluation.current) {
        return { segments: evaluation.current.read.segments };
      }
      // Every rung settled. The calm answer is a real answer, not an empty one.
      return {
        segments: [
          text(
            "Nothing needs you right now. Everything the ladder asks of you " +
              "is handled, and that is rarer than it sounds.",
          ),
        ],
      };
    }

    case "ladder": {
      const evaluation = evaluate(profile, options);
      const current = evaluation.current;
      if (!current) {
        return {
          segments: [
            text("Every rung is behind you. I'll speak up if that changes."),
          ],
        };
      }
      const total = evaluation.ladder.length;
      return {
        segments: [
          // Rung labels stay in the prose case they were authored in. They
          // are written to sit inside sentences, and capitalising them is a
          // presentation decision that lives outside `core/` (lib/text.ts).
          text(
            `You're on ${current.rung.index} of ${total} — ` +
              `${current.rung.label}. ` +
              "I work down these in order, so the only one I ask about is the " +
              "first that isn't settled. That's why the ones above it have " +
              "gone quiet.",
          ),
        ],
      };
    }

    case "decisions": {
      const summary = summariseLedger(decisions);
      if (summary.empty) {
        return {
          segments: [
            text(
              "Nothing on the record yet. The first decision you make with me " +
                "lands there, along with whether you held it.",
            ),
          ],
        };
      }
      return { segments: summary.read };
    }

    case "goals": {
      const scene = composeScene(profile, options);
      if (!scene.hasGoal) {
        return {
          segments: [
            text(
              "You haven't named a destination yet. Tell me what you're saving " +
                "for and I'll fold it into the ladder.",
            ),
          ],
        };
      }
      // Each goal's own pacing sentence, which is what "how is it going"
      // actually means — the headline alone is the horizon, not the goals.
      const segments: ReadSegment[] = [];
      for (const line of scene.goals) {
        if (segments.length > 0) segments.push(text(" "));
        segments.push(...line.pacing);
      }
      return { segments };
    }

    case "horizon": {
      const scene = composeScene(profile, options);
      if (!scene.projection) {
        return {
          segments: [
            text(
              "I can't project a horizon yet — I need a little more about what " +
                "you're putting away.",
            ),
          ],
        };
      }
      return { segments: scene.headline };
    }

    case "capabilities":
      return { segments: CAPABILITIES };

    case "changes": {
      const letter = composeLetter(
        previousProfile ?? null,
        previousAt ?? null,
        profile,
        decisions,
        options,
      );
      // A quiet stretch is a real answer, and the letter already knows how to
      // say so without scolding — so it is passed through, not replaced.
      return { segments: letterSegments(letter) };
    }

    case "scenario": {
      const scenario = scenarioById(intent.id);
      const answer = answerScenario(
        scenario,
        profile,
        scenario.defaults,
        options,
      );
      return {
        // The verdict and what it costs — every real recommendation has a
        // tradeoff, and leaving it out of the spoken answer would make the
        // coach sound more certain than the screen is.
        segments: [
          text(`${answer.recommendation.headline} ${answer.recommendation.tradeoff}`),
        ],
        opens: scenario.id,
      };
    }

    // The caller owns these: it holds the last thing said and the speaker.
    case "repeat":
    case "stop":
      return { segments: [] };

    case "unknown":
      return { segments: REFUSAL };
  }
}

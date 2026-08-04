import type { ScenarioId } from "../navigator/types.ts";
import type { RungId } from "../waterfall/types.ts";

/**
 * Going a layer deeper on what was just said.
 *
 * ── THE COMPLAINT THIS EXISTS FOR ─────────────────────────────────────────
 * Ask "how am I doing", hear about the debt, then ask "how do I bring it
 * down" — and get the identical sentence back. Every follow-up fell through
 * to `standing`, because a continuation is not ABOUT anything on its own:
 * "why", "tell me more" and "what should I do about it" share no vocabulary
 * with any topic, so the router had nothing to match and used its default.
 *
 * A coach that answers the follow-up with the same words it just said is
 * worse than one that says it cannot help — the repetition reads as not
 * having heard the question at all.
 *
 * ── AND WHY IT IS NOT A MODEL ─────────────────────────────────────────────
 * The obvious reach is "let a model handle the conversation". It cannot,
 * here: CLAUDE.md's rule is that the engine never depends on a model call to
 * produce an answer, and every sentence North says is composed by `core/`
 * from the same functions the screens use. A model may classify (see
 * `app/api/intent`), never compose.
 *
 * What makes that a non-problem is that the engine ALREADY holds the deeper
 * layer. "How do I bring it down" is a question North can genuinely model —
 * `debt-first` is one of the five scenarios, run against this person's real
 * numbers — so the honest elaboration is that scenario's verdict and its
 * tradeoff, not a paraphrase of the read.
 */

/**
 * The what-if that models acting on each rung.
 *
 * This is the "how" behind the rung's "what": the read says the expensive
 * debt comes first, and `debt-first` is the engine actually clearing it and
 * reporting what that costs. Answering a follow-up with it means the
 * suggestion carries a verdict AND a tradeoff, which is the shape every
 * recommendation in this product has (docs/FOUNDATION.md §9).
 *
 * `liquidity` has none on purpose — building a buffer is not one of the five
 * what-ifs, and inventing a sixth to satisfy this mapping would be the tail
 * wagging the engine. That rung elaborates with its own action instead.
 */
export const SCENARIO_BEHIND_RUNG: Partial<Record<RungId, ScenarioId>> = {
  "high-interest-debt": "debt-first",
  match: "contribute-more",
  "tax-advantaged": "contribute-more",
  goal: "contribute-more",
  taxable: "contribute-more",
  optimization: "contribute-more",
};

/**
 * Utterances that mean "go on" rather than naming a subject.
 *
 * Matched as WHOLE utterances, exactly like the commands in `./intent.ts`
 * and for the same hard-won reason: these are made of the commonest words in
 * the language, and matching them loosely would swallow half the questions
 * anyone asks. "Why" is a continuation; "why is my buffer short" is a
 * question about the buffer.
 *
 * They only mean anything when something was said before them, so the router
 * ignores this set entirely on the first turn.
 */
export const CONTINUATIONS = new Set([
  // Reasons.
  "why", "why that", "why then", "why not", "how come", "how so", "says who",
  // More.
  "tell me more", "more", "go on", "and", "and then", "then what", "so",
  "what else", "anything else",
  // The actionable ones — the case that prompted this.
  "how do i do that", "how do i fix that", "how do i fix it",
  "how do i change that", "how do i bring it down", "how to bring it down",
  "how do i bring that down", "how", "how though",
  "what do i do", "what do i do about it", "what should i do about it",
  "what can i do about it", "what about it", "what would you do",
]);

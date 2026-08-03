import type { Scenario, ScenarioId } from "../navigator/types.ts";
import type { Intent, IntentKind } from "./types.ts";

/**
 * Turn an untrusted value into an `Intent`, or refuse it.
 *
 * ── WHY THIS EXISTS SEPARATELY FROM THE ROUTER ────────────────────────────
 * The keyword router in `./intent.ts` constructs intents itself, so it cannot
 * produce an invalid one. A MODEL can. The moment routing moves behind a
 * network call, something outside this codebase is proposing the shape of the
 * answer — and the whole safety argument for a talking North
 * (docs/VOICE.md §5) rests on that shape being narrow and checked.
 *
 * So this is the gate, and it is deliberately paranoid:
 *
 *   · The kind must be one of the eleven. Not "close to" one — one of them.
 *   · A scenario must name an id **the caller offered**, which is how the
 *     rule that a hidden scenario can never be routed to survives being
 *     decided somewhere else. Someone with no debt cannot be handed the
 *     debt question by a model that guessed.
 *   · A scenario without a valid id is not silently downgraded to a topic.
 *     It is rejected, and the caller falls back to the local router.
 *
 * Anything it cannot vouch for returns `null` rather than `unknown` — those
 * are different facts. `unknown` means *North understood you and won't
 * answer*; `null` means *this response is unusable*, and the caller should
 * use the deterministic route instead of speaking a refusal it never earned.
 *
 * Pure, and in `core/` on purpose: the API route validates with it before
 * responding, the client validates with it again after, and both are the same
 * function. A boundary check that exists on only one side of the boundary is
 * a check you are trusting the network to run.
 */

const KINDS: readonly IntentKind[] = [
  "scenario",
  "standing",
  "ladder",
  "decisions",
  "goals",
  "horizon",
  "changes",
  "capabilities",
  "repeat",
  "stop",
  "unknown",
];

function isKind(value: unknown): value is IntentKind {
  return typeof value === "string" && (KINDS as readonly string[]).includes(value);
}

export function parseIntent(
  value: unknown,
  available: readonly Scenario[],
): Intent | null {
  if (typeof value !== "object" || value === null) return null;

  const candidate = value as { kind?: unknown; id?: unknown };
  if (!isKind(candidate.kind)) return null;

  if (candidate.kind !== "scenario") return { kind: candidate.kind };

  const offered = available.map((scenario) => scenario.id as string);
  if (typeof candidate.id !== "string" || !offered.includes(candidate.id)) {
    return null;
  }

  return { kind: "scenario", id: candidate.id as ScenarioId };
}

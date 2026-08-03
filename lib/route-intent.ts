import { outOfScope, parseIntent, routeIntent } from "@/core/coach";
import type { Intent } from "@/core/coach";
import type { Scenario } from "@/core/navigator";

/**
 * Route what someone said — with a model when there is one, and without one
 * when there isn't.
 *
 * ── THE DETERMINISTIC ROUTE IS THE FLOOR, NOT THE FALLBACK ────────────────
 * `routeIntent()` runs FIRST, always, and its answer is in hand before the
 * network is touched. The model can only ever improve on it. That ordering is
 * the whole design:
 *
 *   · **No spinner, ever.** There is already an answer; the wait is optional.
 *     This product refuses loading states (docs/UX-ARCHITECTURE.md §11), and
 *     a router that could block on a network call would have needed one.
 *   · **Offline is not degraded, it is Tuesday.** No key, no signal, a 500 —
 *     the coach behaves exactly as it did before this file existed.
 *   · **The engine never depends on a model call** (CLAUDE.md). Literally
 *     true here: delete the route and every question still gets answered.
 *
 * ── THREE THINGS NEVER REACH THE NETWORK ──────────────────────────────────
 * 1. **Out-of-scope questions.** Checked locally first. A markets question is
 *    refused here and never sent, so no model is in a position to be talked
 *    into answering one.
 * 2. **Control words.** "Stop" must be instant — waiting 600ms to go quiet is
 *    the one latency a person will actually notice, and it is not a
 *    classification problem.
 * 3. **The money.** Only the transcript and the ids of the scenarios this
 *    person can be offered go over the wire. No balances, no income, no
 *    goals, no decisions.
 *
 * ── WHAT THE MODEL IS FOR ─────────────────────────────────────────────────
 * Precision, not coverage. Since the keyword router's default was inverted it
 * answers nearly everything — but it answers a lot of it with `standing`,
 * because that is the honest fallback when no term matches. The model is what
 * turns "did I keep my promises" into `decisions` and "how long until I'm
 * okay" into `horizon` instead. Better routing of questions that were already
 * being answered, which is why it is allowed to be optional.
 */

/**
 * How long the model gets before the local answer is used instead.
 *
 * A spoken conversation tolerates a beat; it does not tolerate a pause. This
 * is set below the point where a listener starts to wonder whether they were
 * heard, and the API route's own timeout sits above it so the budget is
 * enforced on the side that is actually waiting.
 */
const BUDGET_MS = 1200;

export async function resolveIntent(
  transcript: string,
  available: Scenario[],
): Promise<Intent> {
  const local = routeIntent(transcript, available);

  // The refusal and the control words are decided locally, full stop. See
  // the note above — these are not classification problems.
  if (outOfScope(transcript)) return local;
  if (local.kind === "stop" || local.kind === "repeat") return local;

  // A controller rather than `AbortSignal.timeout`, so the timer is CLEARED
  // once an answer is in hand. Left to expire, it fires against a request
  // that already settled — harmless, but it leaves a stray abort in the
  // network log for every question asked, which is the kind of noise that
  // costs an hour the next time something here is genuinely wrong.
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), BUDGET_MS);

  try {
    const response = await fetch("/api/intent", {
      method: "POST",
      headers: { "content-type": "application/json" },
      signal: controller.signal,
      body: JSON.stringify({
        transcript,
        scenarios: available.map((scenario) => scenario.id),
      }),
    });

    // 204 is the route's way of saying "use yours" — no key, no network, a
    // malformed tool call. It is the expected path, not an error, and it is
    // what every install without a key does on every single question.
    if (!response.ok || response.status === 204) return local;

    const data = (await response.json()) as { intent?: unknown };
    const remote = parseIntent(data.intent, available);
    if (!remote) return local;

    // Even a valid model intent cannot trigger a refusal. `unknown` from the
    // model means it did not recognise the question — which is exactly the
    // situation the inverted local default already handles better, by
    // answering rather than refusing.
    if (remote.kind === "unknown") return local;

    // ── NOR CAN IT ISSUE A COMMAND ──────────────────────────────────────────
    // The note at the top of this file says control words are decided
    // locally, full stop. That was only half enforced: the local route
    // short-circuits before the fetch when IT sees a command, but nothing
    // stopped the MODEL from returning one for a question the local router
    // read as a topic. `stop` closes voice mode and `repeat` re-speaks the
    // last answer — a classifier should not be able to do either, and a
    // transcript that talks about stopping should not be able to talk it
    // into it.
    if (remote.kind === "stop" || remote.kind === "repeat") return local;

    return remote;
  } catch {
    return local;
  } finally {
    clearTimeout(timer);
  }
}

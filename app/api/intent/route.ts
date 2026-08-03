import { parseIntent } from "@/core/coach";
import type { Scenario, ScenarioId } from "@/core/navigator";
import { SCENARIOS } from "@/core/navigator";

/**
 * THE MODEL ROUTER — classification, and nothing else.
 *
 * ── WHAT THIS IS ALLOWED TO DO ────────────────────────────────────────────
 * Turn a sentence into one of eleven labels. That is the whole job. It never
 * composes an answer, never sees a number, and never produces a word the user
 * reads or hears. `respond()` in `core/` writes every sentence North says,
 * from the same engine that produces Today (CLAUDE.md: the engine never
 * depends on a model call to produce an answer).
 *
 * This is the arrangement docs/VOICE.md §5 described from the start: *"the
 * router is the ONLY model call, and it returns a typed Intent, never
 * prose."* The keyword router was always the fallback rather than the plan.
 *
 * ── THE MODEL NEVER SEES THE MONEY ────────────────────────────────────────
 * The request body carries the transcript and the LABELS of the scenarios
 * this person can be offered. No balances, no income, no goals, no profile,
 * no decision history — none of it is needed to classify a question, so none
 * of it goes over the wire. In a money product that is not a nicety; it is
 * the reason this call is defensible at all.
 *
 * ── THE REFUSAL IS NOT DELEGATED ──────────────────────────────────────────
 * The client checks its own out-of-scope list BEFORE calling here (see
 * `lib/route-intent.ts`), so a markets question never reaches the model in
 * the first place. The instructions below repeat the rule, but the rule is
 * not enforced by them. A model that is asked nicely to refuse investment
 * advice is not a control; a request that is never made is.
 *
 * ── FAILURE IS A 204, NEVER AN ERROR ──────────────────────────────────────
 * No key, no network, a timeout, a malformed tool call, a hallucinated
 * scenario id — every one of them returns "no content", and the client uses
 * the deterministic route it already computed. The product has no failed
 * states (docs/UX-ARCHITECTURE.md §11), and this must degrade to exactly the
 * behaviour that shipped before it existed.
 */

const MODEL = "claude-haiku-4-5-20251001";
const ENDPOINT = "https://api.anthropic.com/v1/messages";

/**
 * What each label means, in the model's terms.
 *
 * Written as the QUESTION a person is asking rather than as a feature name,
 * because that is what classification actually keys on — "goals" is a word,
 * "what am I working toward" is a thing someone says.
 */
const KIND_GUIDE = `
- standing: how they're doing right now, where they stand, what to focus on,
  whether they're behind or okay, what their situation is. THE DEFAULT — most
  vague or emotional questions about money are this one.
- ladder: why this comes first, what's next, the order of priorities.
- decisions: what they've decided, committed to, or held to before.
- goals: what they're saving toward, targets, whether goals are on pace.
- horizon: the long run, retirement, when they can stop working, where this
  all ends up.
- changes: what's changed lately, what's new, catch me up.
- capabilities: what North can do, what they can ask, how this works, help.
- scenario: a specific what-if that matches one of the listed scenarios.
- repeat: say that again.
- stop: be quiet, cancel, never mind. ONLY a short interruption — "when can I
  stop working" is horizon, not stop.
- unknown: markets, indices, specific securities, crypto, market timing, or
  anything not about this person's own situation. Also genuine noise.
`.trim();

const SYSTEM = `
You are a classifier inside a financial coaching product. You are given
something a person said out loud to their coach. Return the ONE label that
best matches what they are asking.

${KIND_GUIDE}

Rules:
- Classify only. Never write an answer, never explain, never add prose.
- Prefer answering to refusing. If someone is asking about their own money in
  a way that does not fit a specific label, that is "standing" — not
  "unknown". "unknown" is for subjects this product does not cover, not for
  phrasings you did not expect.
- Use "scenario" only when the question clearly matches one of the scenarios
  offered in the message, and return that scenario's exact id.
`.trim();

/** The tool IS the type. A forced tool call cannot come back as a sentence. */
function tool(available: readonly Scenario[]) {
  return {
    name: "route",
    description: "Record which question the person is asking.",
    input_schema: {
      type: "object" as const,
      properties: {
        kind: {
          type: "string",
          enum: [
            "standing",
            "ladder",
            "decisions",
            "goals",
            "horizon",
            "changes",
            "capabilities",
            "scenario",
            "repeat",
            "stop",
            "unknown",
          ],
        },
        id: {
          type: "string",
          enum: available.map((scenario) => scenario.id),
          description: "Required when kind is 'scenario'. Omit otherwise.",
        },
      },
      required: ["kind"],
    },
  };
}

/**
 * Resolve ids the client sent back to real scenarios.
 *
 * The client sends ids, not objects — a `Scenario` carries functions and does
 * not survive JSON. Anything unrecognised is dropped rather than trusted, so
 * the enum handed to the model can only ever contain real scenario ids.
 */
function scenariosFrom(ids: unknown): Scenario[] {
  if (!Array.isArray(ids)) return [];
  const wanted = new Set(ids.filter((id): id is string => typeof id === "string"));
  return SCENARIOS.filter((scenario) => wanted.has(scenario.id));
}

export async function POST(request: Request): Promise<Response> {
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) return new Response(null, { status: 204 });

  let transcript = "";
  let available: Scenario[] = [];
  try {
    const body = (await request.json()) as {
      transcript?: unknown;
      scenarios?: unknown;
    };
    if (typeof body.transcript !== "string") {
      return new Response(null, { status: 204 });
    }
    // A sentence, not a document. Anything longer is not a spoken question,
    // and capping it here caps what can be sent anywhere by this route.
    transcript = body.transcript.slice(0, 400);
    available = scenariosFrom(body.scenarios);
  } catch {
    return new Response(null, { status: 204 });
  }

  const offered = available
    .map((scenario) => `  ${scenario.id}: ${scenario.question}`)
    .join("\n");

  try {
    // The client already has a deterministic answer in hand, so a slow model
    // is worth nothing — this budget is what keeps the conversation feeling
    // like a conversation rather than a request.
    const response = await fetch(ENDPOINT, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-api-key": key,
        "anthropic-version": "2023-06-01",
      },
      signal: AbortSignal.timeout(2500),
      body: JSON.stringify({
        model: MODEL,
        max_tokens: 128,
        system: SYSTEM,
        tools: [tool(available)],
        // Forced. Without this the model may answer in prose, and prose is
        // the one thing this seam exists to make impossible.
        tool_choice: { type: "tool", name: "route" },
        messages: [
          {
            role: "user",
            content: `Scenarios available to this person:\n${
              offered || "  (none)"
            }\n\nThey said: "${transcript}"`,
          },
        ],
      }),
    });

    if (!response.ok) return new Response(null, { status: 204 });

    const data = (await response.json()) as {
      content?: { type: string; name?: string; input?: unknown }[];
    };
    const call = data.content?.find(
      (block) => block.type === "tool_use" && block.name === "route",
    );

    // Validated HERE as well as on the client. Same function, both sides —
    // a boundary check that runs on only one side of the boundary is a check
    // you are trusting the network to run.
    const intent = parseIntent(call?.input, available);
    if (!intent) return new Response(null, { status: 204 });

    return Response.json({ intent } satisfies { intent: typeof intent });
  } catch {
    return new Response(null, { status: 204 });
  }
}

export type { ScenarioId };

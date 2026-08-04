import type { Decision } from "../decisions/types.ts";
import type { SituationProfile } from "../profile/types.ts";
import type { Intent, IntentKind } from "./types.ts";

/**
 * What to offer asking next.
 *
 * ── NOBODY TYPES INTO AN EMPTY FIELD ──────────────────────────────────────
 * The coach could answer eleven things and seven of them had no tap path
 * anywhere in the product: `standing`, `ladder`, `decisions`, `goals`,
 * `horizon`, `changes` and `capabilities` were reachable only by typing or
 * speaking the right sentence. The conversation opened with a text input, a
 * tertiary hint paragraph, and five scenario rows — so on a phone, on a live
 * link, all the engine composition behind those seven intents was invisible.
 *
 * ── OFFERS, NOT A MENU ────────────────────────────────────────────────────
 * Each line is a QUESTION IN THE USER'S OWN WORDS, which is the same rule
 * `CAPABILITIES` already follows: tapping one is indistinguishable from
 * having said it, because what gets sent is the sentence itself, back through
 * the same router. There is no second code path and no way for a tap to reach
 * an answer that speaking could not.
 *
 * ── AND ONLY WHAT IS TRUE ─────────────────────────────────────────────────
 * "What's changed?" is offered only when there is a previous state to diff,
 * "What have I decided?" only when the ledger has something in it, "What am I
 * working toward?" only when a goal exists. A fixed menu would offer all of
 * them always and answer three of them with "nothing yet" — which teaches
 * people the offers are decoration. Conditioning them is what makes the
 * conversation look like it knows what it has to talk about.
 */

export interface OfferContext {
  profile: SituationProfile;
  decisions: readonly Decision[];
  /** Present only when there is a past state worth diffing against. */
  hasPrevious: boolean;
}

interface Offer {
  /** The intent this question routes to — used to avoid offering it twice. */
  kind: Exclude<IntentKind, "scenario" | "unknown" | "repeat" | "stop">;
  /** The question, exactly as it will be sent. */
  ask: string;
  applies: (context: OfferContext) => boolean;
}

/**
 * Ordered by how useful they are to someone who has just arrived.
 *
 * "How am I doing?" first because it is the question behind almost every
 * vague one, and it is the only one that is always true.
 */
const OFFERS: readonly Offer[] = [
  {
    kind: "standing",
    ask: "How am I doing?",
    applies: () => true,
  },
  {
    kind: "ladder",
    ask: "Why that first?",
    applies: () => true,
  },
  {
    kind: "changes",
    ask: "What’s changed?",
    // Nothing to diff against on a first run — the answer would be a
    // paragraph explaining that this is the start of the record, which is
    // not worth offering as a question.
    applies: ({ hasPrevious }) => hasPrevious,
  },
  {
    kind: "goals",
    ask: "What am I working toward?",
    applies: ({ profile }) => (profile.goals?.length ?? 0) > 0,
  },
  {
    kind: "decisions",
    ask: "What have I decided?",
    applies: ({ decisions }) => decisions.length > 0,
  },
  {
    kind: "horizon",
    ask: "Where does this leave me?",
    applies: () => true,
  },
  {
    kind: "capabilities",
    ask: "What else can I ask?",
    applies: () => true,
  },
];

/** How many to show. Three is a choice; six is a menu. */
const MOST = 3;

/**
 * The questions worth offering after answering `answered`.
 *
 * `answered` is excluded, because offering someone the question they just
 * asked is the clearest possible sign that nothing is listening. Pass `null`
 * for the cold start, where nothing has been asked yet.
 */
export function offers(
  answered: Intent | null,
  context: OfferContext,
): string[] {
  const justAnswered = answered?.kind;
  return OFFERS.filter((o) => o.kind !== justAnswered)
    .filter((o) => o.applies(context))
    .slice(0, MOST)
    .map((o) => o.ask);
}

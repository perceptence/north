"use client";

import { useCallback, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { RHYTHM, Button, Text, TRANSITION, m } from "@/components/nds";
import {
  openingOffers,
  respond,
  type CoachDoor,
  type CoachReply,
  type Destination,
  type Intent,
} from "@/core/coach";
import { resolveIntent } from "@/lib/route-intent";
import type { Scenario, ScenarioId } from "@/core/navigator";
import { spoken, type SpeechRegister } from "@/core/speech";
import type { Decision } from "@/core/decisions";
import type { SituationProfile } from "@/core/profile/types";
import type { EvaluateOptions, ReadSegment } from "@/core/waterfall";
import { cn } from "@/lib/cn";
import { useSpeechSynthesis } from "@/lib/use-speech-synthesis";
import {
  ActionLink,
  AdjustMark,
  HorizonMark,
  LedgerMark,
  SpeakMark,
} from "./ActionGlyphs";
import { ReadProse } from "./ReadProse";
import { SpokenField } from "./SpokenField";

/**
 * Talking to the coach.
 *
 * ── WHAT THIS IS, AND WHAT IT REFUSES TO BE ───────────────────────────────
 * A one-on-one conversation, not a chatbot and not a page being read out.
 * You ask in your own words; North answers from its engine and says the
 * answer back. What it CANNOT do is answer anything: the router returns a
 * typed `Intent` and `core/coach/respond.ts` composes every reply from
 * `evaluate()`, `summariseLedger()`, `composeScene()` and
 * `answerScenario()`. Ask it about markets and it says so
 * (docs/UX-ARCHITECTURE.md §4.5) — that refusal is the product, not a gap.
 *
 * ── THE MODALITY OF THE QUESTION SETS THE MODALITY OF THE ANSWER ──────────
 * Speak, and North speaks back. Type, and it answers in text and stays
 * silent. That is what keeps "North is silent by default" (docs/VOICE.md
 * §3.2) true without making the conversation feel deaf: starting to talk IS
 * the asking, and someone who never made a sound never triggers one.
 *
 * ── AND IT STILL DOESN'T SAY YOUR BALANCE BY DEFAULT ──────────────────────
 * The spoken half runs in the discreet register: the figures are in the
 * thread, on screen, in real `Figure`s carrying their confidence, so the
 * voice can carry the interpretation and leave the numbers where they can be
 * checked. "Say the numbers too" is offered on the conversation, applies
 * from that point on, and resets when the conversation is left — a control
 * on the thing it governs, never a setting (docs/VOICE.md §3.4).
 *
 * ── NO THINKING STATE ─────────────────────────────────────────────────────
 * The router is deterministic and synchronous, so there is nothing to wait
 * for. Inventing a pause to show a considered beat would be a workload
 * meter, which this product refuses (docs/UX-ARCHITECTURE.md §11).
 */

interface Turn {
  id: number;
  from: "you" | "north";
  /** What you said. */
  said?: string;
  /** What North said — engine segments, rendered and spoken from one source. */
  segments?: ReadSegment[];
  /** A scenario this answer belongs to, offered as a way in. */
  opens?: ScenarioId;
  /** What to ask next, chosen by the engine from what is true of you. */
  asks?: string[];
  /** The screen this answer belongs to, if there is one worth opening. */
  goes?: CoachDoor;
}

/**
 * Where a destination lives, and what marks it.
 *
 * The mapping is HERE and not in `core/`, which has no business knowing this
 * app's routes — `goes.to` is a name. `?from=navigator` rides along so the
 * ledger's Back names where you actually came from; Decisions is a drill-down
 * reached from three screens now, and getting that wrong is how a drill-down
 * starts lying about the way out.
 */
const PATHS: Record<Destination, string> = {
  today: "/today",
  decisions: "/decisions?from=navigator",
  goals: "/goals",
  insights: "/insights",
};

const pathFor = (to: Destination) => PATHS[to];

/**
 * The destination's OWN mark, where the product already has one.
 *
 * `LedgerMark` means the record and `HorizonMark` means the horizon field on
 * Goals everywhere else in the product, so a door wearing them says where it
 * leads rather than merely that it is a link. Today and Insights have no such
 * mark, and inventing one for this would be a worse trade than going bare —
 * doors are imperatives ("Read the letter") where offers are questions ending
 * in "?", which is what actually tells them apart.
 */
function markFor(to: Destination) {
  if (to === "decisions") return <LedgerMark />;
  if (to === "goals") return <HorizonMark />;
  return undefined;
}

/**
 * What to ask next, as questions you can tap.
 *
 * `ActionLink` rather than buttons: these are tertiary in weight — the
 * composer is still the primary way in — and the product's one tertiary
 * action is an ActionLink everywhere else.
 *
 * Tapping calls `ask()` with the sentence, so the question lands in the
 * thread as the user having said it and travels the same router a spoken one
 * would. There is deliberately no shortcut from an offer to an intent.
 */
function Offers({
  asks,
  onAsk,
}: {
  asks?: string[];
  onAsk: (question: string) => void;
}) {
  if (!asks || asks.length === 0) return null;
  return (
    // NO icon, deliberately. `SpeakMark` was stamped on each of these at
    // first, which put the same glyph on screen five times with three
    // different meanings — the Talk launcher, "Say the numbers too", and
    // every offer. A list of questions does not need a mark repeated down
    // its side; the dotted rule already says these are tappable, and leaving
    // `•=` alone keeps it meaning one thing.
    <ul className="flex flex-col items-start gap-1">
      {asks.map((question) => (
        <li key={question}>
          <ActionLink onClick={() => onAsk(question)}>{question}</ActionLink>
        </li>
      ))}
    </ul>
  );
}

export interface CoachConversationProps {
  profile: SituationProfile;
  decisions: Decision[];
  options: EvaluateOptions;
  scenarios: Scenario[];
  /** For "what's changed?" — the letter needs a previous profile to diff. */
  previousProfile?: SituationProfile | null;
  previousAt?: string | null;
  /** Open the full scenario view, with its sliders. */
  onOpenScenario: (id: ScenarioId) => void;
}

export function CoachConversation({
  profile,
  decisions,
  options,
  scenarios,
  previousProfile = null,
  previousAt = null,
  onOpenScenario,
}: CoachConversationProps) {
  const router = useRouter();
  const [draft, setDraft] = useState("");
  const [turns, setTurns] = useState<Turn[]>([]);
  /**
   * The questions to open with, chosen the same way every later set is —
   * so the cold start is not a hand-written menu that drifts from what
   * `respond()` offers after an answer.
   */
  const opening = openingOffers({
    profile,
    decisions,
    options,
    previousProfile,
    previousAt,
  });
  const [register, setRegister] = useState<SpeechRegister>("discreet");
  const { available: canSpeak, speaking, speak, stop } = useSpeechSynthesis();

  // A counter, not a random id or a timestamp: keys have to be stable across
  // renders and identical on the server and the client.
  const nextId = useRef(0);
  /** The last thing North said, so "say that again" has something to repeat. */
  const lastReply = useRef<ReadSegment[]>([]);
  /** What was answered last, so a continuation has something to continue. */
  const lastIntent = useRef<Intent | null>(null);
  /** Live register for callbacks that fire outside React's render cycle. */
  const registerRef = useRef<SpeechRegister>("discreet");

  const say = useCallback(
    (segments: ReadSegment[]) => {
      if (!canSpeak) return;
      const line = spoken(segments, registerRef.current);
      if (line) speak(line);
    },
    [canSpeak, speak],
  );

  /**
   * One turn of the conversation.
   *
   * `aloud` is whether the QUESTION was spoken — it decides whether the
   * answer is. Passed explicitly rather than inferred from any state,
   * because dictation resolves in a callback that can land before the
   * render which recorded it.
   */
  const ask = useCallback(
    async (question: string, aloud: boolean) => {
      const said = question.trim();
      if (!said) return;

      // ── THE QUESTION GOES UP FIRST, BEFORE THE AWAIT ─────────────────────
      // Clearing the field alone was not enough. Routing can now take up to
      // the model's budget, and for that whole beat the typed question had
      // left the input but not yet arrived in the thread — so the screen
      // showed no trace of what had just been asked. On a surface with no
      // spinner (docs/UX-ARCHITECTURE.md §11), the user's own words ARE the
      // acknowledgement, and they have to land immediately.
      setDraft("");
      setTurns((current) => [
        ...current,
        { id: nextId.current++, from: "you", said },
      ]);

      // Awaited, but never blocking on the network for an answer — the local
      // route is already decided inside `resolveIntent`, and the model only
      // ever gets a fixed budget to improve on it. See lib/route-intent.ts.
      const intent = await resolveIntent(said, scenarios, lastIntent.current);

      if (intent.kind === "stop") {
        stop();
        return;
      }

      if (intent.kind === "repeat") {
        if (aloud) say(lastReply.current);
        return;
      }

      const reply: CoachReply = respond(intent, {
        profile,
        decisions,
        options,
        previousProfile,
        previousAt,
      });

      lastReply.current = reply.segments;
      lastIntent.current = intent;
      // The "you" turn is already on screen — appended before the await above.
      setTurns((current) => [
        ...current,
        {
          id: nextId.current++,
          from: "north",
          segments: reply.segments,
          opens: reply.opens,
          asks: reply.asks,
          goes: reply.goes,
        },
      ]);
      if (aloud) say(reply.segments);
    },
    [scenarios, profile, decisions, options, previousProfile, previousAt, say, stop],
  );

  const sayTheNumbers = () => {
    registerRef.current = "full";
    setRegister("full");
    // Re-say what was just said, now in full — the control is only useful if
    // it applies to the sentence that prompted you to reach for it.
    say(lastReply.current);
  };

  return (
    <div className={cn("flex flex-col", RHYTHM.block)}>
      {/* The thread. Your words in the voice face — speech written down, the
          same register the composer uses — and North's as real `Figure`s, so
          every number in the conversation keeps its confidence mark. */}
      {turns.length > 0 && (
        <ol className={cn("flex flex-col", RHYTHM.block)}>
          {turns.map((turn) => (
            <m.li
              key={turn.id}
              initial={{ y: 6 }}
              animate={{ y: 0 }}
              transition={TRANSITION.standard}
              className={cn("flex flex-col", RHYTHM.pair)}
            >
              {turn.from === "you" ? (
                <p className="type-voice-md measure text-text-tertiary italic">
                  {turn.said}
                </p>
              ) : (
                <>
                  <div className="type-voice-md measure text-text-primary">
                    <ReadProse
                      read={{ segments: turn.segments ?? [] }}
                    />
                  </div>
                  {/* The conversation gives the verdict; the scenario view
                      gives the sliders — "what if the deposit were bigger"
                      is a thing you drag, not a thing you say. AdjustMark,
                      because that is the mark for something re-pointable. */}
                  {turn.opens && (
                    <ActionLink
                      icon={<AdjustMark />}
                      onClick={() => onOpenScenario(turn.opens!)}
                    >
                      Try the numbers yourself
                    </ActionLink>
                  )}

                  {/* ── ONE WAY ONWARD ──────────────────────────────────
                      The conversation gives the verdict; the screens give
                      you something to do about it. Until this, only a
                      SCENARIO answer said so — "how am I doing?" returned
                      Today's exact read with nothing to act on, and "what
                      have I decided?" returned the ledger sentence with no
                      ledger.

                      `goes.to` is a NAME, not a URL. `core/` does not know
                      this app's routes; the mapping lives here, which is
                      also where `?from=` belongs so Decisions can name the
                      way back. */}
                  {turn.goes && (
                    <ActionLink
                      icon={markFor(turn.goes.to)}
                      onClick={() => router.push(pathFor(turn.goes!.to))}
                    >
                      {turn.goes.label}
                    </ActionLink>
                  )}

                  {/* What to ask next, on the LAST answer only — older turns
                      keep their offers as history would, and stacking a live
                      choice under every past answer turns a thread into a
                      form. */}
                  {turn.id === turns[turns.length - 1]?.id && (
                    <Offers asks={turn.asks} onAsk={(q) => ask(q, false)} />
                  )}
                </>
              )}
            </m.li>
          ))}
        </ol>
      )}

      {/* The composer is the typed twin, always visible. Speaking a question
          answers it without a tap; typing one keeps the button. */}
      <SpokenField
        value={draft}
        onChange={setDraft}
        label="Ask North a question in your own words"
        onSubmit={() => ask(draft, false)}
        onSpeechEnd={(transcript) => ask(transcript, true)}
        action={
          <Button
            variant="primary"
            disabled={!draft.trim()}
            onClick={() => ask(draft, false)}
          >
            Think it through
          </Button>
        }
      />

      {/* Offered only once North has actually spoken something, and only
          while it still has something left to reveal. */}
      {canSpeak && turns.length > 0 && (
        <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
          {speaking && (
            <ActionLink icon={<SpeakMark />} onClick={stop}>
              Stop
            </ActionLink>
          )}
          {register === "discreet" && (
            <ActionLink icon={<SpeakMark />} onClick={sayTheNumbers}>
              Say the numbers too
            </ActionLink>
          )}
        </div>
      )}

      {/* ── THE COLD START ─────────────────────────────────────────────────
          This was a paragraph telling people what they COULD ask, which on a
          phone, on a live link, in ninety seconds, nobody reads and nobody
          acts on — seven of the eleven things this coach can answer had no
          tap path anywhere in the product, so all the engine composition
          behind them was unreachable by clicking.

          The sentence stays, shortened to the part that is not obvious (the
          modality rule), and the questions become the questions. */}
      {turns.length === 0 && (
        <div className={cn("flex flex-col", RHYTHM.pair)}>
          <Offers asks={opening} onAsk={(q) => ask(q, false)} />
          <Text variant="meta" tone="tertiary" measure>
            Or ask in your own words. Speak and North answers out loud; type
            and it stays quiet.
          </Text>
        </div>
      )}
    </div>
  );
}

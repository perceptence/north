"use client";

import { useCallback, useRef, useState } from "react";
import { RHYTHM, Button, Text, TRANSITION, m } from "@/components/nds";
import { respond, routeIntent, type CoachReply } from "@/core/coach";
import type { Scenario, ScenarioId } from "@/core/navigator";
import { spoken, type SpeechRegister } from "@/core/speech";
import type { Decision } from "@/core/decisions";
import type { SituationProfile } from "@/core/profile/types";
import type { EvaluateOptions, ReadSegment } from "@/core/waterfall";
import { cn } from "@/lib/cn";
import { useSpeechSynthesis } from "@/lib/use-speech-synthesis";
import { ActionLink, AdjustMark, SpeakMark } from "./ActionGlyphs";
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
  const [draft, setDraft] = useState("");
  const [turns, setTurns] = useState<Turn[]>([]);
  const [register, setRegister] = useState<SpeechRegister>("discreet");
  const { available: canSpeak, speaking, speak, stop } = useSpeechSynthesis();

  // A counter, not a random id or a timestamp: keys have to be stable across
  // renders and identical on the server and the client.
  const nextId = useRef(0);
  /** The last thing North said, so "say that again" has something to repeat. */
  const lastReply = useRef<ReadSegment[]>([]);
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
    (question: string, aloud: boolean) => {
      const said = question.trim();
      if (!said) return;

      const intent = routeIntent(said, scenarios);

      if (intent.kind === "stop") {
        stop();
        setDraft("");
        return;
      }

      if (intent.kind === "repeat") {
        if (aloud) say(lastReply.current);
        setDraft("");
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
      setTurns((current) => [
        ...current,
        { id: nextId.current++, from: "you", said },
        {
          id: nextId.current++,
          from: "north",
          segments: reply.segments,
          opens: reply.opens,
        },
      ]);
      setDraft("");
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
                      read={{
                        action: { commit: "", defer: "" },
                        segments: turn.segments ?? [],
                      }}
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

      {turns.length === 0 && (
        <Text variant="meta" tone="tertiary" measure>
          Ask how you&rsquo;re doing, what you&rsquo;re working toward, what
          you&rsquo;ve decided — or think a decision through. Speak and
          North answers out loud; type and it stays quiet.
        </Text>
      )}
    </div>
  );
}

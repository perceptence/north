"use client";

import { useMemo, useState } from "react";
import { availableScenarios } from "@/core/navigator";
import { ILLUSTRATIVE_LIMITS } from "@/core/waterfall";
import { cn } from "@/lib/cn";
import { useHydrated } from "@/lib/use-hydrated";
import { speechRecognitionAvailable } from "@/lib/use-speech-recognition";
import { speechSynthesisAvailable } from "@/lib/use-speech-synthesis";
import { useDecisions } from "@/state/decisions-store";
import { usePreviousProfile, useProfile } from "@/state/profile-store";
import { SpeakMark } from "./ActionGlyphs";
import { VoiceMode } from "./VoiceMode";

/**
 * The way into voice mode, from anywhere in the product.
 *
 * ── WHY THE MASTHEAD, AND NOT A FLOATING BUTTON ───────────────────────────
 * The obvious answer to "make it always available" is a circular button
 * hovering above the content. docs/VOICE.md refuses exactly that — a
 * floating assistant is on the explicit no list, and it is the shape that
 * turns a coach into an intrusive chatbot.
 *
 * The masthead is already fixed on every product screen, and its own note
 * says it "kept only the thing that belongs to the app rather than the
 * screen". Talking to North is an app-level capability, not a property of
 * whichever tab you happen to be on — so it belongs in the chrome that is
 * already there rather than in a new object floating over the page.
 *
 * The dock could not take it: four destinations, hard cap (CLAUDE.md).
 *
 * ── WHERE IT DOES NOT APPEAR ──────────────────────────────────────────────
 * Arrival and onboarding sit outside the product shell and so have no
 * masthead — which is correct rather than incidental. There is nothing to
 * talk to a coach about before it knows anything about you, and the
 * onboarding conversation already has its own voice input.
 *
 * ── STILL PHONE AND TABLET ────────────────────────────────────────────────
 * `lg:hidden`, unchanged. "Available everywhere" was about SURFACES, not
 * about putting a microphone on the machine most likely to be in an
 * open-plan office.
 *
 * ── AND STILL NOTHING WITHOUT A PROFILE ───────────────────────────────────
 * Every answer comes from the engine, and the engine needs a situation to
 * reason about. No profile, no control — never a button that opens a
 * conversation with nothing to say.
 */
export function VoiceLauncher() {
  const hydrated = useHydrated();
  const profile = useProfile();
  const previous = usePreviousProfile();
  const decisions = useDecisions();
  const [open, setOpen] = useState(false);
  const [now] = useState(() => new Date());

  const options = useMemo(
    () => ({ limits: ILLUSTRATIVE_LIMITS, now }),
    [now],
  );
  const scenarios = useMemo(
    () => (profile ? availableScenarios(profile) : []),
    [profile],
  );

  // Gated on hydration: the server cannot know whether this browser speaks,
  // and guessing is a hydration mismatch either way.
  if (!hydrated || !profile) return null;
  if (!speechRecognitionAvailable() || !speechSynthesisAvailable()) return null;

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Talk to North"
        className={cn(
          "type-meta hit-target inline-flex cursor-pointer items-center gap-2",
          "rounded-full text-text-on-deep opacity-80 select-none",
          "transition-opacity duration-[--motion-micro] hover:opacity-100",
          "lg:hidden",
        )}
      >
        <SpeakMark />
        Talk
      </button>

      {open && (
        <VoiceMode
          profile={profile}
          decisions={decisions}
          options={options}
          scenarios={scenarios}
          previousProfile={previous?.profile ?? null}
          previousAt={previous?.at ?? null}
          onClose={() => setOpen(false)}
        />
      )}
    </>
  );
}

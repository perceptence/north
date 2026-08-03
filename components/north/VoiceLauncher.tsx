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
 * The way into voice mode — a floating button, bottom right.
 *
 * ── THIS OVERRIDES A DOCUMENTED REFUSAL, DELIBERATELY ─────────────────────
 * docs/VOICE.md's refused list includes "a floating assistant", and the
 * launcher lived in the masthead first on exactly that argument. The user
 * overrode it: the mode should feel like a companion you can reach for from
 * anywhere, and a corner button is the honest shape of that. What the
 * refusal was actually protecting against survives — this button OPENS a
 * mode; it never listens, never speaks, and never carries a conversation
 * itself. The intrusive part of a floating assistant is the assistant, not
 * the float.
 *
 * ── THE FILL IS THE MODE'S OWN CENTRE ─────────────────────────────────────
 * The same radial sky voice mode opens with, cropped to its light-teal
 * centre — so the button is a keyhole view of the surface it opens, and
 * pressing it reads as the glow expanding to full screen.
 *
 * Held at the LIGHT end of that ramp deliberately. Carrying the mode's dark
 * rim into a 56px button made it a heavy navy dot sitting on warm paper —
 * the one loudest object on a calm screen, which is the opposite of what a
 * standing invitation should be. sky-300 into sky-600 keeps the same three
 * tokens and the same OKLab ramp, just the half of it that stays quiet.
 *
 * ── AND IT SAYS WHAT IT IS ────────────────────────────────────────────────
 * A bare mark in a corner is a puzzle. The word is what makes it an offer
 * rather than a guess — the same reason every `ActionLink` in the product
 * carries a label rather than trusting its glyph alone.
 *
 * ── WHERE IT DOES NOT APPEAR ──────────────────────────────────────────────
 * Desktop (`lg:hidden`): talking to your finances is a thing you do holding
 * a device, not at a desk in an open-plan office. Without a profile: every
 * answer comes from the engine, and the engine needs a situation to reason
 * about. Where the browser cannot both hear and speak: progressive, like
 * every voice control — never a button referring to a capability that isn't
 * there. And on Arrival/onboarding, which sit outside the product shell.
 *
 * ── IT SITS ABOVE THE DOCK ────────────────────────────────────────────────
 * `bottom-24` on mobile clears the floating dock pill; from `lg` the dock
 * moves into the left rail, but the launcher is gone there anyway.
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
          "fixed right-4 bottom-24 z-40 lg:hidden",
          "type-label inline-flex h-13 cursor-pointer items-center gap-2.5",
          "rounded-full px-5 text-text-on-deep shadow-sheet select-none",
          "transition-transform duration-[--motion-micro] active:scale-95",
        )}
        style={{
          // The light half of voice mode's own ramp — see the note above on
          // why the dark rim does not belong on a 56px button.
          background:
            "radial-gradient(circle at 50% 20% in oklab, var(--sky-300) 0%, var(--sky-600) 120%)",
        }}
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

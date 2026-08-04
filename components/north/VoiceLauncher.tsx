"use client";

import { useMemo, useState } from "react";
import { availableScenarios } from "@/core/navigator";
import { ILLUSTRATIVE_LIMITS } from "@/core/waterfall";
import { cn } from "@/lib/cn";
import { useHydrated } from "@/lib/use-hydrated";
import { speechRecognitionAvailable } from "@/lib/use-speech-recognition";
import { speechSynthesisAvailable } from "@/lib/use-speech-synthesis";
import { useDecisions } from "@/state/decisions-store";
import { useBaselineProfile, useProfile } from "@/state/profile-store";
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
 * ── IT WEARS THE PRODUCT, NOT THE MODE ────────────────────────────────────
 * This was a teal radial gradient — a keyhole view of the surface it opens,
 * so pressing it would read as the glow expanding to full screen. Nice idea,
 * wrong object. It made this the ONLY gradient-filled control in the product,
 * and the fill it used was the atmosphere, which the system defines as
 * GROUND, never a control (docs/VISUAL-DIRECTION.md — the sky is ground, not
 * signal). A floating pill in a ground colour, sitting inches from a dock in
 * paper and hairline, read as a control borrowed from a different app.
 *
 * So it wears what every other quiet control in the product wears: paper, a
 * hairline edge, ink. The same material as the dock it floats beside, and the
 * same pill language as "Or say it" in the composer.
 *
 * It is deliberately NOT ink-filled. An ink pill is the *primary action*
 * (CLAUDE.md), and this is persistent chrome — it would have competed with
 * whatever the screen itself is asking, on every screen, forever. Standing
 * invitations are quiet.
 *
 * And it is deliberately not the dock's ACTIVE-item treatment either, or a
 * fifth thing in paper beside four destinations starts to look like a fifth
 * destination — which the four-item cap exists to prevent. The mark and the
 * offset keep it legible as an action rather than a place.
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
  const [now] = useState(() => new Date());
  const previous = useBaselineProfile(now);
  const decisions = useDecisions();
  const [open, setOpen] = useState(false);

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
          "rounded-full px-5 select-none",
          // The dock's exact material, because it floats beside the dock and
          // two pieces of floating chrome in different materials is the thing
          // that read as borrowed.
          "border border-line-hairline bg-surface-raised/95 shadow-sheet backdrop-blur",
          "text-text-primary",
          "transition-[transform,background-color] duration-[--motion-micro]",
          "hover:bg-surface-raised active:scale-95",
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

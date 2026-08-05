"use client";

import { Button, RHYTHM, Text, Wordmark, m, TRANSITION } from "@/components/nds";
import { cn } from "@/lib/cn";
import { useHydrated } from "@/lib/use-hydrated";
import { updateAccount, useAccount } from "@/state/account-store";
import { OnboardingConversation } from "./OnboardingConversation";
import { SignUp } from "./SignUp";
import { Sky } from "./Sky";

/**
 * The way in, in the order a real product does it: account, terms, then the
 * conversation.
 *
 * ── WHY THE ORDER CHANGED ─────────────────────────────────────────────────
 * The ten questions used to come first and identity last, on the argument
 * that a coach should hear your concern before asking your name. Good
 * instinct, wrong sequence: those answers ATTACH to somebody. Collected
 * before an account existed they sat in the air for two minutes with nothing
 * to belong to, and the day a backend arrives the order has to invert
 * anyway — so it inverts now, while it costs nothing.
 *
 * The terms come second, at signup, which is where a real product puts them
 * and where they are actually load-bearing: you agree to how North works
 * BEFORE it starts asking what you hold.
 *
 * ── THE STEPS SHARE ONE FRAME ─────────────────────────────────────────────
 * Sky overhead, the mark, one measure. The conversation then takes the whole
 * viewport for itself (it owns its own scroller and wayfinding), so this
 * shell hands over completely rather than nesting it — two scrollers inside
 * each other is the bug that shape always produces.
 */



/**
 * The terms, in the coach's own voice.
 *
 * A statement to take in, not a box to tick. It stays prose because the
 * coach never breaks character into system voice — and it is genuinely three
 * commitments rather than a policy, so three sentences is the whole of it.
 */
const TERMS = [
  "I coach; I don’t advise. I’ll name what matters and show my working, but I won’t pick investments, and nothing here is investment advice.",
  "What I know is what you’ve told me. Every figure is a reading of that — ranges, not promises.",
  "And everything stays on this device. There’s no server behind me, so your record is yours to move — I’ll give you a recovery code for that.",
];

export function OpeningFlow() {
  const hydrated = useHydrated();
  const account = useAccount();

  // The server cannot read localStorage, so it cannot know whether an
  // account exists — render nothing until the client can answer, rather than
  // flashing a signup form at someone who already signed up.
  if (!hydrated) return null;

  /**
   * The step is DERIVED, never held in state.
   *
   * It was held, and the first version had a real bug because of it:
   * completing signup set the step to "terms" while the account also became
   * non-null, and the guard for "account plus terms" fired in the same
   * render — walking straight past the terms nobody had agreed to yet.
   *
   * Reading the step off the stored record instead makes that unstateable.
   * It also means a reload mid-flow resumes exactly where it was, and a
   * return visit skips only the parts genuinely done.
   */
  const step = !account ? "account" : !account.consentAt ? "terms" : "asking";

  if (step === "asking") {
    // The conversation owns the whole viewport — its own scroller, its own
    // wayfinding — so this shell hands over rather than nesting it.
    return <OnboardingConversation />;
  }

  return (
    <div className="relative min-h-dvh">
      <div
        className="pointer-events-none fixed inset-x-0 top-0 z-10"
        style={{ height: "calc(var(--safe-top) + var(--chrome-onboarding))" }}
      >
        <Sky className="h-full" />
        {/* Below the inset, never under the clock — the same inline `top`
            the product masthead uses. Centering across the FULL box only
            looked right while the chrome stood 6rem tall; at the product's
            4rem the wordmark rode into the status bar on a phone. */}
        <div
          className="absolute inset-0 flex items-center px-4 md:px-6 lg:px-7"
          style={{ top: "var(--safe-top)" }}
        >
          <div className="mx-auto w-full max-w-column text-text-on-deep">
            <Wordmark height={12} strokeWidth={2.1} />
          </div>
        </div>
      </div>

      {/* A flex column the full height of the glass, so a step can push its
          action to the FOOT of the screen rather than to the bottom of its
          own text. The terms are a thing to read and then agree to, and an
          agree button floating directly under the last line reads as the end
          of a paragraph rather than the end of a page.

          The column is `flex-1` inside this min-h-dvh box, NOT a hand-derived
          `min-h-[calc(100dvh-…)]`. It was the calc, pinned to one breakpoint's
          chrome and no inset — inside a device frame the safe-top pushed the
          whole column down and the button clean off the glass. Border-box
          does this arithmetic natively; there is no number to go stale. */}
      <div
        className="flex min-h-dvh flex-col px-4 pb-10 md:px-6 lg:px-7"
        // Chrome + inset + the apron — the same paper foot the product's
        // masthead wears, so content starts at the same height here as it
        // does on every screen after onboarding.
        style={{ paddingTop: "calc(var(--safe-top) + var(--chrome-onboarding) + var(--apron))" }}
      >
        <m.div
          key={step}
          initial={{ y: 8 }}
          animate={{ y: 0 }}
          transition={TRANSITION.standard}
          className={cn(
            "mx-auto flex w-full max-w-column flex-1 flex-col",
            RHYTHM.block,
          )}
        >
          {step === "account" ? (
            <>
              <div className={cn("flex flex-col", RHYTHM.heading)}>
                {/* The coach asking, not a form announcing itself. "First,
                    so this is yours" described the ORDERING — a fact about
                    the flow, which is the product's business and not the
                    reader's. This asks the question the fields answer, in
                    the voice that will be asking everything else. */}
                <h1 className="type-voice-lg measure text-text-primary">
                  Who am I coaching?
                </h1>
                <Text variant="body" tone="secondary">
                  Then ten questions, about ninety seconds — they belong to an
                  account, so this comes first.
                </Text>
              </div>
              {/* No `onDone` handler needed: saving the account changes the
                  derived step by itself. */}
              <SignUp />
            </>
          ) : (
            <>
              <div className={cn("flex flex-col", RHYTHM.heading)}>
                <h1 className="type-voice-lg measure text-text-primary">
                  Before we start — how I work.
                </h1>
                {/* No `measure`: these are three short commitments, and a
                    prose measure inside an already-narrow column rags them
                    twice over. */}
                <div className={cn("flex flex-col", RHYTHM.block)}>
                  {TERMS.map((line) => (
                    <Text key={line} variant="body" tone="secondary">
                      {line}
                    </Text>
                  ))}
                </div>
              </div>
              {/* Pushed to the foot: agreeing is the end of the PAGE, not
                  the end of the last paragraph. */}
              <div className="mt-auto pt-8">
              <Button
                variant="primary"
                fullWidth
                onClick={() =>
                  updateAccount({ consentAt: new Date().toISOString() })
                }
              >
                Understood — let’s begin
              </Button>
              </div>
            </>
          )}
        </m.div>
      </div>
    </div>
  );
}

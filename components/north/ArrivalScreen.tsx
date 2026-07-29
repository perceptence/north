"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type { TargetAndTransition } from "motion/react";
import {
  RHYTHM,
  Button,
  HorizonField,
  Text,
  EASE,
  TRANSITION,
  Wordmark,
  m,
  useReducedMotion,
} from "@/components/nds";
import { cn } from "@/lib/cn";
import { seedDemoStory } from "@/lib/demo-story";
import { ActionLink, StoryMark } from "./ActionGlyphs";
import { Sky } from "./Sky";

/**
 * Arrival — the front door (docs/UX-ARCHITECTURE.md §4.1).
 *
 * Decide within five seconds whether this deserves ninety. The promise, one
 * sentence of context, one action. No navigation, no pricing, no feature grid,
 * no screenshots — the absence is the argument.
 *
 * ── THE DOOR IS CONSTANT ──────────────────────────────────────────────────
 * The same two ways in every time, whether or not a profile exists: BEGIN the
 * conversation, or BORROW the demo story. Nothing here reads stored state, so
 * the page also renders identically on the server and the client.
 *
 * ── THE WORDMARK TRAVELS ──────────────────────────────────────────────────
 * It sits WITH the content, on paper, in ink — the first thing said, with the
 * promise directly under it. Press either action and it lifts to the masthead
 * position of wherever you are going, shrinking and turning to on-deep as it
 * enters the sky, and the route hands over just before it lands. The door and
 * the next screen read as one object moving rather than two pages swapping.
 *
 * The travel is MEASURED at press time rather than hard-coded, because the
 * mark's starting height is a share of the viewport. Only the destinations are
 * constants, and they mirror the two mastheads that draw them.
 */

/**
 * Where each destination draws its wordmark, in viewport pixels.
 *
 * Onboarding centres a masthead group in a 96px header (112 from `md`);
 * the product shell pins its mark 24px down. These mirror
 * `OnboardingConversation` and `app/(product)/layout.tsx` — change one and
 * this must follow, which is why the numbers are named rather than inline.
 */
const MASTHEAD = {
  onboarding: { y: 43.5, yNarrow: 35.5, height: 12 },
  product: { y: 24, height: 13 },
} as const;

/**
 * The travel is DURATION-based, not a spring.
 *
 * The mark now crosses most of the viewport, and a spring only asymptotes
 * toward its target — at handover it was still ~38px short, which reads as a
 * jump. An ease-out lands exactly, and its final frames are nearly stationary,
 * so handing over just as it arrives is invisible.
 */
const TRAVEL = { duration: 0.42, ease: EASE.out } as const;
const HANDOVER_MS = 400;

/** Illustrative, deliberately wide, and never rendered as text — the field is
 *  pure scenery here, hidden from assistive tech. A number this page cannot
 *  justify is a number this page must not speak. */
const SCENERY = {
  low: 110_000_000,
  high: 190_000_000,
  central: 148_000_000,
} as const;

type Travel = TargetAndTransition & { y: number; scale: number };

export function ArrivalScreen() {
  const router = useRouter();
  const reduce = useReducedMotion();
  const markRef = useRef<HTMLDivElement>(null);
  const [travel, setTravel] = useState<Travel | null>(null);

  /** Staged like the reveal: y only, and only on the way in. */
  const stage = (delay: number) => ({
    initial: { y: 12 },
    animate: { y: 0 },
    transition: { ...TRANSITION.considered, delay },
  });

  /**
   * Lift the mark to `target`, then go.
   *
   * `seed` runs BEFORE navigating for the demo journey, so Today has its story
   * the moment it mounts and no interstitial interrupts the travel.
   */
  const leave = (
    href: string,
    target: { y: number; height: number },
    seed?: () => void,
  ) => {
    const el = markRef.current;
    if (reduce || !el) {
      seed?.();
      router.push(href);
      return;
    }

    const rect = el.getBoundingClientRect();
    setTravel({
      y: target.y - rect.top,
      scale: target.height / rect.height,
    });

    window.setTimeout(() => {
      seed?.();
      router.push(href);
    }, HANDOVER_MS);
  };

  const begin = () => {
    const narrow = window.innerWidth < 640;
    leave("/start", {
      y: narrow ? MASTHEAD.onboarding.yNarrow : MASTHEAD.onboarding.y,
      height: MASTHEAD.onboarding.height,
    });
  };

  const borrow = () => leave("/today", MASTHEAD.product, seedDemoStory);

  /** Everything but the mark steps aside. Fading is fine on the way OUT. */
  const exit = travel ? { opacity: 0, y: -8 } : { opacity: 1, y: 0 };

  return (
    <div className="relative flex min-h-dvh flex-col">
      {/* The sky sets weather, then gets out of the way. It was twice this
          tall with the content pushed below it, which bought nothing but a
          scrollbar on a page that has one screen of content. */}
      <Sky className="h-[26dvh]" />

      {/* Padding outside, measure inside — the same nesting the onboarding
          masthead uses, so the travelling mark's left edge never shifts. */}
      <main className="relative flex flex-1 flex-col px-4 pb-8 md:px-6 lg:px-7">
        <div className="mx-auto flex w-full max-w-column flex-1 flex-col">
          {/* The content block starts BELOW the sky's coloured zone. The
              promise is ink on paper; sitting it any higher put warm grey
              text on a teal gradient, which is the one contrast failure this
              page cannot afford. */}
          <div className={cn("flex flex-col pt-[26dvh]", RHYTHM.block)}>
            <m.div
              ref={markRef}
              className={cn(
                "origin-top-left transition-colors duration-[--motion-considered]",
                // Ink while it sits on paper; on-deep once it lifts into the
                // sky, so it stays legible for the whole journey.
                travel ? "text-text-on-deep" : "text-text-primary",
              )}
              animate={travel ?? { y: 0, scale: 1 }}
              transition={TRAVEL}
            >
              <Wordmark height={22} strokeWidth={1.7} />
            </m.div>

            <m.section
              className={cn("flex flex-col", RHYTHM.block)}
              animate={exit}
              transition={TRANSITION.standard}
            >
              <m.p
                {...stage(0.25)}
                className="type-voice-md measure text-text-secondary"
              >
                Everyone else shows you where your money went.
              </m.p>
              <m.p
                {...stage(0.5)}
                className="type-voice-xl measure text-text-primary"
              >
                North tells you where you&rsquo;re{" "}
                <span className="text-aurora">going</span>.
              </m.p>
              <m.div {...stage(0.75)}>
                <Text variant="body" tone="secondary" measure as="p">
                  A coach, not a dashboard. It reads your whole picture, names
                  the one thing worth doing, and checks back on what you
                  decided.
                </Text>
              </m.div>

              <m.div
                {...stage(0.95)}
                className="flex flex-col items-start gap-5 pt-2"
              >
                <Button variant="primary" size="lg" onClick={begin}>
                  Begin
                </Button>

                <ActionLink icon={<StoryMark />} onClick={borrow}>
                  Or borrow a story and watch it work
                </ActionLink>
              </m.div>
            </m.section>
          </div>

          {/* The horizon, breathing at the foot of the door. Scenery, not
              data: no visible number, nothing announced. */}
          <m.div
            aria-hidden="true"
            className="mt-auto pt-10"
            animate={exit}
            transition={TRANSITION.standard}
          >
            <HorizonField
              low={SCENERY.low}
              high={SCENERY.high}
              central={SCENERY.central}
              confidence="assumed"
              months={300}
              height={72}
            />
          </m.div>
        </div>
      </main>
    </div>
  );
}

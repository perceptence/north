/**
 * The numbers a sky-height travel animation needs, shared so the two ends of
 * a transition can't drift apart — the same reason `SKY_HEIGHT` exists in
 * `Masthead.tsx`.
 *
 * Arrival and the story flow are the only two screens with a tall, scenic
 * sky (26–30dvh); every destination they hand off to — onboarding, the
 * product shell — has a short, fixed one. Crossing that boundary is a real
 * route change, so nothing can be animated across it directly: the outgoing
 * screen animates its OWN sky toward the destination's height, then hands
 * over to `router.push` just before it lands, the same trick
 * `ArrivalScreen`'s wordmark already uses for its own travel.
 */

/** Sky height at each compact destination, in px — mirrors `SKY_HEIGHT`
 *  (`Masthead.tsx`: h-16/md:h-20) and onboarding's header
 *  (`OnboardingConversation.tsx`: h-24/md:h-28). Change one, change this. */
export const SKY_HEIGHT_PX = {
  onboarding: { narrow: 96, wide: 112 },
  product: { narrow: 64, wide: 80 },
} as const;

/**
 * Linear, not eased. An eased band of sky reads as decelerating unevenly
 * along its trailing edge; a constant rate reads as one continuous shrink
 * or extend — the wordmark's own travel stays eased (`ArrivalScreen`'s
 * `TRAVEL`), because arriving is the right read for a mark landing on a
 * point. A whole band resizing wants the plainer read.
 */
export const SKY_TRAVEL_TRANSITION = { duration: 0.28, ease: "linear" } as const;

/**
 * Route hands over once the animation has actually finished — not a beat
 * early. `ArrivalScreen`'s wordmark can hand over ~20ms before its own
 * travel completes, because ease-out decelerates into a "nearly stationary"
 * tail (its own comment says so): cutting inside that tail is invisible.
 * Linear motion has no such tail — it covers ground at a constant rate
 * right up to its last frame, so a 20ms-early cut here means the sky is
 * still ~5% short when the next page's own sky snaps in at full height.
 * Derived from the duration itself, not a sibling constant, so the two
 * cannot quietly drift out of sync the way they briefly did here.
 */
export const SKY_TRAVEL_HANDOVER_MS = SKY_TRAVEL_TRANSITION.duration * 1000;

/** True under 640px — this project's `md` (`app/globals.css`), not
 *  Tailwind's default. Both travel targets branch on it. */
export function narrowViewport(): boolean {
  return typeof window !== "undefined" && window.innerWidth < 640;
}

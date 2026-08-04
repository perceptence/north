"use client";

import { cn } from "@/lib/cn";
import {
  clearMembership,
  seedMembership,
  useMembership,
} from "@/state/membership-store";

/**
 * The journeys, as a panel — and deliberately NOT part of the product.
 *
 * ── WHY THIS EXISTS ───────────────────────────────────────────────────────
 * North's journeys are one-way. Arrival offers two doors — begin the
 * conversation, or borrow a story — and taking either closes the other:
 * nothing anywhere routes back to `/`. So a reviewer sees one path and leaves
 * thinking that is the product. docs/STRATEGY.md §0 measures this work by
 * whether a reviewer understands the thinking in ninety seconds, and half the
 * thinking was behind whichever door they did not pick.
 *
 * ── AND WHY IT IS NOT IN THE PRODUCT ──────────────────────────────────────
 * The obvious fix was to make the masthead wordmark a link home. That puts a
 * control on the one mark docs/VISUAL-DIRECTION.md §0 locks, and it makes the
 * door read differently depending on state — which
 * docs/UX-ARCHITECTURE.md §4.1 tried in July and reversed.
 *
 * This sits outside instead. `/preview` is already the stage the app stands
 * on rather than a screen inside it, so a reviewer's controls belong there
 * and nowhere near the four destinations. Nothing here is reachable from
 * inside the experience, and the product's IA is untouched.
 *
 * Styled as stage furniture, not as North: mono labels, hairline pills on the
 * sky. It should read as the thing HOLDING the product, never as part of it.
 */

export interface Journey {
  id: string;
  label: string;
  /** What a reviewer will actually see — the reason to press it. */
  note: string;
  /** Where the framed app goes. `/demo?at=` seeds the state it needs. */
  href: string;
}

/**
 * Ordered as a reviewer should walk them, not alphabetically.
 *
 * The reveal first because it is the flagship and the fastest thing to
 * understand; the return second because it is the one screen no competitor
 * can render; onboarding last because it is the longest and the only one that
 * asks for ninety seconds of typing.
 */
export const JOURNEYS: readonly Journey[] = [
  {
    id: "reveal",
    label: "The reveal",
    note: "A decision offered, nine months of record behind it",
    href: "/demo?at=reveal",
  },
  {
    id: "return",
    label: "The return",
    note: "Three days on — North asks whether it happened",
    href: "/demo?at=return",
  },
  {
    id: "story",
    label: "How you got here",
    note: "The same situation, told as the story of getting to it",
    href: "/demo?at=story",
  },
  {
    id: "arrival",
    label: "The door",
    note: "Arrival, with both ways in",
    href: "/",
  },
  {
    id: "onboarding",
    label: "The conversation",
    note: "Wipes and starts fresh — a dozen turns, about two minutes",
    href: "/demo?at=onboarding",
  },
];

export function DemoPanel({
  active,
  onGo,
  className,
}: {
  active: string;
  onGo: (journey: Journey) => void;
  className?: string;
}) {
  return (
    <nav
      aria-label="Demo journeys"
      className={cn("flex flex-col items-center gap-2", className)}
    >
      <ul className="flex flex-wrap items-center justify-center gap-2">
        {JOURNEYS.map((journey) => {
          const current = journey.id === active;
          return (
            <li key={journey.id}>
              <button
                type="button"
                onClick={() => onGo(journey)}
                aria-current={current ? "true" : undefined}
                title={journey.note}
                className={cn(
                  "type-overline cursor-pointer rounded-full border px-3 py-1.5",
                  "transition-colors duration-[--motion-micro]",
                  current
                    ? "border-transparent bg-text-on-deep/90 text-surface-deep"
                    : "border-text-on-deep/25 text-text-on-deep/70 hover:text-text-on-deep",
                )}
              >
                {journey.label}
              </button>
            </li>
          );
        })}
      </ul>

      {/* The note for whatever is selected, so the row stays a row of labels
          and the explanation does not multiply across five chips. */}
      <p className="type-meta text-text-on-deep/55 text-center">
        {JOURNEYS.find((j) => j.id === active)?.note ?? ""}
      </p>

      <TierToggle />
    </nav>
  );
}

/**
 * The tier, flippable from outside the experience — so a reviewer sees both
 * sides of every gate without walking the subscribe flow, and so the flow
 * itself can be walked from a known state.
 */
function TierToggle() {
  const membership = useMembership();
  return (
    <div className="flex items-center gap-2">
      <span className="type-overline text-text-on-deep/55">Tier</span>
      {(["free", "plus"] as const).map((tier) => {
        const current = membership.tier === tier;
        return (
          <button
            key={tier}
            type="button"
            aria-pressed={current}
            onClick={() =>
              tier === "plus" ? seedMembership({ tier: "plus", since: new Date().toISOString(), renewsAt: new Date(Date.now() + 30 * 86_400_000).toISOString() }) : clearMembership()
            }
            className={cn(
              "type-overline cursor-pointer rounded-full border px-3 py-1",
              "transition-colors duration-[--motion-micro]",
              current
                ? "border-transparent bg-text-on-deep/90 text-surface-deep"
                : "border-text-on-deep/25 text-text-on-deep/70 hover:text-text-on-deep",
            )}
          >
            {tier === "plus" ? "Plus" : "Free"}
          </button>
        );
      })}
    </div>
  );
}

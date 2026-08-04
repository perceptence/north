"use client";

import type { ReactNode } from "react";
import {
  ActionLink,
  BackMark,
  BehindMark,
  HorizonMark,
  LedgerMark,
} from "@/components/north/ActionGlyphs";

/**
 * TEMPORARY — replacements for `BehindMark`, the weakest mark in the set.
 * Delete once a pick is made.
 *
 * ── WHAT IS ALREADY SPOKEN FOR ────────────────────────────────────────────
 * The shape space is crowded, and that is the actual constraint here. Taken:
 * a rule with a leftward arrowhead (`BackMark`); a rule with vertical ticks
 * (`HorizonMark`); three lines and a tick (`LedgerMark`); an asterisk, a
 * signpost, wind, rewind triangles, a door, a book, a dot with speech, a ring
 * with an arrow entering it, quote marks, a tray, a closed lid, two level
 * rules, a caret. The ring itself belongs to the compass and cannot be spent.
 *
 * `BehindMark` collided with the first of those. Every candidate below is
 * checked against the whole list, and both neighbours it could be confused
 * with are shown beneath it.
 */

function Mark({ children }: { children: ReactNode }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 16 16"
      className="size-4 shrink-0"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.25}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {children}
    </svg>
  );
}

/** D1 · The cleared rung. The ladder's own vocabulary — a rung, ticked. */
const D1 = (
  <Mark>
    <path d="M2.6 11.6 H13.4" />
    <path d="M4.8 8.2 L7 10.4 L11.6 5" />
  </Mark>
);

/** D2 · The step down. You have come down a rung and are standing here. */
const D2 = (
  <Mark>
    <path d="M2.6 4.6 H7.4 V9.8 H13.4" />
    <circle cx="13.4" cy="9.8" r="1.5" fill="currentColor" stroke="none" />
  </Mark>
);

/**
 * D3 · The rungs behind you. Literally the RungIndicator's own strip — the
 * ones passed inked, the ones ahead pale. `AdjustMark` already uses opacity
 * this way, so the device is established rather than invented.
 */
const D3 = (
  <Mark>
    <path d="M3.2 4.6 V11.4" />
    <path d="M6.4 4.6 V11.4" />
    <path d="M9.6 6.4 V9.6" opacity="0.4" />
    <path d="M12.8 6.4 V9.6" opacity="0.4" />
  </Mark>
);

/** D4 · Struck through. The classic, and shown mainly to be argued with: a
    strike means CANCELLED, and this is the opposite of cancelled. */
const D4 = (
  <Mark>
    <path d="M3 8 H13" />
    <path d="M4.6 11.8 L11.4 4.2" />
  </Mark>
);

interface Option {
  key: string;
  mark: ReactNode;
  gloss: string;
}

const OPTIONS: Option[] = [
  {
    key: "D1",
    mark: D1,
    gloss:
      "The cleared rung — a rung, ticked. Uses the ladder the whole engine runs on. Nearest neighbour is LedgerMark, which is THREE lines and a tick; this is one.",
  },
  {
    key: "D2",
    mark: D2,
    gloss:
      "The step down — you have come down a rung, and the filled marker is where you are standing. No other mark in the set is a stair.",
  },
  {
    key: "D3",
    mark: D3,
    gloss:
      "The rungs behind you — the RungIndicator's own strip, passed ones inked and the rest pale. The most in-world, and the busiest at 16px.",
  },
  {
    key: "D4",
    mark: D4,
    gloss:
      "Struck through. Here to be argued with: a strike reads as CANCELLED, and this action is the opposite of cancelled.",
  },
];

/** Shown large and small, because the whole problem was legibility at 16. */
function Specimen({ mark, label }: { mark: ReactNode; label: string }) {
  return (
    <div className="flex items-center gap-5">
      <span className="[&_svg]:size-14 shrink-0 text-text-primary">{mark}</span>
      <ActionLink icon={mark} onClick={() => {}}>
        {label}
      </ActionLink>
    </div>
  );
}

export default function IconOptionsPage() {
  return (
    <main className="mx-auto flex max-w-[600px] flex-col gap-10 px-6 py-16">
      <div className="flex flex-col gap-3">
        <span className="type-overline text-text-tertiary">For review</span>
        <h1 className="type-voice-md text-text-primary">
          Replacing BehindMark.
        </h1>
        <p className="type-body text-text-secondary">
          It reads as BackMark at the size it is used. Each candidate is shown
          large and at 16px, and both marks it could be confused with are at the
          bottom.
        </p>
      </div>

      <div className="flex flex-col divide-y divide-line-hairline rounded-sheet border border-line-control">
        {OPTIONS.map((option) => (
          <div key={option.key} className="flex flex-col gap-3 p-5">
            <span className="type-overline text-text-tertiary">
              {option.key}
            </span>
            <Specimen mark={option.mark} label="I’ve already done this" />
            <p className="type-meta text-text-tertiary">{option.gloss}</p>
          </div>
        ))}
      </div>

      <section className="flex flex-col gap-4">
        <h2 className="type-section text-text-primary">
          What each must stay clear of
        </h2>
        <div className="flex flex-col gap-5 rounded-sheet border border-line-control p-5">
          <div className="flex flex-col gap-3">
            <span className="type-overline text-text-tertiary">
              Current — BehindMark
            </span>
            <Specimen mark={<BehindMark />} label="I’ve already done this" />
          </div>
          <div className="flex flex-col gap-3">
            <span className="type-overline text-text-tertiary">
              BackMark — the collision
            </span>
            <Specimen mark={<BackMark />} label="Navigator" />
          </div>
          <div className="flex flex-col gap-3">
            <span className="type-overline text-text-tertiary">
              LedgerMark — D1’s nearest neighbour
            </span>
            <Specimen mark={<LedgerMark />} label="Everything you’ve decided" />
          </div>
          <div className="flex flex-col gap-3">
            <span className="type-overline text-text-tertiary">
              HorizonMark — D3’s nearest neighbour
            </span>
            <Specimen mark={<HorizonMark />} label="The long view" />
          </div>
        </div>
      </section>

      <section className="flex flex-col gap-4">
        <h2 className="type-section text-text-primary">On the card</h2>
        <p className="type-meta text-text-tertiary">
          Where it actually lives — beneath two pills and a figure, as the quiet
          third way.
        </p>
        {OPTIONS.map((option) => (
          <div
            key={option.key}
            className="flex flex-col gap-2 rounded-sheet border border-line-control p-5"
          >
            <span className="type-overline text-text-tertiary">
              {option.key}
            </span>
            <div className="flex flex-wrap items-center gap-3">
              <span className="type-label rounded-full bg-surface-inverse px-5 py-3 text-text-inverse">
                Clear the expensive debt first
              </span>
              <span className="type-label rounded-full border border-action-border px-5 py-3 text-text-primary">
                Not now
              </span>
            </div>
            <ActionLink icon={option.mark} onClick={() => {}}>
              I&rsquo;ve already done this
            </ActionLink>
          </div>
        ))}
      </section>
    </main>
  );
}

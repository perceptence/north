"use client";

import type { ReactNode } from "react";
import { ActionLink, BehindMark, LedgerMark } from "@/components/north/ActionGlyphs";

/**
 * TEMPORARY — a mark for the Steady line. Delete once a pick is made.
 *
 * ── THE FAULT ─────────────────────────────────────────────────────────────
 * "Recorded. I'll ask you how it went on Friday, Aug 7." carries `LedgerMark`
 * — and so does "1 decision with North · last today", four inches below it on
 * the same screen. The same drawing, twice, meaning two different things: one
 * is a STATE the screen is in, the other is a DOOR to the Decisions surface.
 * `LedgerMark` belongs to the door.
 *
 * ── WHAT THIS MARK HAS TO SAY ─────────────────────────────────────────────
 * Not "done" — nothing has happened yet; the money has not moved and the read
 * above is unchanged. Not "recorded" either, or it duplicates the ledger. What
 * is true is that North is HOLDING something and will come back on a named
 * day: a promise with a date on it. The mark is about waiting, kept.
 *
 * Taken, and unavailable: asterisk, signpost, wind, rule-with-ticks
 * (HorizonMark), three-lines-and-a-tick (LedgerMark), rewind triangles,
 * rule-with-arrowhead (BackMark), door, book, dot-with-speech, ring-with-arrow,
 * quote marks, tray, closed lid, two level rules (UnchangedMark), caret
 * (CorrectionMark), the rung strip (BehindMark). The ring is the compass.
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

/** E1 · The day, ringed. A date held open on the calendar — one square, kept. */
const E1 = (
  <Mark>
    <path d="M2.8 5.2 H13.2 V13 H2.8 Z" />
    <path d="M2.8 8 H13.2" />
    <path d="M5.4 5.2 V3" />
    <path d="M10.6 5.2 V3" />
  </Mark>
);

/** E2 · Held. The pause — two uprights, the coach waiting rather than idling. */
const E2 = (
  <Mark>
    <path d="M6 3.6 V12.4" />
    <path d="M10 3.6 V12.4" />
  </Mark>
);

/**
 * E3 · The hourglass, turned. Time running, with the turn already taken —
 * three days of it, which is the whole of what this line says.
 */
const E3 = (
  <Mark>
    <path d="M4 2.8 H12" />
    <path d="M4 13.2 H12" />
    <path d="M4.6 2.8 C4.6 6.4 11.4 9.6 11.4 13.2" />
    <path d="M11.4 2.8 C11.4 6.4 4.6 9.6 4.6 13.2" />
  </Mark>
);

/** E4 · A thread, tied. The commitment held — a knot on the line. */
const E4 = (
  <Mark>
    <path d="M2.4 8 H5.8" />
    <path d="M10.2 8 H13.6" />
    <circle cx="8" cy="8" r="2.2" />
  </Mark>
);

/**
 * E5 · The bookmark. A place kept, to be returned to — and the one object in
 * the set that means "come back to this" without meaning "go there now".
 */
const E5 = (
  <Mark>
    <path d="M4.4 2.8 H11.6 V13.2 L8 10 L4.4 13.2 Z" />
  </Mark>
);

interface Option {
  key: string;
  mark: ReactNode;
  gloss: string;
}

const OPTIONS: Option[] = [
  {
    key: "E1",
    mark: E1,
    gloss:
      "The day, ringed — a date held open. The most literal: this line's whole content is a named day. Busiest of the five at 16px.",
  },
  {
    key: "E2",
    mark: E2,
    gloss:
      "Held — the pause. Two uprights, which is the universal sign for “waiting, not stopped”. Quietest, and closest to UnchangedMark's two rules turned upright.",
  },
  {
    key: "E3",
    mark: E3,
    gloss:
      "The hourglass, turned. Time running with the turn already taken — three days of it, which is exactly what the line says.",
  },
  {
    key: "E4",
    mark: E4,
    gloss:
      "A thread, tied. The commitment held — a knot on the line, and nothing else in the set is a knot.",
  },
  {
    key: "E5",
    mark: E5,
    gloss:
      "The bookmark. A place kept, to be returned to — the only object here that says “come back to this” without saying “go there now”.",
  },
];

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
          A mark for the Steady line.
        </h1>
        <p className="type-body text-text-secondary">
          It borrows <em>LedgerMark</em> — which also sits on &ldquo;1 decision
          with North&rdquo; on the same screen. It has to say North is holding
          something and will come back on a named day. Not &ldquo;done&rdquo;:
          nothing has moved yet.
        </p>
      </div>

      <div className="flex flex-col divide-y divide-line-hairline rounded-sheet border border-line-control">
        {OPTIONS.map((option) => (
          <div key={option.key} className="flex flex-col gap-3 p-5">
            <span className="type-overline text-text-tertiary">
              {option.key}
            </span>
            <Specimen mark={option.mark} label="Recorded. I’ll ask you Friday." />
            <p className="type-meta text-text-tertiary">{option.gloss}</p>
          </div>
        ))}
      </div>

      {/* ── IN PLACE ──────────────────────────────────────────────────────
          The duplication is only visible with both lines on screen at once,
          which is how it ships. */}
      <section className="flex flex-col gap-4">
        <h2 className="type-section text-text-primary">On the screen</h2>
        <p className="type-meta text-text-tertiary">
          Both lines together, as they appear on Today — the Steady line above,
          the ledger door below.
        </p>
        {OPTIONS.map((option) => (
          <div
            key={option.key}
            className="flex flex-col gap-6 rounded-sheet border border-line-control p-5"
          >
            <span className="type-overline text-text-tertiary">
              {option.key}
            </span>
            <div className="flex items-start gap-3">
              <span
                aria-hidden="true"
                className="mt-[0.2em] shrink-0 text-text-tertiary"
              >
                {option.mark}
              </span>
              <p className="type-meta text-text-secondary">
                Recorded. I&rsquo;ll ask you how it went on{" "}
                <span className="text-text-primary">Friday, Aug 7</span>.
              </p>
            </div>
            <ActionLink icon={<LedgerMark />} onClick={() => {}}>
              1 decision with North · last today
            </ActionLink>
          </div>
        ))}
      </section>

      <section className="flex flex-col gap-4">
        <h2 className="type-section text-text-primary">Neighbours to clear</h2>
        <div className="flex flex-col gap-5 rounded-sheet border border-line-control p-5">
          <div className="flex flex-col gap-3">
            <span className="type-overline text-text-tertiary">
              LedgerMark — what it borrows today
            </span>
            <Specimen mark={<LedgerMark />} label="Everything you’ve decided" />
          </div>
          <div className="flex flex-col gap-3">
            <span className="type-overline text-text-tertiary">
              BehindMark — E2’s nearest shape
            </span>
            <Specimen mark={<BehindMark />} label="I’ve already done this" />
          </div>
        </div>
      </section>
    </main>
  );
}

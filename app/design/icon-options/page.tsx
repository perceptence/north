"use client";

import type { ReactNode } from "react";
import { ActionLink } from "@/components/north/ActionGlyphs";

/**
 * TEMPORARY — candidate marks for the three new tertiary links, for review.
 *
 * Delete this route once the picks are made and the winners move into
 * `ActionGlyphs.tsx` with their "chosen over —" note, exactly as every other
 * mark in the product carries one.
 *
 * Every candidate is drawn to the same spec as the shipped marks: a 16 grid,
 * 1.25 stroke, round caps and joins, no fill except where the identity's one
 * filled shape is being deliberately restated. They are shown at the size
 * they will actually be used, beside their real label, on the product's own
 * paper — a mark that only reads at 48px is not a mark this product can use.
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

/* ── "Coming from another device instead" ─────────────────────────────────
   The inbound half of the move: a record arriving from elsewhere and
   landing here, replacing what is on this device. */

/** A1 · The card, arriving — a sheet with an arrow entering it. */
const A1 = (
  <Mark>
    <path d="M2.6 9.4 V13 H13.4 V9.4" />
    <path d="M8 2.4 V9.6" />
    <path d="M5.4 7 L8 9.6 L10.6 7" />
  </Mark>
);

/** A2 · The door, entered — AjarMark's own door with a step through it. */
const A2 = (
  <Mark>
    <path d="M11.6 2.6 V13.4" />
    <path d="M11.6 2.6 L4.4 4 V12.4 L11.6 13.4" />
    <path d="M2 8 H8" />
    <path d="M6 6 L8 8 L6 10" />
  </Mark>
);

/** A3 · Two devices, one handing over — the literal reading. */
const A3 = (
  <Mark>
    <path d="M2.2 3.4 H6.2 V12.6 H2.2 Z" />
    <path d="M9.8 3.4 H13.8 V12.6 H9.8 Z" />
    <path d="M6.8 8 H9.2" />
  </Mark>
);

/** A4 · The compass, handed on — the ring with an arrow entering it. */
const A4 = (
  <Mark>
    <circle cx="10" cy="8" r="4.4" />
    <path d="M1.6 8 H6.4" />
    <path d="M4.4 6 L6.4 8 L4.4 10" />
  </Mark>
);

/* ── "Call me something else" ─────────────────────────────────────────────
   Renaming — and specifically the name North SAYS, the salutation on the
   letter, not a database field. */

/** B1 · The nib — the pen that writes the salutation. */
const B1 = (
  <Mark>
    <path d="M3 13 L4.4 9.6 L10.8 3.2 L12.8 5.2 L6.4 11.6 Z" />
    <path d="M4.4 9.6 L6.4 11.6" />
  </Mark>
);

/** B2 · The salutation itself — a line of address over its rule. */
const B2 = (
  <Mark>
    <path d="M2.6 5.2 H9" />
    <path d="M2.6 8.4 H6.6" />
    <path d="M2.6 12 H13.4" />
  </Mark>
);

/** B3 · Spoken to — the opening quote, which is how a name is said. */
const B3 = (
  <Mark>
    <path d="M5.6 4 C3.4 5.2 2.6 7 2.6 9.2 H5.8 V5.6" />
    <path d="M12.4 4 C10.2 5.2 9.4 7 9.4 9.2 H12.6 V5.6" />
  </Mark>
);

/** B4 · The tag — a name plate on its string. */
const B4 = (
  <Mark>
    <path d="M8.6 2.6 H13.4 V7.4 L7.4 13.4 L2.6 8.6 Z" />
    <circle cx="11" cy="5" r="0.9" fill="currentColor" stroke="none" />
  </Mark>
);

/* ── "Never mind" ─────────────────────────────────────────────────────────
   Backing out of something you opened by choice, leaving it as it was. */

/** C1 · Turning back — the arrow that curls to where it came from. */
const C1 = (
  <Mark>
    <path d="M2.6 6.6 H10 C12.2 6.6 13.4 8 13.4 9.8 C13.4 11.6 12.2 13 10 13" />
    <path d="M5.2 4 L2.6 6.6 L5.2 9.2" />
  </Mark>
);

/** C2 · Closed again — the door pulled to. */
const C2 = (
  <Mark>
    <path d="M4 2.6 V13.4" />
    <path d="M4 2.6 H12 V13.4 H4" />
    <circle cx="10" cy="8" r="0.5" fill="currentColor" stroke="none" />
  </Mark>
);

/** C3 · Struck out — the plain cross, for comparison's sake. */
const C3 = (
  <Mark>
    <path d="M4 4 L12 12" />
    <path d="M12 4 L4 12" />
  </Mark>
);

const SETS: {
  heading: string;
  label: string;
  note: string;
  options: { key: string; mark: ReactNode; gloss: string }[];
}[] = [
  {
    heading: "Coming from another device instead",
    label: "Coming from another device instead",
    note: "Currently borrowing AjarMark, which means “leave it for now” everywhere else in the product — a mark cannot hold two meanings.",
    options: [
      { key: "A1", mark: A1, gloss: "The card, arriving — a record dropping into this device." },
      { key: "A2", mark: A2, gloss: "The door, entered — AjarMark's own door with a step through it." },
      { key: "A3", mark: A3, gloss: "Two devices, one handing over. The literal reading." },
      { key: "A4", mark: A4, gloss: "The compass, handed on — the identity's own object, received." },
    ],
  },
  {
    heading: "Call me something else",
    label: "Call me something else",
    note: "No mark today. The name here is the one North SAYS — the letter's salutation — not a field on a record.",
    options: [
      { key: "B1", mark: B1, gloss: "The nib — the pen that writes the salutation." },
      { key: "B2", mark: B2, gloss: "The salutation — a line of address above its rule." },
      { key: "B3", mark: B3, gloss: "Spoken to — the opening quote, which is how a name is said." },
      { key: "B4", mark: B4, gloss: "The tag — a name plate. Closest to “a field”, furthest from “what I call you”." },
    ],
  },
  {
    heading: "Never mind",
    label: "Never mind",
    note: "No mark today, and that may be right: it is the quiet half of a pair, and the loud half beside it is already a bordered pill.",
    options: [
      { key: "C1", mark: C1, gloss: "Turning back — the arrow that curls to where it came from." },
      { key: "C2", mark: C2, gloss: "Closed again — AjarMark's door, pulled to. Reads as the undo of opening." },
      { key: "C3", mark: C3, gloss: "Struck out. Generic, and this product draws no generic marks — shown to be rejected." },
    ],
  },
];

export default function IconOptionsPage() {
  return (
    <main className="mx-auto flex max-w-[600px] flex-col gap-10 px-6 py-16">
      <div className="flex flex-col gap-3">
        <span className="type-overline text-text-tertiary">For review</span>
        <h1 className="type-voice-md text-text-primary">
          Marks for the three new tertiary links.
        </h1>
        <p className="type-body text-text-secondary">
          Each at the size it will be used, beside its real label, on the
          product&rsquo;s paper. A mark that only reads at 48px is not a mark
          this product can use.
        </p>
      </div>

      {SETS.map((set) => (
        <section key={set.heading} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1">
            <h2 className="type-section text-text-primary">{set.heading}</h2>
            <p className="type-meta text-text-tertiary">{set.note}</p>
          </div>

          <div className="flex flex-col divide-y divide-line-hairline rounded-sheet border border-line-control">
            {set.options.map((option) => (
              <div key={option.key} className="flex flex-col gap-2 p-4">
                <div className="flex items-center gap-3">
                  <span className="type-overline w-6 shrink-0 text-text-tertiary">
                    {option.key}
                  </span>
                  <ActionLink icon={option.mark} onClick={() => {}}>
                    {set.label}
                  </ActionLink>
                </div>
                <p className="type-meta pl-9 text-text-tertiary">
                  {option.gloss}
                </p>
              </div>
            ))}

            {/* The null option, always on the table. */}
            <div className="flex flex-col gap-2 p-4">
              <div className="flex items-center gap-3">
                <span className="type-overline w-6 shrink-0 text-text-tertiary">
                  —
                </span>
                <ActionLink onClick={() => {}}>{set.label}</ActionLink>
              </div>
              <p className="type-meta pl-9 text-text-tertiary">
                No mark. Several shipped ActionLinks already go without one.
              </p>
            </div>
          </div>
        </section>
      ))}
    </main>
  );
}

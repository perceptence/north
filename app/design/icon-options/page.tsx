"use client";

import type { ReactNode } from "react";
import {
  ActionLink,
  AdjustMark,
  LedgerMark,
  SalutationMark,
} from "@/components/north/ActionGlyphs";

/**
 * TEMPORARY — candidates for the three actions this round added. Delete once
 * the picks are made and the winners move into `ActionGlyphs.tsx` with their
 * "chosen over —" notes.
 *
 * Two of the three are currently BORROWING a mark that already means
 * something else, which is the exact fault the last round existed to fix:
 *
 *   "Change it"            → SalutationMark, which means the NAME North calls
 *                            you. A figure is not a salutation.
 *   "I've already done this" → LedgerMark, which means the Decisions surface.
 *                            An action is not a ledger.
 *   "Still right"          → nothing at all.
 *
 * Every candidate is drawn to the shipped spec: a 16 grid, 1.25 stroke, round
 * caps and joins, no fill except where the identity's one filled shape (the
 * needle's north point) is deliberately restated.
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

/* ── "Still right" ────────────────────────────────────────────────────────
   Confirming a figure has not moved. NOT completion — nothing was done. The
   subject is TIME: this answer is still current, and `asOf` gets re-stamped. */

/** A1 · Level. Two rules at the same height — nothing has moved. */
const A1 = (
  <Mark>
    <path d="M3 6.2 H13" />
    <path d="M3 9.8 H13" />
  </Mark>
);

/** A2 · Sealed. The ring with its bar — dated, and on the record. */
const A2 = (
  <Mark>
    <circle cx="8" cy="8" r="5.4" />
    <path d="M5.4 8 H10.6" />
  </Mark>
);

/** A3 · Still true. The needle alone, upright, no bezel to turn against. */
const A3 = (
  <Mark>
    <path d="M8 2.6 L9.7 8 L6.3 8 Z" fill="currentColor" stroke="none" />
    <path d="M6.3 8 L8 13.4 L9.7 8 Z" />
  </Mark>
);

/** A4 · The tick. Generic, and shown to be rejected. */
const A4 = (
  <Mark>
    <path d="M3.2 8.4 L6.6 12 L12.8 4.4" />
  </Mark>
);

/* ── "Change it" ──────────────────────────────────────────────────────────
   Correcting a figure North holds. */

/** B1 · The nib. Drawn last round for the NAME and rejected there for saying
    "edit" — which is exactly what this one means. */
const B1 = (
  <Mark>
    <path d="M3 13 L4.4 9.6 L10.8 3.2 L12.8 5.2 L6.4 11.6 Z" />
    <path d="M4.4 9.6 L6.4 11.6" />
  </Mark>
);

/** B2 · The caret. The proofreader's insert mark — editorial register, and
    it means "this line wants something different" and nothing else. */
const B2 = (
  <Mark>
    <path d="M2.6 11.4 H13.4" />
    <path d="M5.4 8.6 L8 5.4 L10.6 8.6" />
  </Mark>
);

/** B3 · The dial, turned. A value moved to a new setting. */
const B3 = (
  <Mark>
    <path d="M3.4 11.6 A5.8 5.8 0 1 1 12.6 11.6" />
    <path d="M8 8 L11.4 5.4" />
    <circle cx="8" cy="8" r="0.9" fill="currentColor" stroke="none" />
  </Mark>
);

/** B4 · AdjustMark, which already exists — for re-pointing a GOAL. Shown to
    make the overload visible rather than to be chosen. */
const B4 = <AdjustMark />;

/* ── "I've already done this" ─────────────────────────────────────────────
   Reporting a past action. Not a commitment, not a record — a fact. */

/** C1 · The rung, cleared. The ladder's own vocabulary: a step, behind you. */
const C1 = (
  <Mark>
    <path d="M2.6 11.6 H13.4" />
    <path d="M4.8 8.4 L7 10.6 L11.6 5.2" />
  </Mark>
);

/** C2 · Done and sealed. The tick inside the ring — settled, not pending. */
const C2 = (
  <Mark>
    <circle cx="8" cy="8" r="5.6" />
    <path d="M5.2 8.2 L7.2 10.2 L10.9 5.9" />
  </Mark>
);

/** C3 · Behind you. The path, with the distance already walked. */
const C3 = (
  <Mark>
    <path d="M2.6 8 H13.4" />
    <path d="M5.8 4.8 L2.6 8 L5.8 11.2" />
    <path d="M10.4 5.6 V10.4" />
  </Mark>
);

/** C4 · LedgerMark — what it borrows today. Shown to be rejected. */
const C4 = <LedgerMark />;

interface Option {
  key: string;
  mark: ReactNode;
  gloss: string;
}

const SETS: {
  heading: string;
  label: string;
  note: string;
  options: Option[];
}[] = [
  {
    heading: "Still right",
    label: "Still right",
    note: "Confirms a figure has not moved, and re-stamps how current it is. It is NOT completion — nothing was done, and a mark that says “done” would be the wrong idea. The subject is time.",
    options: [
      { key: "A1", mark: A1, gloss: "Level — two rules at one height. Nothing has moved. Reads as “equals”, which is the meaning." },
      { key: "A2", mark: A2, gloss: "Sealed — the ring and its bar. Dated, and on the record." },
      { key: "A3", mark: A3, gloss: "Still true — the needle alone, upright. The identity's own shape, and its one filled point restated." },
      { key: "A4", mark: A4, gloss: "The tick. Every app's mark for “done”, and this is not done. Shown to be rejected." },
    ],
  },
  {
    heading: "Change it",
    label: "Change it",
    note: "Borrowing SalutationMark today — the opening quote, which means the NAME North calls you. A cash figure is not a salutation.",
    options: [
      { key: "B1", mark: B1, gloss: "The nib. Drawn last round for the name and rejected there for saying “edit” — which is exactly what this one means." },
      { key: "B2", mark: B2, gloss: "The caret — the proofreader's insert mark. Editorial register, and it means one thing only: this line wants something different." },
      { key: "B3", mark: B3, gloss: "The dial, turned. A value moved to a new setting." },
      { key: "B4", mark: B4, gloss: "AdjustMark, which already exists — for re-pointing a GOAL. Here to make the overload visible, not to be chosen." },
    ],
  },
  {
    heading: "I’ve already done this",
    label: "I’ve already done this",
    note: "Borrowing LedgerMark today — the Decisions surface. This is not a record, it is a fact being reported: the money already moved.",
    options: [
      { key: "C1", mark: C1, gloss: "The rung, cleared. The ladder's own vocabulary — a step, behind you." },
      { key: "C2", mark: C2, gloss: "Done and sealed — the tick inside the ring. Settled rather than pending." },
      { key: "C3", mark: C3, gloss: "Behind you — the path, with the distance already walked." },
      { key: "C4", mark: C4, gloss: "LedgerMark, what it borrows today. Shown to be rejected." },
    ],
  },
];

export default function IconOptionsPage() {
  return (
    <main className="mx-auto flex max-w-[600px] flex-col gap-10 px-6 py-16">
      <div className="flex flex-col gap-3">
        <span className="type-overline text-text-tertiary">For review</span>
        <h1 className="type-voice-md text-text-primary">
          Marks for the three actions this round added.
        </h1>
        <p className="type-body text-text-secondary">
          Each at the size it will be used, beside its real label. Two of the
          three are borrowing a mark that already means something else, which
          is the fault the last round existed to fix.
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
                <p className="type-meta pl-9 text-text-tertiary">{option.gloss}</p>
              </div>
            ))}

            <div className="flex flex-col gap-2 p-4">
              <div className="flex items-center gap-3">
                <span className="type-overline w-6 shrink-0 text-text-tertiary">
                  —
                </span>
                <ActionLink onClick={() => {}}>{set.label}</ActionLink>
              </div>
              <p className="type-meta pl-9 text-text-tertiary">
                No mark. What “Still right” does today, and several shipped
                ActionLinks go without one.
              </p>
            </div>
          </div>
        </section>
      ))}

      {/* ── THE ROWS THEY ACTUALLY JOIN ──────────────────────────────────
          A mark's job is to be told apart from its NEIGHBOURS, which is
          invisible when candidates are judged alone. This is where the
          mirrored-tray candidate died last round. */}
      <section className="flex flex-col gap-4">
        <h2 className="type-section text-text-primary">The rows they join</h2>

        <div className="flex flex-col gap-5 rounded-sheet border border-line-control p-5">
          <p className="type-meta text-text-tertiary">
            Under the read — the pair sit side by side, so they must not read
            as two versions of one thing.
          </p>
          {[
            ["A1 · B1", A1, B1],
            ["A1 · B2", A1, B2],
            ["A2 · B2", A2, B2],
            ["A3 · B1", A3, B1],
            ["— · B2", null, B2],
          ].map(([key, still, change], i) => (
            <div key={i} className="flex flex-wrap items-center gap-x-5 gap-y-2">
              <span className="type-overline w-16 shrink-0 text-text-tertiary">
                {key as string}
              </span>
              <ActionLink
                icon={(still as ReactNode) ?? undefined}
                onClick={() => {}}
              >
                Still right
              </ActionLink>
              <ActionLink icon={change as ReactNode} onClick={() => {}}>
                Change it
              </ActionLink>
            </div>
          ))}
        </div>

        <div className="flex flex-col gap-5 rounded-sheet border border-line-control p-5">
          <p className="type-meta text-text-tertiary">
            On the decision card — beneath two large pills and a figure. It has
            to read as the quiet third way, not a third button.
          </p>
          {[
            ["C1", C1],
            ["C2", C2],
            ["C3", C3],
            ["C4", C4],
          ].map(([key, mark], i) => (
            <div key={i} className="flex flex-col gap-2">
              <span className="type-overline text-text-tertiary">
                {key as string}
              </span>
              <div className="flex flex-wrap items-center gap-3">
                <span className="type-label rounded-full bg-surface-inverse px-5 py-3 text-text-inverse">
                  Clear the expensive debt first
                </span>
                <span className="type-label rounded-full border border-action-border px-5 py-3 text-text-primary">
                  Not now
                </span>
              </div>
              <p className="type-meta text-text-tertiary">
                Waiting costs about $733 a month.
              </p>
              <ActionLink icon={mark as ReactNode} onClick={() => {}}>
                I&rsquo;ve already done this
              </ActionLink>
            </div>
          ))}
        </div>
      </section>

      <p className="type-meta text-text-tertiary">
        SalutationMark, for reference — the mark &ldquo;Change it&rdquo; is
        borrowing, in the job it was actually chosen for:{" "}
        <span className="inline-flex translate-y-1 items-center">
          <ActionLink icon={<SalutationMark />} onClick={() => {}}>
            Call me something else
          </ActionLink>
        </span>
      </p>
    </main>
  );
}

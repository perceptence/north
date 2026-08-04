"use client";

import type { ReactNode } from "react";
import { ActionLink } from "@/components/north/ActionGlyphs";

/**
 * TEMPORARY — candidate marks for review. Delete once the picks are made.
 *
 * Settled already, and moved into `ActionGlyphs.tsx` with their "chosen
 * over —" notes: `ReceiveMark` for arriving from another device,
 * `SalutationMark` for changing what North calls you, `DownloadMark` for
 * taking the recovery code as a file, and no mark at all on "Never mind".
 *
 * Open: "Hide it" — the third action under a revealed recovery code, beside
 * "Copy code" and "Download it". It currently borrows `AjarMark`, which
 * means "leave it for now" elsewhere, so it needs its own drawing for the
 * same reason the arrival link did.
 *
 * Every candidate is drawn to the shipped spec: a 16 grid, 1.25 stroke,
 * round caps and joins, no fill except where the identity's one filled shape
 * is deliberately restated.
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

/** D1 · The sheet, folded — the writing turned to the inside. */
const D1 = (
  <Mark>
    <path d="M2.8 3 H13.2 V13 H2.8 Z" />
    <path d="M13.2 3 L8 8.2 L2.8 3" />
  </Mark>
);

/** D2 · Put away — the sheet going back into its sleeve, arrow leaving. */
const D2 = (
  <Mark>
    <path d="M2.6 9.4 V13 H13.4 V9.4" />
    <path d="M8 9.6 V2.4" />
    <path d="M5.4 5 L8 2.4 L10.6 5" />
  </Mark>
);

/** D3 · Closed over — two leaves drawn shut across what was showing. */
const D3 = (
  <Mark>
    <path d="M2.4 3 H7.2 V13 H2.4 Z" />
    <path d="M8.8 3 H13.6 V13 H8.8 Z" />
  </Mark>
);

/** D4 · Not shown — the lid, down, with the sightline struck through it. */
const D4 = (
  <Mark>
    <path d="M1.8 8.6 C4 11.4 12 11.4 14.2 8.6" />
    <path d="M4 10.8 L2.9 12.6" />
    <path d="M8 11.8 V13.8" />
    <path d="M12 10.8 L13.1 12.6" />
  </Mark>
);

/** D5 · Under cover — the horizon drawn over the thing, the product's own line. */
const D5 = (
  <Mark>
    <path d="M2 9.6 H14" />
    <path d="M4.6 6.6 H11.4" />
    <path d="M6.6 3.8 H9.4" />
  </Mark>
);

const OPTIONS: { key: string; mark: ReactNode; gloss: string }[] = [
  {
    key: "D1",
    mark: D1,
    gloss:
      "The sheet, folded — the writing turned to the inside. Paper is already this product's material.",
  },
  {
    key: "D2",
    mark: D2,
    gloss:
      "Put away — deliberately the chosen download mark, mirrored. Same tray, opposite direction: one takes the record out, one puts it back.",
  },
  {
    key: "D3",
    mark: D3,
    gloss: "Closed over — two leaves drawn shut across what was showing.",
  },
  {
    key: "D4",
    mark: D4,
    gloss:
      "Not shown — the lid down. The most instantly legible, and the most borrowed: an eye is nowhere else in this product's vocabulary.",
  },
  {
    key: "D5",
    mark: D5,
    gloss:
      "Under cover — receding rules, the code sinking below the line. In the product's own hand, but says least on its own.",
  },
];

export default function IconOptionsPage() {
  return (
    <main className="mx-auto flex max-w-[600px] flex-col gap-10 px-6 py-16">
      <div className="flex flex-col gap-3">
        <span className="type-overline text-text-tertiary">For review</span>
        <h1 className="type-voice-md text-text-primary">
          Marks for &ldquo;Hide it&rdquo;.
        </h1>
        <p className="type-body text-text-secondary">
          The third action under a revealed recovery code. It sits beside
          &ldquo;Copy code&rdquo; and &ldquo;Download it&rdquo;, so it has to
          be told apart from both at a glance.
        </p>
      </div>

      <section className="flex flex-col gap-4">
        <div className="flex flex-col divide-y divide-line-hairline rounded-sheet border border-line-control">
          {OPTIONS.map((option) => (
            <div key={option.key} className="flex flex-col gap-2 p-4">
              <div className="flex items-center gap-3">
                <span className="type-overline w-6 shrink-0 text-text-tertiary">
                  {option.key}
                </span>
                <ActionLink icon={option.mark} onClick={() => {}}>
                  Hide it
                </ActionLink>
              </div>
              <p className="type-meta pl-9 text-text-tertiary">
                {option.gloss}
              </p>
            </div>
          ))}

          <div className="flex flex-col gap-2 p-4">
            <div className="flex items-center gap-3">
              <span className="type-overline w-6 shrink-0 text-text-tertiary">
                —
              </span>
              <ActionLink onClick={() => {}}>Hide it</ActionLink>
            </div>
            <p className="type-meta pl-9 text-text-tertiary">
              No mark — but its two neighbours have one, and a bare label in a
              row of three reads as the odd one out rather than the quiet one.
            </p>
          </div>
        </div>
      </section>

      {/* In context: the row these actually appear in, so the candidates can
          be judged against their neighbours rather than in isolation. */}
      <section className="flex flex-col gap-4">
        <h2 className="type-section text-text-primary">The row they join</h2>
        <div className="flex flex-col gap-4 rounded-sheet border border-line-control p-5">
          {OPTIONS.map((option) => (
            <div
              key={option.key}
              className="flex flex-wrap items-center gap-x-5 gap-y-3"
            >
              <span className="type-overline w-6 shrink-0 text-text-tertiary">
                {option.key}
              </span>
              <span className="type-label rounded-full border border-action-border px-4 py-2 text-text-primary">
                Copy code
              </span>
              <ActionLink
                icon={
                  <Mark>
                    <path d="M2.6 9.4 V13 H13.4 V9.4" />
                    <path d="M8 2.4 V9.6" />
                    <path d="M5.4 7 L8 9.6 L10.6 7" />
                  </Mark>
                }
                onClick={() => {}}
              >
                Download it
              </ActionLink>
              <ActionLink icon={option.mark} onClick={() => {}}>
                Hide it
              </ActionLink>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}

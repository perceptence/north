"use client";

import { useCallback, useEffect, useId, useRef, type ReactNode } from "react";
import { Button, TRANSITION, m } from "@/components/nds";
import { Sky } from "./Sky";

/**
 * The explanation room — one chrome for every "why does North say this?".
 *
 * ── WHY ONE COMPONENT ─────────────────────────────────────────────────────
 * There were two. "What's assumed" opened a full-height room; "What this
 * rests on" opened a bottom Sheet. Both answer the SAME kind of question —
 * what a claim rests on, and what North had to assume to make it — so wearing
 * different chrome taught the reader that they were different kinds of thing.
 * They are not. One room, one behaviour, one place to look.
 *
 * `DerivationSheet` stays a Sheet, and that distinction is real: it explains
 * ONE number's arithmetic, which is bounded and dismissed in ten seconds. This
 * room is for the reasoning behind a whole answer, which is meant to be READ.
 *
 * Full-height on a phone, a right-hand pane from `md` — the same geometry the
 * assumptions panel already used, now applied consistently.
 */

export interface ExplanationPanelProps {
  open: boolean;
  onClose: () => void;
  /** Mono-caps label on the sky. */
  eyebrow: string;
  /** The one sentence the room exists for, in the coach's voice. */
  thesis: string;
  children: ReactNode;
}

export function ExplanationPanel({
  open,
  onClose,
  eyebrow,
  thesis,
  children,
}: ExplanationPanelProps) {
  const titleId = useId();
  const panelRef = useRef<HTMLDivElement>(null);
  const returnTo = useRef<HTMLElement | null>(null);

  const close = useCallback(() => onClose(), [onClose]);

  useEffect(() => {
    if (!open) return;

    returnTo.current = document.activeElement as HTMLElement | null;
    panelRef.current?.focus();

    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.stopPropagation();
        close();
      }
    };
    document.addEventListener("keydown", onKey);

    // The room is full-height; the page behind it must not scroll under it.
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = previous;
      returnTo.current?.focus?.();
    };
  }, [open, close]);

  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      className="fixed inset-0 z-50"
    >
      {/* Overlays are the documented exception to "motion never gates
          visibility": user-triggered, so the window is focused by definition,
          and this renders OVER content rather than being it. */}
      <m.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={TRANSITION.micro}
        className="absolute inset-0 bg-surface-scrim"
        onClick={close}
        aria-hidden="true"
      />

      <m.div
        ref={panelRef}
        tabIndex={-1}
        initial={{ y: 18 }}
        animate={{ y: 0 }}
        transition={TRANSITION.standard}
        className="absolute inset-0 overflow-y-auto bg-surface-page outline-none md:inset-y-0 md:right-0 md:left-auto md:w-[34rem] md:shadow-sheet"
      >
        <Sky className="h-28" />

        <div className="relative mx-auto flex w-full max-w-column flex-col gap-8 px-5 pt-8 pb-16 md:px-8">
          <p className="type-overline text-text-on-deep">{eyebrow}</p>

          <h2 id={titleId} className="type-voice-lg measure text-text-primary">
            {thesis}
          </h2>

          {children}

          <Button variant="secondary" className="self-start" onClick={close}>
            Close
          </Button>
        </div>
      </m.div>
    </div>
  );
}

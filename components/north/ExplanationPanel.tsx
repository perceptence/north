import type { ReactNode } from "react";
import { RHYTHM, Sheet } from "@/components/nds";
import { cn } from "@/lib/cn";

/**
 * The explanation room — one chrome for every "why does North say this?".
 *
 * A thin skin over `Sheet` (components/nds/Sheet.tsx): a sheet on phone and
 * tablet, a right-hand pane from `lg`, every dismiss path (scrim, Escape,
 * drag, the system back gesture) inherited rather than reimplemented. The
 * header is an eyebrow and a full sentence in the coach's voice instead of
 * a plain label — the reasoning behind a whole answer is meant to be READ,
 * not scanned like a number's receipt.
 *
 * `DerivationSheet` stays a plain Sheet, and that distinction is real: it
 * explains ONE number's arithmetic, bounded and dismissed in ten seconds.
 * This is for the reasoning behind a whole answer.
 *
 * No sky, and no separate "Close" button: a masthead-sized band of
 * atmosphere read as its own piece of chrome bolted onto a room that
 * otherwise wears the SAME surface as every other sheet in the product, and
 * every sheet already dismisses the same four ways without asking for a
 * dedicated button. Plain `bg-surface-sunken` — Sheet's own — is what makes
 * this read as the same kind of thing as everything else that discloses,
 * rather than a special case.
 */

export interface ExplanationPanelProps {
  open: boolean;
  onClose: () => void;
  /** Mono-caps label above the thesis. */
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
  return (
    <Sheet
      open={open}
      onClose={onClose}
      title={
        <div className="flex flex-col gap-2">
          <p className="type-overline text-text-tertiary">{eyebrow}</p>
          <h2 className="type-voice-lg measure text-text-primary">{thesis}</h2>
        </div>
      }
    >
      <div className={cn("mx-auto flex w-full max-w-column flex-col", RHYTHM.block)}>
        {children}
      </div>
    </Sheet>
  );
}

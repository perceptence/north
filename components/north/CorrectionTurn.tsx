"use client";

import { useCallback, useMemo, useState } from "react";
import {
  RHYTHM,
  Button,
  ChoiceChip,
  ChoiceChipGroup,
  ConversationTurn,
  Text,
} from "@/components/nds";
import { applyAnswers } from "@/core/onboarding/correction";
import { SCRIPT, toAnswer, type Answers, type TurnId } from "@/core/onboarding/script";
import { saveProfile, useProfile } from "@/state/profile-store";
import { cn } from "@/lib/cn";

/**
 * A correction: the coach asking one question again.
 *
 * Not a form. This renders the SAME `ConversationTurn` onboarding uses, which
 * is precisely what lets the product have no settings screen
 * (docs/UX-ARCHITECTURE.md §5.3). The reuse is the design.
 *
 * Follow-up questions come from the script's own `showIf`, so correcting
 * "expensive debt" asks for the balance too — without this component knowing
 * anything about debt.
 */

export interface CorrectionTurnProps {
  turnId: TurnId;
  /** Shown above the question. e.g. "Cash you hold" */
  label?: string;
  onDone: () => void;
  onCancel: () => void;
}

export function CorrectionTurn({
  turnId,
  label,
  onDone,
  onCancel,
}: CorrectionTurnProps) {
  const profile = useProfile();
  const [answers, setAnswers] = useState<Answers>({});

  /**
   * The questions this correction covers, given what has been answered.
   * Follow-ups come from the script's own `showIf`, so correcting "expensive
   * debt" asks for the balance too — without this component knowing about debt.
   */
  const turnsFor = useCallback(
    (given: Answers) => {
      const base = SCRIPT.find((t) => t.id === turnId);
      if (!base) return [];
      return [...
        new Set([base, ...SCRIPT.filter((t) => t.showIf && t.showIf(given))]),
      ];
    },
    [turnId],
  );

  const turn = useMemo(
    () => turnsFor(answers).find((t) => answers[t.id] === undefined),
    [turnsFor, answers],
  );

  /**
   * Saving happens HERE, in the event handler — never during render.
   *
   * An earlier version patched the profile and called `onDone` from the render
   * body once every question had an answer. That is a side effect in the render
   * phase: it saved correctly but left the sheet open, because the parent's
   * state update was issued while the child was still rendering.
   */
  const answer = useCallback(
    (choice: Parameters<typeof toAnswer>[0]) => {
      if (!profile || !turn) return;

      const next: Answers = { ...answers, [turn.id]: toAnswer(choice) };
      const remaining = turnsFor(next).filter(
        (t) => next[t.id] === undefined,
      );

      if (remaining.length > 0) {
        setAnswers(next);
        return;
      }

      saveProfile(applyAnswers(profile, next, new Date()));
      onDone();
    },
    [profile, turn, answers, turnsFor, onDone],
  );

  // Nothing left to ask, or nothing askable — the handler above has already
  // saved and closed by the time this matters.
  if (!profile || !turn) return null;

  if (turn.kind !== "choice") {
    // Corrections are always selections. Free text exists once, in onboarding,
    // and it is not a fact anyone needs to correct.
    return null;
  }

  return (
    <div className={cn("flex flex-col", RHYTHM.block)}>
      {label && (
        <Text variant="meta" tone="tertiary">
          Correcting · {label}
        </Text>
      )}

      <ConversationTurn question={turn.question}>
        {turn.note && (
          <Text variant="meta" tone="tertiary" className="-mt-1">
            {turn.note}
          </Text>
        )}

        <ChoiceChipGroup label={turn.question} block={turn.block}>
          {turn.options.map((choice) => (
            <ChoiceChip
              key={choice.label}
              block={turn.block}
              onSelect={() => answer(choice)}
            >
              {choice.label}
            </ChoiceChip>
          ))}
        </ChoiceChipGroup>
      </ConversationTurn>

      <Button variant="quiet" onClick={onCancel} className="self-start">
        Leave it as it is
      </Button>
    </div>
  );
}

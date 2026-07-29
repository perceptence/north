import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

/**
 * One turn of the conversation.
 *
 * Used in onboarding AND in the correction loop — the reuse that removes a
 * settings screen from the IA entirely (docs/UX-ARCHITECTURE.md §5.3).
 *
 * Two rules this component exists to enforce:
 *   1. ONE question at a time. Rendering two is a system violation, not a
 *      layout choice.
 *   2. NO progress indicator, ever. A progress bar tells the user how much work
 *      remains, which frames a conversation as a chore.
 */

export interface ConversationTurnProps {
  question: ReactNode;
  /** The answer affordance — a ChoiceChipGroup or the single TextField. */
  children?: ReactNode;
  /** A prior turn: recedes and its affordance is replaced by the answer given. */
  answered?: boolean;
  /** The user's answer, shown once the turn is behind them. */
  answer?: ReactNode;
  onBack?: () => void;
  className?: string;
}

export function ConversationTurn({
  question,
  children,
  answered = false,
  answer,
  onBack,
  className,
}: ConversationTurnProps) {
  return (
    <div
      className={cn(
        "flex flex-col gap-4 transition-opacity duration-[--motion-standard]",
        answered && "opacity-55",
        className,
      )}
    >
      <p
        className={cn(
          "type-voice-md measure",
          answered ? "text-text-secondary" : "text-text-primary",
        )}
      >
        {question}
      </p>

      {answered ? (
        answer && <p className="type-body text-text-tertiary">{answer}</p>
      ) : (
        <>
          {children}
          {onBack && (
            <button
              type="button"
              onClick={onBack}
              className={cn(
                "type-meta hit-target mt-1 cursor-pointer self-start",
                "rounded-control text-text-tertiary transition-colors",
                "duration-[--motion-micro] hover:text-text-secondary",
              )}
            >
              Back
            </button>
          )}
        </>
      )}
    </div>
  );
}

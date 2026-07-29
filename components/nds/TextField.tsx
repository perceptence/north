"use client";

import { useLayoutEffect, useRef } from "react";
import { cn } from "@/lib/cn";

/**
 * Used exactly once in the entire product: onboarding's opening question.
 *
 * No placeholder. Placeholders-as-labels are an accessibility failure, and the
 * question sitting above this field already does that job
 * (docs/DESIGN-SYSTEM.md §8.2).
 *
 * There is deliberately no form-field suite — no validation system, no field
 * groups, no inline errors. Add them when a second field exists.
 */

export interface TextFieldProps {
  value: string;
  onChange: (value: string) => void;
  /** Accessible name. Visually this is the question rendered above the field. */
  label: string;
  onSubmit?: () => void;
  disabled?: boolean;
  autoFocus?: boolean;
  className?: string;
}

export function TextField({
  value,
  onChange,
  label,
  onSubmit,
  disabled = false,
  autoFocus = false,
  className,
}: TextFieldProps) {
  const ref = useRef<HTMLTextAreaElement>(null);

  // Auto-grow. A scrollbar inside a one-question field reads as a form.
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${el.scrollHeight}px`;
  }, [value]);

  return (
    <textarea
      ref={ref}
      rows={1}
      value={value}
      aria-label={label}
      disabled={disabled}
      autoFocus={autoFocus}
      onChange={(event) => onChange(event.target.value)}
      onKeyDown={(event) => {
        // Enter submits; Shift+Enter breaks the line. This is a conversation,
        // and in a conversation Enter means "I'm done talking."
        if (event.key === "Enter" && !event.shiftKey && onSubmit) {
          event.preventDefault();
          onSubmit();
        }
      }}
      className={cn(
        "type-body w-full resize-none overflow-hidden bg-transparent",
        // pt-2 + 26px line + pb-3 = 46px, clearing the 44px target floor
        // (docs/DESIGN-SYSTEM.md §9, rule 17). Without the top padding a
        // single-line field measures 38px.
        "border-b border-action-border pt-2 pb-3 text-text-primary",
        "transition-colors duration-[--motion-micro]",
        "hover:border-action-border-hover focus:border-text-primary",
        // The field is the only thing on the line; the ring would double the
        // underline. Border shift carries focus, outline stays for keyboards.
        "focus:outline-none focus-visible:outline-2 focus-visible:outline-offset-4",
        "focus-visible:outline-signal-coach",
        disabled && "pointer-events-none opacity-40",
        className,
      )}
    />
  );
}

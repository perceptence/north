"use client";

import { useId } from "react";
import { cn } from "@/lib/cn";

/**
 * A labelled input — for the two places North is honestly a form.
 *
 * ── WHY THIS EXISTS ALONGSIDE `TextField` ─────────────────────────────────
 * `TextField` is the CONVERSATION's input: an auto-growing textarea with no
 * visible label, because the coach's question above it is the label. That is
 * right for a turn and wrong for a form, where four fields sit together and
 * each needs to say what it is, take a type (email, password), and be able
 * to report a problem with itself.
 *
 * Two components rather than one with a `variant`, because they differ in
 * what they ARE, not how they look: one is speech being written down, the
 * other is a field being filled in. Collapsing them would have put a
 * placeholder and a validation message on the coach's own composer.
 *
 * ── THE ERROR IS PROSE, IN CLAY — NEVER RED ───────────────────────────────
 * A field in trouble IS attention, which is the one job `signal-attention`
 * exists for (DESIGN-SYSTEM §2.2: max once per viewport, never on an
 * amount). Clay at 5.12 clears AA on the page, so the message is readable
 * as text and not merely tinted.
 *
 * It is deliberately not red. The product forbids red/green semantics
 * outright, and a scarlet field on a financial screen reads as "your money
 * is wrong" rather than "this address is missing an @" — which is exactly
 * the misread `errors never imply the user's money is affected` was written
 * to prevent.
 *
 * Colour never carries it alone: the message is a sentence, the border
 * thickens, and `aria-invalid` plus `aria-describedby` carry it for anyone
 * not looking at hue at all.
 */

export interface FormFieldProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: "text" | "email" | "password";
  placeholder?: string;
  /** Native autofill hint — real forms let password managers work. */
  autoComplete?: string;
  /** A sentence naming what is wrong, or absent when nothing is. */
  error?: string;
  /** Quiet guidance under the field, shown when there is no error. */
  hint?: string;
  onSubmit?: () => void;
  disabled?: boolean;
  autoFocus?: boolean;
  className?: string;
}

export function FormField({
  label,
  value,
  onChange,
  type = "text",
  placeholder,
  autoComplete,
  error,
  hint,
  onSubmit,
  disabled = false,
  autoFocus = false,
  className,
}: FormFieldProps) {
  const id = useId();
  const noteId = `${id}-note`;
  const note = error ?? hint;

  return (
    <div className={cn("flex w-full flex-col gap-2", className)}>
      <label htmlFor={id} className="type-label text-text-secondary">
        {label}
      </label>

      <input
        id={id}
        type={type}
        value={value}
        placeholder={placeholder}
        autoComplete={autoComplete}
        autoFocus={autoFocus}
        disabled={disabled}
        aria-invalid={error ? true : undefined}
        aria-describedby={note ? noteId : undefined}
        onChange={(event) => onChange(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === "Enter" && onSubmit) {
            event.preventDefault();
            onSubmit();
          }
        }}
        className={cn(
          "type-body w-full rounded-control bg-surface-raised px-4 py-3",
          "text-text-primary placeholder:text-text-tertiary",
          "border transition-colors duration-[--motion-micro]",
          // Hue AND weight, so the mark survives being unable to see either.
          error
            ? "border-signal-attention"
            : "border-action-border hover:border-action-border-hover",
          "focus:border-action-border-hover focus:outline-none",
          disabled && "opacity-50",
        )}
      />

      {note && (
        <p
          id={noteId}
          className={cn(
            "type-meta",
            error ? "text-signal-attention" : "text-text-tertiary",
          )}
        >
          {note}
        </p>
      )}
    </div>
  );
}

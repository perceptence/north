import type { ElementType, ReactNode } from "react";
import { cn } from "@/lib/cn";

/**
 * The only way type enters the product.
 *
 * No other component sets font-size, font-family, or line-height directly
 * (docs/DESIGN-SYSTEM.md §8.1).
 */

export type TextVariant =
  | "voice-xl"
  | "voice-lg"
  | "voice-md"
  | "body"
  | "label"
  | "meta"
  | "section"
  | "overline"
  | "figure";

export type TextTone = "primary" | "secondary" | "tertiary" | "inverse";

const VARIANT_CLASS: Record<TextVariant, string> = {
  "voice-xl": "type-voice-xl",
  "voice-lg": "type-voice-lg",
  "voice-md": "type-voice-md",
  body: "type-body",
  label: "type-label",
  meta: "type-meta",
  section: "type-section",
  overline: "type-overline",
  figure: "type-figure",
};

const TONE_CLASS: Record<TextTone, string> = {
  primary: "text-text-primary",
  secondary: "text-text-secondary",
  tertiary: "text-text-tertiary",
  inverse: "text-text-inverse",
};

/** Sensible default element per variant; override with `as`. */
const VARIANT_ELEMENT: Record<TextVariant, ElementType> = {
  "voice-xl": "h1",
  "voice-lg": "h1",
  "voice-md": "h2",
  body: "p",
  label: "span",
  meta: "span",
  section: "h2",
  overline: "span",
  figure: "span",
};

export interface TextProps {
  variant: TextVariant;
  tone?: TextTone;
  as?: ElementType;
  /** Constrain to the 62–68ch measure. Use on prose, not on labels. */
  measure?: boolean;
  className?: string;
  children: ReactNode;
}

export function Text({
  variant,
  tone = "primary",
  as,
  measure = false,
  className,
  children,
}: TextProps) {
  const Component = as ?? VARIANT_ELEMENT[variant];

  return (
    <Component
      className={cn(
        VARIANT_CLASS[variant],
        TONE_CLASS[tone],
        measure && "measure",
        className,
      )}
    >
      {children}
    </Component>
  );
}

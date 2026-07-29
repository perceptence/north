import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

/**
 * The heading that opens a block within a screen.
 *
 * ── WHY A COMPONENT AND NOT A VARIANT ─────────────────────────────────────
 * `Text variant="section"` already existed, and every section heading used
 * it — but each call site also picked its own `tone`, so the same rank was
 * rendering at three different weights of grey across the product, and the
 * horizon band's caption had drifted to `type-overline` entirely. A rank whose
 * appearance is decided per call site is not a rank.
 *
 * This takes NO tone and NO variant. One rank, one look, everywhere:
 * "What you're working toward", "On this path by retirement", "Where this
 * leaves you", "Or start from one of these". If a heading needs to look
 * different, it is a different rank and needs its own name.
 *
 * Mono caps at 13/500/0.1em — heavier and larger than `type-overline`, which
 * is the quieter mark reserved for a page's own dateline in the masthead
 * position. The two are not interchangeable.
 */

export interface SectionHeadingProps {
  children: ReactNode;
  /** Layout only — never colour or type. */
  className?: string;
  /** Defaults to `h2`; pass `div` where the heading order forbids one. */
  as?: "h2" | "h3" | "div";
}

export function SectionHeading({
  children,
  className,
  as: Tag = "h2",
}: SectionHeadingProps) {
  return (
    <Tag className={cn("type-section text-text-secondary", className)}>
      {children}
    </Tag>
  );
}

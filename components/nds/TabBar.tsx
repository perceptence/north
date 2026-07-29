"use client";

import type { MouseEvent, ReactNode } from "react";
import { m } from "motion/react";
import { cn } from "@/lib/cn";
import { TRANSITION } from "./motion";

/**
 * Primary navigation.
 *
 * ── TWO POSTURES, ONE COMPONENT ───────────────────────────────────────────
 * Mobile AND tablet: a floating pill dock at the bottom, in thumb reach — a
 * raised paper capsule over the page. A hand holds a tablet like a phone;
 * only a desk gets the desk posture. From `sm` the dock grows a size: the
 * same capsule reads undersized on a screen twice as wide.
 *
 * lg+: a VERTICAL RAIL at the viewport's left edge. The column never widens
 * past 600px, so a desk leaves deep margins on both sides — the rail lives in
 * that whitespace instead of stacking chrome above the content. It sits on
 * paper (the sky is only the page's first 144px), so it uses ink tones, not
 * the on-deep tokens the old top row needed.
 *
 * ── WHY IT EXISTS AT ALL ──────────────────────────────────────────────────
 * MVP shipped with no tab bar deliberately; four destinations was the
 * documented trigger (docs/UX-ARCHITECTURE.md §2).
 *
 * ── NO ICONS ──────────────────────────────────────────────────────────────
 * Labels only. The system has no icon set, and "Navigator" has no unambiguous
 * glyph. Words are the icons.
 *
 * ── REAL ANCHORS ──────────────────────────────────────────────────────────
 * Renders `<a href>` so middle-click, open-in-new-tab, and assistive tech all
 * behave. `onNavigate` lets the product intercept for client routing without
 * NDS importing a router.
 */

export interface TabItem {
  href: string;
  label: string;
  /**
   * Optional hairline glyph, shown on the mobile dock only — the segmented
   * desktop row stays words. NDS renders whatever node it is handed; the
   * drawings live with the product. No icon library.
   */
  icon?: ReactNode;
}

export interface TabBarProps {
  items: TabItem[];
  /** The href of the current destination. */
  current: string;
  onNavigate?: (href: string, event: MouseEvent<HTMLAnchorElement>) => void;
  className?: string;
}

export function TabBar({ items, current, onNavigate, className }: TabBarProps) {
  return (
    <nav
      aria-label="Main"
      className={cn(
        // Mobile and tablet: floating dock, growing a size from sm.
        "fixed bottom-4 left-1/2 z-20 w-max max-w-[calc(100%-2rem)] -translate-x-1/2",
        "rounded-full border border-line-hairline bg-surface-raised/95 p-1.5",
        "shadow-sheet backdrop-blur",
        // `md` is 640 in this system (globals.css clears Tailwind's defaults
        // and declares three breakpoints) — so this is the tablet bump.
        "md:bottom-6 md:p-2",
        // lg+: vertical rail in the left margin.
        "lg:top-1/2 lg:bottom-auto lg:left-7 lg:max-w-none lg:translate-x-0 lg:-translate-y-1/2",
        "lg:rounded-none lg:border-0 lg:bg-transparent lg:p-0",
        "lg:shadow-none lg:backdrop-blur-none",
        className,
      )}
    >
      <ul className="flex items-center gap-1 lg:flex-col lg:items-stretch lg:gap-1.5">
        {items.map((item) => {
          const active = item.href === current;
          return (
            <li key={item.href} className="relative">
              {/* The lit segment is ONE shared element that glides between
                  destinations on the standard spring — navigation you can
                  feel. Falls back to appearing in place until the Motion
                  features load. */}
              {active && (
                <m.span
                  layoutId="nds-dock-active"
                  transition={TRANSITION.standard}
                  aria-hidden="true"
                  className="absolute inset-0 rounded-full bg-surface-sunken lg:bg-surface-raised lg:shadow-card"
                />
              )}
              <a
                href={item.href}
                aria-current={active ? "page" : undefined}
                onClick={(event) => onNavigate?.(item.href, event)}
                className={cn(
                  "relative flex min-h-12 flex-col items-center justify-center gap-0.5 rounded-full px-4",
                  "transition-colors duration-[--motion-micro]",
                  "md:min-h-14 md:gap-1.5 md:px-7",
                  // The rail reads as a list: mark then word, left-aligned.
                  // Sized for a pointer at reading distance, not a thumb —
                  // the first cut was legible but looked like a footnote.
                  "lg:min-h-12 lg:flex-row lg:justify-start lg:gap-3.5 lg:px-4",
                  active
                    ? "text-text-primary"
                    : "text-text-tertiary hover:text-text-secondary",
                )}
              >
                {/* One size everywhere. Scaling the glyph up at `md` also
                    scaled its stroke, so the dock got heavier on exactly the
                    screens with the most room for it to be quiet. */}
                {item.icon && <span aria-hidden="true">{item.icon}</span>}
                {/* `type-meta`, not `type-label`. At 14/500 the dock's words
                    were the heaviest small text in the product, so navigation
                    outweighed content. 13/400 matches every other quiet label;
                    the active state is carried by ink and the pill, which is
                    where state belongs. The type classes live in
                    @layer components and take no breakpoint variants — a
                    `lg:type-meta` would compile to nothing. */}
                <span className="type-meta">{item.label}</span>
              </a>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

"use client";

import { cn } from "@/lib/cn";
import { useScrolled } from "@/lib/use-scrolled";

/**
 * Minimal by design. MVP has no tab bar — two destinations of unequal weight
 * are a push relationship, not peers (docs/UX-ARCHITECTURE.md §2).
 *
 * The hairline appears only once content has scrolled beneath the bar, so a
 * screen at rest has no chrome at all.
 */

export interface AppBarProps {
  title?: string;
  onBack?: () => void;
  className?: string;
}

export function AppBar({ title, onBack, className }: AppBarProps) {
  // Shared with the product shell's apron — see `useScrolled`.
  const scrolled = useScrolled();

  return (
    <header
      className={cn(
        "sticky top-0 z-10 md:static",
        "flex h-14 items-center gap-2 bg-surface-page px-4 md:px-0",
        "border-b transition-colors duration-[--motion-micro]",
        scrolled ? "border-line-hairline" : "border-transparent",
        className,
      )}
    >
      {onBack && (
        <button
          type="button"
          onClick={onBack}
          aria-label="Back"
          className={cn(
            "-ml-2 flex size-11 cursor-pointer items-center justify-center",
            "rounded-control text-text-secondary transition-colors",
            "duration-[--motion-micro] hover:text-text-primary",
          )}
        >
          <svg viewBox="0 0 20 20" className="size-5" fill="none" aria-hidden="true">
            <path
              d="M12 4l-6 6 6 6"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
      )}
      {title && <span className="type-label text-text-primary">{title}</span>}
    </header>
  );
}

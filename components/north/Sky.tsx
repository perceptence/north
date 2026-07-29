"use client";

import { useState } from "react";
import { cn } from "@/lib/cn";

/**
 * The atmosphere, aware of the hour.
 *
 * Dawn, day, and dusk are the SAME three sky tokens in different proportions —
 * no new hues, so every contrast measurement still holds (text on the deep
 * zone worst-cases at sky-600, 7.35:1). Computed once at mount: the sky
 * doesn't shift mid-session, it just greets you correctly.
 *
 * This lives in the product tier, not NDS — it reads the clock, and the
 * design system stays deterministic.
 */

type Mood = "dawn" | "day" | "dusk";

const RAMP: Record<Mood, string> = {
  dawn: `linear-gradient(180deg in oklab, var(--sky-900) 0%, var(--sky-600) 45%, var(--sky-300) 75%, var(--paper-50) 100%)`,
  day: `linear-gradient(180deg in oklab, var(--sky-600) 0%, var(--sky-300) 55%, var(--paper-50) 100%)`,
  dusk: `linear-gradient(180deg in oklab, var(--sky-900) 0%, var(--sky-900) 28%, var(--sky-600) 62%, var(--sky-300) 84%, var(--paper-50) 100%)`,
};

function moodNow(): Mood {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 11) return "dawn";
  if (hour >= 11 && hour < 17) return "day";
  return "dusk";
}

export function Sky({ className }: { className?: string }) {
  const [mood] = useState<Mood>(moodNow);

  return (
    <div
      aria-hidden="true"
      data-mood={mood}
      className={cn("atmosphere", className)}
      style={{ backgroundImage: RAMP[mood] }}
    />
  );
}

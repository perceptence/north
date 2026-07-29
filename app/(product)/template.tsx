"use client";

import type { ReactNode } from "react";
import { TRANSITION, m } from "@/components/nds";

/**
 * Page transition.
 *
 * A `template` rather than a `layout` because templates remount on navigation —
 * which is exactly what re-runs the entrance. It also resets per-screen local
 * state (the Navigator's selected scenario), and that is the behaviour you
 * want: arriving at a surface should show it at rest, not mid-thought.
 *
 * ── ENTER ONLY ────────────────────────────────────────────────────────────
 * The App Router unmounts the outgoing page before an exit could play, so exit
 * transitions need workarounds that fight the router. Enter-only is also the
 * faster choice, and speed is a design value here.
 *
 * ── DELIBERATELY SMALL ────────────────────────────────────────────────────
 * 6px and 220ms. Enough to say "you moved", not enough to make moving feel
 * expensive. A tab bar people use constantly is exactly where a showy
 * transition becomes a tax.
 */
export default function ProductTemplate({ children }: { children: ReactNode }) {
  return (
    <m.div
      initial={{ y: 6 }}
      animate={{ y: 0 }}
      transition={TRANSITION.standard}
    >
      {children}
    </m.div>
  );
}

"use client";

import { cn } from "@/lib/cn";
import { useScrolled } from "@/lib/use-scrolled";

/**
 * The chrome's paper foot, and the edge that only exists when it is needed.
 *
 * ── WHY THERE IS AN EDGE AT ALL ───────────────────────────────────────────
 * The apron is opaque, so content scrolling under it is CUT at its bottom.
 * That cut is correct — it is what every app on the device does — but on
 * paper against paper it has nothing to explain it: you see the lower half
 * of a line of serif with clear space above, which reads as a rendering
 * fault rather than as text passing under the chrome.
 *
 * A hairline gives the cut a reason. `line-hairline` is the separation
 * token — 1.23 against paper, the weight that exists to say "these are two
 * things" without drawing a box — and this is exactly the job it is for.
 *
 * ── AND WHY IT IS NOT ALWAYS THERE ────────────────────────────────────────
 * A screen at rest has nothing underneath the chrome, so a rule there would
 * be a header's rule: furniture, drawn for its own sake, on a product whose
 * whole argument is that the sky dissolves into paper. It fades in once the
 * page has actually moved and there is genuinely something behind the edge.
 *
 * `AppBar` established this exact behaviour and said so in its own comment —
 * "the hairline appears only once content has scrolled beneath the bar, so a
 * screen at rest has no chrome at all". Both now share `useScrolled` rather
 * than keeping two scroll listeners that could disagree.
 *
 * ── THE HEIGHT DOES NOT CHANGE ────────────────────────────────────────────
 * Tailwind sets `box-sizing: border-box`, so `h-7` is 28px INCLUDING the
 * border. The chrome's total stays exactly what the content's spacer
 * reserves, which is the invariant the shell's layout depends on.
 */
export function ChromeApron() {
  const scrolled = useScrolled();

  return (
    <div
      aria-hidden="true"
      className={cn(
        "h-7 border-b bg-surface-page md:h-9",
        "transition-colors duration-[--motion-micro]",
        scrolled ? "border-line-hairline" : "border-transparent",
      )}
    />
  );
}

import type { ReactNode } from "react";
import { ChromeApron } from "@/components/north/ChromeApron";
import { Masthead } from "@/components/north/Masthead";
import { ProductNav } from "@/components/north/ProductNav";
import { VoiceLauncher } from "@/components/north/VoiceLauncher";
import { cn } from "@/lib/cn";
import { Sky, SKY_HEIGHT } from "@/components/north/Sky";

/**
 * The product shell.
 *
 * A route group, so the URLs stay `/today`, `/decisions`, `/navigator`,
 * `/insights` — the grouping is structural only.
 *
 * Onboarding (`/start`) is deliberately outside it: a flow is entered once and
 * has no navigation out (docs/UX-ARCHITECTURE.md §1). Offering someone tabs
 * mid-conversation would invite them to wander off before North knows anything
 * about them. `/design` is outside it too — it is a project artifact, not a
 * product surface.
 *
 * The bottom padding through md clears the floating dock — phone AND tablet
 * carry it (a hand holds a tablet like a phone); from lg the bar sits in the
 * column and the padding is unnecessary.
 */

export default function ProductLayout({ children }: { children: ReactNode }) {
  return (
    <div className="relative min-h-dvh">
      {/* The coach's sky and the mark it carries are FIXED. They are the
          app's frame, not part of the page: on a device the brand sits still
          while the content moves under it, and a masthead that scrolls away
          reads as a web page's header rather than an app's chrome.

          Fixed rather than sticky because the sky has to paint edge to edge —
          a sticky element inside the padded column would carry the gutter with
          it and leave two pale strips down the sides at the top of the scroll.
          The spacer below reserves the same height in the flow, so content
          still starts on paper by construction.

          `SKY_HEIGHT` is shared by all three — sky, bar, spacer — so they
          cannot drift apart. */}
      <div className="pointer-events-none fixed inset-x-0 top-0 z-40">
        {/* `.atmosphere` is position:absolute, so it contributes NO flow
            height — this box supplies it. Without the box, anything placed
            after the sky stacks on top of it instead of below.

            ── THE SKY RUNS BEHIND THE STATUS BAR ────────────────────────────
            `paddingTop: var(--safe-top)` with `content-box`, so the box is
            inset + bar and `SKY_HEIGHT` still means the BAR. The sky is
            `h-full`, and a percentage height on an absolutely positioned
            child resolves against its containing block's PADDING box — so it
            covers the inset too, without a second measurement to keep in
            agreement.

            That is the difference between an app and a page in a frame. On
            hardware the app owns every pixel of the glass and the OS draws
            its clock over the app's own background; the ramp starts at the
            top of the screen. /preview used to fake this from outside by
            pushing the whole iframe down and painting the gap deep, which
            left the app laying its FULL ramp out below the status bar —
            spent before it cleared the masthead, and visibly steeper than the
            same screen on a phone. */}
        <div
          className={cn("relative", SKY_HEIGHT)}
          style={{ paddingTop: "var(--safe-top)", boxSizing: "content-box" }}
        >
          <Sky className="h-full" />
          {/* Below the inset, never under the clock. `inset-0` sets top:0;
              the inline `top` wins and pushes the row clear. */}
          <div
            className="absolute inset-0 px-4 md:px-6 lg:px-7"
            style={{ top: "var(--safe-top)" }}
          >
            <div className="pointer-events-auto mx-auto h-full w-full max-w-column">
              <Masthead />
            </div>
          </div>
        </div>

        {/* The apron — the chrome's own paper, below the sky.
            OPAQUE, for the whole of its height.

            ── WHY IT IS NOT A FADE ──────────────────────────────────────────
            It used to ramp paper → transparent, on the reasoning that a hard
            boundary CLIPPED content mid-glyph and a fade would let text
            "disappear instead of being cut". The reasoning was sound and the
            result was worse: a translucent band is a window. Scrolled text
            landed in the transparent half and sat there, legible, in the
            strip directly under the device's status bar — a whole line of the
            read ghosting above the masthead. Proved with a colour test: with
            the band tinted red, "You're holding 11 months of outgoings" was
            plainly readable through it.

            There is no third option here, and it is worth writing down so
            nobody re-derives the fade. This page scrolls the WINDOW, so a
            viewport-fixed veil is the only thing that can sit at a constant
            y — and a veil is either opaque (content is cut at its edge) or
            translucent (content shows through it). Fading the CONTENT instead
            does not work either: a `mask-image` on the scrolling column
            travels with the column, so the soft edge would ride down the page
            with the text rather than staying under the masthead. A fade
            demands an app-shell with its own scroll container, which is a
            different architecture and not one this page has.

            So: opaque, and content is cut at the apron's edge. That is what
            every app on the device does, and a clean cut on paper reads as
            text passing under the chrome — which is exactly what it is. The
            ghost read as a rendering fault, which is worse than an edge.

            Its height still matches the content's own top padding, so at rest
            the cut sits in the gap above the first line and touches nothing
            you are meant to read. */}
        <ChromeApron />
      </div>

      {/* Padding on the OUTER element, the measure inside it — the same
          nesting Arrival and the onboarding masthead use. Putting the padding
          on the max-width element instead shifts this column's left edge on
          wide viewports, which is what made the wordmark jump sideways when
          Arrival's travelling mark handed over to this screen. All three
          mastheads must resolve to one left edge. */}
      <div className="relative px-4 pb-28 md:px-6 lg:px-7 lg:pb-16">
        <div className="mx-auto w-full max-w-column">
          {/* One row of chrome: the mark, and where you are. The bar OCCUPIES
              the sky's exact height, so content lands on paper BY
              CONSTRUCTION rather than by a padding kept in agreement with it.

              That agreement is what broke once already: the nav used to sit in
              this flow at md and up, and moving it to the fixed rail lifted a
              screen's overline into the gradient, where ink on teal is
              invisible. A shared height makes that class of regression
              impossible.

              The nav is `fixed` in both postures — bottom dock, or the lg left
              rail — so it never takes part in this column's flow. */}
          {/* Reserves inset + bar, the same way the chrome above spends it —
              same padding, same `content-box`, so the two cannot drift. */}
          <div
            aria-hidden="true"
            className={SKY_HEIGHT}
            style={{ paddingTop: "var(--safe-top)", boxSizing: "content-box" }}
          />
          <ProductNav />
          {/* The floating way into voice mode — fixed like the nav, so it
              belongs to the shell rather than to any screen's flow. Renders
              nothing on desktop, without a profile, or where the browser
              cannot both hear and speak. */}
          <VoiceLauncher />
          {/* Matches the APRON's height exactly. That is the invariant the
              whole shell rests on: chrome = sky + apron, spacer = sky +
              this, so the first line lands precisely at the apron's edge and
              the cut has nothing to cut at rest. Change one of these three
              and you must change the other two. */}
          <div className="pt-7 md:pt-9">{children}</div>
        </div>
      </div>
    </div>
  );
}

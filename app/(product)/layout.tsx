import type { ReactNode } from "react";
import { Masthead, SKY_HEIGHT } from "@/components/north/Masthead";
import { ProductNav } from "@/components/north/ProductNav";
import { cn } from "@/lib/cn";
import { Sky } from "@/components/north/Sky";

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
            after the sky stacks on top of it instead of below. */}
        <div className={cn("relative", SKY_HEIGHT)}>
          <Sky className="h-full" />
          <div className="absolute inset-0 px-4 md:px-6 lg:px-7">
            <div className="pointer-events-auto mx-auto h-full w-full max-w-column">
              <Masthead />
            </div>
          </div>
        </div>

        {/* The dissolve. The sky's gradient ends in opaque paper, so content
            scrolling under it was CLIPPED mid-glyph at the boundary — half a
            line of serif hugging the wordmark's heel, which is what reads as
            content peeking through. A short paper-to-transparent fade lets
            text disappear instead of being cut.

            Its height matches the content's own top padding, so the fade sits
            entirely in the gap above the first line and never washes anything
            you are meant to read. */}
        <div
          aria-hidden="true"
          className="h-7 md:h-9"
          style={{
            // Solid paper for the first half, then out. A straight
            // paper→transparent ramp still let text ghost through its tail;
            // holding the colour first means the line is genuinely gone
            // before the gradient starts letting anything through.
            background:
              "linear-gradient(to bottom, var(--surface-page) 0%, var(--surface-page) 52%, transparent 100%)",
          }}
        />
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
          <div aria-hidden="true" className={SKY_HEIGHT} />
          <ProductNav />
          {/* Matches the dissolve's height exactly, so the fade lives entirely
              above the first line and never washes anything readable. */}
          <div className="pt-7 md:pt-9">{children}</div>
        </div>
      </div>
    </div>
  );
}

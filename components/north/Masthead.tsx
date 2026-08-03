import { Wordmark } from "@/components/nds";
import { cn } from "@/lib/cn";
import { VoiceLauncher } from "./VoiceLauncher";

/**
 * The app bar — the mark, and the way into voice mode.
 *
 * ── HOW IT GOT HERE ───────────────────────────────────────────────────────
 * The shell used to spend TWO rows on chrome: a band of sky holding a 13px
 * wordmark with 59px of nothing beneath it, then a gap, then each screen's
 * own overline. On an 812px phone that put the first real content at 184px —
 * 23% of the viewport gone before the coach said anything.
 *
 * The first fix moved each screen's name UP onto the wordmark's row. That
 * bought the space, but it put the name in the wrong place twice over: the
 * dock at the bottom already says which tab you are on, so the bar was
 * repeating it — and the two screens whose label carried real information
 * ("Today · JUL 28", the letter's date range) were keeping content out of the
 * content.
 *
 * So the labels went back into the page, where a letter puts its dateline, and
 * the bar kept only the thing that belongs to the app rather than the screen.
 * That test is also what later earned `VoiceLauncher` its place here: talking
 * to North is an app-level capability, not a property of whichever tab you
 * are on. It is the only thing allowed to join the mark, and only because it
 * passes the same test.
 * Content still starts at 84px, and each screen's `h1` is now what the screen
 * actually SAYS rather than what it is filed under.
 */

/**
 * The sky's height, and therefore the bar's.
 *
 * ONE constant used by both, because they are the same measurement. Splitting
 * them into a height and a matching padding is what let a screen's overline
 * drift onto the gradient when the nav moved out of the flow.
 */
export const SKY_HEIGHT = "h-16 md:h-20";

export function Masthead() {
  return (
    <div
      className={cn(
        "flex items-center justify-between text-text-on-deep",
        SKY_HEIGHT,
      )}
    >
      <Wordmark height={13} strokeWidth={2} />

      {/* The one thing allowed to join the mark here, and only because it is
          the same KIND of thing: something that belongs to the app rather
          than to whichever screen you are on. Voice mode is reachable from
          every product surface without a floating button hovering over the
          content — the shape docs/VOICE.md explicitly refuses. It renders
          nothing on desktop, and nothing before there is a profile. */}
      <VoiceLauncher />
    </div>
  );
}

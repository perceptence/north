import type { MouseEvent, ReactNode } from "react";
import { cn } from "@/lib/cn";

/**
 * Marks for quiet actions — drawn, not licensed.
 *
 * North has no icon library and will not gain one: every mark in the product
 * comes from the same hairline pen that draws the turn glyphs, the horizon
 * fan, and the wordmark's compass. Three shapes cover the quiet actions, and
 * a fourth would need an argument.
 *
 * They are 1.25 stroke on a 16 grid — a hair lighter than the nav glyphs,
 * because these sit beside `type-meta` text and must not outweigh it.
 */

function Mark({ children }: { children: ReactNode }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 16 16"
      className="size-4 shrink-0"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.25}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {children}
    </svg>
  );
}

/**
 * What's assumed — the asterisk. The footnote mark.
 *
 * Chosen in review (July 2026) over two in-world drawings (dashes-as-the-
 * confidence-rule, then a dome on dashed ground) that both required the
 * reader to already know the product's grammar. The asterisk is print's own
 * sign for "there is fine print behind this figure," and financial documents
 * taught everyone what it means long before this product existed. Editorial
 * register, instant read — and honest, because the disclosure it opens IS
 * the fine print.
 */
export function AssumedMark() {
  return (
    <Mark>
      <path d="M8 2.9 V13.1" />
      <path d="M3.6 5.45 L12.4 10.55" />
      <path d="M3.6 10.55 L12.4 5.45" />
    </Mark>
  );
}

/**
 * Name another — a signpost.
 *
 * Chosen in review (July 2026) over a bare plus. Naming a goal is putting up
 * the sign that says where next: a post, a plate pointing onward, the ground
 * it stands in. Says the product's verb — name a destination — rather than
 * the spreadsheet's verb, add a row.
 */
export function SignpostMark() {
  return (
    <Mark>
      <path d="M4.8 3.2 H10.6 L12.4 4.9 L10.6 6.6 H4.8 Z" />
      <path d="M8 6.6 V13.4" />
      <path d="M6 13.4 H10" />
    </Mark>
  );
}

/**
 * Adjust a goal — the signpost's plate, swung to a new bearing.
 *
 * Deliberately the same object as SignpostMark: naming a destination and
 * changing one are the same act, done once and done again. Here the post
 * carries a second, fainter plate behind the first — the bearing it used to
 * point at. It reads as "this sign can be re-pointed", not "delete and start
 * over", which is the difference the action itself exists to make.
 */
export function AdjustMark() {
  return (
    <Mark>
      <path d="M4.4 6.6 H10.2 L12 4.9 L10.2 3.2 H4.4 Z" />
      <path d="M8 6.6 V13.4" opacity="0.45" />
      <path d="M6 13.4 H10" opacity="0.45" />
      <path d="M8 9.2 H11.4" />
      <path d="M10.1 7.9 L11.4 9.2 L10.1 10.5" />
    </Mark>
  );
}

/**
 * Let a goal go — the wind. Carried off on the breeze.
 *
 * Chosen in review (July 2026), third round: two abstract in-world drawings
 * (a minus, then a dome lifting off the horizon) failed the 16px read, and
 * the literal objects (balloon, bird, kite) drew badly at this size. Gusts
 * curling away are legible at any size, kind rather than punitive — released
 * to the weather, not deleted — and the product's sky already owns the
 * weather.
 */
export function ReleaseMark() {
  return (
    <Mark>
      <path d="M2.6 5.8 H9.6 C11.4 5.8 11.4 3.2 9.6 3.2" />
      <path d="M2.6 8.8 H12 C13.8 8.8 13.8 11.4 12 11.4" />
      <path d="M2.6 12.4 H7.4" />
    </Mark>
  );
}

/**
 * The long view — the axis of years this opens onto.
 *
 * Ticks spreading further apart as they run right: time stretching out ahead.
 * The horizon field on Goals is a scrubbable timeline, and this is its axis —
 * so the mark is the thing the link goes to, not a second drawing of the
 * horizon that already sits directly above it.
 *
 * Chosen in review over four horizon variations (a far dome, receding rules, a
 * sightline, a telescope). The lesson worth keeping: when a mark sits beside
 * the graphic it describes, drawing that graphic again says nothing.
 */
export function HorizonMark() {
  return (
    <Mark>
      <path d="M2 11.4 H14" />
      <path d="M3 11.4 V8.6" />
      <path d="M6 11.4 V9.4" />
      <path d="M10 11.4 V9.4" />
      <path d="M14 11.4 V8.6" />
    </Mark>
  );
}

/**
 * The ledger — what you decided, and whether you held it.
 *
 * Entries of decreasing length with the last one settled. Chosen in review
 * over a bare tick: a tick alone says "done", which is a state, where this
 * says "a record of things, one of them held", which is the surface.
 */
export function LedgerMark() {
  return (
    <Mark>
      <path d="M2.4 4.4 H13.6" />
      <path d="M2.4 8 H9" />
      <path d="M2.4 11.6 H6.4" />
      <path d="M9.4 11.4 L11 13 L14 9.6" />
    </Mark>
  );
}

/**
 * The story — rewind.
 *
 * Playback, pointed at the past, which is exactly what this replays: the
 * letter, run back through a beat at a time. Chosen in review over a forward
 * play triangle, which said "watch something" without saying it was YOUR
 * record being wound back.
 */
export function StoryMark() {
  return (
    <Mark>
      <path d="M8.4 4 L3.4 8 L8.4 12 Z" />
      <path d="M13.4 4 L8.4 8 L13.4 12 Z" />
    </Mark>
  );
}

/** Back the way you came. */
export function BackMark() {
  return (
    <Mark>
      <path d="M13.4 8 H3.2" />
      <path d="M7 3.8 L2.8 8 L7 12.2" />
    </Mark>
  );
}

/**
 * Leave it for now — the door, ajar.
 *
 * Chosen in review (July 2026) over four alternatives: a compass ring with no
 * needle, a gate left unlatched, an unset map pin, three dots trailing off.
 * The pin borrowed a shape the product doesn't otherwise draw; the rest
 * needed the label beside them to confirm the reading. A door held ajar says
 * it alone — you can still step back out, and nothing on the other side has
 * changed while you were gone.
 */
export function AjarMark() {
  return (
    <Mark>
      <path d="M4.4 2.6 V13.4" />
      <path d="M4.4 2.6 L11.6 4 V12.4 L4.4 13.4" />
      <circle cx="9.4" cy="8.2" r="0.5" fill="currentColor" stroke="none" />
    </Mark>
  );
}

/**
 * Or borrow a story — the open book.
 *
 * Chosen in review (July 2026) over three alternatives: StoryMark's own
 * triangles mirrored to play forward, a small live window, a ticket stub.
 * Reads as "a story" more directly than any of them, at the cost of saying
 * less about "watch it work" — the half of the label it doesn't cover.
 *
 * The spine down the centre was a second pass: without it, the two leaf
 * curves shared an endpoint but drew no line there, and read as a pair of
 * parentheses rather than a binding.
 */
export function OpenBookMark() {
  return (
    <Mark>
      <path d="M8 3.2 V12.8" />
      <path d="M7.7 3.8 C6 2.9 3.8 2.9 2.4 3.6 V12.2 C3.8 11.5 6 11.5 7.7 12.4" />
      <path d="M8.3 3.8 C10 2.9 12.2 2.9 13.6 3.6 V12.2 C12.2 11.5 10 11.5 8.3 12.4" />
    </Mark>
  );
}

/**
 * North's spoken voice — the coach, speaking.
 *
 * Chosen in review (July 2026) over a hanging quote, a transcript's speaker
 * colon, and a written line lifting off the page. NOT a speaker cone and not
 * radiating arcs: the category's two most tired shapes, and neither drawn in
 * this product's hand.
 *
 * `CoachPresence`'s own dot — the mark that already means North is present —
 * with speech trailing off it. The voice is tied to the thing that already
 * represents the coach, rather than to a new object.
 *
 * The two rules are DELIBERATELY RAGGED and there are two of them, not
 * three. The candidate drawn for review had three near-even rules, which at
 * 16px read as a bullet followed by a hamburger — a list, not a voice.
 * Uneven lengths are what make it speech.
 *
 * It is a CATEGORY mark, not an action mark: it sits on both "Stop" and "Say
 * the numbers too", which are two controls governing one thing — whether and
 * how North is speaking.
 */
export function SpeakMark() {
  return (
    <Mark>
      <circle cx="3.2" cy="8" r="1.6" fill="currentColor" stroke="none" />
      <path d="M7.2 6.2 H13.6" />
      <path d="M7.2 9.8 H11.2" />
    </Mark>
  );
}

export interface ActionLinkProps {
  icon?: ReactNode;
  /**
   * Takes the click event — unlike a bare `() => void`, this lets a caller
   * call `stopPropagation()` when ActionLink sits inside a larger tap
   * target (StoryScreen's whole-screen advance is the one place that
   * matters today). Every existing caller ignores the argument and keeps
   * working unchanged; only callers that need it have to ask for it.
   */
  onClick: (event: MouseEvent<HTMLButtonElement>) => void;
  /**
   * For a tertiary action that TOGGLES rather than fires once.
   *
   * Sets `aria-pressed`, and while it is on the label rises to ink and drops
   * the dotted rule. That is not decoration either: the rule means *"there
   * is more behind this"*, and a control currently doing its job is
   * reporting a state, not offering a way in. Omitted entirely by every
   * one-shot caller, which is most of them.
   */
  pressed?: boolean;
  children: ReactNode;
  className?: string;
}

/**
 * THE tertiary action. One shape for every quiet thing you can do.
 *
 * ── THE PATTERN ───────────────────────────────────────────────────────────
 * A drawn mark, then the label, and the label carries a dotted rule in
 * `signal-coach`. Nothing else in the product looks like this, and everything
 * that behaves like this looks like this.
 *
 * The dotted rule is not decoration — it is the mark North already uses for
 * *"there is more behind this"*: an inferred `Figure` wears it, and so does
 * the rung indicator. Before this, tertiary actions were a scatter of bare
 * text buttons with trailing arrows in three different type sizes, and the
 * only way to know one was pressable was to try it.
 *
 * Buttons carry padding, so a `quiet` Button's label sits indented from the
 * content it belongs to and no negative margin fixes that honestly. This is
 * flush left by construction, and `hit-target` grows the touch area to 44px
 * without adding any visual box — the alignment stays true.
 *
 * **A trailing arrow is not part of this pattern.** The mark leads; an arrow
 * on the other end is a second icon saying the same thing.
 */
export function ActionLink({
  icon,
  onClick,
  pressed,
  children,
  className,
}: ActionLinkProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={pressed}
      className={cn(
        "type-meta hit-target inline-flex cursor-pointer items-center gap-2",
        // `w-fit`, NOT `self-start`. Both stop a flex COLUMN stretching this
        // to full width, which is all `self-start` was ever for — but
        // `self-start` does it by seizing cross-axis alignment, so in a flex
        // ROW it also overrode the parent's `items-center` and pinned the
        // label to the top of the line. Beside a taller pill (Account's
        // "Save" / "Never mind" pair) that read as plainly misaligned.
        // `w-fit` beats `align-self: stretch` on width alone and leaves
        // alignment to the parent, which is whose business it is.
        "w-fit rounded-full",
        "transition-colors duration-[--motion-micro]",
        pressed
          ? "text-text-primary"
          : "text-text-tertiary hover:text-text-secondary",
        className,
      )}
    >
      {icon}
      <span
        className={cn(
          !pressed &&
            "underline decoration-dotted decoration-signal-coach decoration-1 underline-offset-4",
        )}
      >
        {children}
      </span>
    </button>
  );
}

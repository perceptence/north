import { cn } from "@/lib/cn";

/**
 * Where you are on a route: answered, here, still to come.
 *
 * ── ONE ENCODING, BOTH ORIENTATIONS ───────────────────────────────────────
 * Onboarding drew this twice, in two different visual languages. The phone
 * strip used ten equal-width bars separated only by OPACITY; the desktop rail
 * used varying LENGTH plus three different colour tokens. Same information,
 * same product, same screen size away from each other — and a reader who
 * turned a tablet sideways watched the marks change vocabulary.
 *
 * There is one vocabulary now, and it is the richer of the two:
 *
 *   · **here** — long, and at full strength
 *   · **answered** — short, and half lit
 *   · **to come** — short, and barely there
 *
 * Length and weight both carry it, which matters twice over: it survives
 * being read at a glance in a masthead, and it does not rest on colour alone.
 *
 * ── WHY `bg-current` AND NOT A COLOUR TOKEN ───────────────────────────────
 * The strip sits on the sky and the rail sits on paper, so the two grounds
 * genuinely need different ink — that part was never the inconsistency. Marks
 * paint in `currentColor` and let the caller set it (`text-text-on-deep` over
 * the sky, `text-text-primary` over paper), so ONE definition serves both
 * without the component knowing anything about where it has been hung.
 *
 * ── AND WHY ONLY SOMETIMES A BUTTON ───────────────────────────────────────
 * `onJump` is optional, like `RungIndicator`'s `onInterrogate`. The rail has
 * room in a desktop margin to give every mark a real 44px target; a phone
 * masthead does not — ten of those is 440px of touch target in 375px of
 * screen. So the strip renders decorative, and going back there is the swipe,
 * which is the platform's own gesture and needs no target at all.
 */

export type RouteMarkState = "answered" | "current" | "toCome";

export interface RouteMark {
  id: string;
  /** Spoken name for this stop — used only when the marks are travellable. */
  label: string;
  state: RouteMarkState;
  /** A stop that has not been reached yet cannot be jumped to. */
  reachable?: boolean;
}

export interface RouteMarksProps {
  marks: RouteMark[];
  /** A strip across a masthead, or a rail down a margin. */
  direction?: "row" | "col";
  /** Makes each mark a way to travel there. Omit for a read-only strip. */
  onJump?: (id: string) => void;
  /** Names the navigation. Required whenever `onJump` is given. */
  label?: string;
  className?: string;
}

/**
 * The whole vocabulary, in one place.
 *
 * Hairlines, like every other data mark in the product — the horizon fan and
 * the rung ticks are drawn with the same pen.
 */
const TICK: Record<RouteMarkState, string> = {
  current: "h-[3px] w-6 opacity-100",
  answered: "h-[2px] w-3 opacity-55",
  toCome: "h-[2px] w-3 opacity-20",
};

/**
 * The gap is the one thing that varies, and it varies by AXIS, not by screen.
 *
 * A row of ten marks has a width budget — a phone masthead is 375px wide and
 * the marks were eating 266 of it — while a column of ten has a whole margin
 * of height to spend and goes limp if it is crowded. So the marks themselves
 * are one size everywhere (the vocabulary is what had to be unified) and only
 * the spacing answers to the direction it is laid out in.
 */
const GAP = { row: "gap-1", col: "gap-2.5" } as const;

function Tick({
  state,
  jumpable,
}: {
  state: RouteMarkState;
  jumpable: boolean;
}) {
  return (
    <span
      className={cn(
        "block rounded-full bg-current",
        "transition-all duration-[--motion-standard]",
        TICK[state],
        // Only where it can actually be travelled to: reaching for a mark
        // lengthens it toward what "here" looks like.
        jumpable &&
          state === "answered" &&
          "group-hover:w-4 group-hover:opacity-80",
      )}
    />
  );
}

export function RouteMarks({
  marks,
  direction = "row",
  onJump,
  label,
  className,
}: RouteMarksProps) {
  const layout = cn(
    "flex",
    GAP[direction],
    direction === "col" ? "flex-col items-start" : "items-center",
    className,
  );

  // Decorative: the information is already carried by the masthead's step
  // name and the "Question n of m" live region beside it, so repeating it
  // here would make a screen reader read the route twice.
  if (!onJump) {
    return (
      <div aria-hidden="true" className={layout}>
        {marks.map((mark) => (
          <Tick key={mark.id} state={mark.state} jumpable={false} />
        ))}
      </div>
    );
  }

  return (
    <nav aria-label={label} className={layout}>
      {marks.map((mark, index) => (
        <button
          key={mark.id}
          type="button"
          disabled={!mark.reachable}
          onClick={() => onJump(mark.id)}
          aria-current={mark.state === "current" ? "step" : undefined}
          aria-label={`Question ${index + 1}: ${mark.label}${
            mark.state === "answered"
              ? ", answered"
              : mark.state === "current"
                ? ", current"
                : ", to come"
          }`}
          // The tick is a hairline but the button is not — a 2px hit target
          // is a refusal-list violation wearing a nice outfit.
          className={cn(
            "group flex h-4 w-10 items-center",
            direction === "col" ? "justify-start" : "justify-center",
            mark.reachable && "cursor-pointer",
          )}
        >
          <Tick state={mark.state} jumpable={!!mark.reachable} />
        </button>
      ))}
    </nav>
  );
}

"use client";

import { useState, type ReactNode } from "react";
import Link from "next/link";
import {
  ChoiceChip,
  ChoiceChipGroup,
  Figure,
  HorizonBand,
  HorizonField,
  RungIndicator,
  Wordmark,
} from "@/components/nds";
import { DemoPanel, type Journey } from "@/components/north/DemoPanel";
import {
  DeviceFrame,
  SAFE_TOP,
  SCREEN,
  SHELL,
  type Device,
} from "@/components/north/DeviceFrame";
import { Sky } from "@/components/north/Sky";
import { TURN_GLYPH, TurnGlyph } from "@/components/north/TurnGlyph";
import type { TurnId } from "@/core/onboarding/script";
import { cn } from "@/lib/cn";

/**
 * /case-study — the work, argued in the product's own voice.
 *
 * A portfolio page, and deliberately a page OF the product rather than a
 * page ABOUT it: same tokens, same three faces, same components, and the
 * product itself standing in the hardware frames. Like /design and /preview
 * it sits outside the product's IA. Nothing in the app routes here.
 *
 * The page is an editorial FEATURE, not a spec sheet — the reason it stopped
 * borrowing /design's Section/Specimen grammar. The gallery documents parts
 * in labelled boxes; a case study composes spreads and argues decisions.
 *
 * ── ONE COLUMN, ONE EXCEPTION ─────────────────────────────────────────────
 * Every band on this page — credit, chapters, the device stage — is `COLUMN`.
 * It used to be a mix of max-w-5xl and max-w-4xl, so section left edges
 * stepped in and out down the scroll and the page read as assembled rather
 * than composed. The hero is the single exception and goes wider, which is
 * the one place a wider measure means something.
 *
 * ── THE HARDWARE APPEARS TWICE, WITH TWO JOBS ─────────────────────────────
 * The HERO pair is `inert`: a picture that happens to be rendered, so it can
 * never steal a scroll from someone reading the opening. The STAGE pair is
 * the interactive one, and it starts with NOTHING selected — see `journey`.
 */

/** The page's measure. Everything but the hero lives inside this. */
const COLUMN = "mx-auto w-full max-w-4xl px-6";

const VIEWPORT: Record<Device, { width: number; height: number }> = {
  phone: SCREEN.phone,
  tablet: { width: 642, height: 919 },
};

/** The splash, as a still — what a device shows before a journey is chosen. */
function IdleScreen({ device }: { device: Device }) {
  return (
    <div
      className="flex h-full w-full items-center justify-center text-text-on-deep"
      style={{
        backgroundImage:
          "radial-gradient(circle at 50% 50% in oklab, var(--sky-300) 0%, var(--sky-600) 42%, var(--sky-900) 82%)",
        backgroundColor: "var(--sky-900)",
      }}
    >
      <Wordmark height={device === "phone" ? 26 : 34} strokeWidth={1.5} />
    </div>
  );
}

function Frame({
  device = "phone",
  href,
  visit = 0,
  scale,
}: {
  device?: Device;
  /** `null` renders the splash still — no iframe, nothing loaded. */
  href: string | null;
  visit?: number;
  scale: number;
}) {
  const shell = SHELL[device];
  const screen = SCREEN[device];
  const viewport = VIEWPORT[device];
  const factor = screen.width / viewport.width;
  const inset = Math.round((SAFE_TOP[device] / factor) * 100) / 100;

  return (
    <div style={{ width: shell.width * scale, height: shell.height * scale }}>
      <div
        style={{
          width: shell.width,
          height: shell.height,
          transform: `scale(${scale})`,
          transformOrigin: "top left",
        }}
      >
        <DeviceFrame device={device}>
          {href === null ? (
            <IdleScreen device={device} />
          ) : (
            <iframe
              key={`${device}:${href}:${visit}`}
              src={`${href}${href.includes("?") ? "&" : "?"}inset=${inset}`}
              title={
                device === "phone" ? "North on a phone" : "North on a tablet"
              }
              loading="lazy"
              className="block border-0"
              style={{
                width: viewport.width,
                height: screen.height / factor,
                transform: `scale(${factor})`,
                transformOrigin: "top left",
                background: "var(--surface-deep)",
              }}
            />
          )}
        </DeviceFrame>
      </div>
    </div>
  );
}

/** Both devices, bottom-aligned like /preview's pair — one scale for both. */
function Pair({
  href,
  visit = 0,
  scale,
}: {
  href: string | null;
  visit?: number;
  scale: number;
}) {
  return (
    <div className="flex items-end" style={{ gap: 40 * scale }}>
      <Frame device="tablet" href={href} visit={visit} scale={scale} />
      <Frame device="phone" href={href} visit={visit} scale={scale} />
    </div>
  );
}

/** A chapter: kicker, a claim in the coach's voice, then the spread. */
function Chapter({
  id,
  kicker,
  title,
  lede,
  children,
}: {
  id: string;
  kicker: string;
  title: string;
  lede?: ReactNode;
  children?: ReactNode;
}) {
  return (
    // `pt-20` matches the parent's `gap-20`, so the rule sits centred between
    // the chapter it ends and the one it opens. At `pt-14` it was 80px above
    // and 56 below — the divider crowded the kicker it introduced, and after
    // a chapter ending in a list (the receipts) the imbalance was plain.
    <section
      id={id}
      className="scroll-mt-10 border-t border-line-hairline pt-20"
    >
      <p className="type-overline text-text-tertiary">{kicker}</p>
      <h2 className="type-voice-lg mt-4 max-w-2xl text-text-primary">
        {title}
      </h2>
      {/* A column, so a lede can run to several paragraphs and space them
          properly. It could not before — consecutive <p>s inside it sat flush,
          so prose that belonged together had to move into `children`, where
          the 3rem section gap then tore it apart mid-argument. */}
      {lede && (
        <div className="type-body measure mt-5 flex flex-col gap-4 text-text-secondary">
          {lede}
        </div>
      )}
      {children && (
        <div className="mt-12 flex flex-col gap-12">{children}</div>
      )}
    </section>
  );
}

/** A labelled block inside a chapter — an overline and room, no box. */
function Spread({
  label,
  caption,
  children,
}: {
  label: string;
  caption?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-5">
      <p className="type-overline text-text-tertiary">{label}</p>
      {children}
      {caption && (
        <p className="type-meta measure text-text-tertiary">{caption}</p>
      )}
    </div>
  );
}

/**
 * The ladder, drawn the way the product draws it (see LadderPanel).
 *
 * Position, never progress: the rung you are on gets the voice, the ones
 * behind go quiet in tertiary, the ones ahead sit disabled. Nothing
 * animates and nothing completes — a settled rung gets LESS ink, which is
 * the opposite of how a game would draw it.
 */
const CURRENT_RUNG = 3;

const RUNGS = [
  "Liquidity floor",
  "Employer match",
  "High-interest debt",
  "Tax-advantaged space",
  "Goal funding",
  "Surplus with nowhere to go",
  "Optimization",
];

function Ladder() {
  return (
    <ol className="measure flex flex-col">
      {RUNGS.map((label, index) => {
        const position = index + 1;
        const current = position === CURRENT_RUNG;
        const behind = position < CURRENT_RUNG;
        return (
          <li
            key={label}
            className="flex items-baseline gap-4 border-t border-line-hairline py-4 first:border-t-0"
          >
            <span
              className={cn(
                "type-figure w-6 shrink-0 tabular-nums",
                current ? "text-text-primary" : "text-text-tertiary",
              )}
            >
              {String(position).padStart(2, "0")}
            </span>
            <span
              className={cn(
                "flex-1",
                current
                  ? "type-voice-md text-text-primary"
                  : behind
                    ? "type-body text-text-tertiary"
                    : "type-body text-text-disabled",
              )}
            >
              {label}
            </span>
            <span className="type-meta shrink-0 text-text-tertiary">
              {current ? "you’re here" : behind ? "behind you" : ""}
            </span>
          </li>
        );
      })}
    </ol>
  );
}

/* What the role actually covered — the credit's substance. */
const SCOPE = [
  {
    area: "Strategy",
    detail:
      "The thesis, the audience and the anti-users, the pricing principle, and the scope discipline that cut the chart every competitor ships.",
  },
  {
    area: "Identity & visual system",
    detail:
      "The compass wordmark, three typefaces with three jobs, three color families, and a two-tier token architecture that components cannot bypass.",
  },
  {
    area: "Product & interaction design",
    detail:
      "Four destinations, one decision card, onboarding as a spoken conversation, the derivation overlay, and a full-screen voice mode.",
  },
  {
    area: "Engineering direction",
    detail:
      "Held the standard through implementation: every screen reviewed in the browser and settled by measurement rather than opinion, so the design did not quietly degrade on its way to the shipped product.",
  },
];

/**
 * Three reversals, each verified against the commit or document that records
 * it before it was written here. Every figure below is quoted from that
 * source rather than recalled: the refusal rates and the review tallies are
 * in the commit messages, and the voice rule is quoted from docs/VOICE.md,
 * which still carries the sentence it reversed.
 */
const REVERSALS = [
  {
    area: "The coach's router",
    believed:
      "Recognise the questions I planned for and refuse the rest. For a product that must never answer a markets question, refusing by default felt like the safe posture.",
    changed:
      "Measured against 31 ordinary phrasings, it refused 12 of the 29 it could actually answer (41%), and every form of “what can you do” was among them, so most people would have met a refusal as North’s first answer. Widening the term lists took that to 2 of 31, which looked like a fix. Then a second survey, written blind against the new lists, refused 25 of 29. The lists were never the problem; the polarity was. Refusing on the absence of recognition had made those lists responsible for enumerating every way a human might phrase a question, and no list can do that.",
    cost: "Inverting it, so that it refuses only on positive evidence of a subject North does not cover, makes the refusal list the one list that must be complete. An adversarial review then found it wrong in both directions at once: 36 findings raised, 24 confirmed.",
  },
  {
    area: "A fifth destination",
    believed:
      "The spoken coach would be its own surface: “Read this to me”, a narrator for the page you were on.",
    changed:
      "A one-sentence review: a page narrator is not a coach. The product’s own voice document had already said so on its first page (North is a conversation, it just happens to be typed), and I had written that sentence myself without applying it.",
    cost: "The planned fifth tab was cancelled and folded into Navigator, which had always been the “what would you like to think through?” surface. The dock stayed capped at four.",
  },
  {
    area: "A rule I had written down",
    believed:
      "Voice is never a mode, with no state you enter and have to leave. The rule existed to stop North disclosing your balance to a room you had not chosen.",
    changed:
      "A full-screen mode you deliberately enter, obviously occupy and leave with one tap serves that reason better than ambient speech does. Nothing can begin by surprise, and the exposure is bounded by a surface you can see you are in.",
    cost: "The letter of the rule is reversed and its purpose is intact, which is the only kind of reversal worth making. The two rules underneath it were left untouched, so the typed conversation remains the visible twin and nothing is ever voice-only.",
  },
];

/* Real commit messages, verbatim from `git log`. */
const RECEIPTS = [
  {
    line: "Stop refusing questions the engine can answer",
    note: "The coach's router had its default inverted. A gatekeeper became a partner.",
  },
  {
    line: "Spacing: a gap belongs to the weaker relationship it separates",
    note: "One rule replaced eight ad-hoc gap values across the app.",
  },
  {
    line: "The rose was orbiting a pivot 70 units to its left",
    note: "A splash bug diagnosed by reading the live DOM, not by guessing.",
  },
  {
    line: "Both lines identified by toggle, and both were mine",
    note: "Two rendering artifacts isolated in the browser, and owned.",
  },
  {
    line: "Every mark sits on its line by construction, not by a number",
    note: "Three hand-tuned pixel nudges retired by one primitive measured in line-heights.",
  },
];

/**
 * Product scope first, then evidence of quality — a reader scanning this row
 * is looking for how much was owned before they look for how well it was done.
 *
 * Every figure is counted from the repository, not estimated: nine screens is
 * six product destinations plus arrival, onboarding and the story replay
 * (`/design`, `/demo`, `/preview` and this page are excluded — they are not
 * product surfaces). Twenty-five is `components/nds/*.tsx` minus
 * `MotionProvider`, which is infrastructure rather than a component.
 *
 * Commits and elapsed days used to sit here and were cut: they measure the
 * repository rather than the product, and one of them ("14 days") could not
 * be derived from anything at all.
 */
const STATS = [
  { value: "9", label: "product screens" },
  { value: "25", label: "design-system components" },
  { value: "602", label: "tests, none failing" },
];

const COLOR_PANELS: Array<{
  family: string;
  role: string;
  bands: Array<{ token: string; label: string; dark?: boolean }>;
}> = [
  {
    family: "Ground",
    role: "Warm paper, four steps of it",
    bands: [
      { token: "--paper-0", label: "paper-0" },
      { token: "--paper-50", label: "paper-50" },
      { token: "--paper-100", label: "paper-100" },
      { token: "--paper-200", label: "paper-200" },
    ],
  },
  {
    family: "Ink",
    role: "All text, and the primary action",
    bands: [
      { token: "--ink-900", label: "ink-900", dark: true },
      { token: "--ink-800", label: "ink-800", dark: true },
      { token: "--ink-600", label: "ink-600", dark: true },
      { token: "--ink-500", label: "ink-500", dark: true },
    ],
  },
  {
    family: "Signal",
    role: "At most one element per viewport",
    bands: [
      { token: "--indigo-600", label: "indigo-600 · the coach", dark: true },
      { token: "--clay-600", label: "clay-600 · attention", dark: true },
    ],
  },
];

export function CaseStudy() {
  const [glyphTurn, setGlyphTurn] = useState<TurnId>("openingConcern");
  /** Horizon year, in months — the field below is a real slider. */
  const [months, setMonths] = useState(300);
  /**
   * NOTHING is selected at rest, and that is the fix for a real bug.
   *
   * This used to default to the first journey, so the stage booted an iframe
   * while it was still far below the fold. A lazily-loaded frame that loads
   * offscreen has its animation frames throttled, so the app's splash never
   * finished — the reveal sat on the wordmark forever, and the only way to
   * reach it was to pick another journey and come back. Loading nothing until
   * a reader asks removes the failure entirely and turns a broken default
   * into an invitation.
   */
  const [journey, setJourney] = useState<Journey | null>(null);
  const [visit, setVisit] = useState(0);

  const go = (next: Journey) => {
    setJourney(next);
    setVisit((n) => n + 1);
  };

  return (
    <div className="min-h-dvh bg-surface-page">
      {/* ── THE HERO — the full glass, and a picture of the hardware ────── */}
      <header className="relative flex overflow-hidden lg:min-h-dvh">
        <Sky className="h-full" />
        {/* max-w-7xl, not 6xl: the hero is the page's one wide exception, and
            the devices are the argument — at 6xl the text column left them
            barely 480px to stand in. */}
        <div className="relative mx-auto flex w-full max-w-7xl flex-col justify-center gap-12 px-6 pt-16 pb-16 lg:flex-row lg:items-center lg:justify-between lg:py-20">
          <div className="flex max-w-xl flex-col items-start">
            <p className="type-overline text-text-on-deep-dim">
              A design case study
            </p>
            <div className="mt-5 text-text-on-deep">
              <Wordmark height={26} strokeWidth={1.6} />
            </div>
            <h1 className="type-voice-lg mt-8 text-text-on-deep">
              Everyone else shows you where your money went. North tells you
              where you&rsquo;re going.
            </h1>
            {/* Sells the PRODUCT, not the page. This used to list the case
                study's own contents (thesis, engine, system, discipline),
                which is a table of contents standing where the pitch should
                be. The value proposition is the judgment itself, and the
                product's own strategy prices it: $3,000 to $8,000 a year,
                behind a $250k minimum. */}
            <p className="type-body mt-5 text-text-on-deep-dim">
              The judgment a financial advisor sells for thousands a year: do
              this, not that, and here is why, for you, this month. North
              reads your whole picture, surfaces the one decision that matters
              now, and checks back on what you decided.
            </p>
            <div className="mt-8">
              <Link
                href="/preview"
                className="type-label rounded-full bg-text-on-deep px-6 py-3 text-surface-deep transition-opacity duration-[--motion-micro] hover:opacity-90"
              >
                Try it yourself
              </Link>
            </div>
          </div>
          {/* The hardware carries the hero, so it is sized to the room the
              layout actually leaves rather than to a timid constant. At lg
              the pair takes the 7xl container's remainder beside a 576px
              text column; below lg it bleeds through the page gutter with
              `-mx-6` to use the full glass, since 48px of padding on a phone
              is the difference between a device you can read and a thumbnail. */}
          <div inert aria-hidden="true" className="hidden shrink-0 lg:block">
            <Pair href="/demo?at=reveal" scale={0.44} />
          </div>
          <div
            inert
            aria-hidden="true"
            className="-mx-6 flex justify-center lg:hidden"
          >
            <Pair href="/demo?at=reveal" scale={0.28} />
          </div>
        </div>
      </header>

      {/* ── THE CREDIT — who did this, and what the role covered ─────────── */}
      <div className="bg-surface-sunken">
        <div className={cn(COLUMN, "flex flex-col items-start py-14")}>
          <p className="type-overline text-text-tertiary">The work of</p>
          <h2 className="type-voice-lg mt-3 text-text-primary">
            Tanmay Jain, Design Director
          </h2>
          {/* ── THE AI, STATED ONCE, WITH ITS CONSEQUENCE ─────────────────
              This used to say "directed an AI engineering partner" in three
              places, which made the tool the page's collaboration THEME and
              invited the two worst readings: that the author has not worked
              with people, or that the machine did the work. Hiding it would
              be a lie about who wrote the code, and the repository is public
              anyway. So it is stated once, plainly, with the reason it is an
              advantage attached — a method that explains the scope, rather
              than a colleague competing with team experience. The receipts
              and the reversals do the rest of the arguing. */}
          <p className="type-body measure mt-4 text-text-secondary">
            North is a solo-directed product. One person set the strategy,
            drew the identity, designed every screen, and held the standard
            through implementation. Every judgment on this page was made
            here: what shipped, what was cut, what is never for sale. The
            record of it is public in the repository. The build was
            executed with an AI engineering partner working under that
            direction, which is the reason nine finished surfaces exist here
            rather than three sketches.
          </p>
          {/* The scope, stated as the bar it was built to rather than as a
              caveat about what it lacks. The project's own strategy defines
              success this way, so this is the brief being reported, not a
              disclaimer being softened — and it answers "did this ship to
              users?" before a reader has to wonder. */}
          <p className="type-body measure mt-4 text-text-secondary">
            It is a complete, working system rather than a prototype:
            deployed, and open to anyone with the link. Its own strategy set
            the bar: that a reader understands the thinking quickly and wants
            to use the thing, rather than that an adoption curve looks good.
            Every decision here was made against that.
          </p>
          <div className="mt-10 grid w-full grid-cols-1 gap-x-10 gap-y-7 md:grid-cols-2">
            {SCOPE.map((item) => (
              <div key={item.area} className="flex flex-col gap-1.5">
                <p className="type-label text-text-primary">{item.area}</p>
                <p className="type-meta text-text-secondary">{item.detail}</p>
              </div>
            ))}
          </div>
          <dl className="mt-11 flex w-full flex-wrap gap-x-12 gap-y-6 border-t border-line-hairline pt-8">
            {STATS.map((stat) => (
              <div key={stat.label} className="flex flex-col gap-1">
                <dd className="type-voice-md text-text-primary">
                  {stat.value}
                </dd>
                <dt className="type-overline text-text-tertiary">
                  {stat.label}
                </dt>
              </div>
            ))}
          </dl>
        </div>
      </div>

      <main>
        <div className={cn(COLUMN, "flex flex-col gap-20 pt-20 pb-20")}>
          <Chapter
            id="problem"
            kicker="01 · The problem"
            title="Judgment is the scarce thing."
            lede={
              <>
                <p>
                  Financial information is free now. Judgment is not. The part
                  of an advisor&rsquo;s job that says{" "}
                  <em className="text-text-primary">
                    this, not that, and here&rsquo;s why, for you, this month
                  </em>{" "}
                  still costs $3,000 to $8,000 a year, and most firms will not
                  take a client below $250k in assets. Everyone under that
                  line gets generic advice or none.
                </p>
                <p>
                  North&rsquo;s bet is that the judgment layer becomes
                  software, and that the difference between this and every
                  competitor is <em>where</em> the intelligence sits.
                </p>
              </>
            }
          >
            <blockquote className="border-l-2 border-signal-coach pl-6">
              <p className="type-voice-md max-w-2xl text-text-primary">
                Every competitor puts the AI in the conversation layer. North
                puts it in the judgment layer.
              </p>
            </blockquote>
            <div className="measure grid grid-cols-1 gap-8 md:grid-cols-2">
              <div>
                <p className="type-overline text-text-tertiary">Built for</p>
                <ul className="mt-3 flex flex-col gap-3">
                  <li className="type-body text-text-secondary">
                    <span className="text-text-primary">
                      The unadvised earner.
                    </span>{" "}
                    Strong income, no advisor, idle cash in checking.
                  </li>
                  <li className="type-body text-text-secondary">
                    <span className="text-text-primary">
                      Everyone, unasked.
                    </span>{" "}
                    There is no persona picker. Deriving the situation is the
                    coach&rsquo;s job, not the user&rsquo;s.
                  </li>
                </ul>
              </div>
              <div>
                <p className="type-overline text-text-tertiary">
                  Deliberately not for
                </p>
                <ul className="mt-3 flex flex-col gap-3">
                  <li className="type-body text-text-secondary">
                    <span className="text-text-primary">
                      Acute financial distress.
                    </span>{" "}
                    The honest answer there is a nonprofit credit counselor.
                  </li>
                  <li className="type-body text-text-secondary">
                    <span className="text-text-primary">
                      The $40 grocery optimizer.
                    </span>{" "}
                    That is YNAB&rsquo;s job, done well, by YNAB.
                  </li>
                </ul>
              </div>
            </div>

            {/* The load-bearing assumption, named. Stating it is not a
                concession — an unnamed assumption is the one that takes a
                product down, and the first question any reviewer asks of the
                audience claims above is "how do you know?". The honest answer
                is written here rather than left for them to ask. */}
            {/* No caption. It restated in small grey type what the body had
                just said in full, and a point made twice reads as a point
                being defended. The body still says plainly that the
                assumption is unvalidated, so nothing honest was lost. */}
            <Spread label="The assumption everything rests on">
              <div className="measure flex flex-col gap-4">
                <p className="type-voice-md text-text-primary">
                  That judgment, not information, is the thing this person
                  actually feels the absence of.
                </p>
                <p className="type-body text-text-secondary">
                  Every audience claim on this page depends on it, and it is
                  unvalidated. North has been tested against its own engine
                  and against 31 real phrasings of the questions people ask a
                  coach; it has not been put in front of the person it was
                  built for.
                </p>
                <p className="type-body text-text-secondary">
                  The study that would settle it is small and I would run it
                  first: six to eight people in the segment, shown their own
                  idle cash, asked what they would want next. The distinction
                  that matters is whether they say{" "}
                  <em className="text-text-primary">
                    I don&rsquo;t know what to do with it
                  </em>{" "}
                  or{" "}
                  <em className="text-text-primary">
                    I know, and I haven&rsquo;t
                  </em>
                  . If it is the second, the thesis is wrong in a specific and
                  useful way: the scarce thing would be follow-through rather
                  than judgment, and North would need to become a different
                  product rather than a better one.
                </p>
              </div>
            </Spread>
          </Chapter>

          <Chapter
            id="engine"
            kicker="02 · The engine"
            title="Seven rules, in order, for everyone."
            lede={
              <>
                <p>
                  How do you serve everyone without asking who they are? A
                  waterfall: seven rules in a fixed order, checked against
                  what a person actually told the coach. The first rule they
                  do not yet satisfy is the one thing North raises today.
                </p>
                <p>
                  So a surgeon and a teacher in the same situation get the
                  same read, and nobody is ever asked to pick a category for
                  themselves. Here is that ladder as the product draws it:
                  what is behind you goes quiet, what is ahead stays dim.
                </p>
              </>
            }
          >
            <Spread
              label="The ladder, and where this person stands"
              caption="Position, never progress. A settled rung gets less ink rather than more, the opposite of how a game would draw it. Nothing animates, nothing celebrates, and the order never re-sorts."
            >
              <div className="flex flex-col gap-6">
                <RungIndicator rung={CURRENT_RUNG} label="high-interest debt" />
                <Ladder />
              </div>
            </Spread>

            <Spread
              label="Why there is no persona picker"
              caption="Both are one line of code. The difference is who does the thinking: the reader, or the coach."
            >
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                <div className="flex flex-col gap-4 rounded-card border border-line-hairline p-6">
                  <p className="type-overline text-text-tertiary">
                    The usual way, rejected
                  </p>
                  <pre className="type-figure overflow-x-auto text-text-secondary">
                    {"if (persona === \"young_professional\")"}
                  </pre>
                  <p className="type-body text-text-primary">
                    Sort each person into a bucket, then write separate advice
                    for every bucket.
                  </p>
                  <ul className="flex flex-col gap-2">
                    {[
                      "The reader has to classify themselves, which is the coach's job, handed back to them.",
                      "Four buckets means four sets of advice to write, and to keep true forever.",
                      "Anyone between labels gets advice written for somebody else.",
                    ].map((line) => (
                      <li key={line} className="type-meta text-text-secondary">
                        {line}
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="flex flex-col gap-4 rounded-card border border-line-hairline bg-surface-raised p-6">
                  <p className="type-overline text-signal-coach">
                    What North does
                  </p>
                  <pre className="type-figure overflow-x-auto text-text-primary">
                    {"waterfall.firstUnsatisfied(profile)"}
                  </pre>
                  <p className="type-body text-text-primary">
                    Walk one ordered list of seven rules against what this
                    person actually told the coach, and stop at the first rule
                    they do not yet meet.
                  </p>
                  <ul className="flex flex-col gap-2">
                    {[
                      "Nobody is asked to name their category: the profile is built from real answers.",
                      "One list, written once. There is no second copy to keep in agreement.",
                      "A situation nobody anticipated still lands on a sensible rung, because the rules are about the situation rather than the label.",
                    ].map((line) => (
                      <li key={line} className="type-meta text-text-secondary">
                        {line}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </Spread>

            <p className="type-body measure text-text-secondary">
              {/* Not "cannot fail during a demo". That was the engineering
                  note's framing, and it quietly tells the reader they are
                  looking at a demo rather than a product. The consequences
                  that matter to a person using it are stronger anyway, and
                  all three are true of a model-free answer path. */}
              The engine is pure TypeScript with no model call anywhere in the
              path to an answer. The same situation always produces the same
              read, no figure can be invented, and no answer depends on a
              service being available. The rule is held by a test titled{" "}
              <code className="type-figure text-text-primary">
                &ldquo;income does not determine the rung&rdquo;
              </code>
              . A $400k earner and a $60k earner land on the same rung when
              their situations match.
            </p>
          </Chapter>

          <Chapter
            id="system"
            kicker="03 · The system"
            title="Restraint is the premium signal."
            lede={
              <>
                <p>
                  The register is an editorial magazine, not a trading
                  terminal. Light pages, warm neutrals, a serif doing the
                  talking. The sharpest decision is that the primary action is
                  ink rather than a colored button, which sidesteps
                  fintech&rsquo;s entire vocabulary of trust-blue and
                  growth-green.
                </p>
                <p>
                  It reads as print, and print is the most expensive thing a
                  screen can do.
                </p>
              </>
            }
          >
            <Spread
              label="The mark"
              caption="NORTH in the product's own hairline hand, with the O a working compass. Its needle's north point is the one filled shape in the entire identity."
            >
              <div className="text-text-primary">
                <Wordmark height={56} />
              </div>
            </Spread>

            <Spread
              label="Three faces, three jobs, each at its working size"
              caption="The serif is the coach thinking, and it is always the largest voice on a screen. The sans is the interface staying out of the way, so it is shown at interface size. The mono is the machine computing."
            >
              <div className="flex flex-col">
                <div className="border-t border-line-hairline py-6">
                  <p className="type-overline text-text-tertiary">
                    Newsreader · the voice
                  </p>
                  <p className="type-voice-lg mt-3 max-w-2xl text-text-primary">
                    Your $140,000 in cash is the problem, not the win.
                  </p>
                </div>
                <div className="border-t border-line-hairline py-6">
                  <p className="type-overline text-text-tertiary">
                    Geist · the interface
                  </p>
                  <p className="type-body mt-3 text-text-primary">
                    Move the excess into tax-advantaged space
                  </p>
                </div>
                <div className="border-t border-b border-line-hairline py-6">
                  <p className="type-overline text-text-tertiary">
                    Geist Mono · the figures
                  </p>
                  <p className="type-figure mt-3 text-text-primary">
                    $578K – $1.5M · 4 of 7 · 25 years
                  </p>
                </div>
              </div>
            </Spread>

            <Spread
              label="Three color families, and no more"
              caption="Amounts are never colored and direction is a glyph, so the palette is colorblind-safe by construction rather than by remediation."
            >
              <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
                {COLOR_PANELS.map((panel) => (
                  <div key={panel.family} className="flex flex-col gap-3">
                    <div>
                      <p className="type-label text-text-primary">
                        {panel.family}
                      </p>
                      <p className="type-meta text-text-tertiary">
                        {panel.role}
                      </p>
                    </div>
                    <div className="overflow-hidden rounded-card border border-line-hairline">
                      {panel.bands.map((band) => (
                        <div
                          key={band.token}
                          className="flex h-14 items-center px-4"
                          style={{ background: `var(${band.token})` }}
                        >
                          <span
                            className={cn(
                              "type-figure",
                              band.dark
                                ? "text-text-inverse"
                                : "text-text-secondary",
                            )}
                          >
                            {band.label}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </Spread>

            <Spread
              label="Every number carries its confidence"
              caption="Stated, inferred, or assumed: each renders differently, and a screen reader hears the same distinction. No other personal-finance product does this."
            >
              <p className="type-voice-md max-w-2xl text-text-primary">
                You hold{" "}
                <Figure
                  value={4_000_000}
                  format="currency"
                  confidence="stated"
                  label="in checking"
                />{" "}
                in checking, about{" "}
                <Figure
                  value={11}
                  format="duration"
                  confidence="inferred"
                  label="of expenses"
                />{" "}
                of expenses, growing at{" "}
                <Figure
                  value={600}
                  format="percent"
                  confidence="assumed"
                  label="annual return"
                />{" "}
                a year.
              </p>
            </Spread>

            {/* ── THE ONE VISUALIZATION ───────────────────────────────────
                MVP holds exactly one chart, and calling it a chart overstates
                it: no axes, no gridlines, no legend, no tooltip. Both pieces
                below are the product's real components, not drawings of them,
                and the field is a genuine slider. */}
            <Spread
              label="The width is the uncertainty"
              caption="Two projections sharing one domain. The top is a confident profile; the bottom is the same projection with less known about the person. You can see that North knows less without reading a word, which is the whole argument for a range over a single number."
            >
              <div className="measure flex flex-col gap-8">
                <HorizonBand
                  low={140_000_000}
                  high={165_000_000}
                  confidence="inferred"
                  horizon="by 65"
                  domainMax={220_000_000}
                />
                <HorizonBand
                  low={95_000_000}
                  high={205_000_000}
                  confidence="assumed"
                  horizon="by 65"
                  domainMax={220_000_000}
                />
              </div>
            </Spread>

            <Spread
              label="The horizon field: drag it"
              caption="The large-format sibling, for when the projection is the subject. The in-band bars breathe on a slow stagger, because uncertainty is alive. Drag the field, or focus it and use the arrow keys, to move the horizon year under the cursor."
            >
              <HorizonField
                low={57_800_000}
                high={150_000_000}
                central={93_800_000}
                confidence="assumed"
                months={months}
                onScrub={setMonths}
                scrubMin={60}
                scrubMax={480}
                height={132}
              />
            </Spread>

            <Spread
              label="One drawing, six strokes"
              caption="Every figure of the onboarding glyph interpolates into every other: the component is mounted once and fed new ids, because keying it on the turn would remount, and a remount is a swap rather than a morph. Pick one and watch."
            >
              <div className="flex flex-col gap-6">
                <TurnGlyph
                  turnId={glyphTurn}
                  className="h-28 w-[168px] text-text-secondary"
                />
                <ChoiceChipGroup label="Figure">
                  {(Object.keys(TURN_GLYPH) as TurnId[])
                    .slice(0, 8)
                    .map((id) => (
                      <ChoiceChip
                        key={id}
                        selected={glyphTurn === id}
                        onSelect={() => setGlyphTurn(id)}
                      >
                        {TURN_GLYPH[id].name}
                      </ChoiceChip>
                    ))}
                </ChoiceChipGroup>
              </div>
            </Spread>

            {/* The six demonstrations above each state a position; nothing
                said what they collectively argue. One line does it, rather
                than a "Principles" section restating them as bullets. */}
            <p className="type-body measure text-text-secondary">
              Six pieces, one argument: not one of them is a style choice.
              Each is a rule the product cannot get around: a mark that may
              not be redrawn, a face that appears at one job only, a number
              that cannot reach the screen without stating how well it is
              known. A system is what still holds when the person who set it
              is not in the room.
            </p>

            {/* The handover argument, said out loud. Every artifact named
                here already existed; none of them was ever claimed as what
                it actually is — the apparatus of designing for a team that
                did not exist yet. This is the closest honest proxy for
                management thinking a solo project can offer. */}
            <p className="type-body measure text-text-secondary">
              Which is why the system is enforced rather than documented. The
              token layer is built so a component{" "}
              <em className="text-text-primary">cannot</em> reach past it to a
              raw colour. The principles are pinned by tests that fail the
              build, not by a page asking people to remember. The gallery at{" "}
              <Link
                href="/design"
                className="underline decoration-dotted underline-offset-4 hover:text-text-primary"
              >
                /design
              </Link>{" "}
              measures its own contrast in the browser, so it cannot quietly
              go stale, and ten decision documents record why each rule exists,
              because a rule whose reason is lost is the first one someone
              breaks. None of that was necessary for one person. It is what I
              build so that a team can move without me, and it is the part of
              this work that would transfer on day one.
            </p>
          </Chapter>
        </div>

        {/* ── 04 · THE SCREENS — the one place the hardware is live ──────── */}
        <section id="screens" className="bg-surface-deep">
          <div className={cn(COLUMN, "flex flex-col gap-10 py-16")}>
            <div className="flex flex-col items-start">
              <p className="type-overline text-text-on-deep-dim">
                04 · The screens: live, not screenshots
              </p>
              <h2 className="type-voice-lg mt-4 text-text-on-deep">
                Pick a moment. The product runs, right here.
              </h2>
              <p className="type-body measure mt-4 text-text-on-deep-dim">
                Both devices are the real app, seeded with nine months of
                story. Scroll the read, open a derivation, hold a decision.
                Choose a journey to begin; pressing the one you are on resets
                it.
              </p>
            </div>
            <div className="flex flex-col items-center gap-8">
              <DemoPanel active={journey?.id ?? ""} onGo={go} />
              {journey === null && (
                <p className="type-meta text-text-on-deep-dim">
                  Nothing is running yet. Choose a journey above.
                </p>
              )}
              <div className="hidden lg:block">
                <Pair
                  href={journey?.href ?? null}
                  visit={visit}
                  scale={0.56}
                />
              </div>
              <div className="lg:hidden">
                <Frame
                  href={journey?.href ?? null}
                  visit={visit}
                  scale={0.78}
                />
              </div>
            </div>
          </div>
        </section>

        <div className={cn(COLUMN, "flex flex-col gap-20 pt-20 pb-24")}>
          <Chapter
            id="calls"
            kicker="05 · The calls"
            title="What was cut, and what is never for sale."
            lede={
              <>
                <p>
                  The MVP is not the list of good ideas. It is the shortest
                  path to the thesis being undeniable, and anything that does
                  not shorten that path waits, however good it is.
                </p>
                <p>
                  Trajectory, the standalone charting surface every competitor
                  ships, was the most expensive item in the original scope and
                  the least load-bearing. It was cut. What survives is the
                  horizon fan under the day&rsquo;s decision, where a range
                  makes the choice in front of you feel consequential. That{" "}
                  <span className="text-text-primary">
                    makes it the rare cut that also improved the product
                  </span>
                  , since a projection isolated in its own tab is divorced
                  from the thing that moves it. Free-form chat was cut for a
                  different reason:{" "}
                  <em className="text-text-primary">
                    omitting it is a positioning statement.
                  </em>
                </p>
                <p>
                  Membership follows one principle:{" "}
                  <span className="text-text-primary">
                    the coach&rsquo;s judgment is never paywalled; its time
                    is.
                  </span>{" "}
                  Free carries the entire decide, track, check-back loop. Plus
                  buys room to think: more scenarios, the spoken conversation,
                  every goal instead of the first.
                </p>
              </>
            }
          >
            <Spread
              label="The ethics pin is a test, not a policy"
              caption="A principle in a document is a hope. A principle in the test suite is a constraint: it cannot be quietly walked back, because walking it back stops the build."
            >
              <div className="measure flex flex-col gap-5">
                <pre className="type-figure overflow-x-auto rounded-card border border-line-hairline bg-surface-sunken p-5 text-text-secondary">
                  {"assert.ok(FREE_SCENARIOS.has(\"debt-first\"),\n  "}
                  <span className="text-signal-attention">
                    {"\"the copy just became a lie\""}
                  </span>
                  {")"}
                </pre>
                <p className="type-body text-text-primary">
                  It reads: <em>the free tier must always contain this one
                  scenario.</em> Should anyone ever move it behind the paywall,
                  the test fails and the change cannot ship.
                </p>
                <dl className="flex flex-col gap-3">
                  {[
                    {
                      term: "FREE_SCENARIOS",
                      def: "The set of what-ifs a free member can open.",
                    },
                    {
                      term: "\"debt-first\"",
                      def: "The scenario that tells you to stop losing money to high-interest debt, and the single most valuable thing North can say to the person who needs it most.",
                    },
                    {
                      term: "\"the copy just became a lie\"",
                      def: "What prints when the check fails. The product's own promise says the judgment is never paywalled; moving this scenario would make that sentence false, so whoever broke it reads the reason rather than a line number.",
                    },
                  ].map((row) => (
                    <div key={row.term} className="flex flex-col gap-1">
                      <dt className="type-figure text-text-primary">
                        {row.term}
                      </dt>
                      <dd className="type-meta text-text-secondary">
                        {row.def}
                      </dd>
                    </div>
                  ))}
                </dl>
              </div>
            </Spread>
          </Chapter>

          <Chapter
            id="changed"
            kicker="06 · The reversals"
            title="Three things I was wrong about."
            lede={
              <>
                <p>
                  A case study that runs in a straight line from thesis to
                  execution is describing a project that never met anything
                  it did not expect. These three are the places North changed
                  direction, with what triggered each and what the change
                  cost. The third reversed a rule I had written down
                  myself.
                </p>
              </>
            }
          >
            <ol className="measure flex flex-col">
              {REVERSALS.map((item) => (
                <li
                  key={item.area}
                  className="flex flex-col gap-4 border-t border-line-hairline py-8 first:border-t-0 first:pt-0"
                >
                  <p className="type-overline text-text-tertiary">
                    {item.area}
                  </p>
                  <div className="flex flex-col gap-1.5">
                    <p className="type-overline text-text-tertiary">
                      What I believed
                    </p>
                    <p className="type-voice-sm text-text-primary">
                      {item.believed}
                    </p>
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <p className="type-overline text-text-tertiary">
                      What changed it
                    </p>
                    <p className="type-body text-text-secondary">
                      {item.changed}
                    </p>
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <p className="type-overline text-text-tertiary">
                      What it cost
                    </p>
                    <p className="type-meta text-text-tertiary">{item.cost}</p>
                  </div>
                </li>
              ))}
            </ol>

            <p className="type-body measure text-text-secondary">
              What the three have in common is that the reason outlived the
              rule. A rule is a hypothesis with a reason attached; when the
              two come apart, the reason is the part worth keeping. Two of
              these were caught by testing the thing rather than trusting the
              design, and the second was caught by a single sentence in
              review, which is the cheapest way any of them could have been
              found, and the argument for having someone say it out loud.
            </p>
          </Chapter>

          <Chapter
            id="making"
            kicker="07 · The making"
            title="Directed, not delegated."
            lede={
              /* No elapsed-day figure. The repository is public and its commit
                 history spans eight days, so a stated "fourteen days" invites a
                 contradiction a technical reader can check in one click — and
                 the sentence's point is direction, not speed.

                 A PLAIN block comment, not `{/* … *\/}`: `lede={` opens a JS
                 expression position, where a braced comment parses as an empty
                 object literal and the element after it becomes a syntax error.
                 This exact mistake broke the build once already. */
              <p>
                North was built through close, sustained direction of an AI
                engineering partner. The taste, the standard, and the no were
                never delegated; the exhausting parts were. The commit history
                reads as a design review because that is what the process was.
                Five entries, verbatim:
              </p>
            }
          >
            <ul className="measure flex flex-col">
              {RECEIPTS.map((receipt) => (
                <li
                  key={receipt.line}
                  className="border-t border-line-hairline py-4 first:border-t-0"
                >
                  <p className="type-voice-sm text-text-primary">
                    &ldquo;{receipt.line}&rdquo;
                  </p>
                  <p className="type-meta mt-1.5 text-text-tertiary">
                    {receipt.note}
                  </p>
                </li>
              ))}
            </ul>

            {/* Without this, five receipts read as five engineering anecdotes
                — which is the misread this section is most exposed to. The
                line names the standard they are all instances of. It says
                "the standard I would want a team operating at" rather than
                "the bar I held a team to": there was no team, and borrowing
                that credibility would be a lie. */}
            <p className="type-body measure text-text-secondary">
              The subjects differ; the standard does not. Each of these
              replaces a local patch with a rule the system can hold, and each
              was settled by measurement rather than by opinion, including
              the one that begins by owning a mistake. That is the standard I
              would want a team operating at, held here by one person.
            </p>
          </Chapter>

          {/* The footer stands on its own now. It used to be the children of
              a closing "07 · The state" chapter, which ended the page on a
              list of engineering debt — the last thing a reader saw. Removing
              the chapter would have taken the byline, the /design link and
              the second CTA with it, so the footer was lifted out rather than
              deleted, and carries the chapters' own `pt-20` so the rule above
              it sits centred like every other section boundary.

              The page now closes on the making chapter's line about the
              standard, which is a better last impression than a TODO list. */}
          <footer className="border-t border-line-hairline pt-20">
            <div className="flex flex-col items-start gap-6">
              <div className="text-text-primary">
                <Wordmark height={13} strokeWidth={2} />
              </div>
              <p className="type-meta measure text-text-tertiary">
                Designed and directed by Tanmay Jain. Next.js 16 · React 19 ·
                TypeScript · Tailwind v4 · built with Claude Code. The system
                documents itself at{" "}
                <Link
                  href="/design"
                  className="text-text-secondary underline decoration-dotted underline-offset-4"
                >
                  /design
                </Link>
                .
              </p>
              <Link
                href="/preview"
                className="type-label text-text-secondary underline decoration-dotted underline-offset-4 transition-colors duration-[--motion-micro] hover:text-text-primary"
              >
                Try North yourself
              </Link>
            </div>
          </footer>
        </div>
      </main>
    </div>
  );
}

"use client";

import { useState, type ReactNode } from "react";
import Link from "next/link";
import {
  ChoiceChip,
  ChoiceChipGroup,
  Figure,
  Wordmark,
} from "@/components/nds";
import { DemoPanel, JOURNEYS, type Journey } from "@/components/north/DemoPanel";
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

/**
 * /case-study — the work, argued in the product's own voice.
 *
 * A portfolio page, and deliberately a page OF the product rather than a
 * page ABOUT it: same tokens, same three faces, same components, and the
 * product itself standing in the hardware frames. Like /design and /preview
 * it sits outside the product's IA. Nothing in the app routes here.
 *
 * The page is an editorial FEATURE, not a spec sheet — that distinction is
 * the reason it stopped borrowing /design's Section/Specimen grammar. The
 * gallery documents parts in labelled boxes; a case study composes spreads
 * and tells the story of decisions. /design remains the appendix.
 *
 * The product appears in hardware twice, with two different jobs: the HERO
 * pair is `inert`, a picture that happens to be rendered, so it can never
 * steal a scroll from someone reading the opening. The STAGE pair is the
 * one interactive instance, and its heading says so. Both reuse the
 * /preview contract exactly (`/demo?at=` seeds a moment, `inset` hands the
 * status-bar height to SafeArea, frames re-key on journey and visit).
 *
 * Every iframe is `loading="lazy"` on purpose, including above-the-fold
 * ones: a lazy frame in the viewport loads immediately, and a lazy frame
 * inside a `display:none` breakpoint twin never loads at all — which lets
 * the hero and stage each carry a phone-only and a pair layout without
 * booting hidden copies of the app.
 */

const VIEWPORT: Record<Device, { width: number; height: number }> = {
  phone: SCREEN.phone,
  tablet: { width: 642, height: 919 },
};

function Frame({
  device = "phone",
  href,
  visit = 0,
  scale,
}: {
  device?: Device;
  href: string;
  visit?: number;
  scale: number;
}) {
  const shell = SHELL[device];
  const screen = SCREEN[device];
  const viewport = VIEWPORT[device];
  const factor = screen.width / viewport.width;
  const inset = Math.round((SAFE_TOP[device] / factor) * 100) / 100;
  const src = `${href}${href.includes("?") ? "&" : "?"}inset=${inset}`;
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
          <iframe
            key={`${device}:${href}:${visit}`}
            src={src}
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
  href: string;
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
  children: ReactNode;
}) {
  return (
    <section
      id={id}
      className="scroll-mt-10 border-t border-line-hairline pt-14"
    >
      <p className="type-overline text-text-tertiary">{kicker}</p>
      <h2 className="type-voice-lg mt-4 max-w-2xl text-text-primary">
        {title}
      </h2>
      {lede && (
        <div className="type-body measure mt-5 text-text-secondary">{lede}</div>
      )}
      <div className="mt-12 flex flex-col gap-12">{children}</div>
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
  caption?: string;
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

/* The seven rungs — the engine's own order, restated for a reader. */
const RUNGS = [
  { name: "Liquidity floor", active: false },
  { name: "Employer match", active: false },
  { name: "High-interest debt", active: true },
  { name: "Tax-advantaged space", active: false },
  { name: "Goal funding", active: false },
  { name: "Surplus with nowhere to go", active: false },
  { name: "Optimization", active: false },
];

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
      "Every change reviewed live in the browser, measured rather than eyeballed, across seventy-plus commits with an AI engineering partner.",
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

const STATS = [
  { value: "70+", label: "commits" },
  { value: "14", label: "days" },
  { value: "602", label: "tests, none failing" },
  { value: "v1.0", label: "locked and tagged" },
];

/* Color, shown as material rather than as chips. */
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
  const [journey, setJourney] = useState<Journey>(JOURNEYS[0]);
  const [visit, setVisit] = useState(0);

  const go = (next: Journey) => {
    setJourney(next);
    setVisit((n) => n + 1);
  };

  return (
    <div className="min-h-dvh bg-surface-page">
      {/* ── THE HERO — the sky, the claim, and a picture of the hardware ── */}
      <header className="relative overflow-hidden">
        <Sky className="h-full" />
        <div className="relative mx-auto flex w-full max-w-5xl flex-col gap-12 px-6 pt-16 pb-16 lg:flex-row lg:items-center lg:justify-between lg:pt-20 lg:pb-20">
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
            <p className="type-body mt-5 text-text-on-deep-dim">
              A premium AI financial coach: the thesis, the judgment engine,
              the visual system, and the discipline to leave almost everything
              else out. The product itself is standing inside this page.
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
          <div inert aria-hidden="true" className="hidden shrink-0 lg:block">
            <Pair href="/demo?at=reveal" scale={0.3} />
          </div>
          <div
            inert
            aria-hidden="true"
            className="flex justify-center lg:hidden"
          >
            <Pair href="/demo?at=reveal" scale={0.22} />
          </div>
        </div>
      </header>

      {/* ── THE CREDIT — who did this, and what the role covered ─────────── */}
      <div className="bg-surface-sunken">
        <div className="mx-auto flex w-full max-w-5xl flex-col items-start px-6 py-14">
          <p className="type-overline text-text-tertiary">The work of</p>
          <h2 className="type-voice-lg mt-3 text-text-primary">
            Tanmay Jain — Design Director
          </h2>
          <p className="type-body measure mt-4 text-text-secondary">
            North is a solo-directed product. One person set the strategy,
            drew the identity, designed every screen, and directed an AI
            engineering partner through the build. Every judgment on this
            page — what shipped, what was cut, what is never for sale — was
            made here, and the record of it is public in the repository.
          </p>
          <div className="mt-10 grid w-full grid-cols-1 gap-x-10 gap-y-7 md:grid-cols-2">
            {SCOPE.map((item) => (
              <div key={item.area} className="flex flex-col gap-1.5">
                <p className="type-label text-text-primary">{item.area}</p>
                <p className="type-meta text-text-secondary">{item.detail}</p>
              </div>
            ))}
          </div>
          <dl className="mt-11 flex flex-wrap gap-x-12 gap-y-6 border-t border-line-hairline pt-8 w-full">
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

      {/* ── THE DOCUMENT ─────────────────────────────────────────────────── */}
      <main>
        <div className="mx-auto flex w-full max-w-4xl flex-col gap-20 px-6 pt-20 pb-20">
          <Chapter
            id="problem"
            kicker="01 · The problem"
            title="Judgment is the scarce thing."
            lede={
              <p>
                Financial information is free now. Judgment is not. The part
                of an advisor&rsquo;s job that says{" "}
                <em className="text-text-primary">
                  this, not that, and here&rsquo;s why, for you, this month
                </em>{" "}
                still costs $3,000 to $8,000 a year, and most firms will not
                take a client below $250k in assets. Everyone under that line
                gets generic advice or none. North&rsquo;s bet is that the
                judgment layer becomes software.
              </p>
            }
          >
            <blockquote className="border-l-2 border-signal-coach pl-6">
              <p className="type-voice-md max-w-2xl text-text-primary">
                Every competitor puts the AI in the conversation layer. North
                puts it in the judgment layer.
              </p>
              <cite className="type-overline mt-3 block text-text-tertiary not-italic">
                docs/STRATEGY.md
              </cite>
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
          </Chapter>

          <Chapter
            id="engine"
            kicker="02 · The engine"
            title="Seven rules, in order, for everyone."
            lede={
              <p>
                How do you serve everyone without asking who they are?
                North&rsquo;s answer is a waterfall: seven rules in a fixed
                order, evaluated against what a person actually said. The
                first rule they do not yet satisfy is the one thing the coach
                surfaces today. A surgeon and a teacher in the same situation
                get the same read.
              </p>
            }
          >
            <div className="measure overflow-hidden rounded-card border border-line-hairline bg-surface-raised">
              {RUNGS.map((rung, index) => (
                <div
                  key={rung.name}
                  className={
                    "flex items-center gap-4 border-t border-line-hairline px-5 py-3.5 first:border-t-0" +
                    (rung.active ? " bg-surface-sunken" : "")
                  }
                >
                  <span className="type-figure w-5 shrink-0 text-text-tertiary">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <span className="type-body text-text-primary">
                    {rung.name}
                  </span>
                  {rung.active && (
                    <span className="type-overline ml-auto text-signal-coach">
                      First unsatisfied
                    </span>
                  )}
                </div>
              ))}
            </div>
            <div className="measure flex flex-col gap-4">
              <pre className="type-figure overflow-x-auto rounded-card border border-line-hairline bg-surface-sunken p-5 text-text-secondary">
                {"// NO — persona branching. Needs a picker, 4x the content.\n"}
                {"if (persona === \"young_professional\") { ... }\n\n"}
                {"// YES — ordered rules over a derived profile.\n"}
                <span className="text-text-primary">
                  {"const rung = waterfall.firstUnsatisfied(profile)"}
                </span>
              </pre>
              <p className="type-body text-text-secondary">
                The engine is pure TypeScript. No model call sits anywhere in
                the path to an answer, so it cannot fail during a demo and it
                cannot quietly change its mind. The architecture is held by a
                test titled{" "}
                <code className="type-figure text-text-primary">
                  &ldquo;income does not determine the rung&rdquo;
                </code>
                .
              </p>
            </div>
          </Chapter>

          <Chapter
            id="system"
            kicker="03 · The system"
            title="Restraint is the premium signal."
            lede={
              <p>
                The register is an editorial magazine, not a trading
                terminal. Light pages, warm neutrals, a serif doing the
                talking. The sharpest decision is that the primary action is
                ink rather than a colored button, which sidesteps
                fintech&rsquo;s entire vocabulary of trust-blue and
                growth-green. It reads as print, and print is the most
                expensive thing a screen can do.
              </p>
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
              label="Three faces, three jobs — each at its working size"
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
                            className={
                              "type-figure " +
                              (band.dark
                                ? "text-text-inverse"
                                : "text-text-secondary")
                            }
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
              caption="Stated, inferred, or assumed — each renders differently, and a screen reader hears the same distinction. No other personal-finance product does this."
            >
              <p className="type-voice-md max-w-2xl text-text-primary">
                You hold{" "}
                <Figure
                  value={4_000_000}
                  format="currency"
                  confidence="stated"
                  label="in checking"
                />{" "}
                in checking — about{" "}
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

            <Spread
              label="One drawing, six strokes"
              caption="Every figure of the onboarding glyph interpolates into every other. Nothing is ever swapped. Pick one and watch."
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
          </Chapter>
        </div>

        {/* ── 04 · THE SCREENS — the one place the hardware is live ──────── */}
        <section id="screens" className="bg-surface-deep">
          <div className="mx-auto flex w-full max-w-5xl flex-col gap-10 px-6 py-16">
            <div className="flex flex-col items-start">
              <p className="type-overline text-text-on-deep-dim">
                04 · The screens — live, not screenshots
              </p>
              <h2 className="type-voice-lg mt-4 text-text-on-deep">
                These two devices are the real product. Click in and use it.
              </h2>
              <p className="type-body measure mt-4 text-text-on-deep-dim">
                Scroll the read, open a derivation, hold a decision. Both
                viewports are the running app, seeded with nine months of
                story. The chips seed a different moment of that story, and
                pressing the one you are on resets it.
              </p>
            </div>
            <div className="flex flex-col items-center gap-8">
              <DemoPanel active={journey.id} onGo={go} />
              <div className="hidden lg:block">
                <Pair href={journey.href} visit={visit} scale={0.56} />
              </div>
              <div className="lg:hidden">
                <Frame href={journey.href} visit={visit} scale={0.78} />
              </div>
            </div>
          </div>
        </section>

        <div className="mx-auto flex w-full max-w-4xl flex-col gap-20 px-6 pt-20 pb-24">
          <Chapter
            id="calls"
            kicker="05 · The calls"
            title="What was cut, and what is never for sale."
            lede={
              <p>
                The MVP is not the list of good ideas. It is the shortest
                path to the thesis being undeniable, and anything that does
                not shorten that path waits, however good it is.
              </p>
            }
          >
            <div className="measure flex flex-col gap-5">
              <p className="type-body text-text-secondary">
                Trajectory, the standalone charting surface every competitor
                ships, was the most expensive item in the original scope and
                the least load-bearing. It was cut. What survives is a
                horizon fan under the day&rsquo;s decision, where a range
                makes the choice in front of you feel consequential.
                Free-form chat was cut for a different reason:{" "}
                <em className="text-text-primary">
                  omitting it is a positioning statement.
                </em>
              </p>
              <p className="type-body text-text-secondary">
                Membership follows one principle:{" "}
                <span className="text-text-primary">
                  the coach&rsquo;s judgment is never paywalled; its time is.
                </span>{" "}
                Free carries the entire decide, track, check-back loop. Plus
                buys room to think — more scenarios, the spoken
                conversation, every goal instead of the first. The one Plus
                line that touches urgency had to argue for itself, and the
                argument is pinned in code.
              </p>
              <pre className="type-figure overflow-x-auto rounded-card border border-line-hairline bg-surface-sunken p-5 text-text-secondary">
                {"assert.ok(FREE_SCENARIOS.has(\"debt-first\"), "}
                <span className="text-signal-attention">
                  {"\"the copy just became a lie\""}
                </span>
                {")"}
              </pre>
              <p className="type-meta text-text-tertiary">
                The ethics pin. debt-first, the scenario that tells you to
                stop losing money, is free forever — or the suite fails
                before the change ships.
              </p>
            </div>
          </Chapter>

          <Chapter
            id="making"
            kicker="06 · The making"
            title="Directed, not delegated."
            lede={
              <p>
                North was built in fourteen days of close direction of an AI
                engineering partner. The taste, the standard, and the no were
                never delegated; the exhausting parts were. The commit
                history reads as a design review because that is what the
                process was. Five entries, verbatim:
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
          </Chapter>

          <Chapter
            id="state"
            kicker="07 · The state"
            title="Locked at v1.0, edges written down."
            lede={
              <p>
                Version 1.0 is tagged: 602 tests across 124 suites, clean
                typecheck and lint, and a purity guard proving the engine
                imports no framework, no clock, and no membership. The known
                edges are recorded on purpose — the optional intent endpoint
                has no rate limit yet, the dock sits under a real
                iPhone&rsquo;s home indicator, and two constant tables are
                duplicated in onboarding. A case study that hides its edges
                is an advertisement.
              </p>
            }
          >
            <footer className="border-t border-line-hairline pt-10">
              <div className="flex flex-col items-start gap-6">
                <div className="text-text-primary">
                  <Wordmark height={13} strokeWidth={2} />
                </div>
                <p className="type-meta measure text-text-tertiary">
                  Designed and directed by Tanmay Jain. Next.js 16 · React 19
                  · TypeScript · Tailwind v4 · built with Claude Code. The
                  system documents itself at{" "}
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
          </Chapter>
        </div>
      </main>
    </div>
  );
}

"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ChoiceChip,
  ChoiceChipGroup,
  Figure,
  HorizonField,
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
import { Section, Specimen, SwatchRow } from "../design/_parts";

/**
 * /case-study — the work, argued in the product's own voice.
 *
 * A portfolio page, and deliberately a page OF the product rather than a
 * page ABOUT it: same tokens, same three faces, same components, and the
 * product itself standing in the hardware frames. Like /design and /preview
 * it sits outside the product's IA — nothing in the app routes here.
 *
 * The product appears in hardware twice, with two different jobs: the HERO
 * pair is `inert` — a picture that happens to be rendered, so it can never
 * steal a scroll from someone reading the opening — and the STAGE pair is
 * the one interactive instance, labelled as such. Both reuse the /preview
 * contract exactly (`/demo?at=` seeds a moment, `inset` hands the
 * status-bar height to SafeArea, frames re-key on journey and visit).
 *
 * Every iframe is `loading="lazy"` ON PURPOSE, including above-the-fold
 * ones: a lazy frame in the viewport loads immediately, and a lazy frame
 * inside a `display:none` breakpoint twin never loads at all — which is
 * what lets the hero and stage each carry a phone-only and a pair layout
 * without booting hidden copies of the app.
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

/* Real commit messages, verbatim from `git log`. */
const RECEIPTS = [
  {
    line: "Stop refusing questions the engine can answer",
    note: "The coach's router had its default inverted — a gatekeeper became a partner.",
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
    note: "Two rendering artifacts isolated in the browser — and owned.",
  },
  {
    line: "Every mark sits on its line by construction, not by a number",
    note: "Three hand-tuned pixel nudges retired by one primitive measured in line-heights.",
  },
];

/* The stat row under the credit — figures a reader should not scroll past. */
const STATS = [
  { value: "70+", label: "commits" },
  { value: "14", label: "days" },
  { value: "602", label: "tests, none failing" },
  { value: "v1.0", label: "locked and tagged" },
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
              A premium AI financial coach — the thesis, the judgment engine,
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
          {/* `inert`: a rendered picture, not a second demo. The interactive
              pair is on the stage below, and says so. Lazy keeps the hidden
              breakpoint twin from ever booting. */}
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

      {/* ── THE CREDIT — who did this. Not a footnote. ───────────────────── */}
      <div className="bg-surface-sunken">
        <div className="mx-auto flex w-full max-w-5xl flex-col items-start px-6 py-12">
          <p className="type-overline text-text-tertiary">The work of</p>
          <h2 className="type-voice-md mt-3 text-text-primary">
            Tanmay Jain — Design Director
          </h2>
          <p className="type-body measure mt-3 text-text-secondary">
            Set the thesis, wrote the rules, and directed every screen,
            rejection and rebuild until the system stopped breaking its own
            promises.
          </p>
          <dl className="mt-8 flex flex-wrap gap-x-12 gap-y-6">
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
        <div className="mx-auto flex w-full max-w-4xl flex-col gap-16 px-6 pt-16 pb-20">
        <Section
          id="problem"
          title="Judgment is the scarce thing"
          note="Financial information is free. Judgment — this, not that, and here's why, for you, this month — costs $3,000–8,000 a year behind a $250k minimum. North makes the judgment layer software."
        >
          <blockquote className="measure border-l-2 border-signal-coach pl-6">
            <p className="type-voice-md text-text-primary">
              Every competitor puts the AI in the conversation layer. North
              puts it in the judgment layer.
            </p>
            <cite className="type-overline mt-3 block text-text-tertiary not-italic">
              docs/STRATEGY.md
            </cite>
          </blockquote>
          <div className="measure grid grid-cols-1 gap-8 sm:grid-cols-2">
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
                  <span className="text-text-primary">Everyone, unasked.</span>{" "}
                  No persona picker — deriving the situation is the
                  coach&rsquo;s job.
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
                  The honest answer is a nonprofit credit counselor.
                </li>
                <li className="type-body text-text-secondary">
                  <span className="text-text-primary">
                    The $40 grocery optimizer.
                  </span>{" "}
                  That is YNAB, and North would feel condescending.
                </li>
              </ul>
            </div>
          </div>
        </Section>

        <Section
          id="engine"
          title="Seven rules, no persona picker"
          note="The engine is pure, synchronous and tested — it never calls a model. One question: what is the first rule this person does not yet satisfy?"
        >
          <div className="measure">
            <div className="overflow-hidden rounded-card border border-line-hairline bg-surface-raised">
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
          </div>
          <div className="measure">
            <pre className="type-figure overflow-x-auto rounded-card border border-line-hairline bg-surface-sunken p-5 text-text-secondary">
              {"// NO — persona branching. Needs a picker, 4x the content.\n"}
              {"if (persona === \"young_professional\") { ... }\n\n"}
              {"// YES — ordered rules over a derived profile.\n"}
              <span className="text-text-primary">
                {"const rung = waterfall.firstUnsatisfied(profile)"}
              </span>
            </pre>
            <p className="type-body mt-4 text-text-secondary">
              Proven, not asserted — the suite includes a test literally
              titled{" "}
              <code className="type-figure text-text-primary">
                &ldquo;income does not determine the rung&rdquo;
              </code>
              .
            </p>
          </div>
        </Section>

        <Section
          id="system"
          title="Restraint is the premium signal"
          note="Editorial magazine, not trading terminal. The primary action is ink, not a colored button — one decision that sidesteps the entire fintech color problem."
        >
          <Specimen
            name="The mark"
            note="NORTH in the product's hairline hand, the O a working compass — its needle the one filled shape in the identity."
          >
            <div className="flex flex-col items-start gap-5">
              <Wordmark height={13} strokeWidth={2} />
              <Wordmark height={22} strokeWidth={1.7} />
              <Wordmark height={40} />
            </div>
          </Specimen>

          <Specimen
            name="Three families, only three"
            note="Ground, Ink, Signal — amounts are never colored, so the palette is colorblind-safe by construction."
          >
            <div className="flex flex-col gap-6">
              <SwatchRow
                tokens={[
                  { token: "--surface-page", label: "surface-page" },
                  { token: "--surface-raised", label: "surface-raised" },
                  { token: "--surface-sunken", label: "surface-sunken" },
                ]}
              />
              <SwatchRow
                tokens={[
                  { token: "--text-primary", label: "text-primary" },
                  { token: "--text-secondary", label: "text-secondary" },
                  { token: "--text-tertiary", label: "text-tertiary" },
                ]}
              />
              <SwatchRow
                tokens={[
                  { token: "--signal-coach", label: "signal-coach" },
                  { token: "--signal-attention", label: "signal-attention" },
                ]}
              />
            </div>
          </Specimen>

          <Specimen
            name="Three faces, three jobs"
            note="The serif is the coach thinking. The mono is the machine computing. The sans is the interface getting out of the way."
          >
            <div className="flex flex-col gap-6">
              <p className="type-voice-md measure text-text-primary">
                Your $140,000 in cash is the problem, not the win.
              </p>
              <p className="type-body measure text-text-primary">
                Move the excess into tax-advantaged space
              </p>
              <p className="type-figure text-text-primary">$578K – $1.5M</p>
            </div>
          </Specimen>

          <Specimen
            name="Every number carries its confidence"
            note="stated · inferred · assumed — rendered differently, and a screen reader hears the provenance too. Nobody else in personal finance does this."
          >
            <p className="type-voice-md measure text-text-primary">
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
          </Specimen>

          <Specimen
            name="The glyph is one drawing"
            note="Six hairline strokes on one skeleton — every figure interpolates into every other. Pick one and watch."
          >
            <div className="flex flex-col gap-6">
              <TurnGlyph
                turnId={glyphTurn}
                className="h-24 w-[144px] text-text-secondary"
              />
              <ChoiceChipGroup label="Figure">
                {(Object.keys(TURN_GLYPH) as TurnId[]).slice(0, 8).map((id) => (
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
          </Specimen>
        </Section>
        </div>

        {/* ── THE SCREENS — the one place the hardware is live ───────────── */}
        <section id="screens" className="bg-surface-deep">
          <div className="mx-auto flex w-full max-w-5xl flex-col gap-10 px-6 py-16">
            <div className="flex flex-col items-start">
              <p className="type-overline text-text-on-deep-dim">
                The screens — live, not screenshots
              </p>
              <h2 className="type-voice-md mt-3 text-text-on-deep">
                These two devices are the real product. Click in and use it.
              </h2>
              <p className="type-body measure mt-3 text-text-on-deep-dim">
                Scroll the read, open a derivation, hold a decision — both
                viewports are the running app, seeded with nine months of
                story. The chips choose the moment; press the one you are on
                to reset it.
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

        {/* ── SCENERY — the product's one visualization, wordless ────────── */}
        <div aria-hidden="true" className="border-b border-line-hairline">
          <div className="mx-auto w-full max-w-5xl px-6 py-14">
            <HorizonField
              low={57_800_000}
              high={150_000_000}
              central={93_800_000}
              confidence="assumed"
              months={300}
              height={132}
            />
          </div>
        </div>

        <div className="mx-auto flex w-full max-w-4xl flex-col gap-16 px-6 pt-16 pb-24">
        <Section
          id="calls"
          title="What was cut, and what is never for sale"
          note="The MVP is not the list of good ideas. It is the shortest path to the thesis being undeniable."
        >
          <div className="measure flex flex-col gap-5">
            <p className="type-body text-text-secondary">
              <span className="text-text-primary">
                Trajectory was cut as a standalone surface
              </span>{" "}
              — the most expensive item in the plan, and the most generic. It
              survives as the horizon fan under a decision, where a range
              makes the decision feel consequential. Free-form chat went the
              same way: <em>omitting it is a positioning statement.</em>
            </p>
            <p className="type-body text-text-secondary">
              <span className="text-text-primary">
                The coach&rsquo;s judgment is never paywalled; its time is.
              </span>{" "}
              Free carries the whole decide → track → check-back loop. Plus
              buys room to think — and its one line touching urgency had to
              argue for itself: the read stays free in full, Plus adds only
              the arithmetic.
            </p>
          </div>
          <Specimen
            name="The ethics pin is a failing test, not a policy"
            note="debt-first — the scenario that tells you to stop losing money — is free forever, or the suite fails before it ships."
          >
            <pre className="type-figure overflow-x-auto text-text-secondary">
              {"assert.ok(FREE_SCENARIOS.has(\"debt-first\"), "}
              <span className="text-signal-attention">
                {"\"the copy just became a lie\""}
              </span>
              {")"}
            </pre>
          </Specimen>
        </Section>

        <Section
          id="making"
          title="Directed, not delegated"
          note="Fourteen days of close direction of an AI engineering partner. The taste, the standard, and the no were never delegated — the exhausting parts were."
        >
          <div className="measure flex flex-col gap-5">
            <ul className="flex flex-col">
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
            <p className="type-meta text-text-tertiary">
              Commit messages, verbatim. The standard behind them: options
              before decisions, and the browser gets the last word — measured,
              never eyeballed.
            </p>
          </div>
        </Section>

        <Section
          id="state"
          title="Where it stands"
          note="Locked at v1.0 — 602 tests across 124 suites, typecheck and lint clean, and a purity guard proving the engine imports no framework, no clock, no membership."
        >
          <p className="type-body measure text-text-secondary">
            Known and deliberate at the tag: the optional intent endpoint has
            no rate limit yet, the dock sits under a real iPhone&rsquo;s home
            indicator, and two constant tables are duplicated across
            onboarding files. Written down, because a case study that hides
            its edges is an advertisement.
          </p>
        </Section>

        <footer className="border-t border-line-hairline pt-10">
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

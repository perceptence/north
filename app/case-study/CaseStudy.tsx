"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ChoiceChip,
  ChoiceChipGroup,
  Figure,
  Wordmark,
} from "@/components/nds";
import {
  ActionLink,
  AssumedMark,
  CorrectionMark,
  WaitingMark,
} from "@/components/north/ActionGlyphs";
import { DemoPanel, JOURNEYS, type Journey } from "@/components/north/DemoPanel";
import {
  DeviceFrame,
  SAFE_TOP,
  SCREEN,
  SHELL,
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
 * product itself standing live in the hardware frames. Everything /design
 * does for the system, this does for the thinking — and like /design and
 * /preview it sits outside the product's IA. Nothing in the app routes here.
 *
 * The live frames reuse the /preview contract exactly: `/demo?at=` seeds a
 * moment, `inset` hands the frame's status-bar height to `SafeArea`, and the
 * iframe is keyed on journey AND visit so pressing the chip you are already
 * on re-seeds — the same reset gesture the preview taught.
 */

/* One phone, at a fixed scale — the hero and the stage both use it. */
function Frame({
  href,
  visit = 0,
  scale,
  lazy = false,
}: {
  href: string;
  visit?: number;
  scale: number;
  lazy?: boolean;
}) {
  const shell = SHELL.phone;
  const screen = SCREEN.phone;
  // The phone renders at its logical size, so the inset goes over undivided.
  const src = `${href}${href.includes("?") ? "&" : "?"}inset=${SAFE_TOP.phone}`;
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
        <DeviceFrame device="phone">
          <iframe
            key={`${href}:${visit}`}
            src={src}
            title="North, running live"
            loading={lazy ? "lazy" : "eager"}
            className="block border-0"
            style={{
              width: screen.width,
              height: screen.height,
              background: "var(--surface-deep)",
            }}
          />
        </DeviceFrame>
      </div>
    </div>
  );
}

/* The seven rungs, as prose — the engine's own order, restated for a reader. */
const RUNGS = [
  { name: "Liquidity floor", active: false },
  { name: "Employer match", active: false },
  { name: "High-interest debt", active: true },
  { name: "Tax-advantaged space", active: false },
  { name: "Goal funding", active: false },
  { name: "Surplus with nowhere to go", active: false },
  { name: "Optimization", active: false },
];

/* Real commit messages, verbatim from `git log`, each with what it records. */
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
    note: "Two rendering artifacts isolated by switching each cause off in the browser — and owned.",
  },
  {
    line: "Every mark sits on its line by construction, not by a number",
    note: "Three hand-tuned pixel nudges retired by one primitive measured in line-heights.",
  },
  {
    line: "Give “tell me more” somewhere to go",
    note: "A dead end found by walking the conversation as a user would.",
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
      {/* ── THE HERO — the sky, the claim, and the product standing in it ── */}
      <header className="relative overflow-hidden">
        <Sky className="h-full" />
        <div className="relative mx-auto flex w-full max-w-5xl flex-col gap-12 px-6 pt-16 pb-20 lg:flex-row lg:items-center lg:justify-between lg:pt-20 lg:pb-24">
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
              else out. This page is built from the product&rsquo;s own tokens
              and components, and the product itself is standing inside it.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-5">
              <Link
                href="/"
                className="type-label rounded-full bg-text-on-deep px-6 py-3 text-surface-deep transition-opacity duration-[--motion-micro] hover:opacity-90"
              >
                Try it yourself
              </Link>
              <Link
                href="/preview"
                className="type-label text-text-on-deep-dim underline decoration-dotted underline-offset-4 transition-colors duration-[--motion-micro] hover:text-text-on-deep"
              >
                Or borrow the story
              </Link>
            </div>
          </div>
          <div className="hidden shrink-0 lg:block" aria-hidden="false">
            <Frame href="/demo?at=reveal" scale={0.64} />
          </div>
        </div>
      </header>

      {/* ── THE CREDIT BAR — who did this, on paper where ink can say it ── */}
      <div className="border-b border-line-hairline">
        <div className="mx-auto flex w-full max-w-5xl flex-col gap-4 px-6 py-8 md:flex-row md:items-baseline md:justify-between">
          <p className="type-meta max-w-md text-text-secondary">
            <span className="text-text-primary">Tanmay Jain</span> — Design
            Director. Set the thesis, wrote the rules, and directed every
            screen, rejection and rebuild until the system stopped breaking
            its own promises.
          </p>
          <p className="type-figure shrink-0 text-text-tertiary">
            70+ commits · 9 days · 602 tests · v0.1.0
          </p>
        </div>
      </div>

      {/* ── THE DOCUMENT ─────────────────────────────────────────────────── */}
      <main>
        <div className="mx-auto flex w-full max-w-4xl flex-col gap-16 px-6 pt-16 pb-20">
        <Section
          id="problem"
          title="The problem — judgment is the scarce thing"
          note="Financial information is free. Judgment still costs $3,000–8,000 a year, and usually takes a $250k minimum to access at all."
        >
          <div className="measure flex flex-col gap-5">
            <p className="type-body text-text-secondary">
              Below that line people are handed generic advice or none.
              North&rsquo;s bet is that the judgment layer — the part of an
              advisor&rsquo;s job that says{" "}
              <em className="text-text-primary">
                this, not that, and here&rsquo;s why, for you, this month
              </em>{" "}
              — becomes software.
            </p>
            <blockquote className="border-l-2 border-signal-coach pl-5">
              <p className="type-voice-sm text-text-primary">
                Every competitor puts the AI in the conversation layer. North
                puts it in the judgment layer.
              </p>
              <cite className="type-overline mt-2 block text-text-tertiary not-italic">
                docs/STRATEGY.md
              </cite>
            </blockquote>
            <p className="type-body text-text-secondary">
              Built for the unadvised earner — strong income, no advisor, idle
              cash in checking — and deliberately{" "}
              <span className="text-text-primary">not</span> for two groups it
              names: people in acute financial distress, whose honest answer is
              a nonprofit credit counselor rather than a calm optimizing
              register, and people who want to optimize $40 of groceries, who
              already have YNAB and would find North condescending. A product
              that cannot name its anti-user does not know its user.
            </p>
          </div>
        </Section>

        <Section
          id="engine"
          title="The engine — seven ordered rules, no persona picker"
          note="The waterfall is the product's intelligence: pure, synchronous, tested. One question — what is the first rule this person does not yet satisfy?"
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
              The engine never calls a model — every read on every screen is
              computed by the same deterministic core, so it cannot fail live
              and cannot quietly change its mind. The no-branching rule is
              proven, not asserted: the suite includes a test literally titled{" "}
              <code className="type-figure text-text-primary">
                &ldquo;income does not determine the rung&rdquo;
              </code>{" "}
              — a $400k earner and a $60k earner land on the same rung when
              their situations match.
            </p>
          </div>
        </Section>

        <Section
          id="system"
          title="The system — restraint as the premium signal"
          note="Editorial magazine, not trading terminal. The primary action is ink, not a colored button — one decision that sidesteps the entire fintech color problem."
        >
          <Specimen
            name="The mark"
            note="NORTH in the product's hairline hand, the O a working compass. The needle's north point is the one filled shape in the whole identity."
          >
            <div className="flex flex-col items-start gap-5">
              <Wordmark height={13} strokeWidth={2} />
              <Wordmark height={22} strokeWidth={1.7} />
              <Wordmark height={40} />
            </div>
          </Specimen>

          <Specimen
            name="Three families, only three"
            note="Ground (warm paper), Ink (warm near-black), Signal (indigo + clay, at most one element per viewport). Amounts are never colored; direction is a glyph, so the palette is colorblind-safe by construction."
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
            note="stated is sharp and unmarked · inferred carries the dotted coach mark · assumed drops to secondary ink. A screen reader hears the provenance too — nobody else in personal finance does this."
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
            note="Six hairline strokes on a uniform skeleton — every figure interpolates into every other, nothing is ever swapped. Pick one and watch."
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

          <Specimen
            name="No icon library, ever"
            note="Every mark comes from the same hairline pen as the glyphs and the horizon fan, and every candidate was judged in the row it joins — a mark's job is to be told apart from its neighbours."
          >
            <div className="flex flex-col items-start gap-1">
              <ActionLink icon={<AssumedMark />} onClick={() => undefined}>
                What&rsquo;s assumed
              </ActionLink>
              <ActionLink icon={<CorrectionMark />} onClick={() => undefined}>
                That&rsquo;s not quite right
              </ActionLink>
              <ActionLink icon={<WaitingMark />} onClick={() => undefined}>
                I&rsquo;ve already done this
              </ActionLink>
            </div>
          </Specimen>
        </Section>
        </div>

        {/* ── THE SCREENS — the product itself, on its own stage ────────── */}
        <section id="screens" className="bg-surface-deep">
        <div className="mx-auto flex w-full max-w-4xl flex-col gap-10 px-6 py-16">
          <div className="flex flex-col items-start">
            <p className="type-overline text-text-on-deep-dim">
              The screens — live
            </p>
            <h2 className="type-voice-md mt-3 text-text-on-deep">
              Not screenshots. The product, running.
            </h2>
            <p className="type-body measure mt-3 text-text-on-deep-dim">
              Five moments, each seeded on demand: the reveal, the return
              North makes three days later, the story of how this person got
              here, the front door, and the onboarding conversation itself.
              Press the chip you are on to reset it. The full stage — phone
              and tablet side by side — is at{" "}
              <Link
                href="/preview"
                className="text-text-on-deep underline decoration-dotted underline-offset-4"
              >
                /preview
              </Link>
              .
            </p>
          </div>
          <div className="flex flex-col items-center gap-8">
            <DemoPanel active={journey.id} onGo={go} />
            <Frame href={journey.href} visit={visit} scale={0.82} lazy />
          </div>
        </div>
        </section>

        <div className="mx-auto flex w-full max-w-4xl flex-col gap-16 px-6 pt-16 pb-24">
        <Section
          id="calls"
          title="Hard calls — what was cut, and what is never for sale"
          note="The MVP is not the list of good ideas. It is the shortest path to the thesis being undeniable."
        >
          <div className="measure flex flex-col gap-5">
            <p className="type-body text-text-secondary">
              <span className="text-text-primary">
                Trajectory was cut as a standalone surface.
              </span>{" "}
              The most expensive item in the original scope, and the most
              generic — every competitor has charts. It survives as the
              horizon fan under a decision, where a range makes the decision
              feel consequential instead of decorating a screen of its own.
              Free-form chat went the same way:{" "}
              <em>omitting it is a positioning statement.</em>
            </p>
            <p className="type-body text-text-secondary">
              <span className="text-text-primary">
                The coach&rsquo;s judgment is never paywalled; its time is.
              </span>{" "}
              Free carries the whole decide → track → check-back loop. Plus
              buys room to think — more scenarios, the spoken conversation,
              every goal instead of the first. The one Plus line that touches
              urgency, <em>what waiting costs</em>, had to argue for itself:
              the read still names the gap and the action in full, free — Plus
              adds the arithmetic on another month, a sharper prompt but never
              a truer one.
            </p>
          </div>
          <Specimen
            name="The ethics pin is a failing test, not a policy"
            note="debt-first — the scenario that tells you to stop losing money — is free forever. If Plus ever widens to take it, the suite fails before it ships."
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
          title="How it was made — directed, not delegated"
          note="Built in nine days of close direction of an AI engineering partner. The taste, the standard, and the no were never delegated — the exhausting parts were."
        >
          <div className="measure flex flex-col gap-5">
            <p className="type-body text-text-secondary">
              The commit history reads as a design review because that is what
              the process was: every screen walked in the browser, every claim
              measured against the live DOM, every regression owned in the
              message that fixed it. A few entries, verbatim:
            </p>
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
            <p className="type-body text-text-secondary">
              The review standard behind all of it: options first, never a
              silent guess; candidates judged in the row they join, never
              alone; and no fix accepted on faith — the browser gets the last
              word, measured, before anything is called done.
            </p>
          </div>
        </Section>

        <Section
          id="state"
          title="Where it stands"
          note="Locked at v0.1.0 — 602 tests across 124 suites, typecheck and lint clean, and a purity guard proving the engine imports no framework, no clock, and no membership."
        >
          <div className="measure flex flex-col gap-3">
            <p className="type-body text-text-secondary">
              Known and deliberate at the tag: the intent endpoint has no rate
              limit yet — it is optional by design, and the product is fully
              functional without it; the dock still sits under a real
              iPhone&rsquo;s home indicator; two constant tables are
              duplicated across onboarding files. Written down where the
              limitations can be seen, because a case study that hides its
              edges is an advertisement.
            </p>
          </div>
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
              href="/"
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

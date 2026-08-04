"use client";

import { useState } from "react";
import {
  AppBar,
  CompassMark,
  Wordmark,
  Button,
  Card,
  ChoiceChip,
  ChoiceChipGroup,
  CoachPresence,
  ContinuityStrip,
  ConversationTurn,
  EmptyState,
  ErrorState,
  Figure,
  HorizonBand,
  HorizonField,
  MarkedLine,
  Row,
  RouteMarks,
  RungIndicator,
  SectionHeading,
  Sheet,
  Slider,
  TabBar,
  Text,
  TextField,
} from "@/components/nds";
import type { Projection } from "@/core/projection";
import {
  ActionLink,
  AdjustMark,
  AjarMark,
  BehindMark,
  CorrectionMark,
  DownloadMark,
  HiddenMark,
  AssumedMark,
  BackMark,
  HorizonMark,
  LedgerMark,
  OpenBookMark,
  ReleaseMark,
  SpeakMark,
  ReceiveMark,
  SalutationMark,
  SignpostMark,
  UnchangedMark,
  WaitingMark,
  StoryMark,
} from "@/components/north/ActionGlyphs";
import { AssumptionsPanel } from "@/components/north/AssumptionsPanel";
import { InsightSheet } from "@/components/north/InsightSheet";
import { LadderPanel } from "@/components/north/LadderPanel";
import { MembershipSheet } from "@/components/north/MembershipSheet";
import { DirectionMark } from "@/components/north/InsightsScreen";
import { Sky } from "@/components/north/Sky";
import { SpokenField } from "@/components/north/SpokenField";
import { TURN_GLYPH, TurnGlyph } from "@/components/north/TurnGlyph";
import type { TurnId } from "@/core/onboarding/script";
import { ContrastTable, Grid, ScaleRow, Section, Specimen, SwatchRow } from "./_parts";

/**
 * The system's proof.
 *
 * Every token and every component, in every state and variant. A component
 * that is not here is not in the system (docs/DESIGN-SYSTEM.md §10).
 *
 * This is not an application screen — it is a project artifact, outside the
 * product IA (docs/UX-ARCHITECTURE.md §1).
 */

/** A route mid-walk: three behind, one here, the rest still to come. */
const ROUTE_SPECIMEN = [
  { id: "a", label: "Bearings", state: "answered" as const, reachable: true },
  { id: "b", label: "Footing", state: "answered" as const, reachable: true },
  { id: "c", label: "The inflow", state: "answered" as const, reachable: true },
  { id: "d", label: "The outflow", state: "current" as const, reachable: true },
  { id: "e", label: "Reserves", state: "toCome" as const },
  { id: "f", label: "Drag", state: "toCome" as const },
  { id: "g", label: "Leaning in", state: "toCome" as const },
];

/** A dispatch's reasoning, shaped exactly like `behind()` returns it. */
const BEHIND_SPECIMEN = {
  eyebrow: "Behind the buffer",
  thesis: "How many months your cash actually covers, and how it got there.",
  cue: "See the working",
  sections: [
    {
      heading: "The working",
      segments: [
        { kind: "text" as const, value: "You hold " },
        { kind: "figure" as const, value: 14_000_000, format: "currency" as const, confidence: "stated" as const, label: "in cash" },
        { kind: "text" as const, value: " in cash, against " },
        { kind: "figure" as const, value: 1_200_000, format: "currency" as const, confidence: "stated" as const, label: "a month" },
        { kind: "text" as const, value: " a month going out." },
      ],
    },
    {
      heading: "What moved",
      segments: [
        { kind: "text" as const, value: "You held " },
        { kind: "figure" as const, value: 5_000_000, format: "currency" as const, confidence: "stated" as const, label: "in cash before" },
        { kind: "text" as const, value: " when North last looked." },
      ],
    },
  ],
  goes: "today" as const,
  goesLabel: "See it on Today",
};

const SECTIONS = [
  ["brand", "Wordmark"],
  ["color", "Color"],
  ["type", "Typography"],
  ["scale", "Spacing & radius"],
  ["elevation", "Elevation & motion"],
  ["figure", "Figure"],
  ["action", "Buttons & input"],
  ["container", "Card, Row, Sheet"],
  ["data", "Horizon & rung"],
  ["nav", "Navigation"],
  ["conversation", "Conversation"],
  ["glyph", "Marks & voice"],
  ["state", "Empty & error"],
] as const;

/** Shaped exactly like `project()` output, so the panel is proofed on real data. */
const SAMPLE_PROJECTION: Projection = {
  lowCents: 57_800_000,
  centralCents: 98_000_000,
  highCents: 150_000_000,
  confidence: "assumed",
  spreadMultiplier: 1.35,
  horizonMonths: 300,
  assumptions: [
    { label: "Annual return, after inflation", value: 500, format: "percent", confidence: "assumed" },
    { label: "Put to work each month", value: 100_000, format: "currency", confidence: "assumed" },
    { label: "Cash above your buffer, invested", value: 10_400_000, format: "currency", confidence: "inferred" },
    { label: "Time horizon", value: 300, format: "duration", confidence: "stated" },
    { label: "Excludes anything you haven't told us about", confidence: "assumed" },
  ],
};

export default function DesignGallery() {
  const [chip, setChip] = useState("Own a home");
  const [answer, setAnswer] = useState("");
  const [glyphTurn, setGlyphTurn] = useState<TurnId>("openingConcern");
  const [spoken, setSpoken] = useState("");
  const [offered, setOffered] = useState("");
  const [sheet, setSheet] = useState<null | "derivation" | "assumptions" | "ladder" | "behind" | "membership">(null);
  const [pending, setPending] = useState(false);
  const [deposit, setDeposit] = useState(6_000_000);

  return (
    <div className="mx-auto max-w-[52rem] px-4 pb-24 md:px-8">
      <header className="py-10">
        <Text variant="voice-lg">North Design System</Text>
        <Text variant="body" tone="secondary" className="mt-3 max-w-[60ch]">
          Tokens and components. Spec lives in{" "}
          <code className="type-figure">docs/DESIGN-SYSTEM.md</code>. Contrast
          figures below are measured in your browser from the live tokens, not
          copied from the spec — change a token and this page reports it.
        </Text>
        <nav className="mt-6 flex flex-wrap gap-x-4 gap-y-2">
          {SECTIONS.map(([id, label]) => (
            <a
              key={id}
              href={`#${id}`}
              className="type-meta text-text-secondary underline decoration-dotted decoration-signal-coach underline-offset-4 hover:text-text-primary"
            >
              {label}
            </a>
          ))}
        </nav>
      </header>

      <div className="flex flex-col gap-12">
        {/* ── BRAND ──────────────────────────────────────────────────── */}
        <Section
          id="brand"
          title="Wordmark"
          note="LOCKED. NORTH lettered in the same hairline hand that draws the turn glyphs, with the O replaced by a working compass — and the needle's north point is the one filled shape in the whole identity. Do not redraw: the geometry (cap 28, gaps 9, both needle halves on one pen) was settled by measurement."
        >
          <Specimen name="Wordmark — masthead, product, and door sizes">
            <div className="flex flex-col items-start gap-7 text-text-primary">
              <Wordmark height={12} strokeWidth={2.1} />
              <Wordmark height={13} strokeWidth={2} />
              <Wordmark height={22} strokeWidth={1.7} />
              <Wordmark height={40} />
            </div>
          </Specimen>
          <Specimen
            name="The Plus lockup"
            note="Membership, worn by the mark. The wordmark itself is locked and untouched — the lockup EXTENDS it with a compass rose after the H, at the same optical gap and on the same pen. The rose's vertical axis is the needle's own geometry at half scale, its north point filled exactly as the needle's is: the identity's one filled shape restated, never a second kind of fill. A member's masthead carries this; everyone else's carries NORTH alone. Premium is drawn as more compass, because that is the only ornament this identity owns."
          >
            <div className="flex flex-col items-start gap-7 text-text-primary">
              <Wordmark height={13} strokeWidth={2} plus />
              <Wordmark height={22} strokeWidth={1.7} plus />
              <Wordmark height={40} plus />
            </div>
          </Specimen>
          <Specimen
            name="The Plus lockup, in the aurora"
            note="ONE PLACE ONLY: the moment Plus is being presented — the tier panel's header. Never chrome. A masthead that wears the sky on every screen spends the product's one gradient on furniture, and the one-signal-per-viewport rule would have nothing left for the thing that actually needs attention. Same three stops as .text-aurora, held to the AA-safe half of the ramp, but painted as an SVG gradient: background-clip:text fills glyphs a font drew, and a stroke is not one of those. It must be gradientUnits='userSpaceOnUse' — under the objectBoundingBox default every straight stroke in the mark (both N verticals, the R stem, the T, all of the H, the bezel ticks) has a zero-dimension bounding box and is not rendered at all."
          >
            <div className="flex flex-col items-start gap-7">
              <Wordmark height={13} strokeWidth={2} plus aurora />
              <Wordmark height={22} strokeWidth={1.7} plus aurora />
              <Wordmark height={40} plus aurora />
            </div>
          </Specimen>
          <Specimen
            name="Wordmark on the sky"
            note="The mark is ink or on-deep — never a hue, and never reversed out of a box."
          >
            <div className="atmosphere-swatch flex items-center rounded-card px-6 py-8">
              <Wordmark height={20} strokeWidth={1.8} className="text-text-on-deep" />
            </div>
          </Specimen>
          <Specimen
            name="CompassMark — the O alone"
            note="The app icon and favicon. Identical coordinates to the wordmark's O, cropped square, so the icon is a letter of the name rather than a second drawing."
          >
            <Grid>
              <CompassMark size={48} strokeWidth={1.5} />
              <CompassMark size={32} strokeWidth={1.8} />
              <CompassMark size={24} strokeWidth={2.1} />
              <CompassMark size={16} strokeWidth={2.6} />
            </Grid>
          </Specimen>
        </Section>

        {/* ── COLOR ───────────────────────────────────────────────────── */}
        <Section
          id="color"
          title="Color"
          note="Three families, only three. The primary action is ink, not a hue — that sidesteps the entire fintech color problem. There are no red/green financial semantics, so nothing is encoded in hue and there is no colorblind remediation to do."
        >
          <Specimen name="Ground">
            <SwatchRow
              tokens={[
                { token: "--surface-page", label: "surface-page" },
                { token: "--surface-raised", label: "surface-raised" },
                { token: "--surface-sunken", label: "surface-sunken" },
                { token: "--line-hairline", label: "line-hairline" },
              ]}
            />
          </Specimen>

          <Specimen name="Ink">
            <SwatchRow
              tokens={[
                { token: "--text-primary", label: "text-primary" },
                { token: "--text-secondary", label: "text-secondary" },
                { token: "--text-tertiary", label: "text-tertiary" },
                { token: "--text-disabled", label: "text-disabled" },
              ]}
            />
          </Specimen>

          <Specimen name="Signal">
            <SwatchRow
              tokens={[
                { token: "--signal-coach", label: "signal-coach" },
                { token: "--signal-attention", label: "signal-attention" },
                { token: "--action-border", label: "action-border" },
              ]}
            />
          </Specimen>

          <Specimen
            name="Text contrast"
            note="Every text token must clear 4.5:1 on surface-page. text-tertiary was corrected from #7C746A to #726B62 during authoring — it cleared AA on white cards but failed at 4.34 on the warm page ground."
          >
            <ContrastTable
              against="--surface-page"
              againstLabel="--surface-page"
              requirement={4.5}
              tokens={[
                { token: "--text-primary", use: "The read, figures, primary action" },
                { token: "--text-secondary", use: "Supporting prose, labels" },
                { token: "--text-tertiary", use: "Metadata, timestamps" },
                { token: "--signal-coach", use: "Coach presence, focus ring" },
                { token: "--signal-attention", use: "Attention, max once per view" },
              ]}
            />
          </Specimen>

          <Specimen
            name="Non-text contrast"
            note="Control boundaries and graphics carry a 3:1 gate. line-hairline is intentionally below it — it separates and carries no meaning. text-disabled is barred from text by the same measurement."
          >
            <ContrastTable
              against="--surface-page"
              againstLabel="--surface-page"
              requirement={3}
              tokens={[
                { token: "--action-border", use: "Control boundary — was 1.68, fixed" },
                { token: "--action-border-hover", use: "Control boundary, hover" },
                { token: "--signal-band", use: "Horizon band — solid, never a tint" },
                {
                  token: "--text-disabled",
                  use: "Decorative marks only, never text",
                  byDesign: true,
                },
                {
                  token: "--line-hairline",
                  use: "Separation only — no meaning",
                  byDesign: true,
                },
              ]}
            />
          </Specimen>

          <Specimen
            name="Atmosphere — the coach's sky"
            note="The brand indigo made environmental: sky-900 → sky-600 → sky-300 → paper, interpolated in OKLab. Ground, not signal — it holds the top of a screen and always lands on paper. Text on it uses the on-deep tokens (13.67 / 7.35 / 4.73 verified)."
          >
            <div className="atmosphere !static h-40 rounded-card" />
          </Specimen>
        </Section>

        {/* ── TYPE ────────────────────────────────────────────────────── */}
        <Section
          id="type"
          title="Typography"
          note="Three faces, three jobs. Newsreader is the coach thinking; Geist Mono is the machine computing; Geist Sans is the interface getting out of the way. The largest thing on any screen is a sentence, not a number."
        >
          <Specimen name="type-voice-lg" note="The read. Serif, 400 only, responsive 30 → 34.">
            <Text variant="voice-lg" measure>
              Your $40,000 in checking is the problem, not the win.
            </Text>
          </Specimen>
          <Specimen name="type-voice-md" note="Onboarding questions. At the 20px serif floor.">
            <Text variant="voice-md" measure>
              What&rsquo;s the money thing you keep meaning to deal with?
            </Text>
          </Specimen>
          <Specimen name="type-body">
            <Text variant="body" measure>
              You&rsquo;re holding 11 months of expenses in cash. Three is the floor.
            </Text>
          </Specimen>
          <Specimen
            name="type-overline"
            note="Mono caps micro-label — mastheads, section labels, stat lines. Always a label, never a sentence."
          >
            <div className="flex flex-col gap-2">
              <Text variant="overline" tone="tertiary">
                Today · Jul 27
              </Text>
              <Text variant="overline" tone="tertiary">
                On this path by retirement
              </Text>
            </div>
          </Specimen>

          <Specimen
            name="Emphasis & the aurora word"
            note="A read may emphasize AT MOST one figure — it breaks onto a display-serif line at weight 500, still carrying its confidence mark: the big bold number, inside the sentence. And each screen may fill AT MOST one word with the sky (.text-aurora, stops held to the AA-safe half of the ramp)."
          >
            <div className="type-voice-lg measure text-text-primary">
              The other{" "}
              <span className="type-voice-xl my-1 block font-medium">
                <span className="underline decoration-dotted decoration-signal-coach decoration-1 underline-offset-4">
                  $104,000
                </span>
              </span>
              is waiting on your <span className="text-aurora">attention</span>.
            </div>
          </Specimen>

          <Specimen name="type-label / type-meta / type-figure">
            <div className="flex flex-col gap-2">
              <Text variant="label">Open the IRA</Text>
              <Text variant="meta" tone="tertiary">
                4 of 7 · tax-advantaged space
              </Text>
              <Text variant="figure" as="span">
                $1,247,832
              </Text>
            </div>
          </Specimen>
        </Section>

        {/* ── SCALE ───────────────────────────────────────────────────── */}
        <Section
          id="scale"
          title="Spacing & radius"
          note="Spacing is Tailwind's own 4px scale, deliberately not renamed — the sanctioned steps are 4/8/12/16/24/32/48/64/96. Radius tokens are semantic so `rounded-lg` keeps its framework meaning."
        >
          <Specimen name="Sanctioned spacing steps">
            <ScaleRow
              items={[4, 8, 12, 16, 24, 32, 48, 64, 96].map((px) => ({
                label: `p-${px / 4}`,
                px,
                kind: "space" as const,
              }))}
            />
          </Specimen>
          <Specimen name="Radius">
            <ScaleRow
              items={[
                { label: "rounded-chip", px: 8, kind: "radius" },
                { label: "rounded-control", px: 12, kind: "radius" },
                { label: "rounded-card", px: 20, kind: "radius" },
                { label: "rounded-sheet", px: 28, kind: "radius" },
              ]}
            />
          </Specimen>
        </Section>

        {/* ── ELEVATION & MOTION ──────────────────────────────────────── */}
        <Section
          id="elevation"
          title="Elevation & motion"
          note="Elevation never conveys hierarchy — only that a surface floats above scrolling content. Shadows are warm-tinted; a cool shadow on warm paper reads as dirt."
        >
          <Specimen name="Elevation">
            <Grid>
              <div className="h-20 w-40 rounded-card border border-line-hairline bg-surface-raised p-3">
                <code className="type-meta text-text-tertiary">shadow-card</code>
              </div>
              <div className="h-20 w-40 rounded-card bg-surface-raised p-3 shadow-sheet">
                <code className="type-meta text-text-tertiary">shadow-sheet</code>
              </div>
            </Grid>
          </Specimen>
          <Specimen
            name="Motion"
            note="120 micro · 220 standard · 320 considered · 700 ceremonial. Springs never overshoot. Numbers never animate upward — values cross-fade in place. prefers-reduced-motion collapses everything to opacity."
          >
            <code className="type-figure text-text-secondary">
              --motion-micro · --motion-standard · --motion-considered ·
              --motion-ceremonial
            </code>
          </Specimen>
        </Section>

        {/* ── FIGURE ──────────────────────────────────────────────────── */}
        <Section
          id="figure"
          title="Figure"
          note="The signature component and the only way a number enters the product. Every Figure carries a confidence, and that confidence is part of the accessible name — a screen reader user learns which numbers are theirs and which are North's guesses, exactly as a sighted user does."
        >
          <Specimen
            name="Confidence grammar — prose context"
            note="stated is sharp and unmarked · inferred carries the dotted coach mark · assumed drops to secondary ink with a dashed mark. Inspect with a screen reader: each announces its provenance."
          >
            <p className="type-voice-md text-text-primary measure">
              You hold{" "}
              <Figure value={4_000_000} format="currency" confidence="stated" label="in checking" />{" "}
              in checking — about{" "}
              <Figure value={11} format="duration" confidence="inferred" label="of expenses" />{" "}
              of expenses, growing at{" "}
              <Figure value={600} format="percent" confidence="assumed" label="annual return" />{" "}
              a year.
            </p>
          </Specimen>

          <Specimen
            name="Interrogable"
            note="Renders as a button into the derivation sheet. The mark is small; the hit area is projected to 44px beyond the glyph bounds without disturbing text flow."
          >
            <p className="type-voice-md text-text-primary measure">
              That leaves{" "}
              <Figure
                value={1_800_000}
                format="currency"
                confidence="inferred"
                label="of unused tax-advantaged space"
                interrogable
                onInterrogate={() => setSheet("derivation")}
              />{" "}
              of unused tax-advantaged space this year.
            </p>
          </Specimen>

          <Specimen name="Tabular context" note="Mono, tabular figures, for columns that align.">
            <div className="flex flex-col gap-1">
              {[
                [4_000_000, "stated"],
                [1_800_000, "inferred"],
                [125_000, "assumed"],
              ].map(([value, confidence]) => (
                <Figure
                  key={String(value)}
                  value={value as number}
                  format="currency"
                  confidence={confidence as "stated"}
                  context="tabular"
                />
              ))}
            </div>
          </Specimen>

          <Specimen name="Formats">
            <Grid>
              <Figure value={4_000_000} format="currency" confidence="stated" context="tabular" />
              <Figure value={124_000_000} format="currency" confidence="stated" context="tabular" abbreviate />
              <Figure value={675} format="percent" confidence="stated" context="tabular" />
              <Figure value={24} format="duration" confidence="stated" context="tabular" />
              <Figure value={1284} format="count" confidence="stated" context="tabular" />
            </Grid>
          </Specimen>
        </Section>

        {/* ── ACTION ──────────────────────────────────────────────────── */}
        <Section
          id="action"
          title="Buttons & input"
          note="One primary per screen. Selection is weight and surface, never a color fill. The product has exactly one text field — there is deliberately no form suite."
        >
          <Specimen name="Button variants · md">
            <Grid>
              <Button variant="primary">Commit</Button>
              <Button variant="secondary">Not now</Button>
              <Button variant="quiet">Skip</Button>
            </Grid>
          </Specimen>
          <Specimen name="Button · lg, full width, disabled, pending">
            <div className="flex max-w-sm flex-col gap-3">
              <Button variant="primary" size="lg" fullWidth>
                Open the IRA
              </Button>
              <Button variant="secondary" size="lg" fullWidth disabled>
                Disabled
              </Button>
              <Button
                variant="primary"
                size="lg"
                fullWidth
                pending={pending}
                onClick={() => {
                  setPending(true);
                  window.setTimeout(() => setPending(false), 1400);
                }}
              >
                Tap for pending state
              </Button>
            </div>
          </Specimen>
          <Specimen name="ChoiceChip" note="Selected reads through border weight and surface lift. 44px minimum at every breakpoint, desktop included.">
            <ChoiceChipGroup label="What are you working toward?">
              {["Own a home", "Retire early", "Stop feeling behind", "Not sure yet"].map(
                (option) => (
                  <ChoiceChip
                    key={option}
                    selected={chip === option}
                    onSelect={() => setChip(option)}
                  >
                    {option}
                  </ChoiceChip>
                ),
              )}
            </ChoiceChipGroup>
          </Specimen>
          <Specimen
            name="Slider"
            note="Built on native input[type=range], so the slider role, arrow stepping and touch come from the platform — only the paint is ours. The thumb is ink, like every primary control. `valueLabel` is what a screen reader announces, so it hears money rather than 6000000. Chips remain right for discrete choices; this is for ranges you want to explore."
          >
            <div className="max-w-sm">
              <Slider
                label="Deposit"
                min={2_000_000}
                max={20_000_000}
                step={500_000}
                value={deposit}
                onChange={setDeposit}
                valueLabel={`$${(deposit / 100).toLocaleString("en-US")}`}
                minLabel="$20,000"
                maxLabel="$200,000"
              />
            </div>
          </Specimen>

          <Specimen name="TextField" note="Auto-growing, no placeholder, no label chrome — the question above it is the label. Enter submits; Shift+Enter breaks the line.">
            <div className="max-w-md">
              <Text variant="voice-md" className="mb-4">
                What&rsquo;s the money thing you keep meaning to deal with?
              </Text>
              <TextField
                value={answer}
                onChange={setAnswer}
                label="What's the money thing you keep meaning to deal with?"
              />
            </div>
          </Specimen>
        </Section>

        {/* ── CONTAINERS ──────────────────────────────────────────────── */}
        <Section
          id="container"
          title="Card, Row, Sheet"
          note="North has exactly one card and it is the decision — three variants, not three components. History is rows, not cards; that contrast is what makes the card mean something."
        >
          <Specimen name="Card · decision">
            <Card
              variant="decision"
              read={
                <>
                  Your{" "}
                  <Figure
                    value={4_000_000}
                    format="currency"
                    confidence="stated"
                    label="in checking"
                    interrogable
                    onInterrogate={() => setSheet("derivation")}
                  />{" "}
                  in checking is the problem, not the win.
                </>
              }
              rung={<RungIndicator rung={4} label="tax-advantaged space" />}
              primaryAction={
                <Button variant="primary" size="lg" fullWidth>
                  I&rsquo;ll do this
                </Button>
              }
              secondaryAction={
                <Button variant="secondary" size="lg" fullWidth>
                  Not now
                </Button>
              }
              horizon={
                <HorizonBand
                  low={120_000_000}
                  high={180_000_000}
                  confidence="assumed"
                  horizon="by 65"
                  domainMax={220_000_000}
                  onShowAssumptions={() => setSheet("assumptions")}
                />
              }
            />
          </Specimen>

          <Specimen name="Card · callback" note="The return state. The moat, in one sentence.">
            <Card
              variant="callback"
              read="You said you'd open the IRA. Did that happen?"
              primaryAction={
                <Button variant="primary" size="lg" fullWidth>
                  Yes, done
                </Button>
              }
              secondaryAction={
                <Button variant="secondary" size="lg" fullWidth>
                  Not yet
                </Button>
              }
            />
          </Specimen>

          <Specimen name="Card · satisfied" note="A reward state, not an empty state.">
            <Card
              variant="satisfied"
              read="Nothing needs your attention. That's rare."
            />
          </Specimen>

          <Specimen
            name="Row · three outcomes"
            note="held · deferred · open. There is deliberately no failed, missed, or overdue — guilt is a retention bug. Marks come from ONE shared component (OutcomeMark) rather than being drawn per surface: Row kept its own set until July 2026, including a bare minus for deferred, which is the shape review rejected for reading as deletion. Distinguished by SHAPE, never hue — a tick for held, a returning loop for set aside (it comes back around), an unclosed ring for the one still waiting. Dashing the tick to mean deferred was tried twice and abandoned: at 16px only silhouette survives."
          >
            <div>
              <Row
                outcome="held"
                figure={<Figure value={700_000} format="currency" confidence="stated" context="tabular" />}
                timestamp="3 weeks ago"
                onSelect={() => undefined}
              >
                Opened a Roth IRA
              </Row>
              <Row
                outcome="deferred"
                timestamp="last month"
                onSelect={() => undefined}
              >
                Increase 401k to the match
              </Row>
              <Row outcome="open" timestamp="today">
                Move eight months of cash out of checking
              </Row>
            </div>
          </Specimen>

          <Specimen
            name="Sheet — every overlay in the product"
            note="Native <dialog> — focus trap, Esc, and focus restoration come from the platform. Below lg (1024px) it is a bottom sheet with drag-to-dismiss; at lg and up a full-height pane pinned to the right edge. Never a centered modal: a modal reads as a separate surface hovering over the page, and a disclosure is closer to the rest of what is already on screen. Tablet sits on the sheet side of that split — the surface is still held and tapped, not pointed at. Opening pushes a history entry so system back dismisses it. Resize the window to see both presentations. All three buttons below open the SAME component; only the header differs — a plain label for one number's arithmetic, an eyebrow-and-thesis for reasoning meant to be read."
          >
            <Grid>
              <Button variant="secondary" onClick={() => setSheet("derivation")}>
                Open derivation
              </Button>
              <Button variant="secondary" onClick={() => setSheet("assumptions")}>
                Open assumptions
              </Button>
              <Button variant="secondary" onClick={() => setSheet("ladder")}>
                Open the ladder
              </Button>
            </Grid>
          </Specimen>
        </Section>

        {/* ── DATA ────────────────────────────────────────────────────── */}
        <Section
          id="data"
          title="Horizon & rung"
          note="MVP contains one visualization, and calling it a chart overstates it. No axes, no gridlines, no legend, no tooltip."
        >
          <Specimen
            name="HorizonBand — the width IS the uncertainty"
            note="Both bands share a domain. The top is a confident profile; the bottom is the same projection with less known about the person. You can see that North knows less without reading a word."
          >
            <div className="flex flex-col gap-8">
              <HorizonBand
                low={140_000_000}
                high={165_000_000}
                confidence="inferred"
                horizon="by 65"
                domainMax={220_000_000}
                onShowAssumptions={() => setSheet("assumptions")}
              />
              <HorizonBand
                low={95_000_000}
                high={205_000_000}
                confidence="assumed"
                horizon="by 65"
                domainMax={220_000_000}
                onShowAssumptions={() => setSheet("assumptions")}
              />
            </div>
          </Specimen>

          <Specimen
            name="HorizonField — the projection as a landscape"
            note="The large-format sibling of HorizonBand, for when the projection IS the subject (Goals, the calm day). The in-band bars breathe on a slow stagger — uncertainty is alive — and with onScrub it becomes a real slider: drag to move the horizon year under a plumb-line cursor. role=slider with arrow keys and the year in aria-valuetext."
          >
            <HorizonField
              low={57_800_000}
              high={150_000_000}
              central={93_800_000}
              confidence="assumed"
              months={300}
              height={120}
            />
          </Specimen>

          <Specimen
            name="RungIndicator"
            note="Typography is the primary form; ticks are a quiet secondary. Never celebrates advancement — no animation on change, no completion state, no streak."
          >
            <div className="flex flex-col gap-3">
              <RungIndicator rung={1} label="liquidity floor" />
              <RungIndicator rung={4} label="tax-advantaged space" />
              <RungIndicator rung={7} label="optimization" />
              <RungIndicator rung={4} label="tax-advantaged space" showTicks={false} />
            </div>
          </Specimen>

          <Specimen
            name="InsightSheet"
            note="The room behind one dispatch in the letter. Every sentence on Insights is the visible tip of a real calculation — the buffer entry sits on explain(), the ladder entry on a full evaluate(), the record entry on the actual ledger — and none of it was reachable. It uses ExplanationPanel, not DerivationSheet, per the distinction the system already draws: a DerivationSheet shows ONE number's arithmetic, an ExplanationPanel shows the reasoning behind a whole answer, meant to be read. core/insights/behind.ts returns null where there is nothing honest to add, and then the dispatch simply isn't openable — a room that opens onto 'there is nothing here' is worse than a sentence that never offered to open."
          >
            <Button variant="secondary" onClick={() => setSheet("behind")}>
              Open the room
            </Button>
            <InsightSheet
              detail={sheet === "behind" ? BEHIND_SPECIMEN : null}
              onClose={() => setSheet(null)}
            />
          </Specimen>

          <Specimen
            name="MembershipSheet"
            note="Plus proposed, managed, and ended in one room — the same sheet from every entry point, so manage is never a different place than the one that sold it to you. Opened contextually (a locked scenario row, the voice launcher on free, a second goal), never as an interstitial; managed from the masthead's PLUS wordlet, which shows only to members — status, never an ad. The honesty line (NEVER_GATED) ships from core with the rules it describes, and the rules' tests assert it still tells the truth. Ending is one tap, runs to period end, and 'Keep Plus' undoes it in place: no confirmation dialog, no retention flow. The state shown depends on the live membership store — flip it with the tier toggle on /preview."
          >
            <Button variant="secondary" onClick={() => setSheet("membership")}>
              Open the room
            </Button>
            <MembershipSheet
              open={sheet === "membership"}
              onClose={() => setSheet(null)}
            />
          </Specimen>

          <Specimen
            name="RouteMarks"
            note="Where you are on a route: answered, here, still to come. Onboarding drew this twice in two different visual languages — the phone strip used equal-width bars separated only by opacity, the desktop rail used varying length plus three colour tokens — so the same information changed vocabulary at 1024px. One vocabulary now, and the richer of the two: here is long and full strength, answered is short and half lit, to come is short and barely there. Length AND weight carry it, so it survives a glance in a masthead and never rests on colour alone. Marks paint in currentColor and know nothing about their ground, which is what lets one definition hang on the sky and on paper. `onJump` is optional like RungIndicator's `onInterrogate`: a desktop margin has room to give every mark a real 44px target, a phone masthead does not — ten of those is 440px of touch target in 375px of screen — so the strip is decorative and going back there is the swipe."
          >
            <div className="flex flex-col gap-8">
              <RouteMarks marks={ROUTE_SPECIMEN} />
              <div className="flex items-start gap-10">
                <RouteMarks marks={ROUTE_SPECIMEN} direction="col" />
                <RouteMarks
                  marks={ROUTE_SPECIMEN}
                  direction="col"
                  label="Specimen progress"
                  onJump={() => undefined}
                />
              </div>
              {/* The sky ground, where the phone strip actually hangs. */}
              <div className="relative overflow-hidden rounded-chip">
                <Sky className="absolute inset-0" />
                <div className="relative px-5 py-6 text-text-on-deep">
                  <RouteMarks marks={ROUTE_SPECIMEN} />
                </div>
              </div>
            </div>
          </Specimen>

          <Specimen
            name="SectionHeading"
            note="The heading that opens a block within a screen — and it takes no tone and no variant. A section variant existed and every heading used it, but each call site picked its own tone, so one rank was rendering at three greys across the product and the horizon caption had drifted to type-overline entirely. A rank whose appearance is chosen per call site is not a rank. Mono caps 13/500/0.1em — heavier and larger than type-overline, which is the quieter mark reserved for a page's dateline."
          >
            <div className="flex flex-col gap-5">
              <SectionHeading>What you&rsquo;re working toward</SectionHeading>
              <SectionHeading>On this path by retirement</SectionHeading>
              <SectionHeading>Where this leaves you</SectionHeading>
              <SectionHeading>Or start from one of these</SectionHeading>
            </div>
          </Specimen>

          <Specimen
            name="RungIndicator — interrogable"
            note="With onInterrogate it becomes a button into the ladder disclosure, wearing the same dotted rule an INFERRED figure wears — because that is what it is: a derived reading of your situation. It states a position, and a position invites exactly one question: what are the other six, and why is this one mine? Without the disclosure the mark was a dead end, which is the one thing no figure in North may be — a number the reader cannot interrogate is a number taken on faith."
          >
            <RungIndicator
              rung={4}
              label="tax-advantaged space"
              onInterrogate={() => setSheet("ladder")}
            />
          </Specimen>
        </Section>

        {/* ── NAV ─────────────────────────────────────────────────────── */}
        <Section
          id="nav"
          title="Navigation"
          note="MVP shipped with no tab bar: two destinations of unequal weight are a push relationship, and the shell was built to accept one later. Four destinations — Today, Decisions, Navigator, Insights — is the documented trigger, so it exists now."
        >
          <Specimen
            name="TabBar"
            note="Two postures: a floating pill dock in thumb reach on mobile, a segmented row on the atmosphere from md up — shown here on its deep ground. Labels, no icons. Introduced only once four destinations existed."
          >
            <div className="rounded-card bg-surface-deep px-5 py-2">
              <TabBar
                items={[
                  { href: "/today", label: "Today" },
                  { href: "/decisions", label: "Decisions" },
                  { href: "/navigator", label: "Navigator" },
                  { href: "/insights", label: "Insights" },
                ]}
                current="/today"
                onNavigate={(_, event) => event.preventDefault()}
                className="!static !translate-x-0 !border-0 !bg-transparent !p-0 !py-4 !shadow-none"
              />
            </div>
          </Specimen>

          <Specimen name="AppBar" note="Transparent at rest; the hairline appears only once content scrolls beneath it.">
            <AppBar title="Decisions" onBack={() => undefined} />
          </Specimen>
          <Specimen name="ContinuityStrip" note="History sitting directly beneath the present decision.">
            <ContinuityStrip summary="4 decisions with North" onOpenLedger={() => undefined}>
              <Row outcome="held" timestamp="3 weeks ago">
                Opened a Roth IRA
              </Row>
              <Row outcome="deferred" timestamp="last month">
                Increase 401k to the match
              </Row>
            </ContinuityStrip>
          </Specimen>
        </Section>

        {/* ── CONVERSATION ────────────────────────────────────────────── */}
        <Section
          id="conversation"
          title="Conversation"
          note="The turn primitive for the correction loop and goal capture — the reuse that removes a settings screen from the IA. Onboarding itself composes full-viewport sections and no longer uses this. One question at a time, and no workload meter."
        >
          <Specimen name="ConversationTurn — answered, then active">
            <div className="flex flex-col gap-8">
              <ConversationTurn
                question="What's the money thing you keep meaning to deal with?"
                answered
                answer="I have cash piling up and no idea what to do with it."
              />
              <ConversationTurn
                question="Roughly what does your household bring in?"
                onBack={() => undefined}
              >
                <ChoiceChipGroup label="Household income" block>
                  {["Under $100k", "$100k – $200k", "$200k – $400k", "Over $400k"].map(
                    (band) => (
                      <ChoiceChip key={band} block>
                        {band}
                      </ChoiceChip>
                    ),
                  )}
                </ChoiceChipGroup>
              </ConversationTurn>
            </div>
          </Specimen>
          <Specimen name="CoachPresence" note="The considered pause. 400–600ms, and it must always resolve into visible content. Not a spinner — there are no spinners.">
            <Grid>
              <CoachPresence size="sm" />
              <CoachPresence size="md" />
            </Grid>
          </Specimen>
        </Section>

        {/* ── TURN GLYPH & VOICE ──────────────────────────────────────── */}
        <Section
          id="glyph"
          title="Marks & voice"
          note="Product-tier marks (components/north), shown here so the system stays honest about every mark it makes. Six hairline strokes on a uniform skeleton — every figure interpolates into every other; nothing is ever swapped."
        >
          <Specimen
            name="TurnGlyph — the morph"
            note="Pick a figure and watch the same six lines re-arrange on SPRING.fluid. The component is mounted once and fed new turn ids — keying it on the turn would remount, and a remount is a swap, not a morph."
          >
            <div className="flex flex-col gap-6">
              <TurnGlyph
                turnId={glyphTurn}
                className="h-24 w-[144px] text-text-secondary"
              />
              <ChoiceChipGroup label="Figure">
                {(Object.keys(TURN_GLYPH) as TurnId[]).map((id) => (
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
            name="Every figure"
            note="Authored as anchor grids, never as path data: 6 strokes × 6 anchors through one Catmull-Rom converter, so every figure compiles to the same M + 5C skeleton. Layered stroke opacities give depth; the ambient drift stills under reduced motion."
          >
            <div className="grid grid-cols-3 gap-x-6 gap-y-8 md:grid-cols-5">
              {(Object.keys(TURN_GLYPH) as TurnId[]).map((id) => (
                <div key={id} className="flex flex-col items-start gap-2">
                  <TurnGlyph
                    turnId={id}
                    className="h-14 w-[84px] text-text-secondary"
                  />
                  <span className="type-meta text-text-tertiary">
                    {TURN_GLYPH[id].name}
                  </span>
                </div>
              ))}
            </div>
          </Specimen>
          <Specimen
            name="ExplanationPanel — AssumptionsPanel and the ladder"
            note="A skin over Sheet, not a second dialog. It used to be a bespoke full-height room under its own band of sky, with its own Escape listener, its own scroll lock, no history entry and no exit animation. The sky went because a masthead-sized band of atmosphere read as chrome bolted onto a room that otherwise wears the same surface as every other sheet; the hand-rolled dismissal went because it was a worse copy of what <dialog> already gives. What is genuinely its own is the HEADER: an eyebrow and a full sentence in the coach's voice, because the reasoning behind a whole answer is meant to be read, where a number's receipt is scanned and dismissed in ten seconds. Same body surface, same breakpoints, same four ways out."
          >
            <div className="flex flex-col items-start gap-3">
              <Button
                variant="secondary"
                onClick={() => setSheet("assumptions")}
              >
                Open the panel
              </Button>
            </div>
          </Specimen>
          <Specimen
            name="SpokenField"
            note="The opening turn's answer, and Navigator's door. A composer: an opening quote, your words in the voice face, and the actions inside one sheet — the box contains real things, so it never reads as a void. The hanging quote is load-bearing: Today opens with 'You said …', so what you write here is literally what the coach quotes back. Raised white, hairline edge, no shadow — the one elevated thing on a screen is the Card — and focus darkens the sheet's own border rather than drawing a ring inside it. Click anywhere on the sheet to write. The mic pill appears only where the Web Speech API exists (gated on hydration, so SSR never guesses), and no listening failure is ever announced."
          >
            <SpokenField
              value={spoken}
              onChange={setSpoken}
              label="What's the money thing you keep meaning to deal with?"
            />
          </Specimen>
          <Specimen
            name="SpokenField — with offers"
            note="The same field, carrying the questions worth asking. They occupy the placeholder's position and clear the moment you type, but they are BUTTONS, not placeholder text: core/coach/offers.ts exists because seven of the eleven things this coach can answer had no tap path anywhere in the product, and real placeholder text would put six of them back out of reach and show the seventh. Set in the voice face and italic — the same face your typed words take — because tapping one IS saying it, and wearing the dotted signal-coach rule every other tappable thing in the product wears. The field and the offers share one grid cell, so the writing area sizes itself to whichever is taller and no count needs a magic height."
          >
            <SpokenField
              value={offered}
              onChange={setOffered}
              label="Ask North a question in your own words"
              suggestions={[
                "How am I doing?",
                "Why that first?",
                "What’s changed?",
              ]}
              onSuggest={setOffered}
            />
          </Specimen>
          <Specimen
            name="Action marks"
            note="North has no icon library and will not gain one — every mark comes from the same hairline pen as the glyphs and the horizon fan. Every mark here was chosen in user review — July 2026 for the first set, August for the account’s four — after the losing drawings failed the 16px read. Candidates are judged in the ROW they join, never alone: a mark’s job is to be told apart from its neighbours, and “Hide it” beside “Download it” is where the mirrored-tray candidate died, and “I’ve already done this” sits next to BackMark for the same reason. 1.25 stroke on a 16 grid, a hair lighter than the nav glyphs because they sit beside meta text and must not outweigh it. The mark is OPTIONAL — “Never mind” goes bare on purpose, being the quiet half of a pair beside a bordered pill."
          >
            <div className="flex flex-col items-start gap-1">
              <ActionLink icon={<AssumedMark />} onClick={() => undefined}>
                What&rsquo;s assumed
              </ActionLink>
              <ActionLink icon={<SignpostMark />} onClick={() => undefined}>
                Name another
              </ActionLink>
              <ActionLink icon={<AdjustMark />} onClick={() => undefined}>
                Adjust this one
              </ActionLink>
              <ActionLink icon={<ReleaseMark />} onClick={() => undefined}>
                Let this one go
              </ActionLink>
              <ActionLink icon={<HorizonMark />} onClick={() => undefined}>
                The long view
              </ActionLink>
              <ActionLink icon={<LedgerMark />} onClick={() => undefined}>
                Everything you&rsquo;ve decided
              </ActionLink>
              <ActionLink icon={<StoryMark />} onClick={() => undefined}>
                Watch how you got here
              </ActionLink>
              <ActionLink icon={<BackMark />} onClick={() => undefined}>
                Navigator
              </ActionLink>
              <ActionLink icon={<AjarMark />} onClick={() => undefined}>
                Leave it as it is
              </ActionLink>
              <ActionLink icon={<OpenBookMark />} onClick={() => undefined}>
                Or borrow a story and watch it work
              </ActionLink>
              <ActionLink icon={<SpeakMark />} onClick={() => undefined}>
                Say the numbers too
              </ActionLink>
              <ActionLink icon={<SalutationMark />} onClick={() => undefined}>
                Call me something else
              </ActionLink>
              <ActionLink icon={<ReceiveMark />} onClick={() => undefined}>
                Coming from another device instead
              </ActionLink>
              <ActionLink icon={<DownloadMark />} onClick={() => undefined}>
                Download it
              </ActionLink>
              <ActionLink icon={<HiddenMark />} onClick={() => undefined}>
                Hide it
              </ActionLink>
              <ActionLink icon={<UnchangedMark />} onClick={() => undefined}>
                Still right
              </ActionLink>
              <ActionLink icon={<CorrectionMark />} onClick={() => undefined}>
                Change it
              </ActionLink>
              <ActionLink icon={<BehindMark />} onClick={() => undefined}>
                I&rsquo;ve already done this
              </ActionLink>
              {/* Not an ActionLink in the product — the Steady line is a
                  STATE, not something you can press. Shown in the row so the
                  set can be read together. */}
              <ActionLink icon={<WaitingMark />} onClick={() => undefined}>
                Recorded. I&rsquo;ll ask you Friday. (a state, not an action)
              </ActionLink>
              {/* Adjacent on purpose: these two are the closest pair in the
                  set, and the gallery is where that has to be checkable. The
                  filled marker is the whole difference. */}
              <ActionLink icon={<BackMark />} onClick={() => undefined}>
                Navigator (BackMark, for comparison)
              </ActionLink>
              {/* The null option is part of the pattern, not an omission. */}
              <ActionLink onClick={() => undefined}>Never mind</ActionLink>
            </div>
          </Specimen>
          <Specimen
            name="Why these shapes"
            note="Asterisk: print's own footnote mark — 'there is fine print behind this figure,' which is exactly what the assumptions disclosure is. Signpost: naming a goal is putting up the sign that says where next — the product's verb (name a destination), not the spreadsheet's (add a row). Wind: gusts curling away — released to the weather, kind rather than punitive, and the sky already owns the weather. Direction in Insights is two ticks on a ground line — before and after, a comparison drawn as a comparison. Rejected on the way here, recorded so they aren't re-proposed: bare dashes (hamburger menu), a minus (deletion), abstract domes (illegible at 16px), balloon/bird/kite (draw badly at this size)."
          >
            <Grid>
              <div className="flex items-center gap-3 text-text-secondary">
                <AssumedMark />
                <span className="type-meta text-text-tertiary">assumed</span>
              </div>
              <div className="flex items-center gap-3 text-text-secondary">
                <SignpostMark />
                <span className="type-meta text-text-tertiary">name</span>
              </div>
              <div className="flex items-center gap-3 text-text-secondary">
                <ReleaseMark />
                <span className="type-meta text-text-tertiary">release</span>
              </div>
              <div className="flex items-center gap-3 text-text-secondary">
                <DirectionMark direction="up" />
                <span className="type-meta text-text-tertiary">direction</span>
              </div>
            </Grid>
          </Specimen>
          <Specimen
            name="ActionLink — the tertiary action, and the only one"
            note="ONE shape for every quiet action: a drawn mark, then a label carrying a dotted rule in signal-coach — the same rule an inferred Figure wears, because it means the same thing (there is more behind this). Before the pattern, tertiary actions were a scatter of bare text buttons with trailing arrows in three type sizes, and the only way to know one was pressable was to try it. A trailing arrow is NOT part of it: the mark leads, and an arrow on the other end is a second icon saying the same thing. Also: a quiet Button carries padding, so its label sits indented from the content it belongs to and no negative margin fixes that honestly. This is flush left by construction; hit-target grows the touch area to 44px without adding a visual box, so the alignment stays true."
          >
            <div className="flex flex-col gap-2">
              <Text variant="body" tone="secondary">
                Body text sets the left edge.
              </Text>
              <ActionLink icon={<SignpostMark />} onClick={() => undefined}>
                And the action meets it
              </ActionLink>
              <Button variant="quiet" className="self-start">
                A quiet Button does not
              </Button>
            </div>
          </Specimen>
          <Specimen
            name="MarkedLine — the mark sits on the line, not near it"
            note="ActionLink is a mark against one line; this is a mark against a sentence that wraps. `items-start` aligns two BOXES, which is not the same as aligning a glyph with text — a 16px mark inside a 26px line box sits five pixels high of where the eye expects it. Every such row had grown its own hand-tuned nudge (mt-2, mt-1, mt-[0.45em]), and by August 2026 all three were wrong: each was measured once against one type size and then outlived it. The em-based one was the worst kind of wrong, because it moved when the type changed but in the wrong direction — a correction that tracks the type and still misses is harder to spot than one that never moves. This takes the measurement the browser already has: the mark's wrapper is h-[1lh], exactly one line-height of the row it sits on, so a glyph centred inside it is centred on the line at any size, with no number in the source. The one rule it asks for — the type class goes on the ROW — is also why it cannot drift: the declaration that sets the line and the declaration that measures it are the same one."
          >
            <div className="flex flex-col gap-5">
              {(
                [
                  ["type-meta", "Meta, on an 18px line"],
                  ["type-body", "Body, on a 26px line"],
                  ["type-voice-md", "Voice, on a 34px line"],
                ] as const
              ).map(([typeClass, label]) => (
                <MarkedLine
                  key={typeClass}
                  mark={<WaitingMark />}
                  className={`${typeClass} measure text-text-secondary`}
                >
                  {label}. The glyph is the same 16px drawing in all three, and
                  it stays level with the first line however far the sentence
                  runs on past it.
                </MarkedLine>
              ))}
            </div>
          </Specimen>
        </Section>

        {/* ── STATE ───────────────────────────────────────────────────── */}
        <Section
          id="state"
          title="Empty & error"
          note="An empty state is never 'no data' — it is 'here's what happens next'. An error must never imply the user's money is affected, and the coach never breaks character."
        >
          <Specimen name="EmptyState">
            <EmptyState
              title="Nothing here yet."
              body="The first decision you make will land here, along with whether you held it."
              action={<Button variant="secondary">Back to today</Button>}
            />
          </Specimen>
          <Specimen
            name="ErrorState"
            note="`unaffected` is a required prop — you cannot render an error here without saying what is still fine."
          >
            <ErrorState
              title="I can't pull your plan together right now."
              unaffected="Nothing about your situation has changed, and every decision you've made is still recorded."
              action={<Button variant="secondary">Try again</Button>}
            />
          </Specimen>
        </Section>
      </div>

      {/* ── Sheets ─────────────────────────────────────────────────────── */}
      <Sheet
        open={sheet === "derivation"}
        onClose={() => setSheet(null)}
        title={<h2 className="type-label text-text-tertiary">Where this comes from</h2>}
      >
        <div className="flex flex-col">
          {[
            { label: "Checking balance", value: 4_000_000, confidence: "stated" },
            { label: "Monthly expenses", value: 362_000, confidence: "stated" },
            { label: "Unused 401k space", value: 1_800_000, confidence: "inferred" },
          ].map((field) => (
            <div
              key={field.label}
              className="flex items-baseline justify-between gap-4 border-b border-line-hairline py-3"
            >
              <span className="type-body text-text-secondary">{field.label}</span>
              <Figure
                value={field.value}
                format="currency"
                confidence={field.confidence as "stated"}
                context="tabular"
              />
            </div>
          ))}
          <p className="type-meta mt-4 text-text-tertiary">
            Tap a dashed figure to correct it — the coach asks one question rather
            than opening a settings form.
          </p>
        </div>
      </Sheet>

      <LadderPanel
        open={sheet === "ladder"}
        onClose={() => setSheet(null)}
        currentIndex={4}
        ladder={[
          { id: "liquidity", index: 1, label: "liquidity floor", satisfied: true },
          { id: "match", index: 2, label: "employer match", satisfied: true },
          { id: "high-interest-debt", index: 3, label: "high-interest debt", satisfied: true },
          { id: "tax-advantaged", index: 4, label: "tax-advantaged space", satisfied: false },
          { id: "goal", index: 5, label: "goal funding", satisfied: false },
          { id: "taxable", index: 6, label: "surplus with nowhere to go", satisfied: false },
          { id: "optimization", index: 7, label: "optimization", satisfied: false },
        ]}
      />

      <AssumptionsPanel
        open={sheet === "assumptions"}
        onClose={() => setSheet(null)}
        projection={SAMPLE_PROJECTION}
      />
    </div>
  );
}

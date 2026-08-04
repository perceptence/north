"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Button,
  Card,
  ChoiceChip,
  ChoiceChipGroup,
  HorizonBand,
  RHYTHM,
  SectionHeading,
  Slider,
  Text,
  TRANSITION,
  m,
} from "@/components/nds";
import {
  formatCount,
  formatCurrency,
  formatMonths,
  formatPercent,
  type FigureFormat,
} from "@/core/money";
import { cn } from "@/lib/cn";
import { useHydrated } from "@/lib/use-hydrated";
import {
  answerScenario,
  availableScenarios,
  scenarioById,
  type ParamSet,
  type Scenario,
  type ScenarioAnswer,
  type ScenarioId,
  type Side,
  type Verdict,
} from "@/core/navigator";
import { ILLUSTRATIVE_LIMITS } from "@/core/waterfall";
import { useDecisions } from "@/state/decisions-store";
import { useBaselineProfile, useProfile } from "@/state/profile-store";
import { ActionLink, AssumedMark, BackMark } from "./ActionGlyphs";
import { CoachConversation } from "./CoachConversation";
import { ExplanationPanel } from "./ExplanationPanel";
import { ReadProse } from "./ReadProse";

/**
 * The Navigator.
 *
 * ── ASK IN YOUR OWN WORDS, ANSWERED BY THE ENGINE ─────────────────────────
 * The screen used to offer five fixed questions and nothing else, which told
 * the user the product thinks about exactly five things. It doesn't — the
 * engine can reason about any of these situations; what was missing was a
 * door.
 *
 * So there is a field now. What it does NOT do is generate an answer: it
 * ROUTES (core/navigator/match.ts). Whatever is typed resolves to a scenario
 * the engine can genuinely compute, the answer comes from the same seven
 * rules that produce Today, and when nothing matches North says so plainly
 * rather than improvising. That keeps the product's central promise — the
 * engine never depends on a model call to produce an answer — while removing
 * the wall the user actually hit.
 *
 * ── THE ANSWER IS ITS OWN VIEW ────────────────────────────────────────────
 * Opening an answer replaces the question list rather than appending under
 * it, and the back affordance belongs to the answer's own header — the
 * earlier version rendered a floating AppBar as a sibling of the page title,
 * which is what made the top of the screen look broken.
 */

/** The verdict word, set like a magazine deck. */
const VERDICT_WORD: Record<Verdict, string> = {
  yes: "Yes,",
  "yes-with-changes": "Yes \u2014 with changes.",
  "not-yet": "Not yet.",
};

/** Clay ONLY where the verdict is the screen's attention; ink for assent. */
const VERDICT_CLASS: Record<Verdict, string> = {
  yes: "text-text-primary",
  "yes-with-changes": "text-text-primary",
  "not-yet": "text-signal-attention",
};

export function NavigatorScreen() {
  const router = useRouter();
  const profile = useProfile();
  const [now] = useState(() => new Date());
  const previous = useBaselineProfile(now);
  const hydrated = useHydrated();

  const [selected, setSelected] = useState<ScenarioId | null>(null);
  const [params, setParams] = useState<ParamSet>({});

  useEffect(() => {
    if (hydrated && !profile) router.replace("/start");
  }, [hydrated, profile, router]);

  const scenarios = useMemo(
    () => (profile ? availableScenarios(profile) : []),
    [profile],
  );

  // The conversation answers from the whole engine, not just scenarios, so it
  // needs the ledger and the same options every other surface evaluates with.
  const decisions = useDecisions();
  const options = useMemo(
    () => ({ limits: ILLUSTRATIVE_LIMITS, now }),
    [now],
  );

  // Recomputed on every parameter change. Cheap enough to do inline — the
  // engine does no I/O and memoising it would buy nothing but a stale-value
  // bug class.
  const answer: ScenarioAnswer | null =
    profile && selected
      ? answerScenario(scenarioById(selected), profile, params, {
          limits: ILLUSTRATIVE_LIMITS,
          now,
        })
      : null;

  if (!hydrated || !profile) return null;

  const scenario: Scenario | null = selected ? scenarioById(selected) : null;

  const choose = (id: ScenarioId) => {
    setSelected(id);
    setParams(scenarioById(id).defaults);
  };

  const reset = () => {
    setSelected(null);
    setParams({});
  };

  // Routing now lives in `core/coach` and runs inside the conversation —
  // matchQuestion is still the scenario half of it, called from there.

  if (answer) {
    return (
      <Answer
        answer={answer}
        scenario={scenario!}
        params={params}
        onParam={(id, value) =>
          setParams((current) => ({ ...current, [id]: value }))
        }
        onReset={reset}
      />
    );
  }

  return (
    <div className={cn("flex flex-col pb-16", RHYTHM.screen)}>
      {/* The question IS the page's heading. With the tab name gone from
          the bar this is the h1, which is where it always belonged — the dock
          says which tab you are on, so naming it again was saying it twice. */}
      {/* The question and the field answering it are ONE pair. They used to
          sit a full screen-gap apart — further than a heading sits from its
          own list — so the thing that belongs together looked less related
          than the thing that doesn't. */}
      <div className={cn("flex flex-col", RHYTHM.heading)}>
        <Text variant="voice-lg" as="h1">
          What would you like to think through?
        </Text>

        {/* Navigator IS the conversation now, rather than a box that jumps to
            an answer page. It was always the coach-question surface — and the
            dock is capped at four destinations with "Coach" explicitly
            deferred (CLAUDE.md), so this is where a coach you talk to belongs
            without inventing a fifth tab.

            The refusal and the which-one-did-you-mean prompt moved INTO the
            thread, where they read as the coach answering rather than as the
            page reporting an error. */}

        <CoachConversation
          profile={profile}
          decisions={decisions}
          options={options}
          scenarios={scenarios}
          previousProfile={previous?.profile ?? null}
          previousAt={previous?.at ?? null}
          onOpenScenario={choose}
        />
      </div>


      {/* The curated set, as a real table of contents rather than a stack of
          plain links: each row states the question and what it turns on. */}
      <div className={cn("flex flex-col", RHYTHM.heading)}>
        <SectionHeading>
          Or start from one of these
        </SectionHeading>

        {/* `border-b` on the list closes it. With rules only BETWEEN rows the
            last question had nothing under it, so the table of contents just
            stopped rather than ending. */}
        <ul className="flex flex-col border-b border-line-hairline">
          {scenarios.map((s, index) => (
            <li
              key={s.id}
              className="border-t border-line-hairline first:border-t-0"
            >
              <button
                type="button"
                onClick={() => choose(s.id)}
                /* The hover fill BLEEDS past the measure on both sides. Ending
                   flush with the text made it read as a highlighted paragraph
                   rather than a row you can press — a row's target is the
                   whole line, and the fill should say so. The bleed stays
                   inside the host gutter (px-4 md:px-6) so nothing scrolls
                   sideways, and the rule stays on the measure: the divider
                   belongs to the list, the fill belongs to the row. */
                className="group -mx-3 flex w-[calc(100%+1.5rem)] cursor-pointer items-baseline gap-4 rounded-card px-3 py-5 text-left transition-colors duration-[--motion-micro] hover:bg-surface-sunken md:-mx-4 md:w-[calc(100%+2rem)] md:px-4"
              >
                <span className="type-figure w-5 shrink-0 text-text-tertiary tabular-nums">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <span className="type-voice-md flex-1 text-text-secondary transition-colors duration-[--motion-micro] group-hover:text-text-primary">
                  {s.question}
                </span>
                <span
                  aria-hidden="true"
                  className="type-meta shrink-0 text-text-tertiary transition-transform duration-[--motion-micro] group-hover:translate-x-0.5"
                >
                  &rarr;
                </span>
              </button>
            </li>
          ))}
        </ul>
      </div>

      <Text variant="meta" tone="tertiary">
        North answers these by applying the decision to your situation and
        running it through the same rules that produce Today — not by generating
        an opinion.
      </Text>
    </div>
  );
}

function Answer({
  answer,
  scenario,
  params,
  onParam,
  onReset,
}: {
  answer: ScenarioAnswer;
  scenario: Scenario;
  params: ParamSet;
  onParam: (id: string, value: number | string) => void;
  onReset: () => void;
}) {
  const [showAnalysis, setShowAnalysis] = useState(false);

  const stage = (delay: number) => ({
    initial: { y: 8 },
    animate: { y: 0 },
    transition: { ...TRANSITION.standard, delay },
  });

  const { before, after, domainMaxCents } = answer.impact;

  return (
    <div className={cn("flex flex-col pb-16", RHYTHM.screen)}>
      {/* The answer's own header. The back affordance belongs HERE, in the
          column, aligned with everything under it — the floating AppBar this
          replaced sat outside the layout and broke the top of the screen. */}
      <div className={cn("flex flex-col", RHYTHM.block)}>
        <ActionLink icon={<BackMark />} onClick={onReset}>
          Navigator
        </ActionLink>

        <m.div {...stage(0)} className={cn("flex flex-col", RHYTHM.block)}>
          <Text variant="voice-lg" as="h1" measure>
            {answer.question}
          </Text>

          {/* 1 · Understanding — the situation as it bears on the question. */}
          <div className="type-body measure text-text-secondary">
            <ReadProse
              read={{ ...emptyActions, segments: answer.understanding }}
            />
          </div>
        </m.div>
      </div>

      {/* Parameters. Adjusting recomputes everything below, instantly —
          sliders for continuous values you want to explore, chips where the
          choices are genuinely discrete. */}
      {scenario.params.map((param) => (
        <m.div key={param.id} {...stage(0.06)} className={cn("flex flex-col", RHYTHM.heading)}>
          {param.kind === "range" ? (
            <Slider
              label={param.label}
              min={param.min}
              max={param.max}
              step={param.step}
              value={Number(params[param.id] ?? param.min)}
              valueLabel={formatParam(param.format, Number(params[param.id] ?? param.min))}
              minLabel={formatParam(param.format, param.min)}
              maxLabel={formatParam(param.format, param.max)}
              onChange={(value) => onParam(param.id, value)}
            />
          ) : (
            <>
              <Text variant="meta" tone="tertiary">
                {param.label}
              </Text>
              <ChoiceChipGroup label={param.label}>
                {param.options.map((option) => (
                  <ChoiceChip
                    key={option.label}
                    selected={params[param.id] === option.value}
                    onSelect={() => onParam(param.id, option.value)}
                  >
                    {option.label}
                  </ChoiceChip>
                ))}
              </ChoiceChipGroup>
            </>
          )}
        </m.div>
      ))}

      {/* 2 · The working retreats behind a tap — depth is present, never
          presented (the redesign's fourth layer). */}
      <m.div {...stage(0.12)}>
        <ActionLink
          icon={<AssumedMark />}
          onClick={() => setShowAnalysis(true)}
          className="text-text-secondary hover:text-text-primary"
        >
          What this rests on
        </ActionLink>
      </m.div>

      {/* 3 · Recommendation — the call, and what it costs. */}
      <m.div {...stage(0.18)}>
        <Card
          variant="decision"
          read={
            <>
              <span
                className={`type-voice-xl block font-medium italic ${VERDICT_CLASS[answer.recommendation.verdict]}`}
              >
                {VERDICT_WORD[answer.recommendation.verdict]}
              </span>
              <span className="mt-2 block">
                {answer.recommendation.headline}
              </span>
              <span className="type-body mt-4 block text-text-secondary">
                {answer.recommendation.tradeoff}
              </span>
            </>
          }
          primaryAction={
            <Button variant="secondary" size="lg" fullWidth onClick={onReset}>
              Ask something else
            </Button>
          }
        />
      </m.div>

      {/* 4 · Impact — the same projection, before and after, one scale. */}
      <m.div {...stage(0.24)} className={cn("flex flex-col", RHYTHM.heading)}>
        <SectionHeading>
          What it changes
        </SectionHeading>

        <Trajectory label="On your current path" side={before} domain={domainMaxCents} />
        <Trajectory label="If you do this" side={after} domain={domainMaxCents} />

        {before.rungLabel && after.rungLabel && (
          <Text variant="body" tone="secondary" measure>
            {before.rungId === after.rungId ? (
              <>
                Your next move stays the same — {after.rungLabel}.
              </>
            ) : (
              <>
                Your next move changes from <em>{before.rungLabel}</em> to{" "}
                <em>{after.rungLabel}</em>.
              </>
            )}
          </Text>
        )}
      </m.div>

      {/* The same room "What's assumed" uses. Both answer "what does this
          rest on?", so wearing different chrome taught the reader they were
          different kinds of thing. */}
      <ExplanationPanel
        open={showAnalysis}
        onClose={() => setShowAnalysis(false)}
        eyebrow="What this rests on"
        thesis="Here is the working, so you can disagree with it."
      >
        <ul className={cn("flex flex-col border-l border-line-hairline pl-5", RHYTHM.block)}>
          {answer.analysis.map((point) => (
            <li key={point.label} className={cn("flex flex-col", RHYTHM.pair)}>
              <Text variant="label" tone="secondary" as="span">
                {point.label}
              </Text>
              <div className="type-body text-text-primary">
                <ReadProse read={{ ...emptyActions, segments: point.segments }} />
              </div>
            </li>
          ))}
        </ul>
      </ExplanationPanel>
    </div>
  );
}

function Trajectory({
  label,
  side,
  domain,
}: {
  label: string;
  side: Side;
  domain: number;
}) {
  return (
    <div className={cn("flex flex-col", RHYTHM.pair)}>
      <Text variant="label" tone="secondary">
        {label}
      </Text>

      {side.projection ? (
        <HorizonBand
          low={side.projection.lowCents}
          high={side.projection.highCents}
          central={side.projection.centralCents}
          confidence={side.projection.confidence}
          domainMax={domain}
        />
      ) : (
        /* Nothing to project is a real answer, not a gap. */
        <Text variant="body" tone="tertiary">
          Nothing left over to put to work.
        </Text>
      )}
    </div>
  );
}

/** ReadProse takes a full Read; these sections are prose without actions. */
const emptyActions = { action: { commit: "", defer: "" } };

/**
 * Slider values read as money, time or a rate — never as a raw number.
 * The Slider itself stays presentational; formatting belongs to the caller.
 */
function formatParam(format: FigureFormat, value: number): string {
  switch (format) {
    case "currency":
      return formatCurrency(value, { abbreviate: value >= 1_000_000 });
    case "percent":
      return formatPercent(value);
    case "duration":
      // "Now" beats "0 months" on a timeline you can drag to zero.
      return value === 0 ? "Now" : formatMonths(value);
    case "count":
      return formatCount(value);
  }
}

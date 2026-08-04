"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Button,
  ChoiceChip,
  ChoiceChipGroup,
  ConversationTurn,
  HorizonBand,
  HorizonField,
  SectionHeading,
  RHYTHM,
  Text,
  TRANSITION,
  m,
} from "@/components/nds";
import { goalLimit } from "@/core/membership";
import { cn } from "@/lib/cn";
import { useHydrated } from "@/lib/use-hydrated";
import { composeScene } from "@/core/goals";
import {
  applyAnswers,
  removeGoal,
  updateGoal,
} from "@/core/onboarding/correction";
import { toAnswer, visibleTurns, type Answers } from "@/core/onboarding/script";
import type { Goal } from "@/core/profile/types";
import { ILLUSTRATIVE_LIMITS } from "@/core/waterfall";
import { useMembership } from "@/state/membership-store";
import { saveProfile, useProfile } from "@/state/profile-store";
import {
  ActionLink,
  AdjustMark,
  AjarMark,
  AssumedMark,
  SignpostMark,
  ReleaseMark,
} from "./ActionGlyphs";
import { AssumptionsPanel } from "./AssumptionsPanel";
import { MembershipSheet } from "./MembershipSheet";
import { ReadProse } from "./ReadProse";

/**
 * Goals — "Where am I going?"
 *
 * A view, not a tracker. One horizon under the sky, honestly wide; then the
 * things you're working toward, each with ONE sentence saying where it stands.
 * Never a grid of progress bars — that is the dashboard pattern this screen
 * exists to replace.
 *
 * ── MORE THAN ONE ─────────────────────────────────────────────────────────
 * People carry several goals at once, and they COMPETE: one surplus funds all
 * of them. The engine allocates it in deadline order, so each goal's sentence
 * measures it against what is genuinely left for it rather than letting every
 * goal claim the same dollar (core/goals/plan.ts). Order on screen is the
 * engine's order — soonest first — because that is the order money reaches
 * them, not the order they were typed.
 *
 * Naming one is a conversation, not a form: the same turn machinery as
 * onboarding, staged "goal", which activates the already-built rung 5.
 */

const emptyActions = { action: { commit: "", defer: "" } };

export function GoalsScreen() {
  const router = useRouter();
  const profile = useProfile();
  const hydrated = useHydrated();
  const [now] = useState(() => new Date());
  const [capturing, setCapturing] = useState(false);
  const membership = useMembership();
  /** A second goal is Plus; reaching for it proposes, right there. */
  const [proposing, setProposing] = useState(false);
  /** Index of the goal being adjusted, or null. */
  const [adjusting, setAdjusting] = useState<number | null>(null);
  const [sheet, setSheet] = useState(false);
  // Scrubbing tries a different horizon WITHOUT editing the profile —
  // exploration is free, commitment is a conversation.
  const [triedMonths, setTriedMonths] = useState<number | null>(null);

  useEffect(() => {
    if (hydrated && !profile) router.replace("/start");
  }, [hydrated, profile, router]);

  if (!hydrated || !profile) return null;

  const months = triedMonths ?? profile.horizonMonths.value;
  const viewed =
    triedMonths === null
      ? profile
      : {
          ...profile,
          horizonMonths: { ...profile.horizonMonths, value: triedMonths },
        };
  const scene = composeScene(viewed, { limits: ILLUSTRATIVE_LIMITS, now });

  const stage = (delay: number) => ({
    initial: { y: 8 },
    animate: { y: 0 },
    transition: { ...TRANSITION.standard, delay },
  });

  if (capturing) {
    return (
      <div className={cn("flex flex-col pb-16", RHYTHM.screen)}>
        <GoalConversation
          onDone={() => setCapturing(false)}
          onCancel={() => setCapturing(false)}
        />
      </div>
    );
  }

  // Adjusting takes over the screen for the same reason naming does: it is a
  // conversation, and a conversation happening in a corner of a list of other
  // goals is a form with extra steps.
  if (adjusting !== null && profile.goals?.[adjusting]) {
    return (
      <div className={cn("flex flex-col pb-16", RHYTHM.screen)}>
        <GoalAdjustment
          index={adjusting}
          goal={profile.goals[adjusting].value}
          onDone={() => setAdjusting(null)}
        />
      </div>
    );
  }

  return (
    <div className={cn("flex flex-col pb-16", RHYTHM.screen)}>
      {/* The horizon sentence — the largest thing on the screen, and now the
          page's heading. With the tab name gone from the bar, the h1 is what
          the screen actually says rather than what it is filed under. */}
      {/* No `onInterrogate` here, deliberately. These figures and the
          "What's assumed" link below opened the SAME panel, so the screen
          offered two doors into one room and spent its dotted rule — the
          product's one mark for "there is more behind this" — on the door
          that says least about where it goes. The link names the room;
          the figures just state the range. Today keeps its interrogable
          figures because there they are the only way in. */}
      <m.div {...stage(0)}>
        <h1 className="type-voice-xl text-text-primary">
          <ReadProse
            read={{ ...emptyActions, segments: scene.headline }}
            unruled
          />
        </h1>
      </m.div>

      {/* The fan as scenery — only here and in Scenario is the projection the
          subject, so only here does it get this size. */}
      {scene.projection && (
        <m.div
          {...stage(0.08)}
          className={cn("flex flex-col xl:-mx-24", RHYTHM.heading)}
        >
          <HorizonField
            low={scene.projection.lowCents}
            high={scene.projection.highCents}
            central={scene.projection.centralCents}
            confidence={scene.projection.confidence}
            months={months}
            onScrub={setTriedMonths}
            height={148}
            action={
              <ActionLink icon={<AssumedMark />} onClick={() => setSheet(true)}>
                What&rsquo;s assumed
              </ActionLink>
            }
          />
        </m.div>
      )}

      <m.div {...stage(0.14)} className={cn("flex flex-col", RHYTHM.heading)}>
        {scene.hasGoal ? (
          <>
            {/* The heading closes the horizon field above it — without it that
                field sits directly over the first goal and reads as THAT
                goal's graphic. It outranks the goal labels below it: sans, ink,
                and larger, against their quiet mono caps. Two levels of
                heading in the same style is not a hierarchy. */}
            {/* "Name another" belongs to the SECTION, not to the end of the
                list. At the bottom it landed directly under the last goal's
                "Let this one go" — two quiet actions stacked, and the reader
                has to work out which one belongs to the goal above. On the
                heading row it is unambiguously about the whole set, and it
                stays reachable without scrolling past every goal. */}
            {/* Stacked on mobile: side by side, the heading wraps to two lines
                to make room for the action, and a wrapped heading beside a
                one-line link reads as a mistake. */}
            <div className={cn("flex flex-col items-start md:flex-row md:items-baseline md:justify-between md:gap-4", RHYTHM.pair)}>
              <SectionHeading>What you&rsquo;re working toward</SectionHeading>
              <ActionLink
                icon={<SignpostMark />}
                onClick={() =>
                  (profile.goals?.length ?? 0) < goalLimit(membership.tier)
                    ? setCapturing(true)
                    : setProposing(true)
                }
              >
                Name another
              </ActionLink>
            </div>

            {/* Each goal is its own SURFACE.
                Divided only by a hairline, two goals read as one continuous
                run of prose — the eye finds no edge, so a second destination
                looks like a second paragraph about the first. Giving each one
                a contained surface with real space between them is what makes
                two goals read as two things.
                It shares the decision card's surface, radius and hairline, but
                carries NO elevation: the shadow is what makes the Card mean
                "this needs you" (DESIGN-SYSTEM §8.3), and a goal is something
                you're heading toward, not something asking for a decision
                today. Lifting these would quietly cost Home's card the thing
                that makes it read as urgent. Same family, flatter voice. */}
            <ul className={cn("flex flex-col", RHYTHM.heading)}>
              {scene.goals.map((line) => (
                <li
                  key={`${line.planned.index}-${line.planned.goal.label}`}
                  className={cn(
                    "flex flex-col",
                    RHYTHM.heading,
                    "rounded-card border border-line-hairline bg-surface-raised",
                    "px-5 py-6 md:px-6",
                  )}
                >
                  {/* The label alone. The deadline used to sit opposite it AND
                      again under the band as "On this path in 2 years" — one
                      value, printed twice, which a hairline divider hid and a
                      bounded card does not. It stays on the band, where it
                      qualifies the figure it belongs to. */}
                  <span className="type-overline text-text-tertiary">
                    {line.planned.goal.label}
                  </span>

                  <div className="type-voice-md text-text-primary">
                    <ReadProse
                      read={{ ...emptyActions, segments: line.pacing }}
                    />
                  </div>

                  {/* The mini fan — each goal's own horizon at its own date.
                      It scales to its own range, so a near goal draws a tight
                      cluster and a far one spreads: the band's WIDTH is the
                      uncertainty, which is the same thing the big field says.
                      The band captions itself "On this path …", which is the
                      wording that keeps a portfolio figure from being read as
                      this goal's balance. */}
                  {line.projection && (
                    <HorizonBand
                      low={line.projection.lowCents}
                      high={line.projection.highCents}
                      central={line.projection.centralCents}
                      confidence={line.projection.confidence}
                      horizon={horizonWord(line.planned.goal.withinMonths)}
                    />
                  )}

                  {/* Two ways a goal can be wrong, and only one of them used
                      to be available. Letting it go and naming it again was
                      the only correction on offer, which loses whatever was
                      already set aside and reads as a penalty for having
                      guessed. Adjusting keeps the label and the savings —
                      that is exactly what updateGoal's patch protects. */}
                  <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
                    <ActionLink
                      icon={<AdjustMark />}
                      onClick={() => setAdjusting(line.planned.index)}
                    >
                      Adjust this one
                    </ActionLink>
                    <ActionLink
                      icon={<ReleaseMark />}
                      onClick={() =>
                        saveProfile(removeGoal(profile, line.planned.index))
                      }
                    >
                      Let this one go
                    </ActionLink>
                  </div>
                </li>
              ))}
            </ul>

            {/* The honest note when the surplus cannot reach everything —
                stated once for the set, never as a warning per row. */}
            {scene.plan.goals.some((g) => g.monthlyShortCents > 0) && (
              <Text variant="meta" tone="tertiary" measure>
                Nearer goals are funded first, so what&rsquo;s left reaches the
                later ones. Moving a date changes who gets there.
              </Text>
            )}
          </>
        ) : (
          <>
            <Text variant="body" tone="secondary" measure>
              There&rsquo;s no named destination yet. Give the horizon one, and
              North folds it into the ladder.
            </Text>
            <Button
              variant="secondary"
              size="lg"
              className="self-start"
              onClick={() => setCapturing(true)}
            >
              Name where you&rsquo;re going
            </Button>
          </>
        )}
      </m.div>

      {scene.projection && (
        <AssumptionsPanel
          open={sheet}
          onClose={() => setSheet(false)}
          projection={scene.projection}
        />
      )}

      <MembershipSheet open={proposing} onClose={() => setProposing(false)} />
    </div>
  );
}

/** Coarse on purpose — a deadline in months is not a date. */
function horizonWord(months: number): string {
  if (months >= 300) return "at retirement";
  if (months < 12) return `${months} months`;
  const years = Math.round(months / 12);
  return years === 1 ? "in a year" : `in ${years} years`;
}

/**
 * Changing a goal you already named.
 *
 * The two turns that can go stale — what it takes, and when — asked one at a
 * time in the same voice that asked them the first time. NOT a form: North has
 * no settings screen, and correcting what it knows is a conversation
 * (CLAUDE.md, and the correction loop in UX-ARCHITECTURE §5.3).
 *
 * The label and whatever is already saved are never re-asked, because neither
 * is what went wrong. `updateGoal` patches only the answered fields, so they
 * survive untouched — which is the whole reason this exists instead of
 * "let it go and name it again".
 */
function GoalAdjustment({
  index,
  goal,
  onDone,
}: {
  index: number;
  goal: Goal;
  onDone: () => void;
}) {
  const profile = useProfile();
  const [answers, setAnswers] = useState<Answers>({});
  const [now] = useState(() => new Date());

  // Only the two mutable facts, in script order.
  const turns = useMemo(
    () =>
      visibleTurns({}, "goal").filter(
        (t) => t.id === "goalTarget" || t.id === "goalWhen",
      ),
    [],
  );
  const turn = turns.find((t) => answers[t.id] === undefined);

  if (!profile) return null;

  const answer = (choice: Parameters<typeof toAnswer>[0]) => {
    if (!turn) return;
    const next: Answers = { ...answers, [turn.id]: toAnswer(choice) };

    if (turns.some((t) => next[t.id] === undefined)) {
      setAnswers(next);
      return;
    }

    // Saving happens in the event handler, never during render.
    saveProfile(
      updateGoal(
        profile,
        index,
        {
          targetCents: next.goalTarget!.value as number,
          withinMonths: next.goalWhen!.value as number,
        },
        now,
      ),
    );
    onDone();
  };

  if (!turn || turn.kind !== "choice") return null;

  return (
    <div className={cn("flex flex-col", RHYTHM.block)}>
      <Text variant="meta" tone="tertiary">
        Adjusting {goal.label}
      </Text>

      <ConversationTurn question={turn.question}>
        <ChoiceChipGroup label={turn.question} block>
          {turn.options.map((choice) => (
            <ChoiceChip
              key={choice.label}
              block
              onSelect={() => answer(choice)}
            >
              {choice.label}
            </ChoiceChip>
          ))}
        </ChoiceChipGroup>
      </ConversationTurn>

      <ActionLink icon={<AjarMark />} onClick={onDone}>
        Leave it as it is
      </ActionLink>
    </div>
  );
}

/**
 * The goal conversation — four staged turns, then the profile updates and
 * rung 5 wakes up. Same shape as onboarding; no form in sight. Answers are
 * APPENDED, so naming a second goal never displaces the first.
 */
function GoalConversation({
  onDone,
  onCancel,
}: {
  onDone: () => void;
  onCancel: () => void;
}) {
  const profile = useProfile();
  const [answers, setAnswers] = useState<Answers>({});
  const [now] = useState(() => new Date());

  const turns = useMemo(() => visibleTurns(answers, "goal"), [answers]);
  const turn = turns.find((t) => answers[t.id] === undefined);

  if (!profile) return null;
  if (!turn || turn.kind !== "choice") return null;

  const answer = (choice: Parameters<typeof toAnswer>[0]) => {
    const next: Answers = { ...answers, [turn.id]: toAnswer(choice) };
    const remaining = visibleTurns(next, "goal").filter(
      (t) => next[t.id] === undefined,
    );

    if (remaining.length > 0) {
      setAnswers(next);
      return;
    }

    // Saving happens in the event handler, never during render — the lesson
    // CorrectionTurn taught (components/north/CorrectionTurn.tsx).
    saveProfile(applyAnswers(profile, next, now));
    onDone();
  };

  return (
    <div className={cn("flex flex-col", RHYTHM.block)}>
      <ConversationTurn question={turn.question}>
        {turn.note && (
          <Text variant="meta" tone="tertiary" className="-mt-1">
            {turn.note}
          </Text>
        )}
        <ChoiceChipGroup label={turn.question} block>
          {turn.options.map((choice) => (
            <ChoiceChip
              key={choice.label}
              block
              onSelect={() => answer(choice)}
            >
              {choice.label}
            </ChoiceChip>
          ))}
        </ChoiceChipGroup>
      </ConversationTurn>

      <ActionLink icon={<AjarMark />} onClick={onCancel}>
        Leave it for now
      </ActionLink>
    </div>
  );
}

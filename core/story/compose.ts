import type { Decision } from "../decisions/types.ts";
import { composeLetter } from "../insights/letter.ts";
import type { ChangeKind } from "../insights/letter.ts";
import type { TurnId } from "../onboarding/script.ts";
import { derive } from "../waterfall/derive.ts";
import type { SituationProfile } from "../profile/types.ts";
import { project } from "../projection/horizon.ts";
import type { Projection } from "../projection/types.ts";
import { fig, text } from "../prose.ts";
import type { EvaluateOptions, ReadSegment } from "../waterfall/types.ts";

/**
 * The story — the letter, played back one beat at a time.
 *
 * ── WHY THIS EXISTS ───────────────────────────────────────────────────────
 * Insights already says what changed, and says it well, but it says it as a
 * page: four dispatches in one view, read at whatever pace the eye takes. A
 * story is the same material given TIME — one claim on screen, the drawing
 * changing to match it, the horizon reshaping to the situation as it stood at
 * that moment. Nothing new is claimed; the pacing is the whole feature.
 *
 * ── IT CANNOT INVENT DRAMA ────────────────────────────────────────────────
 * Every middle beat is a real diff from `composeLetter`, so a quiet stretch
 * honestly produces two beats and a busy one produces five. There is no
 * padding, no "you're doing great!", and no beat that exists to fill a slot.
 * That restraint is the point: a recap that always finds six exciting things
 * is a recap nobody believes twice.
 *
 * The opening and closing are always present because they are orientation,
 * not content: where you stood, and where this leaves you.
 */

export interface StoryBeat {
  id: string;
  /** Mono-caps orientation for the beat: "WHERE YOU STOOD", "THEN", "NOW". */
  when: string;
  /** The claim, in the coach's voice. */
  segments: ReadSegment[];
  /** Which turn glyph this beat wears. The mark morphs between beats. */
  glyph: TurnId;
  /**
   * The horizon AS IT STOOD at this beat. The opening carries the old
   * profile's projection and everything after carries today's, so the field
   * visibly widens at the moment the story says it did.
   */
  projection: Projection | null;
}

export interface Story {
  beats: StoryBeat[];
  /** True when there was no prior snapshot to tell a story against. */
  tooEarly: boolean;
}

/** Each kind of change gets the figure that already means it in onboarding. */
const GLYPH_FOR: Record<ChangeKind, TurnId> = {
  buffer: "liquid",
  ladder: "employerMatch",
  record: "retirement",
  goal: "goalLabel",
};

export function composeStory(
  previous: SituationProfile | null,
  sinceIso: string | null,
  current: SituationProfile,
  decisions: Decision[],
  options: EvaluateOptions,
): Story {
  const letter = composeLetter(previous, sinceIso, current, decisions, options);

  if (!previous || !sinceIso || letter.quiet) {
    return { beats: [], tooEarly: true };
  }

  const before = project(previous, options);
  const now = project(current, options);

  const opening: StoryBeat = {
    id: "opening",
    when: "Where you stood",
    // The figure from the very first question North ever asked — it means
    // "where this started", which is exactly what the opening beat is. Using
    // the buffer figure here would leave the mark still on the first tap,
    // and the first tap is the one that has to prove this thing moves.
    glyph: "openingConcern",
    projection: before,
    segments: [
      text("When we last looked, you were holding "),
      fig(
        derive(previous, options).liquidityMonths.value,
        "duration",
        "inferred",
        { label: "of cover" },
      ),
      text(" of cover."),
    ],
  };

  const middle: StoryBeat[] = letter.entries.map((entry, index) => ({
    id: `${entry.kind}-${index}`,
    when: entry.label,
    glyph: GLYPH_FOR[entry.kind],
    projection: now,
    segments: entry.segments,
  }));

  const closing: StoryBeat = {
    id: "closing",
    when: "Where this leaves you",
    glyph: "horizon",
    projection: now,
    segments: letter.closing,
  };

  return { beats: [opening, ...middle, closing], tooEarly: false };
}

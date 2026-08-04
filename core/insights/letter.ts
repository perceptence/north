import type { Decision } from "../decisions/types.ts";
import { settledRungIds } from "../decisions/types.ts";
import { fig, text } from "../prose.ts";
import type { SituationProfile } from "../profile/types.ts";
import { derive } from "../waterfall/derive.ts";
import { evaluate } from "../waterfall/evaluate.ts";
import type { EvaluateOptions, ReadSegment } from "../waterfall/types.ts";
import { blindSpots } from "./observe.ts";

/**
 * The letter — "What changed?" answered as prose, not as a report.
 *
 * Everything here is a DIFF of two real states: the profile as it stood at the
 * last snapshot against the profile now, plus the ledger between them. Nothing
 * is a fabricated trend — North has no transactions and doesn't pretend to
 * (see types.ts). And nothing here counts failures: a quiet month closes with
 * "nothing changed, and that's fine", never with a scorecard.
 *
 * ── WHY THIS RETURNS STRUCTURE, NOT PARAGRAPHS ────────────────────────────
 * It used to return a flat list of paragraphs, and a screen handed a flat list
 * can only render a wall of sentences — the reader has to work out for
 * themselves what happened, when, whether it was good, and what it means for
 * tomorrow. That is the reader doing the coach's job.
 *
 * So a letter is now: an OPENING that names the period and its headline, a set
 * of ENTRIES each carrying what moved, which way, when, and why it matters,
 * and a CLOSING that says what this leaves for tomorrow. The prose is
 * unchanged in voice; what is added is the scaffolding a reader needs to take
 * something away. Direction is a datum, never a colour — the presentation
 * layer draws it as a glyph (docs/VISUAL-DIRECTION.md: no red/green).
 */

/** What a single change is about. Drives the entry's mark and grouping. */
export type ChangeKind = "buffer" | "ladder" | "record" | "goal";

/** Which way it moved. `steady` is a real answer, not a missing one. */
export type Direction = "up" | "down" | "steady";

export interface LetterEntry {
  kind: ChangeKind;
  /** The short name of the thing that moved: "Your buffer", "The ladder". */
  label: string;
  /** What happened, in the coach's voice, with figures inside. */
  segments: ReadSegment[];
  /** Why it matters — the part a list of sentences never says out loud. */
  meaning: ReadSegment[];
  direction: Direction;
  /** When it became true, when the ledger actually knows. */
  at?: string;
}

export interface Letter {
  /** One sentence naming what kind of stretch this was. */
  opening: ReadSegment[];
  /** Everything that moved, most consequential first. */
  entries: LetterEntry[];
  /** What this leaves for tomorrow — the letter's "so what now". */
  closing: ReadSegment[];
  /** The quiet footnote — what North can't see. */
  footnote: ReadSegment[];
  /** True when the honest letter is "nothing changed". */
  quiet: boolean;
}

/** What, if anything, waits on you. Every letter closes on this. */
function position(
  current: SituationProfile,
  decisions: Decision[],
  options: EvaluateOptions,
): ReadSegment[] {
  const evaluation = evaluate(current, {
    ...options,
    skip: settledRungIds(decisions, options.now),
  });
  if (!evaluation.current) {
    return [
      text(
        "Nothing is waiting on you. The next move is to keep doing what you’re doing.",
      ),
    ];
  }
  return [
    text("The one thing worth your attention next is the "),
    text(evaluation.current.rung.label),
    text("."),
  ];
}

export function composeLetter(
  previous: SituationProfile | null,
  sinceIso: string | null,
  current: SituationProfile,
  decisions: Decision[],
  options: EvaluateOptions,
): Letter {
  const footnote = blindSpots(current);

  if (!previous || !sinceIso) {
    return {
      opening: [
        text(
          "This is the start of the record. From here North tells you what actually moved — not a feed, a letter.",
        ),
      ],
      entries: [],
      closing: position(current, decisions, options),
      footnote,
      quiet: false,
    };
  }

  const entries: LetterEntry[] = [];

  // Buffer movement — months of cover, the one longitudinal number that is
  // honestly ours to compare.
  const monthsBefore = derive(previous, options).liquidityMonths.value;
  const monthsAfter = derive(current, options).liquidityMonths.value;
  if (monthsAfter !== monthsBefore) {
    const grew = monthsAfter > monthsBefore;
    entries.push({
      kind: "buffer",
      label: "Your buffer",
      direction: grew ? "up" : "down",
      segments: [
        text(grew ? "Your buffer grew from " : "Your buffer came down from "),
        fig(monthsBefore, "duration", "inferred", { label: "of cover before" }),
        text(" of cover to "),
        fig(monthsAfter, "duration", "inferred", { label: "of cover now" }),
        text("."),
      ],
      meaning: [
        text(
          grew
            ? "That’s more months you could go without income before anything else has to change."
            : "That’s fewer months you could go without income before something else has to give.",
        ),
      ],
    });
  }

  // Rungs that are genuinely satisfied now and weren't then.
  const before = new Set(
    evaluate(previous, options).ladder.filter((r) => r.satisfied).map((r) => r.id),
  );
  const cleared = evaluate(current, options)
    .ladder.filter((r) => r.satisfied && !before.has(r.id))
    .map((r) => r.label);
  if (cleared.length > 0) {
    entries.push({
      kind: "ladder",
      label: cleared.length === 1 ? "A rung cleared" : "Rungs cleared",
      direction: "up",
      segments: [
        text(
          cleared.length === 1
            ? `You put the ${cleared[0]} behind you.`
            : `You put the ${cleared.slice(0, -1).join(", the ")} and the ${cleared[cleared.length - 1]} behind you.`,
        ),
      ],
      meaning: [
        text(
          "The ladder is ordered, so clearing one means North stops asking about it and starts asking about what’s underneath.",
        ),
      ],
    });
  }

  // Decisions held since the snapshot.
  const heldDecisions = decisions.filter(
    (d) => d.outcome === "held" && (d.resolvedAt ?? d.decidedAt) > sinceIso,
  );
  if (heldDecisions.length > 0) {
    const held = heldDecisions.length;
    // The most recent one is when this became true.
    const at = heldDecisions
      .map((d) => d.resolvedAt ?? d.decidedAt)
      .sort()
      .at(-1);
    entries.push({
      kind: "record",
      label: held === 1 ? "A decision held" : "Decisions held",
      direction: "up",
      at,
      segments: [
        text("You held "),
        fig(held, "count", "stated", { label: "decisions" }),
        text(
          held === 1
            ? " decision you’d made with North."
            : " decisions you’d made with North.",
        ),
      ],
      meaning: [
        text(
          "Deciding is easy and holding is the hard part, which is the only reason this is worth recording.",
        ),
      ],
    });
  }

  // Goals named since the snapshot are a change worth a sentence — arguably
  // the biggest one a person can make here. Named by name, because "you added
  // a goal" is the kind of sentence a database writes.
  const goalsBefore = previous.goals?.length ?? 0;
  const goalsNow = current.goals?.length ?? 0;
  if (goalsNow > goalsBefore) {
    const fresh = (current.goals ?? []).slice(goalsBefore);
    const named = fresh.map((g) => g.value.label.toLowerCase());
    const phrase =
      named.length === 1
        ? named[0]
        : `${named.slice(0, -1).join(", ")} and ${named[named.length - 1]}`;
    entries.push({
      kind: "goal",
      label: named.length === 1 ? "A goal named" : "Goals named",
      direction: "up",
      at: fresh.map((g) => g.asOf).sort().at(-1),
      segments: [
        text(
          goalsBefore === 0
            ? `You named where you’re going — ${phrase}.`
            : `You added ${phrase} to what you’re working toward.`,
        ),
      ],
      meaning: [
        text(
          "A named goal enters the ladder, so it competes for what’s spare instead of waiting for whatever is left.",
        ),
      ],
    });
  }

  const quiet = entries.length === 0;

  return {
    opening: quiet
      ? [text("Nothing changed. That’s fine — nothing needed to.")]
      : [
          text(
            entries.length === 1
              ? "One thing moved since we last looked."
              : `${countWord(entries.length)} things moved since we last looked.`,
          ),
        ],
    entries,
    closing: position(current, decisions, options),
    footnote,
    quiet,
  };
}

/** Small numbers read as words in a sentence; digits are for figures. */
function countWord(n: number): string {
  return (
    ["Zero", "One", "Two", "Three", "Four", "Five", "Six"][n] ?? String(n)
  );
}

/**
 * The whole letter as one continuous run of segments.
 *
 * For reading aloud (`components/north/ReadAloud.tsx`). A letter read out
 * that stops after its opening line is a trailer, so this walks the same
 * parts the screen renders, in the same order, and joins them with real
 * sentence breaks — a synthesiser pauses on punctuation, and without it the
 * dispatches run together into one breathless paragraph.
 *
 * The footnote is deliberately excluded: it is the quiet aside about what
 * North cannot see, which earns its place in the margin of a page someone is
 * scanning and becomes a strange note to end a spoken letter on.
 *
 * Pure and total — an empty letter returns an empty array, and the caller
 * says nothing rather than saying "nothing".
 */
export function letterSegments(letter: Letter): ReadSegment[] {
  const out: ReadSegment[] = [];

  const pushRun = (segments: ReadSegment[]): void => {
    if (segments.length === 0) return;
    if (out.length > 0) out.push(text(" "));
    out.push(...segments);
  };

  pushRun(letter.opening);

  for (const entry of letter.entries) {
    // The label is a heading on screen; spoken, it is the sentence's subject
    // and needs its own stop or it runs into the dispatch behind it.
    pushRun([text(`${entry.label}.`)]);
    pushRun(entry.segments);
    pushRun(entry.meaning);
  }

  pushRun(letter.closing);

  return out;
}

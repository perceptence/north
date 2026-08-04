"use client";

import { Fragment, type ReactNode } from "react";
import { Figure, TRANSITION, m } from "@/components/nds";
import type { Read, ReadSegment } from "@/core/waterfall";

/**
 * Renders the coach's verdict.
 *
 * A `Read` is prose with typed figures interleaved, so this walks the segments
 * rather than interpolating a string. Every number becomes a `Figure`, which is
 * what carries its confidence into the accessible name.
 *
 * ── EMPHASIS ──────────────────────────────────────────────────────────────
 * A segment marked `emphasis` is set in medium weight and stays INLINE. It
 * used to break onto its own display-size line, which threw the one number a
 * read turns on out of the sentence that explains it. Emphasis is weight, not
 * size, and never a line break. The engine caps it at one per read.
 *
 * ── LEAD ──────────────────────────────────────────────────────────────────
 * With `lead`, the first sentence is set at display size and the rest a step
 * down. A read is a verdict followed by the evidence for it, and rendering
 * all of it at one size made a forty-five word paragraph of serif that a
 * reader has to swim through — the verdict, the reasoning and the aside all
 * shouting equally.
 *
 * This is deliberately NOT the dashboard fix. The numbers stay inside the
 * sentences that interpret them; nothing is lifted into a figure grid, and no
 * number appears without its read (docs/UX-ARCHITECTURE.md §4.3). What changes
 * is only which sentence is loudest.
 *
 * ── STAGED ────────────────────────────────────────────────────────────────
 * With `staged`, figures settle blur-to-sharp in sequence — the reveal
 * choreography. Blur starts at 4px and opacity never drops: if frames stall,
 * the worst case is slightly soft text, never invisible text
 * (components/nds/motion.ts, the visibility rule).
 */

export interface ReadProseProps {
  /**
   * Only the segments are ever read — `action` belongs to the caller, which
   * renders the buttons itself. Typed as `Pick<Read, "segments">` rather than
   * `Read` so prose the engine composes OUTSIDE a rung can be rendered here
   * too, without inventing a commit/defer pair that nothing will draw.
   *
   * The return callback's recollection is the case that forced this: it is a
   * genuine engine-composed read with figures and confidence, and it has no
   * actions of its own because the question above it already has two.
   */
  read: Pick<Read, "segments">;
  /** Opens the derivation sheet for an interrogable figure. */
  onInterrogate?: (segment: Extract<ReadSegment, { kind: "figure" }>) => void;
  /** Reveal choreography — first-run only. */
  staged?: boolean;
  /** Set the opening sentence at display size and the rest a step down. */
  lead?: boolean;
  /**
   * Drop the visible confidence rule from every figure in this read, keeping
   * it in the accessible name. Only where the prose around them already
   * states the uncertainty — see `Figure`'s `unruled`.
   */
  unruled?: boolean;
  /** These segments sit on the deep sky — see `Figure`'s `onDeep`. */
  onDeep?: boolean;
}

/**
 * Split the segments after the first sentence.
 *
 * The terminator has to be followed by whitespace and a capital: a read is
 * full of decimals and abbreviated figures, but those live in their own
 * `figure` segments, so only prose is ever scanned. A read that is one
 * sentence returns everything as the lead and an empty body, which renders
 * exactly as it did before.
 */
function splitLead(segments: ReadSegment[]): [ReadSegment[], ReadSegment[]] {
  const lead: ReadSegment[] = [];

  for (let i = 0; i < segments.length; i++) {
    const segment = segments[i];

    if (segment.kind === "text") {
      const match = /([.!?])(\s+)(?=[A-Z"'“])/.exec(segment.value);
      if (match) {
        const cut = match.index + match[0].length;
        lead.push({ ...segment, value: segment.value.slice(0, cut).trimEnd() });
        const rest = segment.value.slice(cut);
        return [
          lead,
          [
            ...(rest ? [{ ...segment, value: rest }] : []),
            ...segments.slice(i + 1),
          ],
        ];
      }
    }
    lead.push(segment);
  }

  return [lead, []];
}

export function ReadProse({
  read,
  onInterrogate,
  staged = false,
  lead = false,
  unruled = false,
  onDeep = false,
}: ReadProseProps) {
  // One counter across both blocks, so the staged delays stay in reading
  // order rather than restarting at the body.
  const counter = { index: 0 };

  const render = (segments: ReadSegment[], keyPrefix: string): ReactNode =>
    segments.map((segment, index) => {
      const key = `${keyPrefix}-${index}`;

      if (segment.kind === "text") {
        return <Fragment key={key}>{segment.value}</Fragment>;
      }

      const order = counter.index++;
      const figure = (
        <Figure
          value={segment.value}
          format={segment.format}
          confidence={segment.confidence}
          abbreviate={segment.abbreviate}
          label={segment.label}
          // Only interrogable where there is somewhere to go — otherwise a
          // dead affordance lands in the tab order.
          interrogable={Boolean(segment.interrogable && onInterrogate)}
          onInterrogate={
            onInterrogate ? () => onInterrogate(segment) : undefined
          }
          unruled={unruled}
          onDeep={onDeep}
        />
      );

      const settled = staged ? (
        <m.span
          className="inline-block"
          initial={{ filter: "blur(4px)", y: 5 }}
          animate={{ filter: "blur(0px)", y: 0 }}
          transition={{ ...TRANSITION.considered, delay: 0.7 + order * 0.12 }}
        >
          {figure}
        </m.span>
      ) : (
        figure
      );

      return segment.emphasis ? (
        // Emphasis is WEIGHT, not size, and never a line break. It used to
        // set display-size on its own block, which threw the one number the
        // read turns on out of the sentence that explains it — "The other"
        // stranded above it and "is sitting still" below. It still carries
        // its confidence mark, because a bigger number is still speech.
        <span key={key} className="font-medium">
          {settled}
        </span>
      ) : (
        <Fragment key={key}>{settled}</Fragment>
      );
    });

  if (!lead) return <>{render(read.segments, "s")}</>;

  const [opening, body] = splitLead(read.segments);

  return (
    <>
      <span className="type-voice-xl block">{render(opening, "lead")}</span>
      {body.length > 0 && (
        <span className="type-voice-md mt-5 block">{render(body, "body")}</span>
      )}
    </>
  );
}

import type { Confidence, Field } from "./confidence.ts";
import type { FigureFormat } from "./money.ts";
import type { ReadSegment } from "./waterfall/types.ts";

/**
 * Builders for the coach's prose.
 *
 * Shared by the Waterfall rules and the Navigator scenarios so there is exactly
 * one way to construct a sentence containing figures. Anything that speaks to
 * the user goes through here.
 */

export const text = (value: string): ReadSegment => ({ kind: "text", value });

export const fig = (
  value: number,
  format: FigureFormat,
  confidence: Confidence,
  options: {
    label?: string;
    interrogable?: boolean;
    abbreviate?: boolean;
    emphasis?: boolean;
  } = {},
): ReadSegment => ({ kind: "figure", value, format, confidence, ...options });

/** Reads a figure straight from a profile or derived field. */
export const from = (
  field: Field<number>,
  format: FigureFormat,
  options: {
    label?: string;
    interrogable?: boolean;
    abbreviate?: boolean;
    emphasis?: boolean;
  } = {},
): ReadSegment => fig(field.value, format, field.confidence, options);

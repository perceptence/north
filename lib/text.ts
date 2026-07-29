/**
 * Display-casing for engine strings.
 *
 * Rung labels are authored in prose case ("goal funding") because they get
 * dropped into sentences — *"North is watching your goal funding"*, and the
 * letter's own copy. Capitalising them at source would break those. So the
 * capital is applied where a label STANDS ALONE and heads a line, which is a
 * presentation decision and belongs here rather than in `core/`.
 *
 * `text-transform: capitalize` is not a substitute: it would give "Goal
 * Funding", and "Surplus With Nowhere To Go".
 */
export function sentenceCase(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

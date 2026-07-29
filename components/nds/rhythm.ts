/**
 * Vertical rhythm — the spacing scale screens actually compose with.
 *
 * ── WHY THIS EXISTS ───────────────────────────────────────────────────────
 * §3 defines the spacing TOKENS, and every screen used them — but each screen
 * picked its own, so a survey of the product found eight different gap values
 * doing four different jobs. The worst of it: on Navigator the question and
 * the field answering it sat 40px apart (the screen's between-blocks gap),
 * while a heading and its list sat 12px apart. The pair that belongs together
 * was pushed further apart than the pair that doesn't.
 *
 * Tokens are a palette. This is the grammar: four steps, named for the
 * RELATIONSHIP they express, not for their size. If two things are a pair,
 * they get `pair` — everywhere, on every screen, without a judgement call.
 *
 *   pair     a label and the thing it names        eyebrow → title
 *   heading  a heading and the block it opens      "Or start from one of these" → list
 *   block    elements inside one block             sentence → its consequence
 *   screen   between major blocks                  the read → the actions
 *
 * The values are deliberately far apart. Two steps that differ by 4px are two
 * steps nobody can tell apart, which is how a scale rots back into eight
 * arbitrary numbers.
 */
export const RHYTHM = {
  /** 8 — a label and the thing it names. They read as one object. */
  pair: "gap-2",
  /** 16 — a heading and the block beneath it. */
  heading: "gap-4",
  /** 24 — elements within one block. */
  block: "gap-6",
  /** 40 — between major blocks on a screen. */
  screen: "gap-10",
} as const;

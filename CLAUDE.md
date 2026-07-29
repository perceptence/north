# North

Premium AI financial coaching. Read these before making decisions:

- [docs/STRATEGY.md](docs/STRATEGY.md) — product: vision, users, scope, exclusions
- [docs/FOUNDATION.md](docs/FOUNDATION.md) — design principles, visual direction, architecture
- [docs/UX-ARCHITECTURE.md](docs/UX-ARCHITECTURE.md) — IA, screens, flows, states
- [docs/VISUAL-DIRECTION.md](docs/VISUAL-DIRECTION.md) — brand, color, type, motion
- [docs/DESIGN-SYSTEM.md](docs/DESIGN-SYSTEM.md) — tokens, components, usage rules
- [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) — folders, state, data models, motion
- [docs/WATERFALL.md](docs/WATERFALL.md) — the engine's rules and every assumption
- [docs/BACKLOG.md](docs/BACKLOG.md) — future items, explicitly out of MVP scope
- [docs/VOICE.md](docs/VOICE.md) — voice mode: researched proposal, **not built**, awaiting review

`npm test` — 211 tests, zero dependencies (Node's built-in runner executes the
TypeScript directly). The suite targets business rules, not render output.

**`core/` may not import React, Next, the DOM, or `@/` aliases.** It uses
relative `.ts` specifiers so Node can run it without a transpiler. Verify with:
`grep -rE 'from "(react|next|@/)' core/` — it must return nothing.

## What this product is

A **coach**, not a dashboard. It surfaces one thing that matters, remembers what
you decided, and checks back. Push-first with a pull surface.

Core loop — the acceptance test for every screen:

```
Coach observes → surfaces ONE thing → you decide → coach tracks it → checks back
```

## Non-negotiables

- **No persona branching.** Ordered rules over a derived `SituationProfile`,
  never `if (persona === ...)`. See FOUNDATION §4.
- **Money is integer cents.** Never floats. Format at the edge only.
- **Tabular figures only where numbers align vertically** (ledger rows,
  derivation lists, axis ticks). Display-size numbers use proportional figures.
- **No red/green financial semantics.** Amounts are never colored; direction is
  a glyph. Color is reserved for attention, one signal element per viewport.
- **The primary action is ink, not a colored button.**
- **No number without a read.** Raw data is never rendered alone.
- **Ranges, not false precision.** `$1.2M–$1.8M`, never `$1,247,832`.
- **Semantic tokens only in components.** `--surface-raised`, never
  `bg-gray-100`. Raw Tailwind color utilities in a component are a bug.
- **Coaching, not investment advice.** Name the gap, frame the tradeoff. Never
  recommend a specific security or execute a trade. See FOUNDATION §9.
- **Four dock destinations, hard cap** — Home (`/today`) / Navigator / Insights /
  Goals, each answering one question (see UX-ARCHITECTURE §12). Scenario is
  Navigator's full-screen answer *state*, not a destination. Decisions is a
  drill-down. The decision card appears ONLY when something needs you — the calm
  day is cardless, and that absence is the message. Coach remains deferred.
- **One primary action per screen.**
- **Waterfall rules are data, and they are tested.** The engine is the product's
  intelligence; it never depends on a model call to produce an answer.
- **New capability is a state or an overlay** until it proves it needs a surface.
- **No settings screen.** Correcting what North knows is a one-question
  conversation off the derivation overlay, never a form.
- **No spinners, no workload meters, no "failed" states.** Onboarding's
  wayfinding strip (answered / here / to come) is position, never a
  percentage filling toward "done." See
  [UX-ARCHITECTURE §11](docs/UX-ARCHITECTURE.md) for the full refusal list.
- **Errors never imply the user's money is affected**, and the coach never
  breaks character into system voice.
- **Every number is a `Figure`** carrying a confidence. Raw numeric text is a
  review failure, and the accessible label must state the confidence.
- **Semantic tokens only.** A raw hex, a Tier 1 token, or a raw px value inside
  a component is a review failure.
- **One Card, one primary Button, one signal element per screen.**
- **The column never widens past 600px** at any breakpoint. Desktop gets
  whitespace, not density. One exception, argued in
  [DESIGN-SYSTEM §6.1](docs/DESIGN-SYSTEM.md): wordless SCENERY (the horizon
  field) may exceed the measure from `xl`. Prose never does, and a marginalia
  column is still refused.

## Stack

Next.js 16 App Router · React 19 · TypeScript strict · Tailwind v4 with a semantic token
layer · Radix primitives (unstyled) · Motion with a shared spring config · Zod
at every boundary.

Financial data sits behind a typed interface with a fixture implementation.
Never import a data provider into a component.

## Visual register

Editorial magazine or private bank statement — not a trading terminal.
Light-first, warm neutrals, near-monochrome. Full system in
[docs/VISUAL-DIRECTION.md](docs/VISUAL-DIRECTION.md).

**The mark is locked.** `Wordmark` and `CompassMark`
(components/nds/Wordmark.tsx) — NORTH in the product's hairline hand with the O
as a working compass; the icon is that O alone. Do not redraw either; see
[VISUAL-DIRECTION §0](docs/VISUAL-DIRECTION.md).

**Three faces, three jobs:** Newsreader (serif) is the coach speaking — the
largest type on any screen. Geist Sans is the interface. Geist Mono is figures,
only where they align vertically.

**Three color families, only three:** Ground (warm paper), Ink (warm near-black,
all text and primary actions), Signal (`#2E3A8C` indigo + `#A6522F` clay, at most
one element per viewport). Palette is contrast-verified — do not add a hue
without re-measuring.

**The atmosphere (craft pass):** an indigo→teal sky gradient (`.atmosphere`,
sky tokens) grounds the top of every screen and fades into paper — ground, not
signal; text on it uses the `on-deep` tokens. Overlines are Geist Mono caps
(`type-overline`) and are labels, never sentences — **mastheads only, one per
screen**. Controls are pills; the
primary action is still ink. Data marks are thin hairlines (the horizon fan,
rung ticks) — still no axes, gridlines, or legends.

Spring motion, no overshoot, no spinners. **Never animate a number counting up.**
**Motion never gates visibility** — entrances animate `y`, never opacity-from-0
(see components/nds/motion.ts).

**Motion rules.** `motion@12`, configured in `components/nds/MotionProvider.tsx`.
Use `m.div`, never `motion.div` — `LazyMotion strict` throws on the latter
because it defeats the code split. `components/nds/motion.ts` is the source of
truth for all timings; the CSS custom properties mirror it and a dev-only check
warns on drift. Springs are critically damped by construction — changing
`stiffness` without recomputing `damping` reintroduces overshoot. Keep `m.*` at
the leaves; it drags its subtree client-side.

Avoid the 2021 premium-fintech cliché: dark mode + glassmorphism + violet
gradient + a giant number.

## Working agreement

- Challenge weak product decisions rather than implementing them silently.
- UX quality over feature count.
- `/design` route stays current — it is how the system stays honest.

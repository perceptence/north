# North

**Everyone else shows you where your money went. North tells you where you're
going.**

A financial coach, not a dashboard. It reads a whole situation, names the one
thing worth doing about it, remembers what you decided, and checks back.

```bash
npm install
npm run dev     # http://localhost:3000
npm test        # 437 tests, zero dependencies
```

Open `/` and either **Begin** the conversation or **borrow the demo story** —
a seeded five-week narrative that makes every screen show something real.

---

## What makes it different

Most personal-finance software reports the past and leaves the judgment to you.
North is built the other way around: the interpretation is the product, and the
numbers live inside it.

**One ladder, no personas.** Everyone runs the same seven ordered rules — buffer,
employer match, expensive debt, tax-advantaged space, goals, surplus,
optimization. A 26-year-old and a surgeon hit the same engine and land on
different rungs. There is no `if (persona === …)` anywhere, and a test asserts
that a high earner with no buffer lands on the same rung as a low earner with
no buffer.

**The engine never calls a model.** Every answer — the daily read, the what-if
scenarios, the letter, the goal pacing — is computed by pure TypeScript over a
typed profile. Free text never produces an answer anywhere: onboarding's
opening question is captured verbatim and reflected back, and the Navigator's
field and voice mode *route* what you said to something the engine can
genuinely compute.

A model may optionally sit in front of that router to sharpen the routing. It
returns one of eleven labels through a forced tool call — never prose, never a
number — and it is validated on both sides of the network. Delete the API
route and every question is still answered, because the deterministic route is
computed before the network is touched.

**Honesty is the interface.** Every figure carries where it came from — stated,
inferred, assumed — visibly and in its accessible label. Projections are
ranges, never points, and the width of the band is the part North is honest
about. There is no "failed" state in the type system; an unacted commitment
returns to open.

**It refuses things.** No spinners, no workload meters, no red/green money, no
settings screen, no number without a read, and no coloured primary button — the
primary action is ink.

---

## The screens

| Route | Question it answers |
|---|---|
| `/` | Is this worth ninety seconds? |
| `/start` | Who are you? — ten turns, one per viewport, spoken or typed |
| `/today` | How am I doing? — one decision, or a calm day and nothing else |
| `/navigator` | What should I do? — ask in your own words, answered by the engine |
| `/insights` | What changed? — a dated letter, not a metrics wall |
| `/goals` | Where am I going? — a scrubbable horizon and competing goals |
| `/decisions` | What did I commit to, and did I hold? |

Plus three tools outside the product: **`/design`** (the living design system,
which measures its own contrast at runtime), **`/demo`** (seeds the story), and
**`/preview`** (the app in device frames — resize the window to change form
factor).

---

## Architecture

```
core/        the engine — pure TypeScript, no React, no DOM, no clock
components/  nds/ (design system) · north/ (product-tier)
state/       persisted profile and decision ledger
app/         routes
docs/        the specs the code is answerable to
```

**`core/` may not import React, Next, the DOM, or `@/` aliases.** It uses
relative `.ts` specifiers so Node's test runner executes it directly, with no
transpiler and no test dependencies. Verify with:

```bash
grep -rE 'from "(react|next|@/)' core/    # must return nothing
```

Money is integer cents everywhere, formatted only at the edge. The engine never
reads a clock — `now` is injected — which is what makes it deterministic under
test.

---

## Docs

Read these before changing behaviour; the code is answerable to them.

- [CLAUDE.md](CLAUDE.md) — the non-negotiables, in one page
- [docs/STRATEGY.md](docs/STRATEGY.md) — vision, users, scope, exclusions
- [docs/FOUNDATION.md](docs/FOUNDATION.md) — principles and architecture
- [docs/UX-ARCHITECTURE.md](docs/UX-ARCHITECTURE.md) — IA, screens, flows, refusals
- [docs/VISUAL-DIRECTION.md](docs/VISUAL-DIRECTION.md) — the locked mark, colour, type, motion
- [docs/DESIGN-SYSTEM.md](docs/DESIGN-SYSTEM.md) — tokens, components, usage rules
- [docs/WATERFALL.md](docs/WATERFALL.md) — every engine rule and every assumption
- [docs/BACKLOG.md](docs/BACKLOG.md) — deliberately out of scope

## Stack

Next.js 16 (App Router) · React 19 · TypeScript strict · Tailwind v4 over a
two-tier semantic token layer · Motion with a shared, critically-damped spring
config · Newsreader / Geist / Geist Mono.

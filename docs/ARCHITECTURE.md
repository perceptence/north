# North — Technical Architecture

Staff-level technical plan. Companion to [DESIGN-SYSTEM.md](DESIGN-SYSTEM.md)
(tokens and components, **built**) and [UX-ARCHITECTURE.md](UX-ARCHITECTURE.md)
(screens and flows, **not built**).

**Status honesty.** The token layer, the 16 NDS components, and `/design` exist.
Everything below the component layer — the engine, state, data seam, screens — is
specified here and not yet written. Two deviations from the stated constraints
are called out and resolved in §7 (Framer Motion) and §1 (`core/` vs `lib/`).

---

## 1. Folder structure

```
app/                        Routes. Composition and data wiring only — no styling.
  layout.tsx                Fonts, MotionConfig, store provider
  page.tsx                  → Arrival
  start/page.tsx            → Onboarding
  today/page.tsx            → Today
  decisions/page.tsx        → Decisions
  design/                   The gallery. A project artifact, outside the product IA.

core/                       ★ THE DOMAIN. Zero React. Zero Next. Zero DOM.
  money.ts                  Cents, BasisPoints, Months + formatting
  confidence.ts             Confidence, Field<T>
  profile/
    types.ts                SituationProfile
    derive.ts               Conversation answers → profile
  waterfall/
    types.ts                Rung, Read, ReadSegment
    rules.ts                The seven rungs, as DATA
    evaluate.ts             profile → current rung + read
  projection/
    horizon.ts              profile → { low, high, confidence }
  decisions/
    types.ts                Decision, DecisionOutcome

data/                       The seam.
  source.ts                 FinancialDataSource interface
  fixture-source.ts         Seeded personas + ledger
  fixtures/                 Deterministic persona data

state/                      Two stores, both persisted.
  store.ts                  createStore() — useSyncExternalStore-compatible
  profile-store.ts
  decisions-store.ts

components/
  nds/                      Design system. Product-agnostic. ★ Never imports core/
  north/                    Product components. Compose NDS with domain meaning.

lib/                        App utilities only.
  cn.ts
  contrast.ts               Gallery-only

docs/
```

### Why `core/` is not `lib/`

`lib/` is where utilities go to die — a folder with no membership rule
accumulates everything. `core/` has one: **no framework imports, ever.** Enforceable
by lint, verifiable by grep.

The payoff is concrete. The Waterfall is the product's intelligence; keeping it
free of React means it is unit-testable without a renderer, reasonable about in
isolation, and portable if North ever needs a server or a native client. It is
the highest-value boundary in the codebase.

**Required move:** `lib/money.ts` and `lib/confidence.ts` are domain, not
utility, and belong in `core/`. They currently import nothing framework-related,
so this is a path change and an import update — not a refactor.

---

## 2. Component strategy

Three tiers, with a strict dependency direction.

```
app/*/page.tsx        composition + wiring
      ↓
components/north/     product meaning   ── may import core/
      ↓
components/nds/       design system     ── ★ MUST NOT import core/
      ↓
core/ + lib/cn
```

| Tier | Knows about | Example |
|---|---|---|
| **NDS** | Tokens, primitives. Nothing about money, rungs, or profiles. | `Card` takes `read: ReactNode`. It has never heard of a Waterfall. |
| **North** | The domain. Composes NDS. | `DecisionCard` takes a `Read`, renders `Card` + `Figure`s + `RungIndicator`. |
| **Screens** | Data sources and stores. | `today/page.tsx` pulls the profile, evaluates, renders `DecisionCard`. |

**The rule that keeps NDS reusable: it never imports from `core/`.** The moment
`Card` accepts a `Decision`, the design system has become the application and
`/design` stops being able to render it in isolation.

**The deliberate exceptions, and this list is checked rather than asserted:**

| Component | Imports | Why it's acceptable |
|---|---|---|
| `Figure` | `Confidence`, all four formatters | Rendering a number *is* its job; confidence is part of its accessible name |
| `HorizonBand` | `formatCurrency`, `Cents` | Builds a plain-string `aria-label` — the alternative is making callers pre-format, which is worse |
| `HorizonField` | `CONFIDENCE_PHRASE`, `formatCurrency`, `Cents`, `Months` | Same argument as `HorizonBand`; it draws the same figures at full size |
| `Row`, `OutcomeMark` | `type DecisionOutcome` | **Type-only**, erased at build. Both draw one of three outcomes and the union is the honest way to spell "one of three" |

The first three cross the line for the same reason: money formatting and
confidence are *value types*, not domain logic. That is why `core/money.ts`
and `core/confidence.ts` must stay dependency-free — they are the only part of
`core/` the design system is permitted to see at runtime.

`Row` and `OutcomeMark` are a weaker case and worth naming as such: importing
a domain union into the design system is real coupling, even erased. It is
tolerated because the alternative — restating `"open" | "held" | "deferred"`
in `components/nds/` — is a second copy of a vocabulary that
`core/decisions/types.ts` argues at length must have exactly three members.

Verifiable at any time. The exclusion list IS the table above, so this
command failing means either the code or the table is wrong:

```bash
grep -rn 'from "@/core/' components/nds/ \
  | grep -v 'money\|confidence' \
  | grep -v 'Row.tsx\|OutcomeMark.tsx'
# must return nothing
```

### Server vs client

Default to server components; push `"use client"` to leaves. NDS components that
need interactivity already carry it (`Figure`, `Button`, `Sheet`, …).

**Honest caveat:** MVP has no server data. Fixtures plus `localStorage` means
Today and Decisions are effectively client trees, and pretending otherwise is
architecture theater. RSC buys little here. **The seam (§5) is what matters** —
it is what makes a future server implementation a swap rather than a rewrite.
Arrival stays fully static.

---

## 3. State management

### What state actually exists

| State | Lifetime | Where |
|---|---|---|
| `SituationProfile` | Persisted | `profile-store` → `localStorage` |
| Decision ledger | Persisted | `decisions-store` → `localStorage` |
| Current rung, the read, the projection | **Never stored** | Computed from the two above |
| Open sheet, onboarding turn index | Ephemeral | `useState`, component-local |

### The principle

> **Store the profile and the ledger. Compute everything else, every time.**

Derived state is never persisted and never cached. The Waterfall is a pure
synchronous function over a nine-field object — evaluating it is free. Caching it
would buy nothing and introduce the one bug class this app would otherwise never
have: a stale read that disagrees with the ledger.

### The library choice

**No state library. A ~40-line store behind `useSyncExternalStore`.**

Reasoning, since this is a judgment call:

- **Hydration is the actual constraint.** `localStorage` doesn't exist on the
  server, so every persisted read must render a server snapshot and swap after
  mount. `useSyncExternalStore`'s third argument is precisely that contract.
  Context + `useEffect` gets this subtly wrong and flashes.
- Two small stores, no server sync, no optimistic updates, no concurrency. The
  problems Zustand/Redux solve are not present.
- The pattern is already established — `/design`'s contrast table uses it.

**Swap signal:** if a third persisted store appears, or selector-level
subscription starts mattering for render cost, adopt Zustand. It is a drop-in for
this shape and 1.2kb. Reaching for it now would be anticipating a problem the app
doesn't have.

---

## 4. Data models

### Profile

```ts
type Confidence = "stated" | "inferred" | "assumed";
interface Field<T> { value: T; confidence: Confidence; asOf: ISODate }

interface SituationProfile {
  openingConcern:   Field<string>;        // free text, captured verbatim, NEVER parsed
  incomeBand:       Field<IncomeBand>;
  liquidCents:      Field<Cents>;
  monthlyOutCents:  Field<Cents>;
  obligations:      Field<Obligation[]>;
  dependents:       Field<number>;
  retirementBps:    Field<BasisPoints>;
  employerMatchBps: Field<BasisPoints>;
  horizonMonths:    Field<Months>;
}

interface Obligation {
  kind: "student" | "auto" | "card" | "mortgage" | "other";
  balanceCents: Cents;
  rateBps: BasisPoints;
}
```

Every field is a `Field<T>`. There is no bare value and **no `unknown` variant** —
a field North hasn't learned is absent from the profile, and absence renders as a
question, never as a blank or a zero.

### The Read — prose with typed figures

```ts
type ReadSegment =
  | { kind: "text"; value: string }
  | { kind: "figure"; value: number; format: FigureFormat;
      confidence: Confidence; label?: string; interrogable?: boolean };

interface Read {
  segments: ReadSegment[];
  action: { commit: string; defer: string };
}
```

This is the most load-bearing model in the app. Because a `Read` **is** prose
with figures interleaved, *"never a number without a read"* stops being a
guideline and becomes a shape — you cannot construct a bare number for display,
because the only renderable container is a sentence.

### Waterfall

```ts
type RungId =
  | "liquidity" | "match" | "high-interest-debt"
  | "tax-advantaged" | "goal" | "taxable" | "optimization";

interface Rung {
  id: RungId;
  index: number;                                // 1–7
  label: string;
  satisfied(profile: SituationProfile): boolean;
  read(profile: SituationProfile): Read;
}
```

Rules live in `rules.ts` as an ordered array — **data, not control flow.** There
is no `if (persona === …)` anywhere, and no branch on user type. Evaluation is
`rules.find(r => !r.satisfied(profile))`.

### Decisions

```ts
type DecisionOutcome = "open" | "held" | "deferred";

interface Decision {
  id: string;
  rungId: RungId;
  summary: string;
  outcome: DecisionOutcome;
  decidedAt: ISODate;
  resolvedAt?: ISODate;
  amountCents?: Cents;
}
```

Note what is absent: there is no `"failed"`, `"missed"`, or `"overdue"`. **The
guilt constraint is enforced by the type system** — a decision not acted on
returns to `"open"` because there is no other state it can occupy. A product rule
that can't be violated is worth more than one written in a doc.

---

## 5. Mock data strategy

### The seam

```ts
interface FinancialDataSource {
  loadProfile(): Promise<SituationProfile | null>;
  saveProfile(profile: SituationProfile): Promise<void>;
  loadDecisions(): Promise<Decision[]>;
  appendDecision(decision: Decision): Promise<void>;
  resolveDecision(id: string, outcome: DecisionOutcome): Promise<void>;
}
```

**Async from day one, even though nothing is async.** Fixtures resolve
immediately, but the real implementation won't — and a synchronous interface
means every call site changes when a network appears. This is the single cheapest
decision in the document and the one most often skipped.

Components never import a data source. Screens take it from a provider, so
swapping `FixtureSource` for a real one touches one line.

### Fixtures

Three or four seeded personas at **different rungs**, so the demo and the gallery
can show the system's range without hand-editing state:

| Persona | Lands on | Demonstrates |
|---|---|---|
| Early | Rung 1 — liquidity floor | The 26-year-old case, no persona picker needed |
| Unadvised earner | Rung 4 — tax-advantaged space | The hero scenario |
| Optimizer | Rung 7 — optimization | Late-stage read |
| Satisfied | All rungs met | The reward state (§7.2 of UX-ARCHITECTURE) |

Plus a seeded ledger so **the return state is visible on first load** — the
differentiator can't be the thing a reviewer has to wait three weeks to see.

### Determinism is a requirement, not a nicety

**No `Math.random()`, no `Date.now()` anywhere in fixtures or the engine.** Dates
are fixed offsets from a seeded `now` passed in as a parameter. Three payoffs:
the demo is reproducible, the engine is unit-testable without freezing clocks,
and screenshots don't drift.

The engine takes `now` as an argument. It never reads a clock.

---

## 6. The engine, and why it is tested

`core/waterfall/` is the only part of the codebase with a test suite, and that is
deliberate rather than lazy.

Testing render output of a `Button` is low-yield — it breaks on refactors and
catches nothing. Testing that *a person with an unfunded emergency reserve lands
on rung 1 regardless of income* is the product's actual claim. **Test the
business rules, not the render tree.**

This is also the demonstration that matters to the repo-reading audience: it
shows testing was pointed at risk rather than at coverage.

---

## 7. Animation approach

### Reconciling the constraint

**Status: installed and configured.** `motion@12` (the package Framer Motion is
now published as), wired via `components/nds/MotionProvider.tsx`. No animations
applied yet — the foundation only.

CSS keyframes plus Tailwind transitions were correct for the design system and
are **not** sufficient for the product. Three things that approach cannot do:

1. **Exit animations.** ~~`Sheet` unmounts instantly.~~ **Fixed** — `Sheet` now
   uses `AnimatePresence`, with `dialog.close()` deferred to `onExitComplete` so
   the element isn't yanked out of the top layer mid-flight. There is no
   CSS-only fix for this; it was the gap that justified the dependency.
2. **The reveal.** A staged, orchestrated sequence with stagger.
3. **Interruptible springs.** CSS `linear()` approximates a spring but cannot be
   interrupted mid-flight and retargeted.

So: **adopt it, and scope it.** The package is now published as `motion` (the
`framer-motion` name redirects to it); that is what gets installed.

### Ownership rule

| Motion | Owner | Why |
|---|---|---|
| Hover, focus, press, color | **CSS** | A 120ms color change has no business running JS |
| Overlay enter **and exit** | **`AnimatePresence`** | Exit is the whole reason |
| The reveal | **Motion, staged** | Orchestration + stagger |
| Number recompute cross-fade | **`AnimatePresence`, keyed on value** | Proves the system reasoned. Cross-fade — never a count-up |
| Sheet drag-to-dismiss | **Motion `drag`** | Replaces the hand-rolled pointer handlers |
| Origin-aware sheet | **Motion layout** | Needs measured rects; the known gap in `Sheet` |

> **Rule: Motion lives at the leaves.** A `motion.div` high in the tree drags its
> whole subtree client-side. Motion components are client components, and that
> cost is paid by everything beneath them.

### Reduced motion — both layers

`<MotionConfig reducedMotion="user">` at the root, **and** the existing
`prefers-reduced-motion` CSS block. Two layers because they cover different
things: MotionConfig handles JS-driven animation, the CSS block handles
everything else including anything added later that forgets to ask.

The reveal must still land under reduced motion — its impact comes from staging
and typography, not movement.

---

## 8. Performance

This app is small. Naming the real budget matters more than reciting general
advice — and for North the render loop is not where the cost is.

| Concern | Reality | Action |
|---|---|---|
| **Fonts** | **The dominant LCP factor.** Three families, one a serif. | `next/font` self-hosts and preloads; latin subset only. **Drop Newsreader italic** — it is currently loaded and used nowhere. |
| **Motion bundle** | **Measured on `/design`:** 188.7 KB gz with no Motion → 200.1 with the provider only → **236.5 once `Sheet` actually animates.** The `domMax` feature bundle (28.7 KB gz) stays deferred throughout. | `LazyMotion` with an *async* loader. A static `features={domMax}` import saves nothing — it bundles into the main chunk. The split is verified by the feature chunk's absence from the prerendered HTML. **The ~36 KB step is Motion's core runtime** (`m`, `AnimatePresence`, `useDragControls`) — unavoidable on any route that animates, and paid once. `/design` is a dev artifact; product routes should be lighter, and are worth re-measuring once screens exist. |
| **Client boundaries** | The largest avoidable JS cost | `"use client"` at leaves. A route accidentally going client is the regression to watch. |
| **Engine cost** | Negligible — a `find` over 7 rules | **Do not memoize.** Pre-optimizing this adds a stale-value bug class for zero gain. |
| **Images** | There are none | The usual biggest budget line is simply absent. |
| **CLS** | Handled in NDS: pending buttons hold label width, textarea auto-grows before paint | Sheets must not shift the page — `<dialog>` in the top layer already satisfies this. |
| **The gallery** | A large client component | Its own route, so it code-splits. It must never be imported by a product route. |

**What to actually measure:** route-level JS from the build manifest, and font
bytes. Both are cheap to check and both are where regressions will come from.
Lighthouse CI on a four-screen fixture app is ceremony.

---

## 9. Open decisions

Recorded rather than silently defaulted:

1. **Sheet origin animation.** Needs the trigger's rect threaded through. Adds
   API surface to `Sheet`; may require `domMax`. Resolve when the derivation
   sheet is wired to a real `Figure`.
2. **Onboarding persistence.** Does a half-finished conversation survive a
   refresh? Persisting is kinder; not persisting is simpler and the flow is 90
   seconds. Leaning **not persisted** for MVP.
3. **`localStorage` schema versioning.** A one-field `version` stamp with
   discard-on-mismatch is ~10 lines and prevents a corrupt-state class of bug
   during development. Probably worth it immediately.

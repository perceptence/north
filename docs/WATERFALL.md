# The Waterfall Engine — Rules and Assumptions

North's intelligence. Pure TypeScript in `core/waterfall/` — no React, no Next,
no DOM, no clock, no network.

> **This is not financial advice, and the engine is not a tax authority.**
> Every threshold below is a documented judgment. The contribution limits are
> illustrative fixture values for a portfolio demo and have not been verified
> against IRS publications.

---

## 1. Why it exists

It answers the hardest product question in North: **how do you serve everyone
without asking them who they are?**

Financial priority is universal and ordered. A 26-year-old with $2,000 and a
45-year-old surgeon are not different products — they are different rungs on the
same ladder. So the engine turns a `SituationProfile` into *the one thing that
matters right now*, and "Today is your current rung" makes the product thesis
and the architecture the same mechanism ([FOUNDATION §4](FOUNDATION.md)).

Two consequences worth stating plainly:

- **There is no persona branching anywhere.** The only control flow is *find the
  first unsatisfied rule*. One code path serves every user.
- **The intelligence is the judgment, not the prose.** The engine never calls a
  model. It is deterministic, arguable, and cannot fail live in a demo.

---

## 2. Contract

```ts
evaluate(profile: SituationProfile, { limits, now }): Evaluation
```

**In** — a profile of `Field<T>` values, each carrying how it was learned; a
`ContributionLimits` object; and `now`.

**Out** — the current rung and its `Read`, the full ladder state, and the derived
facts (exposed so the derivation sheet can show its working).

`current` is `null` when every rung is satisfied. That is the reward state, not
an empty state ([UX-ARCHITECTURE §7.2](UX-ARCHITECTURE.md)).

**`now` and `limits` are injected, never read.** The engine cannot reach a clock
and does not know a tax figure. That is what makes the demo reproducible, the
tests clock-free, and the annual limit change a data edit rather than a code
edit.

---

## 3. The ladder

| # | Rung | Satisfied when |
|---|---|---|
| 1 | Liquidity floor | cash covers ≥ 3 months of outgoings (6 with dependents) |
| 2 | Employer match | contribution rate ≥ match rate, or no match offered |
| 3 | High-interest debt | nothing at or above 7% with a balance |
| 4 | Tax-advantaged space | configured annual room fully used |
| 5 | Goal funding | no goal named, or every named goal is already funded |
| 6 | Surplus with nowhere to go | monthly surplus < $250 |
| 7 | Optimization | cash within a 12-month ceiling |

**Order is the entire judgment.** Changing it changes what North tells every
user, so it is asserted in the test suite rather than left to convention.

---

## 4. Assumptions, and why each one

Every number here is arguable. They live in `THRESHOLDS` (`core/waterfall/derive.ts`)
rather than inside comparisons precisely so they can be argued with.

### 3 months of outgoings — the liquidity floor
The conventional planning minimum. Chosen over 6 because a floor that feels
unreachable gets abandoned, and rung 1 blocks every other rung — an
unreachable floor would stall the whole product for the people who most need it.

### 6 months with dependents
Standard adjustment when someone else relies on the income. It uses a field the
profile already collects, and it demonstrates the engine personalising **without
branching on user type** — the same rule, a different input.

### 7% — the high-interest threshold
The conventional line: debt above it reliably costs more than investing is
expected to return, so paying it down is the better risk-free return. It sits
above long-run *real* equity expectations, which is where the number comes from.
An assumption, not arithmetic, and the one most worth revisiting.

### Income band midpoints
Onboarding collects a band, not a figure. The engine assumes the midpoint:

| Band | Assumed annual |
|---|---|
| under-100k | $75,000 |
| 100k-200k | $150,000 |
| 200k-400k | $300,000 |
| over-400k | $500,000 |

**This is why every figure downstream of income carries `assumed` confidence.**
That degradation is not a limitation to apologise for — it is the trust model
working. A user reading *"our assumption"* beside a surplus figure is being told
the truth.

### $250/month — a meaningful surplus
Below this, surfacing "put your surplus to work" is noise. A decision the user
cannot act on meaningfully is a decision that trains them to ignore the product.

### 12 months — the idle-cash ceiling
Generous on purpose. Rung 7 fires only for someone who has done everything else
and is *still* sitting on a large cash pile. Anything tighter would nag people
who simply prefer a bigger buffer, which is a preference, not a mistake.

### Contribution limits
Illustrative: $24,000 elective deferral + $7,500 IRA. **Injected, never
imported by the engine.** Limits change annually — a figure baked into a
comparison is a bug with a scheduled detonation date.

---

## 5. Confidence propagation

Two rules, both tested:

1. **Combining takes the weakest.** `stated > inferred > assumed`.
2. **Deriving caps at `inferred`.** A figure North computed is never something
   the user *told* us, however solid the inputs.

So `liquidityMonths` (from stated cash ÷ stated outgoings) is `inferred`, while
`monthlySurplus` (which touches assumed income) is `assumed`. The engine's
output feeds `Figure`'s accessible name directly, so a screen reader user hears
*"$19,500, of unused tax-advantaged room, our assumption"* — the same
information the visual grammar gives a sighted user.

---

## 6. The coaching / advice line

Reads **name a gap and frame a tradeoff**. They never recommend a security,
never name a ticker, never say "buy."

> *"You have $19,500 of tax-advantaged room going unused this year"* — a fact
> about the user's situation.
>
> *"Put it in VTI"* — regulated investment advice.

The first is where nearly all the value is, and it is the part everyone skipped
([FOUNDATION §9](FOUNDATION.md)). There is a test asserting no read or action
label contains a ticker or a purchase verb.

---

## 7. What is deliberately absent

- **Existing invested balances.** MVP onboarding collects none, so the
  projection in `core/projection/` models only deployable cash plus ongoing
  contributions, and understates for anyone with a balance North hasn't been
  told about. It discloses that rather than inventing a field the product does
  not collect — see §9.
- **Amortisation schedules, payoff ordering, Monte Carlo, optimisation solvers.**
  None of them change which rung you are on, and rung is the entire output.
- **Tax computation.** The engine reads a configured limit. It does not model
  brackets, deductions, phase-outs, or filing status.
- **Rung 5 in practice.** Onboarding collects no goal, so the rung is satisfied
  until the Goals surface names one. It has always been genuinely implemented
  and tested rather than stubbed, so switching it on was a data change, not an
  engine change.

---

## 7a. Several goals, one surplus

A person carries more than one goal at a time, and the goals COMPETE: a single
monthly surplus has to reach all of them.

Measuring each goal against the whole surplus is the obvious implementation and
it is wrong. Three goals would each report "your spare covers it" while funding
any one of them exhausts it — three statements that are individually true and
collectively a lie, which is the exact failure this product exists to refuse.

So the surplus is **allocated once, in deadline order** (`core/goals/plan.ts`):

1. Sort by `withinMonths` ascending. A deadline is the one thing about a goal
   the user cannot negotiate with, so the nearest claim is settled first.
2. Ties break on the larger target — two goals due the same month, the bigger
   one is the one more likely to fail quietly.
3. Each goal takes what remains, up to its monthly need. What it asks for and
   cannot get is its **shortfall**, and that is what the Goals screen reports.
4. `monthlyNeed` rounds UP to a clean $50. A monthly figure carrying cents is
   false precision in a sentence that is already an estimate.

**Rung 5 speaks for the soonest UNFUNDED goal** — `plan.primary`. Because the
rung, the Insights observation, and the Goals screen all read the same plan,
they cannot disagree about who is short.

**Assumption, stated:** allocation is by deadline alone. It does not weigh how
much someone wants a goal, what a goal is for, or whether a nearer goal is
trivial. Priority beyond "sooner first" is a judgment North has not been given
grounds to make.

**Absent, never empty.** `profile.goals` is undefined until a goal is named,
never `[]` — "none named" and "a list that happens to be empty" must not be two
states downstream. Each goal carries its own confidence and `asOf`: one named
with a firm date is `stated`, one added with "no date yet" is `assumed`, and
collapsing them into one field would launder the difference.

---

## 8. Testing

```bash
npm test
```

58 tests, zero dependencies — Node 24's built-in runner executes TypeScript
directly. No Vitest, no Jest, no transpiler.

The suite targets **business rules, not render output**. Testing that a
`Button` renders is low-yield; testing that *a person with no emergency buffer
lands on rung 1 regardless of income* is the product's actual claim.

The most important test in the repository:

```
income does not determine the rung
  › a high earner with no buffer lands on the same rung as a low earner
  › the same shortfall produces the same rung across all four bands
```

If income ever starts selecting the rung, the entire no-persona-branching
architecture has silently failed, and that is what catches it.

---

## 9. Projection — `core/projection/`

Feeds `HorizonBand`. Returns a **range**, never a point.

### What it models

Deployable cash above the buffer floor, plus ongoing retirement contributions,
compounding to the horizon. Returns are **real** (inflation-adjusted), so the
output is in today's dollars — a nominal projection looks impressively larger
and is the false-precision problem in a different costume.

**It assumes the cash gets deployed.** Deliberate: the band sits directly
beneath the decision that moves it, so it shows where taking the decision leads.
That is the decision made consequential.

**It excludes anything North hasn't been told about.** That exclusion is
returned as a disclosed assumption, not buried.

### The band width IS the uncertainty

Two aggregations, answering different questions:

| | Question | Rule |
|---|---|---|
| `confidence` | How good is this number? | Weakest input, capped at `inferred` |
| `spreadMultiplier` | How much of the picture is solid? | **Blended** across inputs, 1.0 → 1.6 |

Blending is what makes the visual claim literally true. Taking the weakest would
peg every band to the widest setting and the width would carry no information.

### Assumptions are data, not prose

`project()` returns `assumptions: ProjectionAssumption[]`, so the Assumptions
sheet renders the same values the maths used. The disclosure cannot drift away
from the number it explains — this is the band's table-view twin.

### It returns `null` when there is nothing to project

Someone at the liquidity floor has no deployable cash and no contributions. The
arithmetic answer is zero, and rendering *"your future: $0 – $0"* to a
25-year-old is the guilt register this product exists to avoid — as well as a
distraction from a decision about next month. `null` rather than a zeroed
Projection so a caller cannot render it by accident; `Card`'s `horizon` prop is
optional for exactly this.

### Bands the fixtures produce

| Persona | Horizon | Band | Width |
|---|---|---|---|
| EARLY | — | *none — nothing to project* | — |
| SQUEEZED | 30 years | $328K – $849K | 2.6× |
| UNADVISED_EARNER | 25 years | $578K – $1.5M | 2.5× |
| SETTLED | 20 years | $813K – $1.5M | 1.8× |

Those widths are not a modelling failure. At 3–7% real over 25 years,
(1.07/1.03)^25 ≈ 2.6 — the range genuinely is that uncertain, and saying so is
the product's entire stance on projections.

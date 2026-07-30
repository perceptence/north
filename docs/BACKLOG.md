# North — Backlog

Future considerations. **Nothing here is in MVP scope**
([STRATEGY §8](STRATEGY.md)) and nothing here should influence current build
decisions except where noted as a constraint to preserve.

---

## B2B — North for Employers

**Status:** Roadmap only. Not scoped, not designed, not estimated.

Extend North into an employer-sponsored financial wellness ecosystem.

**Capabilities envisioned**

- Employer admin dashboard
- Employee engagement insights — **aggregated and privacy-safe only**
- Financial wellness programs
- Benefits integrations
- AI-generated organizational insights

### The hard constraint

> **Employers must never access individual employee financial data.**

### Three things that will decide whether this works

Recorded now because they are cheap to reason about and expensive to retrofit.

**1. "Aggregated" is not automatically safe.**
The naive reading — *ship averages, not records* — leaks. On a six-person team,
an average debt figure plus one known salary reconstructs an individual. Any
implementation needs, at minimum: a **hard minimum cohort size** before a metric
renders at all, **suppression of small cells** rather than rounding them,
**no cross-tab drilling** that lets an admin intersect filters down to a person,
and suppression that holds across *time* — a cohort that changes by one person
between periods leaks the difference. This is a design constraint on the metric
layer, not a privacy policy to write later.

**2. The product must be visibly private, not merely technically private.**
North's entire moat is a trust relationship with the individual. If an employee
*suspects* their employer can see their situation, the coach stops getting
honest answers and the product is dead regardless of what the architecture
actually does. Whatever gets built has to make the boundary legible to the
employee, continuously — not disclosed once in an onboarding modal.

**3. Who the coach works for.**
The sharpest tension, and the one most likely to be discovered too late: if the
employer pays, does the coach still give the answer that's best for the
employee? An employer-sponsored coach that steers people toward the employer's
own 401k provider, or stays quiet about a bad plan, has stopped being a coach.

This sits directly on the coaching/advice line ([FOUNDATION §9](FOUNDATION.md)).
It needs an explicit answer before any B2B work starts — probably a stated
commitment that the coach's recommendations are identical whether or not an
employer is paying, and that employer-specific benefits are surfaced as
*options*, never as the recommendation.

### Constraint to preserve in current work

Nothing in the MVP needs to change for this. The one thing worth **not**
foreclosing: keep the `SituationProfile` and the Waterfall engine free of any
notion of an employer, sponsor, or tenant. If a cohort concept is ever needed it
belongs in a layer *above* the engine, so the reasoning that produces a person's
advice can never take an organization as input.

---

## Decision detail

**Status:** Designed, deferred. Not built.

A per-entry overlay off the Decisions ledger: the situation as it stood when
you made that call, and what has changed since. It was specified as overlay
**O3** in [UX-ARCHITECTURE §5](UX-ARCHITECTURE.md) and drawn into the IA
before the ledger was rebuilt.

**Why it is not in the product.** The Decisions redesign replaced a grouped
list with a continuous run of months
(`core/decisions/timeline.ts`), and that run carries the thing a detail view
was mainly there to supply: *interval*. A busy month reads as a cluster, a
quiet stretch reads as quiet, and a settled entry states its own outcome and
date on the row. What remained for an overlay was "the situation at the
time" — which the product does not store, because a `SituationProfile` is
current-state, not an event log.

**What it would cost.** Real historical snapshots. `usePreviousProfile`
holds exactly one prior profile for the story's diff, which is not a
history. Building this means either snapshotting the profile at every
decision or deriving one from an event log that does not exist yet — a data
model change, not a screen.

**Constraint to preserve:** decision rows stay read-only until that history
exists. A tap target that opens a thin or reconstructed "situation then" is
worse than no tap target, on the one screen whose whole job is being
trustworthy about your own record.

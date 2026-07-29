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

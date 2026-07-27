# North — Product Foundation

> Everyone else shows you where your money went.
> North tells you where you're going.

**Division of labor:** [STRATEGY.md](STRATEGY.md) is the source of truth for
**product** — vision, users, problems, jobs, journey, MVP scope, exclusions.
This document is the source of truth for **design and engineering** — the
mechanism, principles, visual direction, and architecture.

If a decision contradicts the relevant file, either the decision is wrong or the
file needs to change — deliberately, not by drift.

---

## 1. Thesis

North is an AI financial coach, not a financial dashboard.

The distinction is not cosmetic. A dashboard reports the past; a coach directs
the future. Every failed personal-finance product in the last decade shipped a
report card — categorized spending, charts, a monthly summary — and lost most
of its users inside 60 days, because being told what you already know, in a
tone that implies you did it wrong, is not a habit anyone sustains.

A coach does five things a dashboard cannot:

1. Knows your **goal**, not just your balance
2. Has a **point of view** — makes an actual call
3. **Remembers** — every session references the last
4. **Notices drift** and comes to you, unprompted
5. **Adjusts the plan** when your life changes

Items 3–5 are the moat. Transaction history is portable and commoditized. A
coach that knows you is not.

**Therefore: North is a push-first product with a pull surface.** It is not a
place you go to browse. It is something that tells you the one thing that
matters, and remembers what you decided.

---

## 2. Who it's for

**Everyone — without ever asking them to classify themselves.**

North does not present a persona picker. The coach infers your situation from
conversation, because asking a user to self-segment offloads the coach's core
job onto the person least equipped to do it. The user who most needs North is
precisely the one who doesn't know which box they belong in.

This is possible because financial priority is **universal and ordered** — see
§4, The Waterfall. Everyone occupies the same ladder; only their rung differs.

→ Segments, narrative wedge, and anti-users: [STRATEGY §2](STRATEGY.md).
The design consequence, which lives here: **no branching UI, no persona-
conditional content, no picker.** One code path for every user.

---

## 3. Core loop

```
Coach observes  →  surfaces ONE thing  →  you decide  →  coach tracks it  →  checks back
```

Not `open app → browse data`. This loop is the acceptance test for every
screen, component, and feature. If it doesn't serve the loop, it doesn't ship.

**The primary metric is decisions made and held — not sessions, not MAU.**
Engagement with a finance app is a vanity metric; a user who opens North daily
and changes nothing is a failure. A user who opens it monthly and moves is a
success.

---

## 4. The Waterfall

The engine that makes "serve everyone" tractable without branching.

| # | Priority | Question |
|---|----------|----------|
| 1 | Liquidity floor | Do you have a buffer? |
| 2 | Employer match | Free money left on the table? |
| 3 | High-interest debt | Anything above ~7%? |
| 4 | Tax-advantaged space | 401k / IRA / HSA unused? |
| 5 | Goal funding | House, sabbatical, kid, exit |
| 6 | Taxable investing | Surplus with nowhere to go |
| 7 | Optimization | Tax efficiency, drift, rebalancing |

Your position on this ladder is derived, never declared. **"Today" is your
current rung.**

Implementation consequence, and it is a strict rule:

```ts
// NO — persona branching. Does not scale, requires a picker, 4x the content.
if (persona === "young_professional") { ... }

// YES — ordered rules over a derived profile. One engine, any segment.
const rung = waterfall.firstUnsatisfied(profile)
```

---

## 5. Situation Profile

The typed object the coach builds through conversation. It replaces the persona
picker entirely.

```ts
type Confidence = "stated" | "inferred" | "assumed"

type SituationProfile = {
  horizon:              Field<number>        // years to primary goal
  incomeBand:           Field<IncomeBand>
  obligations:          Field<Obligation[]>  // type + balance + rate
  dependents:           Field<number>
  liquidityMonths:      Field<number>        // runway
  retirementRate:       Field<number>        // % of income
  primaryWorry:         Field<string>        // the emotional anchor
}

type Field<T> = { value: T; confidence: Confidence; asOf: ISODate }
```

**Every field carries confidence.** This is not defensive engineering — it is a
product feature. Conversation-derived data is uncertain, and the coach must
know what it actually knows. Confidence drives three behaviors:

- What the coach asks about next (lowest-confidence, highest-impact field)
- How strongly it phrases a recommendation
- Whether a projection is shown at all

A coach that states an assumed number with the confidence of a stated one has
lied, and in a financial product that is unrecoverable.

---

## 6. Information architecture

Four surfaces. Hard cap.

| Surface | Job | The one question it answers |
|---|---|---|
| **Today** | The coach's current read | "What should I do about my money right now?" |
| **Trajectory** | Where this path leads | "Am I going to be okay?" |
| **Decisions** | Open calls + history | "What did I commit to, and did I do it?" |
| **Coach** | The conversation | "Can I just ask?" |

**There is no Accounts tab and no Transactions tab.** Those are drill-downs
reachable by tapping a number, never destinations. The moment they become
destinations, North is a dashboard again.

**Trajectory across all segments:** the form never changes — *you vs. your goal
over time, with an uncertainty band.* Only the axis differs between a
26-year-old and a 58-year-old. One component, one visual language, ranges
rather than points.

**This is the product's IA, not the MVP's.** MVP ships Today and Decisions;
Trajectory survives as a horizon line on Today, and Coach is deferred. See
[STRATEGY §8](STRATEGY.md). Build the navigation to hold four, populate two.

---

## 7. Design principles

Written as constraints, so they can be violated — and caught.

**1. Calm over comprehensive.**
Financial anxiety is the user's resting state. The UI's job is to lower it.
*We do not ship a screen with two primary actions.*

**2. Never a number without a read.**
Every figure ships with what it means.
*We do not render raw data and leave the user to infer.*

**3. Earn every number.**
Tap any figure, see its derivation. Trust in fintech is auditability.
*We do not show a projection the user cannot unpack.*

**4. Honest about uncertainty.**
Ranges, not false precision. `$1.2M–$1.8M`, never `$1,247,832`.
*Fake precision is the fastest way to lose a financially literate user.*

**5. Continuity.**
Every session references the last.
*The product never greets a returning user like a stranger.*

**6. Restraint is the premium signal.**
Type, space, and intentional motion carry the quality — not effects.
*We do not reach for a visual effect to carry meaning hierarchy should carry.*

---

## 8. Visual direction

→ **Fully specified in [VISUAL-DIRECTION.md](VISUAL-DIRECTION.md)** — brand
personality, the validated palette, typography, layout, cards, data
visualization, motion, and accessibility.

The register, which anchors everything there: **an editorial magazine or a
private bank's statement — not a trading terminal.** "Premium fintech" has
calcified into a cliché (dark mode, glassmorphism, violet gradient, a number in
72pt); it signalled expensive in 2021 and reads as a crypto app now. North is
light-first, warm-neutral, and near-monochrome, with the primary action rendered
in ink rather than a colored button.

Two rules stated in earlier drafts of this section were **wrong and have been
corrected** in VISUAL-DIRECTION:

- *"`tabular-nums` everywhere numeric"* → tabular figures only where numbers
  align vertically (ledger rows, derivation lists, axis ticks). Display-size
  numbers use proportional figures; equal-width digits look loose at scale.
- *"Green/red for direction only"* → **North uses no red/green financial
  semantics at all.** Amounts are never colored; direction is a glyph. Color is
  reserved for attention.

---

## 9. The coaching / advice line

A hard product boundary, decided now because retrofitting it later means
gutting the coach's voice.

> *"Buy VTI with that $500"* — regulated investment advice (RIA registration,
> fiduciary duty).
>
> *"You have $500/mo unallocated and nothing going to retirement — that's the
> gap"* — coaching.

**North coaches. It does not recommend specific securities or execute trades.**

This is not merely the compliant choice — it is the better product. It respects
the user's agency, and it is what a good human coach actually does: name the
gap, frame the tradeoff, let the person decide. Naming the gap is the hard part
and the valuable part. Picking the ticker is the commodity.

---

## 10. Non-goals

→ The full exclusion list with rationale: [STRATEGY §9](STRATEGY.md).

The two that are *structural* rather than merely deferred, and therefore belong
here as engineering constraints:

- **Persona picker / persona-conditional UI.** See §2 and §4. There is no code
  path that branches on user type.
- **Investment execution and security recommendations.** See §9. The coach names
  gaps; it does not name tickers.

---

## 11. Technical foundation

Decisions made now because they get expensive later.

| Area | Decision | Why |
|---|---|---|
| Framework | Next.js 15 App Router, TypeScript `strict` | Server components for data, minimal client state |
| Styling | Semantic token layer over Tailwind | `--surface-raised`, never `bg-gray-100` in a component |
| Primitives | Radix, unstyled | A11y + focus management free; we own 100% of the visual layer |
| Motion | Motion (Framer), shared spring config | Easing lives in tokens — one vocabulary, not per-component guesses |
| Money | Integer cents, formatted at the edge | **Never floats.** Drift in a financial app is an instant credibility kill |
| Data | Typed interface + fixture implementation | Swap in a real provider without touching a component |
| Validation | Zod at every boundary, especially LLM output | A malformed coach response degrades gracefully, never blanks the screen |
| Quality | `/design` route from commit one | Living token sheet + component gallery; keeps the system honest |

### The data seam

All financial data sits behind one typed interface with a fixture
implementation from day one. Two payoffs: the demo is always real and always
working, and account linking becomes a swap rather than a rewrite.

This aligns with the onboarding model — **conversation first, connect later.**
Linking is offered once the coach has earned it, never as a toll gate before
any value is delivered. The relationship precedes the data, which is the entire
thesis.

---

## 12. Build order

Design system and hero flows first. Slowest to a screenshot, fastest to a real
product — every subsequent screen gets cheaper and stays consistent.

1. Token layer + `/design` route
2. Core primitives (type scale, surface, figure, decision card)
3. Arrival
4. Onboarding conversation → Situation Profile
5. **Today** — the waterfall rung, one decision, one horizon line
6. **Decisions** + the return state ← *protect this; it is the differentiator*
7. README, Waterfall engine tests, repo hygiene

Post-MVP: **Trajectory** as a full surface, then **Coach**.

→ Scope, per-surface definition of done, and what is excluded:
[STRATEGY §8–9](STRATEGY.md). Neither Trajectory nor free-form Coach chat is in
MVP; §6 above describes the product's IA, not the MVP's.

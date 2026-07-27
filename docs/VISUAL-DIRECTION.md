# North — Visual Design Direction

Derived from [STRATEGY.md](STRATEGY.md), [FOUNDATION.md](FOUNDATION.md), and
[UX-ARCHITECTURE.md](UX-ARCHITECTURE.md). This document is the source of truth
for **how North looks and moves**. Values are specified and contrast-verified;
treat them as the starting system, not as untouchable.

---

## 0. The references, decoded

"Apple Health, Linear, Arc level of polish" is a feeling, not a spec. What those
three actually share:

- **Chrome is removed; type and content carry the structure.** None of them
  decorate a container to signal importance.
- **Color is semantic, never ornamental.** Health's category colors *mean*
  something. Linear is ~95% grayscale. Arc's color is identity, not garnish.
- **Motion has physical logic.** Things arrive from where they came from.

What North takes from each:

| Reference | Take | Explicitly don't take |
|---|---|---|
| **Apple Health** | Calm density, warm light ground, semantic color, soft containment | Rings, streaks, gamified completion — guilt mechanics |
| **Linear** | Restraint, precision, *speed as a design value* | Dark-first, the violet accent, the keyboard-power-user register |
| **Arc** | Spatial motion logic, confidence to delete UI | Playfulness — wrong register for someone's money |

**The synthesis:** Health's calm, Linear's precision, Arc's spatial thinking —
in an editorial rather than a software register.

---

## 1. Brand personality

North is a person before it is an interface: **a genuinely competent friend who
happens to be a financial planner.** Not a wealth manager, not a finance bro,
not a robot.

| Trait | Means | Does not mean |
|---|---|---|
| **Direct** | Says the thing in the first sentence | Blunt, or performing bluntness |
| **Warm** | You feel understood | Friendly — no exclamation marks, no emoji, no "Hey there!" |
| **Quiet** | Restraint reads as confidence | Cold, or withholding |
| **Adult** | Assumes competence; explains only on request | Condescending, or jargon-flexing |

### The defining tension

> **Certain about your situation. Honest about your future.**

This is the personality, and it is also — critically — **a rendering rule.**
Facts render with authority. Projections render with visible uncertainty. The
brand is not applied on top of the interface; it *is* the interface's grammar.
See §3.4 and §7.

### Anti-personality

Not a cheerleader. Not a scold. Not a robot. Not a salesperson. If a piece of
copy or UI could appear in a banking app, a budgeting app, or a crypto app, it
is wrong.

---

## 2. Visual design principles

The six product principles in [FOUNDATION §7](FOUNDATION.md) are *what North
believes*. These are their visual enforcement — one each, stated as something
that can be violated and caught in review.

| # | Product principle | Visual enforcement |
|---|---|---|
| 1 | Calm over comprehensive | **One focal element per viewport.** Everything else is at least one full step down in contrast. Two things competing means one is wrong. |
| 2 | Never a number without a read | **Prose is a display element.** The coach's sentence gets the largest type on the screen; figures live inside it. |
| 3 | Earn every number | **Interrogable figures carry a consistent, subtle affordance.** The same mark, everywhere, always meaning "tap to see where this came from." |
| 4 | Honest about uncertainty | **Certainty has a visual grammar.** Known renders sharp; assumed renders soft. System-wide, not a chart feature. |
| 5 | Continuity | **The past is present but subordinate.** History uses the same visual language, one step quieter — never a separate style. |
| 6 | Restraint is premium | **Nothing decorative.** Every element is load-bearing or deleted. No ornament, no filler illustration, no texture for warmth. |

**Principle 4 is the one that makes North's design system unlike anything else
in the category** — see §3.4. It is worth protecting above the other five.

---

## 3. Color strategy

### 3.1 Three families. Only three.

| Family | Job | Rule |
|---|---|---|
| **Ground** | Surfaces the product sits on | Warm neutrals. Never pure white as the page. |
| **Ink** | All text, all primary actions | Warm near-blacks and grays. **The primary action is ink, not a hue.** |
| **Signal** | Attention and the coach's presence | At most **one signal element per viewport.** |

**The strategic move: the primary action is ink on paper, not a colored button.**
That single decision sidesteps the entire fintech color problem. No trust-blue,
no growth-green, no premium-violet. It reads as print, which is the most
expensive-looking thing a screen can do.

### 3.2 The palette

Contrast ratios below are **computed, not estimated**, and verified against all
three ground surfaces.

**Ground (light)**

| Token | Hex | Use |
|---|---|---|
| `ground-page` | `#FAF8F5` | The page. Warm paper. |
| `ground-raised` | `#FFFFFF` | The decision card — the only raised surface |
| `ground-sunken` | `#F2EFEA` | Overlays, inset regions |
| `ground-hairline` | `#E6E1D9` | Separation only — 1.23:1, carries no meaning by design |

**Ink**

| Token | Hex | vs page | Permitted use |
|---|---|---|---|
| `ink-primary` | `#1A1714` | **16.84** | The read, figures, primary action |
| `ink-secondary` | `#57514A` | **7.39** | Supporting prose, labels |
| `ink-tertiary` | `#726B62` | **4.96** | Metadata, timestamps, rung indicator |
| `ink-ghost` | `#ADA49A` | 2.32 | **Never text.** Disabled marks and inactive rung ticks only |

`ink-tertiary` was moved from `#7C746A` after measurement — the original cleared
AA on white but failed on the page ground at 4.34:1. `#726B62` clears 4.5:1 on
**all three** surfaces.

**Signal**

| Token | Hex | vs page | Use |
|---|---|---|---|
| `signal-north` | `#2E3A8C` | **9.43** | Deep indigo. The coach's presence and the interrogable-figure mark. Nothing else. |
| `signal-attention` | `#A6522F` | **5.12** | Warm clay. At most once per screen, never on an amount. |

Indigo for the north-star resonance — deep and desaturated, deliberately not the
bright corporate blue every fintech reaches for. Clay rather than red for
attention, because **red next to a dollar figure reads as "your money is gone"**
— which violates the error rule in [UX-ARCHITECTURE §9](UX-ARCHITECTURE.md).

### 3.3 North does not use red and green for financial direction

The category's deepest reflex, and North rejects it entirely.

- **Amounts are never colored.** Ever.
- **Direction is a glyph and a position**, not a hue.
- **Color is reserved for exactly one thing: attention.**

The justification is on-thesis rather than merely aesthetic: in North, *the read
tells you whether it's good or bad, in words.* Color-coding is redundant with
the product's core feature. Removing it kills the banking-dashboard feel in one
decision and makes the palette colorblind-safe by construction rather than by
remediation.

*This is a bet. It is also the single most differentiating decision in the
system.*

### 3.4 Confidence has a visual grammar

The `SituationProfile`'s three confidence levels ([FOUNDATION §5](FOUNDATION.md))
render as three distinct treatments, consistently, everywhere a figure appears:

| Confidence | Meaning | Treatment |
|---|---|---|
| **stated** | You told us | `ink-primary`, sharp, unmarked |
| **inferred** | Derived from what you told us | `ink-primary`, with the interrogable mark |
| **assumed** | Our assumption, not your fact | `ink-secondary`, with a distinct assumption mark |

**Nobody else in personal finance does this.** It makes the product's smartest
idea visible instead of internal, it enforces principle 4 at the token level,
and it is the visual reason a user trusts North's numbers more than a
competitor's.

### 3.5 Dark mode

Tokens are authored dark-ready; **MVP ships light only**
([STRATEGY §8](STRATEGY.md)). When it lands, Ground and Ink invert roles and
Signal desaturates — and the palette is **re-validated against the dark surface,
not flipped.** An automatic inversion is not a dark mode.

---

## 4. Typography

### 4.1 Three families, three jobs

The typographic concept *is* the product thesis:

> **The serif is the coach thinking. The mono is the machine computing. The sans
> is the interface getting out of the way.**

| Role | Face | Carries |
|---|---|---|
| **Voice** | **Newsreader** (editorial serif, variable, optical sizing) | The coach's prose — the largest type on any screen |
| **Interface** | **Geist Sans** (precise grotesque) | Labels, buttons, navigation, metadata |
| **Figures** | **Geist Mono** | Numbers **only where they align vertically** |

All three are openly licensed — no licensing friction for a portfolio piece, and
the demo runs anywhere.

Newsreader over the obvious alternatives because it is an editorial serif
designed for screens with a genuine optical-size axis, rather than a display
face pressed into body duty. Geist over Inter because Inter is now the default
signifier of "a startup made this."

### 4.2 The figure rule — corrected

An earlier draft of [FOUNDATION §8](FOUNDATION.md) said *tabular figures
everywhere numeric.* **That was wrong, and it's now fixed.** Equal-width digits
make large standalone numbers look loose and gappy.

| Context | Figures |
|---|---|
| Inside the coach's sentence | **Newsreader's own proportional lining figures** — it's speech; a person saying "forty thousand dollars" |
| Ledger rows, derivation lists, axis ticks | **Geist Mono, tabular** — columns that must align |
| Any large standalone number | Proportional, never tabular |

Numbers inside the read stay in the serif rather than switching to mono. Mixing
mono into serif prose creates a texture clash at inline sizes, and — more
importantly — it breaks the fiction that a person is speaking. **The coach
speaks numbers; the system tabulates them.**

### 4.3 Scale

A modular scale, ~1.25, with the serif consistently outranking the sans. The
hierarchy is unusual and deliberate: **the largest thing on the screen is a
sentence, not a number.**

| Step | Size / Line | Face | Use |
|---|---|---|---|
| `voice-lg` | 30 / 40 | Serif | The read on Today |
| `voice-md` | 22 / 32 | Serif | Onboarding questions, decision detail |
| `body` | 17 / 26 | Sans | Supporting prose |
| `label` | 14 / 20 | Sans | Actions, field labels |
| `meta` | 13 / 18 | Sans | Timestamps, rung indicator |
| `figure` | 15 / 22 | Mono | Ledger and derivation values |

**Serif floor: 20px.** Below it, editorial serifs lose legibility on screen —
anything smaller uses the sans.

Measure caps at **62–68 characters**, which is what drives the layout in §5.

---

## 5. Layout philosophy

> **A dashboard is a grid. North is a column.**

That is the whole philosophy, and it is the clearest anti-dashboard statement
the product can make structurally.

- **Single column, at every breakpoint.** On desktop it stays a column, centered,
  ~600px max — set by the measure, not by the viewport. It does not become a
  two-up grid at 1024px. Widening into columns is precisely the moment a
  coaching product turns back into a dashboard.
- **8px base rhythm**, 4px half-steps. Vertical spacing is the primary
  compositional tool.
- **Content-driven height.** Scrolling is fine; cramming to fit a viewport is
  not.
- **One focal element per viewport.** The read, or the question, or the open
  commitment — never two.
- **Generous margins.** Content never touches an edge.
- **No side-by-side comparison anywhere in MVP.** Two things beside each other
  invite comparison; North's job is to have already done the comparing.

---

## 6. Card design

### North has one card, and it is the decision.

Cards proliferate in dashboards because every module needs a container. When
exactly one thing on the screen is a card, **the card itself carries meaning:
this is the thing that needs you.**

Everything else is flow — prose and hairlines on paper. History entries are
**rows**, not cards. That contrast is the point.

**The decision card**

| Property | Spec | Why |
|---|---|---|
| Surface | `ground-raised` on `ground-page` | The lift comes from the warm/white shift |
| Border | 1px `ground-hairline` | A hairline, not a shadow |
| Shadow | **None**, or a single near-invisible ambient layer | Drop shadows read as 2015 Material |
| Radius | 20px | Soft enough to read calm; short of toy-like |
| Padding | 24px, 32px bottom | Extra below so actions breathe |
| Chrome | **None** — no header, no icon, no overflow menu | The content is the card |

**Contents, in order:** the read (serif, voice-lg) → rung indicator (meta) →
primary action → secondary action → horizon line.

**The rule that keeps this honest:** if a second card ever appears on a screen,
one of them isn't a decision, and it should be a row.

---

## 7. Data visualization style

MVP contains **one visualization**, and calling it a chart overstates it.

### 7.1 The horizon band

A projected range. Per the form heuristic, a two-endpoint range is *not a chart*
— a one-bar bar chart is an anti-pattern, and the number is the chart.

**The form:** a single horizontal band. No axes, no gridlines, no legend, no
tooltip. Two endpoint labels, direct. Height ~6px. `signal-north` at low opacity
for the band; endpoints in `ink-primary`.

**The idea that makes it worth rendering at all:**

> **The band's width *is* the uncertainty.** Low confidence in the profile
> produces a visibly wider band.

The graphic encodes the product's honesty rather than illustrating a number.
When the coach knows less, you can *see* that it knows less — without reading a
word. That is principle 4 made physical.

The Assumptions overlay ([UX-ARCHITECTURE §5](UX-ARCHITECTURE.md)) is this
graphic's **table-view twin**, which satisfies the accessibility requirement
that no value be reachable only through a visual encoding.

### 7.2 The rung indicator

Primarily typographic: *"4 of 7 · tax-advantaged space."* Optionally seven
hairline ticks, filled to position, `ink-ghost` for inactive.

**The constraint: never celebrate advancement.** No animation on rung change, no
completion state, no color shift to "done." The instant it reads as a progress
ring, North has become a game about money — which is the register
[STRATEGY §3, P3](STRATEGY.md) identifies as the category's core failure.

### 7.3 Standing chart rules (for post-MVP Trajectory)

- No gridlines, or one baseline hairline only.
- **Never a dual axis.** Two measures at different scales are two charts.
- Direct labels, selectively — never a value on every point.
- Anything projected renders as a **band, never a line.** A line asserts a
  precision the model doesn't have.
- Maximum two series. Past that, emphasis: one in `signal-north`, the rest gray.
- **Color never encodes magnitude.** That is the cluttered-chart trap — it
  double-encodes what length already shows.
- Thin marks, hairline chrome, generous padding. Saturated fills only on small
  marks.
- Every chart has a table-view twin.

---

## 8. Motion principles

**Speed is a design value.** Nothing bounces. Nothing lingers. Overshoot reads
as playful, and playful is the wrong register for money.

### 8.1 Spatial logic

Motion tells you where things came from. The derivation overlay **rises from the
number you tapped**, not from the bottom of the screen. Decisions slides in from
the direction of the continuity strip. Back reverses the exact path forward
took. If an element's origin isn't legible from its motion, the motion is
decoration.

### 8.2 Timing

| Class | Duration | Curve |
|---|---|---|
| Micro (press, hover, focus) | 120ms | ease-out |
| Standard (overlays, routes) | 220ms | spring, no overshoot |
| Considered (recompute) | 320ms | spring |
| Ceremonial (the reveal) | 600–900ms | staged |

**The reveal is the one place slowness is correct** — it is the highest-value
moment in the product, and rushing it wastes it. Everything else is fast.

### 8.3 Never animate a number counting up

The definitive fintech cliché. A counting number says *look at me*; North's
numbers say *this is true*. Values **cross-fade in place**. On recompute the
change must be visible and legible — that's the proof the system reasoned — but
it resolves in one step, not by ticking.

### 8.4 Reduced motion

`prefers-reduced-motion` degrades everything to opacity. Non-negotiable, and
the reveal must still land — its impact comes from staging and typography, not
from movement.

---

## 9. Accessibility

**WCAG 2.1 AA is the floor, and the palette was measured against it rather than
assumed.**

### Verified

- Every ink and signal token clears **4.5:1 on all three ground surfaces** —
  `ink-tertiary` was corrected from `#7C746A` to `#726B62` for exactly this.
- `ink-ghost` (2.32:1) and `ground-hairline` (1.23:1) are **structurally barred
  from carrying meaning.** Decorative marks and separators only.
- **Color is never the sole carrier of information** — guaranteed by
  construction, since §3.3 removes red/green semantics entirely. There is no
  colorblind remediation to do because there is nothing encoded in hue.

### Required

- **Touch targets ≥ 44×44**, including the interrogable-figure affordance —
  which is small and inline, so its hit area must exceed its visual bounds.
- **Focus is designed, not defaulted and not removed.** A visible ring in
  `signal-north`, consistent everywhere, meeting 3:1 against both adjacent
  surfaces.
- **Text scales to 200% without breaking layout.** A single-column layout makes
  this nearly free — one of the quiet benefits of §5.
- **Serif floor of 20px** is an accessibility constraint as much as an aesthetic
  one.
- **Mono figures must not be announced character-by-character** by screen
  readers — verify, and use explicit `aria-label` on figures.

### The confidence system extends to assistive technology

A figure's confidence is part of its meaning, so it must be announced:

> "$40,000 — a figure you told us"
> "6% annual return — our assumption"

A sighted user gets this from the visual grammar in §3.4. **A screen reader user
must get the same information, not a bare number.** This is the accessibility
requirement most likely to be skipped and the one that matters most here — the
entire trust model depends on knowing which numbers are yours and which are
North's guesses.

---

## 10. What this system refuses

- **No green or red for financial direction.** §3.3
- **No colored primary button.** The primary action is ink. §3.1
- **No shadows for elevation.** Hairline and surface shift. §6
- **No second card on a screen.** §6
- **No number animating upward.** §8.3
- **No dual-axis chart, ever.** §7.3
- **No line where a band is honest.** §7.3
- **No progress ring, no streak, no celebration on rung advance.** §7.2
- **No multi-column layout at any breakpoint.** §5
- **No tabular figures on display-size numbers.** §4.2
- **No decorative element anywhere.** §2

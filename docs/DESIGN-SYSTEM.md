# North Design System (NDS)

The implementable layer beneath [VISUAL-DIRECTION.md](VISUAL-DIRECTION.md).
That document decides *what North looks like*; this one defines the tokens and
components that make it buildable and keep it consistent.

**Every contrast figure here is computed, not estimated.** Three failures were
found and fixed during authoring — see §2.4.

---

## 1. Token architecture

Two tiers. The separation is what makes theming possible later and what keeps
components honest.

```
Tier 1 — Primitive     raw values, named for what they ARE      --paper-50, --ink-900
Tier 2 — Semantic      named for what they DO                   --surface-page, --text-primary
                                     ↓
Components consume Tier 2 ONLY.
```

**A component referencing a Tier 1 token, a raw hex, or a raw pixel value is a
review failure.** No exceptions — this is the rule that prevents a design system
from decaying into a color palette with opinions.

---

## 2. Color tokens

### 2.1 Tier 1 — primitives

**Paper** (warm neutral ground)

| Token | Hex |
|---|---|
| `paper-0` | `#FFFFFF` |
| `paper-50` | `#FAF8F5` |
| `paper-100` | `#F2EFEA` |
| `paper-200` | `#E6E1D9` |
| `paper-300` | `#C9C1B6` |

**Ink** (warm near-black)

| Token | Hex |
|---|---|
| `ink-900` | `#0F0D0B` |
| `ink-800` | `#1A1714` |
| `ink-700` | `#302B25` |
| `ink-600` | `#57514A` |
| `ink-500` | `#726B62` |
| `ink-400` | `#918B83` |
| `ink-300` | `#ADA49A` |

**Indigo** / **Clay** (signal)

| Token | Hex |
|---|---|
| `indigo-600` | `#2E3A8C` |
| `indigo-300` | `#6B87FF` |
| `clay-600` | `#A6522F` |

### 2.2 Tier 2 — semantic

Contrast measured against the surface each token actually renders on.

**Surface**

| Semantic token | Primitive | Use |
|---|---|---|
| `surface-page` | `paper-50` | The page |
| `surface-raised` | `paper-0` | The decision card — the only raised surface |
| `surface-sunken` | `paper-100` | Sheets, inset regions |
| `surface-scrim` | `ink-800 @ 32%` | Behind modal sheets |

**Text**

| Semantic token | Primitive | vs page | Gate |
|---|---|---|---|
| `text-primary` | `ink-800` | **16.84** | AA body |
| `text-secondary` | `ink-600` | **7.39** | AA body |
| `text-tertiary` | `ink-500` | **4.96** | AA body |
| `text-inverse` | `paper-50` | 16.84 *(on ink)* | AA body |
| `text-disabled` | `ink-300` | 2.32 | **Non-text only** |

**Action**

| Semantic token | Primitive | Contrast | Gate |
|---|---|---|---|
| `action-primary-bg` | `ink-800` | 16.84 *(label)* | AA body |
| `action-primary-bg-hover` | `ink-700` | 13.23 *(label)* | AA body |
| `action-primary-bg-pressed` | `ink-900` | 18.30 *(label)* | AA body |
| `action-border` | `ink-400` | **3.18** | AA non-text |
| `action-border-hover` | `ink-500` | **4.90** | AA non-text |

**Atmosphere** *(craft pass, July 2026)*

| Semantic token | Primitive | Contrast | Use |
|---|---|---|---|
| `surface-deep` | `sky-900` | 13.67 *(paper on it)* | The sky's deep zone |
| `text-on-deep` | paper @ 95% | 13.67 / 7.35 | Text on the sky |
| `text-on-deep-dim` | paper @ 72% | 7.77 / 4.73 | Inactive nav on the sky |
| `--atmosphere` | sky ramp → paper | — | The gradient itself; OKLab in `.atmosphere` |

**Signal**

| Semantic token | Primitive | vs page | Use |
|---|---|---|---|
| `signal-coach` | `indigo-600` | **9.43** | Coach presence, interrogable mark, focus ring |
| `signal-attention` | `clay-600` | **5.12** | Max once per viewport. Never on an amount. |
| `signal-band` | `indigo-600` | **9.43** | Horizon band fill |

**Line**

| Semantic token | Primitive | vs page | Use |
|---|---|---|---|
| `line-hairline` | `paper-200` | 1.23 | Separation only — **carries no meaning by design** |
| `line-control` | `ink-400` | 3.18 | Control boundaries — meets the UI-component gate |

### 2.3 Confidence tokens

The `SituationProfile` grammar ([VISUAL-DIRECTION §3.4](VISUAL-DIRECTION.md))
gets its own tokens so it can never be improvised per-component:

| Token | Color | Mark |
|---|---|---|
| `confidence-stated` | `text-primary` | none |
| `confidence-inferred` | `text-primary` | dotted underline, `signal-coach` |
| `confidence-assumed` | `text-secondary` | dashed underline, `ink-400` |

### 2.4 Three failures found and fixed

Recorded so they don't get reintroduced:

| Problem | Measured | Fix |
|---|---|---|
| `text-tertiary` at `#7C746A` cleared AA on white cards but failed on the warm page | 4.34:1 | → `#726B62`, clears 4.5:1 on **all three** surfaces |
| Secondary-button hairline border was decorative-weight and failed the 3:1 UI-component gate | 1.68:1 | → `ink-400` `#918B83` at 3.18:1 |
| Focus ring in `signal-coach` is invisible on the ink primary button | 1.78:1 | → **2px ring + 2px `surface-page` offset.** Ring contrasts the offset (9.43), offset contrasts the button (16.84) |
| Horizon band as a low-opacity tint failed the non-text gate at every usable opacity | ≤1.78:1 | → **solid `indigo-600` at 6px height.** Small and contrasty, not large and washed |

That last fix follows the general rule: **saturated fills belong on small marks,
never on large blocks.** A 6px solid band is calmer *and* more accessible than a
40px wash.

---

## 3. Spacing

8px base, 4px half-step. Vertical rhythm is North's primary compositional tool.

| Token | px | Typical use |
|---|---|---|
| `space-0` | 0 | — |
| `space-1` | 4 | Icon-to-label, mark offsets |
| `space-2` | 8 | Tight pairs |
| `space-3` | 12 | Chip padding, row internals |
| `space-4` | 16 | Default gap; mobile page margin |
| `space-5` | 24 | Card padding, field gap |
| `space-6` | 32 | Card bottom padding, block gap |
| `space-7` | 48 | Section separation |
| `space-8` | 64 | Major separation |
| `space-9` | 96 | Reveal-scale breathing room |

**Semantic spacing**

| Token | Value | Applies to |
|---|---|---|
| `space-page-margin` | `space-4` → `space-6` → `space-7` | Page gutters, by breakpoint |
| `space-card-inset` | `space-5`, `space-6` bottom | Card padding — extra below so actions breathe |
| `space-stack` | `space-5` | Default vertical gap between blocks |
| `space-field` | `space-4` | Between conversation turn and its answers |

### 3.1 Vertical rhythm — the grammar *(added, July 2026)*

The tokens above are a palette. Screens compose with a **grammar**: four steps
named for the RELATIONSHIP they express, in `components/nds/rhythm.ts`.

| Step | Value | Expresses |
|---|---|---|
| `pair` | 8 | A label and the thing it names — an eyebrow and its title |
| `heading` | 16 | A heading and the block it opens |
| `block` | 24 | Elements within one block |
| `screen` | 40 | Between major blocks on a screen |

**Why this was needed.** Every screen used the tokens, and every screen picked
its own — a survey found eight different gap values doing four jobs. The worst
of it: on Navigator the question and the field answering it sat 40px apart (the
between-blocks gap) while a heading and its list sat 12px apart. *The pair that
belongs together was pushed further apart than the pair that doesn't.*

The values are deliberately far apart. Two steps differing by 4px are two steps
nobody can tell apart, which is how a scale rots back into eight arbitrary
numbers. **If two things are a pair, they get `pair`** — on every screen,
without a judgement call.

---

## 4. Typography

### 4.1 Families

| Token | Stack | Role |
|---|---|---|
| `font-voice` | Newsreader, Georgia, serif | The coach speaking |
| `font-ui` | Geist Sans, system-ui, sans-serif | The interface |
| `font-figure` | Geist Mono, ui-monospace, monospace | Figures **only where they align vertically** |

### 4.2 Scale

Type is the one thing that scales across breakpoints. Values: `base → md → lg`.

| Token | Size / Line | Face | Weight | Tracking | Use |
|---|---|---|---|---|---|
| `type-voice-lg` | 30/40 → 32/44 → 34/46 | voice | 400 | −0.01em | The read on Today |
| `type-voice-md` | 22/32 → 24/34 → 24/34 | voice | 400 | −0.005em | Onboarding questions |
| `type-body` | 17/26 | ui | 400 | 0 | Supporting prose |
| `type-label` | 14/20 | ui | 500 | 0 | Actions, field labels |
| `type-meta` | 13/18 | ui | 400 | 0.01em | Timestamps, rung indicator |
| `type-figure` | 15/22 | figure | 400 | 0 | Ledger and derivation values |

**Weights:** 400 and 500 only. A third weight is a request to justify, not a
default. The serif ships at 400 for speech, with 500 permitted for exactly two
things: emphasized figures and verdict words (VISUAL-DIRECTION §12) — bold
editorial serif anywhere else reads as advertising.

**Serif floor: 20px.** Below it, use `font-ui`. Both a legibility requirement
and an aesthetic one.

**Figure rule:** `tabular-nums` on `type-figure` only. Numbers inside the
coach's prose use Newsreader's proportional lining figures — it's speech.
Display-size numbers are never tabular.

**Measure: 62–68 characters.** This sets the column width in §6, not the
viewport.

---

## 5. Radius & elevation

### 5.1 Radius

| Token | px | Use |
|---|---|---|
| `radius-sm` | 8 | Chips, inputs, band ends |
| `radius-md` | 12 | Inputs, small inline controls |
| `radius-full` | 9999 | **Buttons, chips, the dock** — controls are capsules (craft pass) |
| `radius-lg` | 20 | The decision card |
| `radius-xl` | 28 | Sheets |
| `radius-full` | 9999 | Rung ticks, coach presence dot |

**Rule:** radius never exceeds half the element's shorter side. Radius scales
*with* surface size — a large radius on a small element reads as a toy.

### 5.2 Elevation

North has essentially no shadow language. Three tokens, and two of them are
nearly invisible.

| Token | Value | Use |
|---|---|---|
| `elevation-flat` | `none` | Default for everything |
| `elevation-card` | `0 1px 2px …0.05` + `0 12px 32px -16px …0.14` | The decision card — one soft warm ambient (craft pass) |
| `elevation-sheet` | `0 8px 32px rgba(26,23,20,0.12)` | Sheets only |

Shadows are **warm-tinted** (`ink-800`-based), never neutral black — a cool
shadow on warm paper reads as dirty.

**Rule: elevation never conveys hierarchy or importance.** It conveys exactly
one thing — that a surface floats above scrolling content. The decision card is
prominent because of type, space, and being the only card. Not because it has a
shadow.

---

## 6. Breakpoints & responsive strategy

| Token | Range | Name |
|---|---|---|
| `base` | 0–639 | Mobile |
| `md` | 640–1023 | Tablet |
| `lg` | 1024+ | Desktop |

Three breakpoints. Nothing changes past 1024, so there is no fourth.

### The strategy

> **North's responsive strategy is not "more content on bigger screens." It is
> "the same column, more calmly presented."**

The content column is capped at **600px and never widens** — it is set by the
measure (§4.2), not by the viewport. A coaching product that becomes a two-up
grid at 1024px has turned back into a dashboard.

### What actually changes

| | Mobile | Tablet | Desktop |
|---|---|---|---|
| Column | Full width | 600px centered | 600px centered |
| Page margin | `space-4` | `space-6` | `space-7` |
| `type-voice-lg` | 30/40 | 32/44 | 34/46 |
| Sheets | Bottom sheet, drag-dismiss | Centered modal | Centered modal |
| App bar | Sticky | Static | Static |
| Min hit target | 44px | 44px | 32px (pointer) |
| Hover states | None | Pointer only | Yes |

**Desktop is not an opportunity to add density.** It is an opportunity to add
whitespace.

---

### 6.1 The measure, and what may exceed it — amendment (July 2026)

**The rule stands: the reading column never widens past 600px, and desktop
gets whitespace, not density.** A coaching product that becomes a grid at
1024px has turned back into a dashboard.

The rule protects a MEASURE — the line length prose is readable at — and the
absence of a second column competing for attention. It was never a claim about
the pixels themselves. So one thing is now allowed past it:

**Wordless scenery may exceed the measure from `xl` (1280px).** The horizon
field on Goals and on Today's calm day is a graphic with no text in it, and at
desk width it can use the room the column leaves. Nothing is added to the
screen; one existing element simply breathes.

What is still refused, and why:
- **No marginalia column.** A second column of content in the margin is exactly
  the density this rule exists to prevent, whatever it holds.
- **No prose past the measure.** Text stays in the 600px column at every width.
- **No second reading destination on screen.** One thing at a time survives.

`xl` exists for this job alone (`app/globals.css`). It is not a licence for a
wider layout, and a fifth breakpoint would need its own argument.

Desktop's real answer remains what it already was: the navigation moved into
the left margin as a rail, and the Assumptions panel opens into the right. The
margins carry CHROME and DISCLOSURE, never a second read.

## 7. Motion tokens

| Token | Duration | Curve | Use |
|---|---|---|---|
| `motion-micro` | 120ms | ease-out | Press, hover, focus |
| `motion-standard` | 220ms | spring, **no overshoot** | Sheets, routes |
| `motion-considered` | 320ms | spring | Recompute |
| `motion-ceremonial` | 600–900ms | staged | The reveal only |

`prefers-reduced-motion` collapses all of these to opacity-only at
`motion-micro`. **Never animate a number counting up** — values cross-fade in
place.

---

## 8. Components

Sixteen. Each maps to a real need across the four screens; none is speculative.

### 8.1 Foundation

#### `Text`
The only way type enters the product.

- **Props:** `variant` (the §4.2 scale), `tone` (primary / secondary / tertiary), `as`
- **Rule:** no component sets `font-size`, `font-family`, or `line-height` directly.

#### `Figure` — *North's signature component*
A number, rendered with its confidence. **The only way a number enters the
product.**

- **Props:** `value`, `confidence` (stated / inferred / assumed), `format` (currency / percent / duration / count), `context` (prose / tabular), `interrogable`, `onInterrogate`
- **Rendering:** `context="prose"` → serif proportional figures, inline in the read. `context="tabular"` → `font-figure`, tabular, right-aligned.
- **Confidence:** applies the §2.3 tokens. Never improvised.
- **Accessibility:** `aria-label` **must** include the confidence — *"$40,000, a figure you told us"* / *"6% annual return, our assumption."* A sighted user reads this from the visual grammar; a screen reader user must get the same meaning, not a bare number.
- **Hit area:** when `interrogable`, the touch target expands to 44px vertically beyond the glyph bounds. The mark is small; the target is not.
- **Don't:** render a currency value as raw text anywhere, ever.

### 8.2 Action

#### `Button`

| Variant | Fill | Label | Border | Use |
|---|---|---|---|---|
| `primary` | `action-primary-bg` | `text-inverse` | none | Commit. **One per screen.** |
| `secondary` | transparent | `text-primary` | `line-control` | Defer, dismiss |
| `quiet` | transparent | `text-secondary` | none | Tertiary, inline |

- **The primary button is ink, not a hue.** There is no colored button in North.
- **Sizes:** `md` (44px, default), `lg` (52px, the card's primary action)
- **States:** rest / hover / pressed / focus / disabled / pending
- **Focus:** 2px `signal-coach` ring + **2px `surface-page` offset** — required, since the ring alone fails against the ink fill (§2.4).
- **Pending:** label cross-fades to a `CoachPresence` dot. **No spinner.**
- **Don't:** two primaries on a screen. Icon-only buttons anywhere in MVP.

#### `ChoiceChip`
Onboarding and correction answers.

- **States:** rest / hover / selected / focus
- **Selected:** `surface-raised` fill + `line-control` border + `text-primary`. **Not a color fill** — selection is weight and surface, consistent with §3.3 of VISUAL-DIRECTION.
- **Layout:** wraps; full-width single column when any label exceeds ~24 characters.
- **Min height 44px** at every breakpoint, including desktop — these are the primary input and misfires are costly.

#### `TextField`
Used **once** in the entire product: onboarding's opening question.

- Single-line, auto-growing, no label chrome — the question above it *is* the label.
- No placeholder text. Placeholders as labels are an accessibility failure and the question already does that work.
- **Don't:** build a form-field suite. North has one text input and a chip. A validation system, field groups, and inline error text are all speculative — add them when a second field exists.

#### The composer *(amended twice, July 2026)*

Both open questions — onboarding's opening turn and Navigator's door — went
through three forms. A bare hairline rule had no presence: a floating divider
under a question. Ruled paper had presence but no content: hairlines floating
in a white void read as an empty table, with the controls orbiting outside.

`SpokenField` is now a **composer** — one object with anatomy:

- **An opening quote, your words, and the two ways to finish saying them**
  (the turn's primary action and the "Or say it" mic pill) all inside the same
  sheet. The box contains real things, so it never reads as a void.
- **The hanging quote is load-bearing.** Today opens with *"You said …"* — what
  you write here is literally what the coach quotes back, and the mark says so
  up front. Typed words render in Newsreader italic: speech being written down.
- **Room for two lines before it grows.** A one-line slot reads as a search
  bar, and this is a place to say something.
- **Raised white, hairline edge, no elevation** — the one elevated thing on any
  screen is the decision `Card`. Focus darkens the sheet's own border; no
  second ring inside it, which would draw a box in a box.
- **Click anywhere on the sheet to write.** The whole surface hands you the
  pen; the controls keep their own clicks.
- **It aligns with the content column** *(amended)*. The sheet used to bleed
  outward by its own padding so the writing stayed flush with the question
  above it — buying that alignment by making the composer the widest object on
  the page, wider than the question and wider than the list beneath. On
  Navigator it simply read as spread out. The column is the page's measure;
  the answer sitting a pen's width inside it is the smaller price.
- Still **no placeholder** — the question above is the label (§8.2), and the
  quote is an affordance, not a hint.

### 8.3 Containers

#### `Card` — *the AI insight card*

You asked for buttons, cards, **and** AI insight cards as separate components.
In North they are one thing, and the constraint is load-bearing:

> **North has exactly one card, and it is the decision.**

An "insight card" that doesn't ask for a decision is a dashboard widget — the
pattern [STRATEGY §7](STRATEGY.md) exists to reject. Cards proliferate in
dashboards because every module needs a container; when exactly one thing is a
card, **the card itself means "this needs you."**

Three **variants**, not three components:

| Variant | Content | Actions |
|---|---|---|
| `decision` | The read + rung + horizon | Commit / Defer |
| `callback` | *"You said you'd open the IRA. Did that happen?"* | Yes / Not yet |
| `satisfied` | *"Nothing needs your attention. That's rare."* | None |

- **Anatomy, in order:** read (`type-voice-lg`) → `RungIndicator` → primary → secondary → `HorizonBand`
- **Emphasis is weight, never size, and never a line break.** A segment marked `emphasis` renders `font-medium` inline. It used to break onto its own display-size line, which threw the one number the read turns on out of the sentence explaining it — "The other" stranded above and "is sitting still" below.
- **Surface:** `surface-raised` on `surface-page`, `radius-lg`, `elevation-card`, 1px `line-hairline`
- **Chrome:** none. No header, no icon, no overflow menu. The content is the card.
- **Don't:** nest a Card in a Card. Render two Cards on one screen. Add a card header.

##### The goal card — a surface, not a `Card` *(amended, July 2026)*

Goals divided only by a hairline read as **one continuous run of prose**: the
eye finds no edge, so a second destination looks like a second paragraph about
the first. Each goal now gets its own contained surface.

It borrows the Card's **surface, radius and hairline** and refuses its
**elevation**, because the shadow is the part that carries meaning:

> The Card is the one thing on a screen that is *lifted*. That is what makes it
> read as "this needs you." A goal is somewhere you're heading, not something
> asking for a decision today.

So "one Card per screen" is intact — Home's decision card is still the only
elevated object in the product. Flat contained surfaces are available to any
list whose items are being mistaken for one item; a **shadow** is not.

A side effect worth knowing: a bounded card exposes repetition that a hairline
hides. The goal's deadline had been printed twice — once opposite the label,
once under the band as *"On this path in 2 years"* — and only became obviously
wrong once there was an edge around it. It now appears on the band alone, where
it qualifies the figure it belongs to.

#### `Row`
The ledger entry. History is **rows, not cards** — that contrast is what makes
the card mean something.

- **Anatomy:** outcome mark · decision text · `Figure` (tabular) · timestamp (`type-meta`)
- **Outcomes:** `held` / `deferred` / `open`. **There is deliberately no "failed," "missed," or "overdue"** — a commitment not acted on returns to `open` and the coach re-asks. Guilt is a retention bug ([STRATEGY §3, P3](STRATEGY.md)).
- Separated by `line-hairline`. No fill, no radius, no elevation.

#### `Sheet`
All four overlays ([UX-ARCHITECTURE §5](UX-ARCHITECTURE.md)).

- **Mobile:** bottom sheet, drag-to-dismiss, `radius-xl` top corners
- **Tablet / desktop:** centered modal, `radius-xl`, max 520px
- **Origin:** animates from the element that spawned it — the derivation sheet rises from the tapped `Figure`, not from the screen edge.
- **Always has a live parent.** Never a root route.
- Focus trap, `Esc` to dismiss, focus returns to the trigger. Pushes a history entry so system back dismisses it.

### 8.4 Data

#### `HorizonBand`

- **Form:** a single horizontal bar. No axes, no gridlines, no legend, no tooltip.
- **Spec:** 6px height, `radius-sm` ends, solid `signal-band`. Two direct endpoint labels via `Figure`.
- **The idea:** **the band's length *is* the uncertainty.** Lower profile confidence renders a visibly wider band. The graphic encodes the product's honesty rather than illustrating a number.
- **Accessibility:** the Assumptions sheet is this component's **table-view twin** — no value is reachable only through the visual encoding.
- **Don't:** add an axis, a midpoint marker, or a point estimate. A line asserts precision the model doesn't have.

#### `RungIndicator` *(amended, July 2026)*

**With `onInterrogate` it becomes a button into the ladder disclosure**,
wearing the same dotted rule an *inferred* figure wears, because that is what
it is: a derived reading of your situation. Without it the mark was a dead end
— and a number the reader cannot interrogate is a number taken on faith, which
is the one thing no figure in North is allowed to be. The disclosure it opens
(`LadderPanel`) uses `ExplanationPanel`, not `DerivationSheet`: this is the
reasoning behind a whole answer, meant to be read, not one number's arithmetic.



- **Primary form is typographic:** *"4 of 7 · tax-advantaged space"* in `type-meta`.
- Optional: seven 2px ticks, `radius-full`, `signal-coach` filled / `text-disabled` inactive.
- **Hard constraint: never celebrate advancement.** No animation on rung change, no completion state, no color shift to "done." The moment it reads as a progress ring, North is a game about money.
- **Don't:** confuse this with onboarding's wayfinding strip. The rung ladder is financial standing; the wayfinding strip is position on a scrolled route ([UX-ARCHITECTURE §4.2](UX-ARCHITECTURE.md)). Neither fills toward "done."

### 8.5 Navigation

MVP has **no tab bar** ([UX-ARCHITECTURE §2](UX-ARCHITECTURE.md)). Two
destinations of unequal weight are a push relationship, not peers.

#### `AppBar`
Minimal. Back affordance + optional title in `type-label`. Transparent over
`surface-page`; a `line-hairline` appears only once content scrolls beneath it.
Sticky on mobile, static above.

#### `ContinuityStrip`
The base of Today and the path into Decisions.

- Last 2–3 `Row`s at reduced prominence + the affordance into the full ledger.
- **Why it exists:** it carries the entire navigation load for the second surface, and it places history directly beneath the present decision — which is exactly the relationship a coach has to it.

**Deferred — `TabBar`:** when Trajectory and Coach land, four destinations
justify the chrome. Build the app shell to accept it without restructuring; do
not build it now.

### 8.6 Conversation

#### `ConversationTurn`
The correction loop and goal capture's turn primitive — the reuse that removes
a settings screen from the IA. (Onboarding proper now composes its own
full-viewport sections; see [UX-ARCHITECTURE §4.2](UX-ARCHITECTURE.md).)

- **Anatomy:** question (`type-voice-md`) → answer affordance (`ChoiceChip` set or `TextField`) → back
- **No workload meter.** The onboarding shell carries a wayfinding strip (position, never percentage); the turn itself never carries anything.
- **One question at a time.** Rendering two is a system violation, not a layout choice.

#### Product-tier companions — `TurnGlyph`, `SpokenField`
Not NDS components — they live in `components/north/` because they encode
product meaning (the onboarding script's turn ids, the Web Speech API) — but
they are documented here and shown in `/design` so the system stays honest
about every mark it makes.

- **`TurnGlyph`** — six hairline strokes that morph between figures, one per
  turn. Authored as anchor grids on a uniform skeleton (6 strokes × 6 anchors
  → Catmull-Rom → `M + 5C`), so every figure interpolates into every other on
  `SPRING.fluid`. Ambient drift between morphs; stills under reduced motion.
  Mount once and change `turnId` — keying it turns the morph into a swap.
- **`SpokenField`** — the opening turn's answer and Navigator's door: the
  composer (see *The composer*, §8.2) — a hanging quote, your words in
  Newsreader italic (speech written down), and the actions inside one sheet,
  with Web Speech dictation behind an "Or say it" pill. Strictly progressive
  (no API → no button, gated on hydration), and no listening failure is ever
  announced.

#### The action marks — `AssumedMark`, `SignpostMark`, `ReleaseMark` *(user-reviewed, July 2026)*

**North has no icon library and will not gain one.** Every mark comes from the
same hairline pen as the turn glyphs, the horizon fan, and the wordmark's
compass: 1.25 stroke on a 16 grid, a hair lighter than the nav glyphs because
they sit beside `type-meta` text and must not outweigh it.

All four current marks were **chosen by the user from drawn candidates**, after
two generations of in-world drawings (confidence-rule dashes, horizon domes)
failed the same test: legibility at 16px without prior knowledge of the
product's grammar. The lesson, recorded: *a mark may live in the product's
world, but it must first read in the reader's.*

- **`AssumedMark` — the asterisk.** Print's own footnote mark: "there is fine
  print behind this figure." Financial documents taught everyone what it means,
  and the disclosure it opens genuinely is the fine print.
- **`SignpostMark` — a signpost.** Naming a goal is putting up the sign that
  says where next. The product's verb (name a destination), not the
  spreadsheet's (add a row). Replaced the bare plus.
- **`ReleaseMark` — the wind.** Gusts curling away: released to the weather,
  which the sky already owns. Kind rather than punitive — let go, not deleted.
- **`DirectionMark` (Insights) — two ticks on a ground line.** Before and
  after; up means the second reading stands taller. A comparison drawn as a
  comparison, in the rung indicator's language. Not a chevron (every
  dashboard's arrow) and not a trend curve (a mute diagonal at this size).

Rejected along the way, recorded so they aren't re-proposed: bare dashes
(hamburger menu), a minus (deletion), abstract domes (illegible small),
balloon/bird/kite/feather (draw badly at 16px), diagonal arrows (legible but
every dashboard's voice).

#### The gutter bleed — a pattern, not a one-off *(July 2026)*

A Navigator row's hover fill extends past the measure. The rule it follows —
and the rule for anything that joins it:

> **A surface bleeds by exactly its own horizontal padding**, so the surface
> grows while the text inside it does not move. And the bleed must stay
> **inside the host's gutter** (`px-4 md:px-6`) or the page scrolls sideways.

Twelve and twenty sit under sixteen and twenty-four with room to spare, which
is why `-mx-3 px-3 md:-mx-5 md:px-5` is the safe pair. A fill that stops flush
with its text reads as a highlighted paragraph; a row's target is the whole
line, and the fill should say so.

**Use it for a FILL, not for a container.** The composer bled once and was
pulled back: on a background tint the bleed is invisible and only the target
grows, but on a bordered surface the edge itself moves, and a container wider
than the column reads as spread out no matter how well the text inside lines
up.

#### `ActionLink` — THE tertiary action *(pattern locked, July 2026)*

> **A drawn mark, then a label carrying a dotted rule in `signal-coach`.**
> Nothing else in the product looks like this, and everything that behaves like
> this looks like this.

The dotted rule is not decoration: it is the mark North already uses for
*"there is more behind this"* — an inferred `Figure` wears it, and so does the
interrogable `RungIndicator`. Before the pattern, tertiary actions were a
scatter of bare text buttons with trailing arrows in three different type
sizes, and the only way to know one was pressable was to try it.

**A trailing arrow is not part of this pattern.** The mark leads; an arrow on
the other end is a second icon saying the same thing.

Every quiet action in the product now uses it — *What's assumed*, *Name
another*, *Adjust this one*, *Let this one go*, *The long view*, *Everything
you've decided*, *Watch how you got here*, and the back links. Two things
deliberately do **not**: the scenario list rows on Navigator (a numbered table
of contents, whose arrow is a row affordance) and the story's *Close* (chrome
on the deep ground, where the tertiary colour cannot go — it carries the dotted
rule in `text-on-deep` instead).

A `quiet` Button carries padding, so its label sits indented from the content
it belongs to and no negative margin fixes that honestly. `ActionLink` is flush
left by construction, and `hit-target` grows the touch area to 44px without
adding a visual box.

- **Pass no `className` for colour or alignment.** `cn` is a plain joiner, not
  `tailwind-merge` — an override from the call site does not replace the
  component's own class; both land and stylesheet order picks the winner. If a
  different appearance is needed, the component needs a variant (§10).

#### `SectionHeading` — the one rank *(added, July 2026)*

The heading that opens a block within a screen. It takes **no tone and no
variant**.

`Text variant="section"` already existed and every section heading used it —
but each call site chose its own `tone`, so one rank rendered at three
different greys across the product, and the horizon band's caption had drifted
to `type-overline` entirely. **A rank whose appearance is decided per call site
is not a rank.**

Mono caps 13/500/0.1em, `text-secondary`. Heavier and larger than
`type-overline`, which is the quieter mark reserved for a page's own dateline
in the masthead position. The two are not interchangeable. If a heading needs
to look different, it is a different rank and needs its own name.

#### Display casing for engine strings

Rung labels are authored in prose case (`"goal funding"`) because the engine
drops them into sentences — *"North is watching your goal funding"*, and the
letter's own copy. Where a label **stands alone and heads a line** — the rung
indicator, the ladder panel — `lib/text.ts#sentenceCase` capitalises it. CSS
`text-transform: capitalize` is not a substitute: it gives "Goal Funding", and
"Surplus With Nowhere To Go".

#### `CoachPresence`
The considered pause between turns.

- A single small `radius-full` dot in `signal-coach` with a slow opacity pulse.
- **Duration 400–600ms**, and it must always resolve into visible content. Latency that produces no change is a fake.
- **Not a spinner.** Never a spinner.

### 8.7 State

#### `EmptyState`
- **Anatomy:** what this will hold (`type-voice-md`) → what produces it (`type-body`) → one action
- **Never an illustration. Never an apology.** An empty state in a coaching product is *"here's what happens next."*

#### `ErrorState`
- **In the coach's voice.** Never a system message, never an error code, never a stack trace.
- **Must state what is unaffected.** A bare "Something went wrong" beside a dollar figure reads as *your money is gone*.
- Uses `signal-attention`, never red.

---

## 9. Component usage rules

The rules that keep the system from decaying. Each is checkable in review.

**Composition**
1. **One `Card` per screen.** A second card means one of them is a `Row`.
2. **One `primary` Button per screen.**
3. **One `signal-*` element per viewport** — coach mark, attention, or band. Not two.
4. Never nest a `Card` in a `Card`.
5. A `Sheet` always has a live parent.

**Content**
6. **Every number is a `Figure`.** Raw numeric text is a review failure.
7. **Every `Figure` carries a confidence.** There is no default and no "unknown" — an unknown field is a question the coach hasn't asked, and it renders as a prompt or not at all.
8. **Prose outranks figures.** If the largest element on a screen is a number, the screen has reverted to a dashboard.

**Tokens**
9. **Semantic tokens only.** A raw hex, a Tier 1 token, or a raw px value in a component is a review failure.
10. **No new hue without re-measuring.** The palette is contrast-verified; adding a color means re-running the check, not eyeballing it.

**Motion**
11. No number animates upward.
12. No spinner. `CoachPresence` or nothing.
13. Every pause resolves into a visible change.

**Layout**
14. **The column never widens past 600px** at any breakpoint.
15. No side-by-side comparison in MVP.
16. Content never touches an edge.

**Accessibility**
17. Hit targets ≥44px on touch, ≥32px on pointer — including inline `Figure` affordances.
18. Focus is visible everywhere, uses the ring **and offset**, and is never removed.
19. Layout survives 200% text scaling.
20. Color never carries information alone — guaranteed by construction, since there are no red/green semantics to remediate.

---

## 10. Governance

**`/design` is the system's proof.** It renders every token and every component
in every state and variant, at all three breakpoints. It ships from commit one
and stays current — a component that isn't in the gallery isn't in the system.

**When something doesn't fit:** the default is that the *screen* is wrong, not
the system. A new component requires showing it appears in at least two places
and cannot be a variant of something existing. Variants are cheap; components
are not.

**Deliberately absent, so their absence stays intentional:** Modal (Sheet
covers it) · Tooltip (no hover-gated content) · Accordion · Tabs · Badge ·
Avatar · Toast · Breadcrumb · Table · Pagination · Skeleton · Spinner ·
DatePicker · Select · Checkbox · Radio (ChoiceChip covers it) · Slider ·
Progress bar (onboarding's wayfinding ticks are position on a route, built
in-place — deliberately not a reusable meter).

Every one of those is a reasonable component in a different product. **In North
each one would be evidence the design drifted back toward a dashboard.**

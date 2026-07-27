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
default. The serif ships at 400 exclusively — bold editorial serif reads as
advertising.

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
| `radius-md` | 12 | Buttons |
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
| `elevation-card` | `0 1px 2px rgba(26,23,20,0.04)` | The decision card |
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
- **Surface:** `surface-raised` on `surface-page`, `radius-lg`, `elevation-card`, 1px `line-hairline`
- **Chrome:** none. No header, no icon, no overflow menu. The content is the card.
- **Don't:** nest a Card in a Card. Render two Cards on one screen. Add a card header.

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

#### `RungIndicator`

- **Primary form is typographic:** *"4 of 7 · tax-advantaged space"* in `type-meta`.
- Optional: seven 2px ticks, `radius-full`, `signal-coach` filled / `text-disabled` inactive.
- **Hard constraint: never celebrate advancement.** No animation on rung change, no completion state, no color shift to "done." The moment it reads as a progress ring, North is a game about money.
- **Don't:** use this as a progress bar in onboarding. Onboarding has no progress indicator — that would make a conversation a form.

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
Used in onboarding **and** in the correction loop — the reuse that removes a
settings screen from the IA.

- **Anatomy:** question (`type-voice-md`) → answer affordance (`ChoiceChip` set or `TextField`) → back
- Prior turns scroll up and recede to `text-secondary`.
- **No progress indicator.** Ever.
- **One question at a time.** Rendering two is a system violation, not a layout choice.

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
Progress bar.

Every one of those is a reasonable component in a different product. **In North
each one would be evidence the design drifted back toward a dashboard.**

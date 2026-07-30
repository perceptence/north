# North — UX Architecture

Derived from [STRATEGY.md](STRATEGY.md) (product) and [FOUNDATION.md](FOUNDATION.md)
(principles, IA, tech). This document defines structure and behavior. **No
visual design** — no color, type, or spacing decisions here.

**Screen budget: 4 of 5 used.** The cap is a ceiling, not a target. A fifth
screen would have to earn itself against the core loop, and nothing currently
does.

---

## 1. Information architecture

Four tiers. Confusing them is how products like this sprawl.

| Tier | Definition | In MVP |
|---|---|---|
| **Flow** | Linear, entered once, no navigation out | Arrival → Onboarding |
| **Surface** | A destination you return to | Today, Decisions |
| **Overlay** | Contextual, dismissible, always has a parent | Derivation, Assumptions, the ladder, Correction |
| **State** | Same surface, different content | First-run, Steady, Return, Satisfied, Empty, Loading, Error |

The discipline this enforces: **new capability is a state or an overlay until
proven to need a surface.** Every finance app that became unusable did so by
promoting states to surfaces.

### Structure

```
Arrival  ──▶  Onboarding  ──▶  Today · Navigator · Insights · Goals
 (flow)        (flow)          the four dock destinations (§12)
                                          │
                    ┌─────────────────────┼─────────────────────┐
                    ▼                     ▼                     ▼
                Overlays              Decisions             The story
             · Derivation           (drill-down)          (drill-down)
             · Assumptions
             · The ladder
             · Navigator's working
             · Correction
```

`/design` exists as a project artifact, not a product surface. It is outside
the IA and does not count against the screen budget.

### What is deliberately *not* in the IA

No Accounts. No Transactions. No Settings. No Profile page. No Search.

The profile is reachable — but as a **correction overlay** off a derivation, not
as a destination. You don't go somewhere to edit what North knows; you tap the
thing that's wrong, and the coach asks you about it again. See §5.3.

---

## 2. Primary navigation

> **Superseded by §12.** The dock shipped: four destinations — Home, Navigator,
> Insights, Goals — as a bottom dock through `md` and a left rail from `lg`.
> The reasoning below is kept because it records WHY two destinations did not
> justify chrome, which is the test any fifth destination still has to pass.

**There is no tab bar in MVP.** Today is home; Decisions is a push; back
returns.

With two destinations of unequal weight, a tab bar is the wrong instrument. It
would falsely present Decisions as a peer of Today when it is subordinate to it,
and a two-item tab bar reads as an unfinished four-item tab bar — the one
impression a portfolio piece cannot afford.

Instead, Decisions is reached from a **continuity strip** at the base of Today —
the last two or three decisions, always visible, always the same place. That
placement does real work: your history sits directly beneath your current
decision, which is exactly the relationship a coach has to it.

**Build the shell to accept a tab bar without restructuring.** When Trajectory
and Coach land post-MVP, four destinations justify the chrome. Two do not.

**Back behavior:** overlays push a history entry so the system back gesture
dismisses them — the mobile expectation. Overlays are not deep-linkable entry
points; they always have a live parent.

---

## 3. Screen list

| # | Screen | Tier | Route |
|---|---|---|---|
| 1 | Arrival | Flow | `/` |
| 2 | Onboarding | Flow | `/start` |
| 3 | Today | Surface (home) | `/today` |
| 4 | Navigator | Surface | `/navigator` |
| 5 | Insights | Surface | `/insights` |
| 6 | Goals | Surface | `/goals` |
| 7 | Decisions | Drill-down | `/decisions` |
| 8 | The story | Drill-down | `/story` |
| — | Design system | Artifact | `/design` |
| — | Demo seed | Tool | `/demo` |
| — | Device preview | Tool | `/preview` |

Scenario is Navigator's full-screen answer STATE, not a destination. Decisions
is depth reached from Home's continuity line and the letter — a ledger is not a
peer of the four questions. The story is depth reached from the letter for the
same reason: it re-tells what Insights already said, so it can never be a place
you go instead. `/design`, `/demo`, and `/preview` are project tooling, outside
the IA.

---

## 4. Screens

### 4.1 Arrival — `/` *(built, July 2026)*

**User goal:** Decide within five seconds whether this deserves ninety.

**Information hierarchy**
1. The promise — *"Everyone else shows you where your money went. North tells
   you where you're going."* Staged line by line under the product's tallest
   sky; "going" is the page's one aurora word.
2. One sentence of context. What it is, in plain language.
3. One ink button.

The wordmark sits with the content, directly above the promise. A drawn glyph
sat here once and was removed: it competed with the mark for the same job, and
the page reads better with one drawing, not two. Beneath the fold the horizon
field breathes as pure scenery — aria-hidden, no visible number, because a
number this page cannot justify is a number it must not speak.

Nothing else. No navigation, no footer, no pricing, no feature grid, no
screenshots of dashboards, no logos of banks. The absence is the argument — a
page this quiet is a claim about the product's character before the product has
made one.

**Primary actions**
- **Begin** — the conversation.
- **Or borrow a story and watch it work** — the seeded demo.

**The door is CONSTANT** *(amended)*. It offers the same two ways in every
time, whether or not a profile exists. An earlier version read the store and
swapped in "Continue" for a returning visitor, which meant the demo link
disappeared the moment anyone used the demo — the one link the page exists to
offer. Nothing here reads stored state now, so the page also renders
identically on the server and the client.

**The wordmark travels.** It sits WITH the content, on paper, in ink. Press
either action and it lifts to the masthead position of the destination —
shrinking, and turning to on-deep as it enters the sky — with the route handing
over just before it lands, so the door and the next screen read as one object
moving rather than two pages swapping. The travel is measured at press time
(the start is a share of the viewport); only the destinations are constants,
and they mirror the two mastheads that draw them.

Three consequences worth writing down, because each was a bug first:
- All three mastheads — Arrival, onboarding, the product shell — put their
  padding on an OUTER element with the measure inside it. Padding on the
  max-width element instead shifts the column's left edge on wide viewports,
  and the travelling mark jumps sideways at the handover.
- The travel is duration-based, not a spring. A spring only asymptotes toward
  its target; across most of a viewport it was still ~38px short at handover.
- The demo journey seeds INLINE (`lib/demo-story.ts`) and goes straight to
  Today. Routing through the `/demo` interstitial dropped the mark for a frame.

**Why this screen exists**
Positioning must be legible before any interaction. This is also the *only*
place North explains itself by contrast; everywhere else it simply behaves
differently and lets the user notice. Stating the contrast once, at the door,
buys the right to never mention competitors again.

---

### 4.2 Onboarding — `/start`

**User goal:** Be understood, without filling in a form.

**The shape — one question per viewport, on a vertical line** *(July 2026
amendment; replaces the receding-stack layout)*. Each turn owns a full
snap-scrolled viewport; answering carries you down to the next, and scrolling
up revisits any earlier answer, live and re-answerable. The conversation is a
place with a direction, not a stack — going back is literally going back up.

**Information hierarchy**
1. The sky, pinned: a masthead naming the current step's essence
   (*North · Bearings*, *· Footing*, *· The inflow* …) and the wayfinding
   strip.
2. The turn glyph on its fixed stage above every question — six hairline
   strokes that MORPH from figure to figure as the active section changes
   (compass → swell → rising line …). One drawing becoming the next is the
   thesis made visible: every question is one picture of the same life.
   Technically: anchor grids on a uniform skeleton
   (`components/north/TurnGlyph.tsx`), so every figure interpolates into every
   other on a critically-damped spring, with an ambient drift between morphs.
3. The current question and its answer affordance.

**Wayfinding, not workload** *(July 2026 amendment)*. The doctrine here
originally read "no progress bar." What it protected against was WORKLOAD
FRAMING — a meter filling toward "done" reframes a conversation as a chore.
That protection stands: no percentage, nothing fills, nothing celebrates. But
a scrolled flow needs POSITION, so the screen carries a wayfinding strip —
answered / here / still to come. Small bars under the masthead on mobile; a
left-margin rail on desktop where each tick is also a way to travel back.
Ticks on a route, not a thermometer.

**Structure — 10 turns, emotional first, structured after**

The opening question is not the one the system needs. It's the one the *user*
came with:

> *"What's the money thing you keep meaning to deal with?"*

Free text, captured verbatim, **never parsed**. It requires no model call — it
gets reflected back at the reveal (§4.3), which is why the user feels heard.
Structured fields follow, one per turn, answered by selection rather than
typing: income band, obligations, dependents, liquidity, retirement rate,
horizon.

Selection for the structured fields is not a compromise. It guarantees a valid
`SituationProfile`, it is faster on mobile than typing, and it keeps the flow
deterministic. Free text is used exactly once, where the answer's *content*
matters more than its parseability.

**The spoken field.** The opening turn honors its own note ("however you'd say
it out loud") two ways: typed words render in the voice face — Newsreader
italic, speech being written down, not data entered — and an "Or say it"
affordance starts real dictation via the Web Speech API
(`components/north/SpokenField.tsx`). Strictly progressive: no browser
support → no button, and nothing refers to what isn't there; a permission
refusal or recognition error just ends the listening session quietly — the
coach never announces a failure. Dictation appends to typed text, both are the
user's words, and both land `stated`.

**Primary actions**
- **Answer** — select, or speak/type for the opening question.
- **Revisit** — scroll up, or the desktop rail. The Back button is gone; the
  gesture replaced it. Re-answering an earlier question travels you forward
  again, because answering always means moving.

**The pause, relocated.** The scripted ~500ms "thinking" beat between stacked
turns is gone; the scroll travel between viewports is the considered pause
now — real motion with real distance, always resolving in visible content
(§8 still governs: latency that produces no change is a fake).

**Why this screen exists**
It is the thesis made interactive. It replaces the persona picker
([STRATEGY §2](STRATEGY.md)), it produces the typed profile the entire product
reasons over, and it is the first evidence that North behaves like a person
rather than a database intake form. If this screen feels like a form, the
product has failed before Today loads.

---

### 4.3 Today — `/today` · **home**

**User goal:** Know the one thing to do about money right now.

**Information hierarchy**

1. **The read.** The coach's verdict, in prose, in the coach's voice. Largest
   and most prominent element on the screen.
2. **The numbers, embedded in the read** — inline, tappable, not extracted into
   tiles.
3. **Rung indicator** — quiet. *"4 of 7 · tax-advantaged space."* Orientation,
   not decoration.
4. **Primary action.**
5. **Secondary action.**
6. **Horizon line** — the range and the link to its assumptions.
7. **Continuity strip** — the last two or three decisions, and the way into
   Decisions.

**The inversion that matters:** in every competing product, the number is the
hero and the interpretation is a caption underneath it. Here the interpretation
is the hero and the number lives inside it. That single layout decision is the
entire differentiation, expressed structurally. If a future screen puts a big
number on top with a sentence beneath, it has reverted to a dashboard.

**Primary actions**
- **Commit** — "I'll do this."
- **Defer** — "Not now." Equal weight in the interaction model, quieter in
  visual weight. Deferral is recorded, never nagged.
- **Tap any number** → Derivation overlay.
- **Tap the horizon** → Assumptions overlay.

**States**

| State | Trigger | Behavior |
|---|---|---|
| First-run | Arriving from onboarding | Opens by reflecting the user's own opening answer back, then delivers the read |
| Steady | Return with an open decision | The open decision persists; no new one is surfaced until it resolves |
| Return | Return after a decision has aged | Opens with the callback: *"You said you'd open the IRA. Did that happen?"* |
| Satisfied | All seven rungs met | Reward state, not an empty state — see §7.2 |

**Why this screen exists**
It *is* the product. Onboarding exists to make this screen possible; Decisions
exists to give it memory. Every architectural decision in this document was made
to protect this screen's ability to say one thing clearly.

---

### 4.4 Decisions — `/decisions`

**User goal:** See what I committed to, and whether I held.

**Information hierarchy**
1. **Open commitments** — pinned above, with the action to resolve them.
2. **History** — reverse chronological. Each entry carries: what was decided,
   when, its outcome, and what it changed.
3. **Nothing else.** No filters, no search, no charts, no totals. A ledger this
   short does not need instrumentation.

**Outcome vocabulary — and the tone constraint on it**

Three outcomes: **held**, **deferred**, **open**. There is deliberately no
"missed," "failed," or "overdue."

A decision the user committed to and didn't act on returns to **open** and the
coach re-asks. This is a hard constraint, not a nicety: [STRATEGY §3, P3](STRATEGY.md)
identifies guilt as the category's central retention failure. A product that
keeps a scorecard of your failures is the thing users delete. A coach that
notices and asks again is the thing they keep.

**A commitment ripens before North asks** *(added, July 2026)*

The ledger records a decision the instant you make it. The **question** waits
three days (`core/decisions/callback.ts`).

Today used to call back on any open decision, which meant pressing the ink
button replaced the read with *"Did that happen?"* one second later. A coach
that asks whether you did the thing immediately after you said you would is not
attentive — it is nagging, and it made the commit read as "nothing happened
except the screen changed". Real commitments take days, and North observes no
accounts, so it cannot know either way. The waiting is the respect.

`openDecision` answers *what is unresolved* — which is what a ledger shows.
`callbackDue` answers *what may I ask about* — which is what a coach does.
Conflating them is what produced the instant callback.

**Primary actions**
- **Mark held / Not yet** — resolve the open commitment, pinned at the top.
- **Back** — named for wherever you came from, because this is a drill-down
  rather than a dock destination.

Settled entries are **read-only rows**. Tapping one opens nothing: per-entry
detail was designed as an overlay and deferred
([BACKLOG](BACKLOG.md#decision-detail)), and the timeline redesign made the
run of months carry the interval that a detail view would otherwise explain.

**Why this screen exists**
It is the memory made visible, and it is the one surface no competitor has.
More precisely: **it is the only screen in consumer personal finance designed to
produce pride rather than guilt.** Every other app's history view is a record of
spending you regret. This is a record of decisions you made well.

Cut this screen and North is a nicer-looking dashboard with a conversational
intake.

**The redesign, and the call it turned on** *(July 2026)*

The screen shipped at spec level and stayed there: a mono-caps label and four
flat facts per row. It was the only surface in the product with no voice and no
drawing — the one built for pride, rendered as a filing cabinet.

The obvious fix is to celebrate: a streak, a badge, a percentage held, a number
counting up. **That is the wrong fix, and the reason is that a scoreboard cuts
both ways.** The moment a run of five is worth celebrating, breaking it is a
failure — and the screen has manufactured the precise emotion it exists to
remove, just deferred to the first miss. It is the same trap as "missed" and
"overdue", arriving by the front door.

So the pride is **stated, not performed**:

- **The coach speaks first**, as on every other screen. `summariseLedger`
  (core/decisions/summary.ts) reads the record back — *"You have held every
  decision you have made with North — 2 of them so far."* Held and set-aside
  are counted as two kinds of thing, never as a hit rate: "two of three"
  implies a third that got away, and a deferral is a decision.
- **The record is made worth reading.** Entries carry the decision at voice
  size rather than caption weight; it is the thing you actually did.
- **The ledger has a spine** — one hairline the length of the record with each
  outcome inked onto it, month headings sitting on it rather than restarting
  it. Still rows, not cards: that contrast is what lets a bounded surface mean
  something elsewhere.
- **What animates is the spine only.** It draws downward as the record enters —
  the pen laying the line. It is the one thing allowed to animate into
  existence because it is decorative and `aria-hidden`; if frames never run, a
  hairline is missing and no fact is. Outcome marks are fully drawn from the
  first frame (the visibility rule, components/nds/motion.ts).
- **The one live thing is the open commitment**, which carries the product's
  single signal colour because it genuinely is live.

Nothing counts, ranks, congratulates, or shifts colour to "done".

---

### 4.5 Navigator — `/navigator` *(amended, July 2026)*

**User goal:** Think a real decision through before making it.

**Ask in your own words.** The screen offers a field, not only a curated list.
Five fixed questions told the user the product thinks about exactly five
things; it doesn't — the engine can reason about any of these situations, and
what was missing was a door.

**The field ROUTES; it never generates** (`core/navigator/match.ts`). Whatever
is typed resolves to a scenario the engine can genuinely compute, the answer
comes from the same seven rules that produce Today, and the product's central
promise holds: the engine never depends on a model call to produce an answer.
Matching is deterministic keyword scoring — testable, instant, offline, and
incapable of inventing a scenario that does not exist. A model could later
replace that function's body to widen recall without weakening the guarantee,
because what it returns is a scenario id, not a claim about someone's money.

Three behaviours, and the third is the important one:
- A clear winner opens directly.
- A near-tie **asks which you meant** rather than guessing. Answering the wrong
  question confidently is what makes a router feel stupid.
- Nothing matched is a real answer: *"That one North can't reason about
  honestly — it works from your situation, not from markets or specific
  investments."* A coach that pretends every question is one of its five is
  worse than one that names its limits.

The curated set remains below the field as a numbered table of contents — the
questions North is best at, and the fastest path for someone who doesn't want
to type.

**The answer is its own view.** Opening one replaces the list rather than
appending under it, and the back affordance belongs to the answer's own header,
inside the column. An earlier version floated an `AppBar` as a sibling of the
page title, outside the layout, which is what made the top of the screen look
broken.

---

### 4.6 Insights — `/insights` *(amended, July 2026)*

**User goal:** Understand what actually changed, and what it means.

**A letter with STRUCTURE, not a run of paragraphs.** It used to return a flat
list of paragraphs, and a screen handed a flat list can only render a wall of
sentences in one weight — leaving the reader to work out what moved, when,
whether it was good, and what it means for tomorrow. That is the reader doing
the coach's job.

`composeLetter` now returns:
- an **opening** naming what kind of stretch this was,
- **entries**, each carrying what moved, a direction, when it became true where
  the ledger genuinely knows, and — the part a flat list never says — **why it
  matters**,
- a **closing**: what this leaves for tomorrow, which is the question the
  reader actually arrived with.

Direction is a **glyph, never a colour**. There is no red and no green here.

Everything is still a diff of two real states — the profile at the last
snapshot against now, plus the ledger between them. Nothing is a fabricated
trend; North has no transactions and does not pretend to. A quiet month still
says *"Nothing changed. That's fine — nothing needed to."*

---

### 4.7 Goals — `/goals` *(amended, July 2026)*

**User goal:** Know where you're going, and whether you'll get there.

**More than one goal.** People carry several at once and they COMPETE for one
surplus. The engine allocates it in deadline order, so each goal's sentence
measures it against what is genuinely left for it rather than letting every
goal claim the same dollar — see [WATERFALL §7a](WATERFALL.md).

On screen: the horizon, then the goals in the ENGINE's order (soonest first,
because that is the order money reaches them, not the order they were typed),
one pacing sentence each, and one honest note when the surplus cannot reach
everything. Never a progress bar, never a grid. Naming another is the same
staged conversation; letting one go is a quiet action on the row, because
adding something you can never remove is a trap.

---

### 4.8 The story — `/story` *(added, July 2026)*

**User goal:** See how you got here, rather than read it.

A drill-down off Insights, in the same category as Decisions — **not** a fifth
destination, and it does not appear in the dock.

Insights already says what changed, and says it well, but it says it as a
**page**: four dispatches in one view, taken in at whatever pace the eye
chooses. The story is the same material given **time** — one claim on screen,
the mark morphing to match it, and the horizon reshaping to the situation as it
stood at that moment. Nothing new is claimed. The pacing is the whole feature.

- **The reader sets the pace.** Tap anywhere, or arrow keys; nothing is on a
  timer. A recap that runs away from you is one you watch rather than read, and
  this is the coach talking, not a title sequence.
- **It cannot invent drama.** Every middle beat is a real entry from
  `composeLetter`, so a quiet stretch produces two beats and a busy one produces
  five. There is no padding and no beat that exists to fill a slot.
- **It refuses rather than pads.** With no prior snapshot, or a stretch where
  nothing moved, `composeStory` returns `tooEarly` and the screen says so
  plainly — then offers the demo. The link on Insights only appears when a story
  genuinely exists, so it never lands on that refusal.
- **The horizon is the argument.** The opening beat carries the OLD profile's
  projection and everything after carries today's, so the field visibly widens
  at the moment the story says it did. That is the reason to play this back
  instead of reading it.
- **There is a way out at every beat** — Close, or Escape. A full-screen surface
  with no chrome still owes the reader an exit that isn't "tap to the end."

---

### 4.9 The app bar *(amended, July 2026)*

Every product screen used to spend **two rows** on chrome: a band of sky holding
a 13px wordmark near its top with 59px of nothing beneath it, then a gap, then
the screen's own overline. On an 812px phone the first real content landed at
**184px — 23% of the viewport** — and it read like a web page with a hero, not
an app you opened on a phone.

It is now **one row**: the mark on the left, where-you-are on the right, in the
height that row actually needs. Content starts at **84px**.

- The **screen owns its label** ("Today · JUL 28" needs today's date, "Insights
  · since June 21" needs the previous snapshot — neither is derivable from the
  route), but the **bar owns the position**. A portal (`components/north/
  Masthead.tsx`) lets both be true with no state syncing and no flash.
- The label is still the page's `h1`. Heading order is unchanged; it has moved
  to where it was always trying to be.
- `SKY_HEIGHT` is **one constant** shared by the sky and the bar, because they
  are the same measurement. Splitting them into a height and a matching padding
  is what let an overline drift onto the gradient — where ink on teal is
  invisible — when the nav moved out of the flow.

### 4.10 Changing a goal *(added, July 2026)*

A goal could be **named** and **released**, and nothing in between. That made
"let it go and name it again" the only way to fix a slipped date — which
discards whatever was already set aside and reads as a penalty for having
guessed. The correction loop's premise is that what North knows can be *fixed*.

`Adjust this one` re-asks the two turns that go stale — what it takes, and when
— one at a time, in the voice that asked them the first time. **Not a form:**
there is no settings screen, and correcting what North knows is a conversation
(§5.3). The label and the savings are never re-asked because neither is what
went wrong; `updateGoal` patches only the answered fields, and the adjusted
goal becomes `stated`, since the user has just said it out loud.

---

### 4.11 Home without a card *(amended, July 2026)*

Today used to box its decision in the product's one `Card`. The border was
doing two jobs and only one of them well: it said *"this is one object"*, which
the content already says, and *"this needs you"*, which on the one screen that
always leads with the decision is not news. What it cost was **the inversion
this screen exists for** — a bordered, elevated panel reads as a widget, and a
widget's caption cannot be the hero.

Unboxed, the coach's sentence **is** the page. The rules that mattered survive
without the border: one primary action, ink not a hue, no number without a
read. `Card` itself is untouched and remains the product's one card
(DESIGN-SYSTEM §8.3) — it simply no longer appears on Home.

Everything else stayed where it was. `RungIndicator` keeps its place directly
under the read — the typographic line plus the tick strip — and the compact
horizon still closes the screen.

A seven-row ladder was tried in that slot and removed: it said exactly what the
tick strip says, in twenty times the space, and read as a table of contents
rather than a mark. **The chart is the mark.**

**But the mark is interrogable.** "4 of 7" states a position, and a position
invites exactly one question — *what are the other six, and why is this one
mine?* For a while it had no answer, which made it the one thing no figure in
North may be: a number you have to take on faith. It now wears the same dotted
rule an inferred figure wears and opens `LadderPanel` — the whole ladder, your
position on it, and the sentence that explains the order. That is where the
expanded ladder belonged all along: behind a disclosure, not in the flow of the
one screen that must stay a single decision.

### 4.12 Where a screen names itself *(amended, July 2026)*

Screen names came out of the app bar entirely. **The dock already says which
tab you are on**, so a name in the bar was saying it twice — and on the two
screens whose label carried real information it was keeping content out of the
content.

- **Today** carries a dateline (`TODAY · JUL 28`) at the top of the page, where
  a letter puts its date rather than in the letterhead.
- **Insights** carries the letter's date *range*. "Since June 21" stated one
  edge and made the reader work out the other against today to know how long a
  stretch they were reading about; `5 WEEKS · JUN 21 – JUL 28` gives the size
  in words and both ends, with no arithmetic.
- **Navigator** and **Goals** name nothing. Their `h1` is what the screen says
  — the question, and the horizon sentence — rather than what it is filed
  under.

The bar keeps only the wordmark, which belongs to the app rather than to any
screen.

---

## 5. Overlays

| ID | Overlay | Parent | Purpose |
|---|---|---|---|
| O1 | **Derivation** | Any number | Where this figure comes from, field by field, each labeled with its confidence |
| O2 | **Assumptions** | Horizon line | What the projection assumes, in plain sentences, and which assumptions are guesses |
| O3 | **The ladder** | The rung indicator | All seven rungs, and why this one is yours |
| O4 | **Navigator's working** | A scenario answer | The reasoning behind the answer, so you can disagree with it |
| O5 | **Correction** | O1 or O2 | The coach re-asks about one field |

O1 wears `Sheet`'s plain label header; O2–O4 wear `ExplanationPanel`'s
eyebrow-and-thesis header. Both are the same component underneath
([DESIGN-SYSTEM §8.3](DESIGN-SYSTEM.md)) — a sheet below `lg`, a right-hand
pane above it, never a centered modal.

**Decision detail was designed and deferred**, not built — see
[BACKLOG](BACKLOG.md#decision-detail).

### 5.3 The correction loop — the one worth detailing

North states things about the user's situation. When it is wrong and the user
cannot fix it, they leave — and they are right to. So there must be a correction
path. There must *not* be a settings screen.

The resolution: **correcting a field is a one-question conversation.**

```
Today → tap a number
      → Derivation: "11 months liquidity (you told me) ·
                     $210k income (you told me) ·
                     6% return (we assume)"
      → tap an assumed or inferred field
      → the coach asks about it — one question, same component as onboarding
      → profile updates → Today recomputes
```

This reuses the onboarding conversation component rather than introducing form
UI, it reinforces that conversation is the interface, and it makes the
confidence system visible and useful instead of merely internal. It costs one
component's worth of reuse and it removes an entire screen from the IA.

---


### 5.4 Assumptions — a ROOM, not a drawer *(amended, July 2026)*

`DerivationSheet` answers "where did this number come from?" — a forensic
question with a bounded answer, read in ten seconds and dismissed. A bottom
sheet is exactly right for it.

Assumptions answer a different question — "what does North not know?" — and the
answer is the product's ethics, not a calculation. Giving it the same chrome as
a number's receipt says the two are the same weight, and they are not: one is
arithmetic, the other is the reason the arithmetic is a RANGE.

So `AssumptionsPanel` is full-height rather than a drawer (a side panel from
`md`). It opens under the same sky the app wears, states its thesis in the
coach's voice at reading size, and sets each assumption as a STATEMENT — label,
figure, and the confidence spoken as a phrase — instead of a table row. It is
the one disclosure in the product meant to be READ rather than scanned.

---

## 6. User flows

| ID | Flow | Path |
|---|---|---|
| **F1** | First run | Arrival → Onboarding (6–8 turns) → reveal → Today → first decision |
| **F2** | Return | Today *(return state)* → answer the callback → outcome recorded → next rung surfaces |
| **F3** | Interrogate & correct | Today → number → Derivation → field → Correction → recompute |
| **F4** | Review | Today → continuity strip → Decisions → resolve what's open → back to where you came from |
| **F5** | Defer | Today → "Not now" → recorded as open → next rung surfaces |

**F1 and F2 are the demo.** F1 proves the product's thesis; F2 proves the moat.
Everything in F3–F5 exists to make the product survive contact with a curious
reviewer who taps things.

**F5's design constraint:** deferring must not feel like losing. The coach moves
on without comment. No "are you sure?", no re-prompt, no guilt copy. The
deferred item reappears later, once, phrased as new.

---

## 7. Empty states

**Principle: an empty state in a coaching product is never "no data" — it is
"here's what happens next."** Never an illustration of an empty box.

### 7.1 Decisions — zero entries

Reachable only in a genuine first run, before the first commitment.

Content: what this screen will hold, plus a pointer to the live decision waiting
on Today. It is a promise, not an apology. One action: return to Today.

### 7.2 Today — all rungs satisfied

The rare case where the Waterfall has nothing to surface.

This is a **reward state, not an empty state**, and it should feel like one:

> **Nothing needs your attention. That's rare.**
> Here's what I'm watching for.

Followed by the specific conditions that would produce a new decision. This
matters more than its frequency suggests — it is the only moment the product can
tell a user they are genuinely doing well, and personal finance software almost
never does.

### 7.3 Unknown profile field

**Not an empty state.** A field North doesn't know is a question the coach
hasn't asked yet. It never renders as a blank, a dash, or "—". It renders as a
prompt, or it is simply absent from the read.

---

## 8. Loading states

**Principle: no spinners.** Content-shaped skeletons, or nothing.

With fixture data and no network, almost nothing genuinely loads — which makes
loading a **rhetorical device rather than a technical necessity.** Used well
that is an advantage; used carelessly it is manipulation.

| Moment | Treatment | Rationale |
|---|---|---|
| **Between conversation turns** | ~400–600ms considered pause with a subtle presence indicator | A coach that answers instantly reads as a lookup table. This is the one place latency is *added*, deliberately. |
| **The reveal** (onboarding → Today) | 1–2s, ceremonial, purposeful transition | The highest-value moment in the product. Rushing it wastes it. |
| **Recompute after correction** | Brief, and *visible* — the number and the read visibly change | Proves the system reasoned rather than refreshed |
| **Route transitions** | Instant | Nothing is loading; pretending otherwise is a lie with no payoff |

**The constraint on all of it:** a pause must always be doing something the user
can see resolve. Latency that produces no visible change is a fake, and a slow
demo reads as a broken one. **Nothing waits longer than two seconds, ever.**

---

## 9. Error states

**The category-specific rule: in a financial product, an error must never imply
the user's money is affected.** A generic "Something went wrong" rendered
anywhere near a dollar figure reads as *your money is gone*. Every error must
scope itself and say explicitly what is unaffected.

**The voice rule: the coach never breaks character.** Failures are phrased as
something the coach can't do right now — never as a system message, never as a
stack trace, never as an error code.

| ID | Failure | Handling |
|---|---|---|
| **ER1** | Storage unavailable (private browsing, quota) | Fall back to in-memory session. One honest line: this session works fully, it won't be here next time. Not a modal, not a blocker. |
| **ER2** | Phrasing service unavailable *(if the LLM flag is on)* | **Invisible.** Deterministic string renders instead. The user never learns anything failed, because from the product's perspective nothing did. |
| **ER3** | Contradictory or implausible profile answers | **Not an error.** The coach asks a clarifying question. This is the correct behavior for a coach and it removes an entire error class. |
| **ER4** | Unexpected exception | Error boundary, in the coach's voice, scoped to what broke, explicit that nothing about the user's situation was lost. One action: restart the conversation — non-destructive, since decision history persists independently of the profile. |
| **ER5** | `/today` reached without a profile | **Not an error.** Redirect to Arrival. An unreachable state should be routed, not explained. |

Three of the five resolve to *not an error* — states routed, clarified, or made
invisible. That ratio is the goal: **most error handling in a well-architected
product is error elimination.**

---

## 10. Key interactions

Seven. Ranked by how much of the product's quality they carry.

1. **The reveal** — onboarding to Today. The single highest-craft moment. It
   opens by reflecting the user's own opening answer back at them, then delivers
   the read. This is where the product either lands or doesn't.
2. **Conversation turn-taking** — one question at a time, the prior turn
   receding. Must never feel like a form advancing.
3. **Commit / Defer** — the loop closing. Both are first-class; only one is
   visually louder.
4. **Number → derivation** — tap any figure, see where it came from. This is
   *"earn every number"* made literal, and it is the interaction most likely to
   convince a skeptical reviewer the reasoning is real.
5. **Correction** — an assumed field becomes a one-question conversation, and
   Today visibly recomputes. Proves the system thinks rather than displays.
6. **The return callback** — *"You said you'd open the IRA. Did that happen?"*
   The moat, in one sentence.
7. **Continuity strip → Decisions** — history sitting directly beneath the
   present decision.

**Interactions 1, 4, and 6 are the demo.** If time forces a choice, polish those
three to the exclusion of everything else.

---

## 11. What this architecture refuses

Recorded so the refusals are deliberate rather than rediscovered:

- **No tab bar** while there are two destinations. §2.
- **No settings screen.** Correction is a conversation. §5.3.
- **No workload meters.** Nothing fills toward "done," anywhere. Onboarding's
  wayfinding strip is position on a route — answered / here / to come — never
  a percentage. §4.2.
- **No spinners.** §8.
- **No "failed" or "overdue" decision state.** Guilt is a retention bug. §4.4.
- **No number without an interpretation above it.** §4.3.
- **No empty state that apologizes.** §7.

---

## 12. The app redesign — July 2026 amendment (approved)

The product is designed as a PHONE APP first; desktop is a later staging of the
same column. Every screen answers exactly one question, and the daily loop —
not the sitemap — is the organizing idea: most days North should need nothing
from you, and say so beautifully.

| Screen | The one question | Form |
|---|---|---|
| **Home** (`/today`) | How am I doing? | The read when something needs you (the card); a large calm sentence, cardless, when nothing does. Continuity is one quiet line. |
| **Navigator** | What should I do? | The questions you bring, set like a table of contents in serif. |
| **Scenario** | What happens if I make this decision? | Navigator's full-screen answer STATE — not a dock destination. Situation → the call → the consequence; the working sits behind "what this rests on". |
| **Insights** | What changed? | A LETTER diffing two real profile snapshots plus the ledger. Allowed to say "Nothing changed. That's fine." The ladder table is gone. |
| **Goals** | Where am I going? | Trajectory reborn as a scene: one horizon fan under the sky, one pacing sentence when a goal exists. Goal capture is a staged conversation (activates rung 5). Never progress bars. |

**Dock: Home · Navigator · Insights · Goals.** Decisions (`/decisions`) is a
drill-down reached from Home's continuity line and the letter — a ledger is
depth, not a destination. The card's meaning sharpened: it appears ONLY when
something needs you, so the calm day is cardless by design.

**Overlines are mastheads only.** One per screen. Every other label is meta or
absent — label stacks were how the instrument-panel drift crept in.

State addition backing the letter: the profile store snapshots the outgoing
state on every save (v2, capped, v1 migrates losslessly).

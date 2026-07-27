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
| **Overlay** | Contextual, dismissible, always has a parent | Derivation, Assumptions, Decision detail, Correction |
| **State** | Same surface, different content | First-run, Steady, Return, Satisfied, Empty, Loading, Error |

The discipline this enforces: **new capability is a state or an overlay until
proven to need a surface.** Every finance app that became unusable did so by
promoting states to surfaces.

### Structure

```
Arrival  ──▶  Onboarding  ──▶  Today ◀──────────┐
 (flow)        (flow)          (home surface)   │
                                 │              │
                                 │  ┌───────────┴──────────┐
                                 │  │ Overlays             │
                                 │  │  · Derivation        │
                                 │  │  · Assumptions       │
                                 │  │  · Correction        │
                                 │  └──────────────────────┘
                                 ▼
                              Decisions
                            (surface, pushed)
                                 │
                                 └─▶ Decision detail (overlay)
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
| 4 | Decisions | Surface | `/decisions` |
| — | Design system | Artifact | `/design` |

---

## 4. Screens

### 4.1 Arrival — `/`

**User goal:** Decide within five seconds whether this deserves ninety.

**Information hierarchy**
1. The promise — *"Everyone else shows you where your money went. North tells you where you're going."*
2. One sentence of context. What it is, in plain language.
3. One button.

Nothing else. No navigation, no footer, no pricing, no feature grid, no
screenshots of dashboards, no logos of banks. The absence is the argument — a
page this quiet is a claim about the product's character before the product has
made one.

**Primary actions**
- **Start** — the only action on the screen.

**Why this screen exists**
Positioning must be legible before any interaction. This is also the *only*
place North explains itself by contrast; everywhere else it simply behaves
differently and lets the user notice. Stating the contrast once, at the door,
buys the right to never mention competitors again.

---

### 4.2 Onboarding — `/start`

**User goal:** Be understood, without filling in a form.

**Information hierarchy**
1. The current question — occupies the screen, one at a time.
2. The answer affordance directly beneath it.
3. Prior turns recede above, scrollable but visually subordinate.

**No progress bar.** A progress bar converts a conversation into a form and
tells the user how much work remains — framing this as a chore. Progress is
implied by the conversation advancing.

**Structure — 6 to 8 turns, emotional first, structured after**

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

**Primary actions**
- **Answer** — select, or type for the opening question.
- **Back** — revise the previous answer. Lightweight and always available; a
  mis-tapped chip with no way back is infuriating and cheap to prevent.

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

**Primary actions**
- **Mark held** — resolve an open commitment.
- **Tap a decision** → Decision detail overlay: the situation as it stood then,
  and what changed since.

**Why this screen exists**
It is the memory made visible, and it is the one surface no competitor has.
More precisely: **it is the only screen in consumer personal finance designed to
produce pride rather than guilt.** Every other app's history view is a record of
spending you regret. This is a record of decisions you made well.

Cut this screen and North is a nicer-looking dashboard with a conversational
intake.

---

## 5. Overlays

| ID | Overlay | Parent | Purpose |
|---|---|---|---|
| O1 | **Derivation** | Any number | Where this figure comes from, field by field, each labeled with its confidence |
| O2 | **Assumptions** | Horizon line | What the projection assumes, in plain sentences, and which assumptions are guesses |
| O3 | **Decision detail** | A decision entry | The situation at the time, and what has changed since |
| O4 | **Correction** | O1 or O2 | The coach re-asks about one field |

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

## 6. User flows

| ID | Flow | Path |
|---|---|---|
| **F1** | First run | Arrival → Onboarding (6–8 turns) → reveal → Today → first decision |
| **F2** | Return | Today *(return state)* → answer the callback → outcome recorded → next rung surfaces |
| **F3** | Interrogate & correct | Today → number → Derivation → field → Correction → recompute |
| **F4** | Review | Today → continuity strip → Decisions → entry → Decision detail |
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
- **No progress bar in onboarding.** It would make a conversation a form. §4.2.
- **No spinners.** §8.
- **No "failed" or "overdue" decision state.** Guilt is a retention bug. §4.4.
- **No number without an interpretation above it.** §4.3.
- **No empty state that apologizes.** §7.

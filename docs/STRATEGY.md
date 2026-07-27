# North — Product Strategy

> Everyone else shows you where your money went.
> North tells you where you're going.

**Companion document:** [FOUNDATION.md](FOUNDATION.md) covers design principles,
visual direction, and technical architecture. This document covers product —
vision, users, problems, scope. Product questions are settled here.

---

## 0. The constraint that shapes this document

North is a **portfolio product**. Success is a reviewer understanding the
thinking within ninety seconds and wanting to use the thing. Not ARR, not
retention curves, not parity with a bank.

That inverts the normal MVP calculus, and it is worth stating plainly because
sections 8 and 9 are derived entirely from it:

| Normal startup MVP | North |
|---|---|
| Cut polish to ship scope | **Cut scope to ship polish** |
| Breadth proves ambition | **Depth proves taste** |
| Infrastructure is table stakes | **Infrastructure with no visible surface is waste** |
| Ship, then learn from users | **Ship something legible without a walkthrough** |

The practical filter for every feature: *does a reviewer see it, and does seeing
it change what they think of the work?* Auth doesn't. Billing doesn't. Account
linking doesn't. A projection that admits its own uncertainty does.

### The audience: demo first, code second

North is encountered twice, by two audiences with opposite tastes:

1. **A live link.** Sixty to a hundred and twenty seconds of clicking. Never
   opens the code. Rewards motion, copy, the reveal on Today, and the return
   state.
2. **The repository.** An engineer reading structure, types, and commits. May
   never run it. Rewards architecture, a narrative README, the `/design` route,
   and tests on the part that matters.

Serving both at a high bar costs more than serving either. **The scope shrinks
to pay for it** — see §8. Where the two conflict, the demo wins, because it is
what gets encountered first and it is what makes someone bother to open the
repo at all.

---

## 1. Product vision

> **A financial advisor's judgment in everyone's pocket — without their sales
> pitch.**

Financial *information* is solved. Rates, returns, contribution limits, the
case for index funds — all of it is free, abundant, and one search away.

Financial *judgment* is not. Judgment is the part that says *this, not that, and
here's why, for you, this month.* It is the only genuinely scarce thing in
personal finance, and it currently costs $3,000–8,000 a year and usually
requires $250k in assets to access. Below that line, people are handed a
dashboard and wished luck.

North's vision is that the judgment layer becomes software: available to
anyone, at software cost, with no book of business to protect and nothing to
sell you at the end of the conversation.

The endpoint is not an app people check. It is a relationship people keep —
something that knows their situation, tells them the truth about it, and
notices when they drift.

---

## 2. Target users

North serves everyone. It never asks anyone to declare which kind of person
they are — the coach infers a situation from conversation, because self-
segmentation is a task the user is least equipped to perform and the coach is
most equipped to handle. (Mechanism: the Waterfall, [FOUNDATION §4](FOUNDATION.md).)

But **positioning is not eligibility.** The narrative aims at a wedge, because
a story addressed to everyone converts no one.

### Primary — The Unadvised Earner *(narrative wedge)*

30–45. $150–400k household income. No advisor. A 401k they configured once
during onboarding at a job they've since left. Cash accumulating in checking
because moving it requires a decision they don't feel qualified to make. A
standing intention to "look into it properly" that is now several years old.

Literate enough to know they're leaving money on the table. Not confident
enough to act. **Their problem is judgment, not data** — and they are the group
for whom that gap is most expensive.

### Secondary — The Early Optimizer

25–32, first real salary, wants to build correctly from the start rather than
correct course at 40. Currently assembling a strategy from Reddit threads and
a colleague's offhand advice. High engagement, low willingness to pay,
excellent word of mouth.

### Secondary — The Inflection Decider

Any age, any income, facing one discrete irreversible decision: a house, a
child, a job change, an equity event. Episodic rather than habitual usage, but
the highest-stakes and highest-gratitude moment the product has.

### Explicit anti-users

Naming these matters as much as naming the users:

- **People in acute financial distress.** North's register — calm, forward-
  looking, optimizing — is wrong for someone choosing between rent and
  utilities. The honest answer for them is a nonprofit credit counselor, and
  the product should not pretend otherwise.
- **People who want to optimize $40 of grocery spending.** That is YNAB, and
  they are good at it. North will feel useless and slightly condescending to
  someone who wants envelope budgeting.

---

## 3. User problems

Six problems, each real, each mapping to a design decision.

**P1 — The advice gap.**
Between free information and a $5,000 advisor there is nothing. Everyone knows
*about* index funds. Nobody will tell them what to do with the $12,000 sitting
in checking *this month*.

**P2 — Information without judgment is noise.**
Existing apps exhaustively answer a question nobody is anxious about — *what
did I spend on restaurants?* — and stay completely silent on the one they are:
*am I going to be okay?*

**P3 — Avoidance is the default behavior.**
Money apps make people feel bad, so people stop opening them. This is the
category's defining failure: a tool built to reduce financial anxiety reliably
increases it, then gets deleted. Any design that produces guilt is a retention
bug, not a motivation feature.

**P4 — Nothing remembers.**
You make a good decision in January and no system holds onto it. There is no
ratchet. Every session restarts from zero, so progress never compounds and the
user never accumulates evidence that they're doing better.

**P5 — Trust is demanded before value is delivered.**
Every competitor opens with *link your bank account* — the highest-friction,
highest-anxiety action in the product, requested at the exact moment of lowest
trust. It is the single largest funnel leak in consumer fintech and everyone
ships it anyway.

**P6 — False precision destroys credibility.**
A projection reading *$1,247,832 at 65* is obviously fabricated to anyone who
considers it for two seconds. The moment a user notices, every other number in
the product becomes suspect.

---

## 4. Jobs to be done

### Functional

- When **a bonus or raise lands**, I want to know where it should go, so it
  doesn't get quietly absorbed into my lifestyle.
- When **there's surplus at the end of the month**, I want to know the single
  highest-value place to put it, so I stop defaulting to leaving it in checking.
- When **I'm facing a large decision**, I want to know whether it breaks my
  plan, so I can decide without dread.
- When **something changes** — income, job, a new obligation — I want the plan
  to update itself, so it doesn't silently go stale.

### Emotional *(the ones that actually drive the category)*

- When **I think about money**, I want to feel oriented rather than vaguely
  guilty, so I stop avoiding the subject entirely.
- When **I've done something right**, I want it acknowledged and remembered, so
  I have evidence I'm improving rather than just a fresh list of failures.

### Social

- When **someone asks if I'm on track**, I want a real answer, so I stop
  performing a confidence I don't have.
- I want to be **the kind of person who has this handled**, not the kind who is
  winging it and hoping.

Every competitor optimizes the functional column. The emotional and social
columns are where they lose, and where North is designed to win.

---

## 5. Core user journey

Maya, 34, product lead. $210k household. $40k in checking that keeps growing
because they haven't decided what to do with it. They open North on their phone
after seeing it recommended.

### Stage 0 — Arrival · *5 seconds*

One line, one sentence of context, one button. No signup wall, no pricing, no
feature grid, no screenshots of dashboards.

*Sees:* "Everyone else shows you where your money went. North tells you where
you're going." → **Start**
*Feels:* This is not another budgeting app.
*Proves:* Positioning is legible before any interaction.

### Stage 1 — The conversation · *90 seconds*

Six to eight exchanges. The coach asks; Maya answers. It is never a form, and
the coach never asks two things at once. It opens with the question that
matters rather than the data it needs — *"What's the money thing you keep
meaning to deal with?"* — and works backward to the facts.

*Sees:* A conversation that feels like being interviewed by someone competent.
*Feels:* Understood, not processed.
*Proves:* Conversation-first onboarding. No account linking. No persona picker.
Output is a typed `SituationProfile` with per-field confidence.

### Stage 2 — The reveal · *the money moment*

**Today.** One screen. One thing.

> **Your $40,000 in checking is the problem, not the win.**
> You're holding 11 months of expenses in cash. Three is the floor. The other
> eight months — about $29,000 — is sitting still while you have $18,000 of
> unused tax-advantaged space this year.
>
> *Your rung: 4 of 7 — tax-advantaged space*

Below it, one action and one derivation link. Nothing else on the screen.

*Sees:* A verdict, not a chart.
*Feels:* Relief, then mild embarrassment, then motivation. In that order.
*Proves:* Never a number without a read. One decision per screen. The Waterfall
producing a personalized answer without ever asking who Maya is.

### Stage 3 — The decision · *15 seconds*

Two first-class responses: **I'll do this** and **Not now.** Deferral is not a
failure state and is not nagged about — it is recorded with the same weight as
a commitment, because a coach that punishes honesty gets lied to.

*Sees:* A decision recorded, and the next rung surfacing behind it.
*Feels:* Momentum.
*Proves:* The loop closes. The product tracks decisions, not sessions.

### Stage 4 — The horizon · *30 seconds*

**Trajectory.** Maya taps through to the question underneath all of it.

A single projection — not a line, a **band**. Wide near the edges, honest about
what it doesn't know, and annotated: *"This assumes your income holds and you
keep the change you just made. Both are guesses."*

*Sees:* A range, and the assumptions written out.
*Feels:* Trust. Specifically: this thing isn't flattering me.
*Proves:* Honest about uncertainty. Earn every number.

### Stage 5 — The return · *three weeks later*

North does not greet Maya like a stranger.

> **You said you'd open the IRA. Did that happen?**
> Last time we spoke you were holding 11 months of cash. Let's see where you
> landed.

*Sees:* Continuity.
*Feels:* Accountable to something, in a way that isn't unpleasant.
*Proves:* The moat. Not the data — the relationship. This is the stage every
competitor is structurally incapable of, and it is the reason to build North.

---

## 6. Primary use case

> **"I have money sitting in checking and I don't know what to do with it."**

This is the hero scenario, and everything in the MVP is arranged to serve it.

**Why this one:**

- **High frequency.** It recurs monthly for anyone with surplus, so it drives
  return usage rather than one-time curiosity.
- **High anxiety, low resolution.** People feel actively bad about idle cash and
  have no reliable way to resolve it. Every other app shows them the balance and
  says nothing.
- **Directly answerable.** The Waterfall exists precisely to answer *where does
  the next dollar go.* Product thesis and hero use case are the same mechanism,
  which is what makes the demo coherent rather than assembled.
- **Demoable in sixty seconds** without a contrived setup.

**Recurring secondary:** *"Am I on track?"* — the ambient question that brings
people back between decisions. It is Trajectory's entire job. It is not the
primary because it produces a feeling rather than an action, and North's core
loop is built on actions.

---

## 7. Differentiation

| | Everyone else | North |
|---|---|---|
| **Tense** | Past — where did it go? | **Future — where are you going?** |
| **Output** | Information | **A decision** |
| **Surface area** | Maximized (more data = more value) | **Minimized (one thing at a time)** |
| **Onboarding** | Link your bank, then we'll talk | **Talk, then link if it's earned** |
| **Where the AI lives** | A chat box summarizing the charts | **The judgment layer** |
| **Emotional register** | Report card, or gamified roasting | **Calm and adult** |
| **Memory** | None — every session starts at zero | **Continuous — it remembers what you decided** |

### Against the field specifically

- **Monarch / Copilot** — the best dashboards ever built. Genuinely beautiful.
  Still dashboards: they answer *what happened* with great craft, and are silent
  on *what now.* North does not compete on data breadth or integrations. Those
  are lost battles and not the interesting ones.
- **YNAB** — a methodology with a product attached, and it works. It also
  requires the user to become a bookkeeper. Different user, different job.
- **Cleo** — the closest analogue, and instructive: it puts AI in a chat box and
  a personality on top of spending data. The AI summarizes; it doesn't decide.
  The tone is engineered for engagement rather than trust.
- **Rocket Money** — a utility, not a coach. Cancels subscriptions well.
- **Empower** — free tracking as lead generation for human advisors. The product
  is the funnel.

### The sharpest line

**Every competitor puts the AI in the conversation layer. North puts it in the
judgment layer.**

A chat box that explains your spending chart is a feature. A system that reasons
over your situation and tells you the one thing to do next is a product. The
intelligence in North is the reasoning over the Situation Profile — not the
text generation on top of it.

### Why hasn't anyone done this?

Because judgment is a liability. Telling someone what to do with their money is
regulated in the US, and it is unfalsifiable right up until it's wrong.
Dashboards are safe: data cannot be sued.

North's answer is the coaching line ([FOUNDATION §9](FOUNDATION.md)) — *name
the gap, frame the tradeoff, never pick the ticker.* "You have $18,000 of
unused tax-advantaged space" is a fact about the user's situation. "Buy VTI" is
advice. The first is where nearly all the value is, and it is the part
everyone skipped.

---

## 8. MVP scope

**Three screens, one landing, one design route.** Plus the repo artifacts that
serve the second audience.

### Product surfaces

| # | Scope item | Done means |
|---|---|---|
| 1 | **Design system + `/design` route** | Semantic tokens, type scale, ~10 primitives, live gallery. Zero raw color utilities in any component. Presentable as a deliverable in its own right, not a dev tool. |
| 2 | **Arrival** | One screen: promise, one sentence, one button. Loads instantly, no wall. |
| 3 | **Onboarding conversation** | 6–8 exchanges producing a valid `SituationProfile` with per-field confidence. Feels conversational, is deterministic. |
| 4 | **Today** | Waterfall rung computed from the profile. One read, one action, one derivation drawer, one horizon line. Nothing else. |
| 5 | **Decisions** | A list. Commit and defer both first-class. Seeded with history so continuity is visible on first view. |
| 6 | **Return state** | A togglable "three weeks later" state that opens with a callback to a prior decision. |

### Repository artifacts

| # | Scope item | Done means |
|---|---|---|
| 7 | **Narrative README** | Tells the product story, then the architecture. The bridge between the two audiences — someone who liked the demo should understand the thinking without opening a file. |
| 8 | **Waterfall engine tests** | The rules are data, and they are tested. High signal: it demonstrates testing the thing that matters rather than the thing that's easy. |
| 9 | **Repo hygiene** | Legible structure, meaningful commits, no dead code, no TODOs, no commented-out blocks. An engineer's first thirty seconds decides the rest. |

### The horizon line, not a Trajectory tab

Trajectory is **out of MVP as a standalone surface** (§9). The projection
instead appears as a compact line on Today, directly beneath the decision:

> On this path: **$1.2M – $1.8M** by 65 · *what's assumed →*

This is a cut, but it is also better product design. Adjacent to the decision,
the range makes the decision feel consequential; isolated in its own tab, it is
divorced from the thing that moves it. Design principle #4 — honest about
uncertainty — is demonstrated either way. Ranges only; no point estimates
anywhere in the product.

### Deliberate technical posture

- **Fixture data only.** No account linking, no network dependency. The fixture
  layer sits behind the same typed interface a real provider would.
- **No auth, no persistence beyond `localStorage`.** Neither produces portfolio
  signal; both produce real engineering cost.
- **The reasoning is deterministic, and the rules are data.** The Waterfall is
  an ordered rule set over a typed profile — same situation, same answer, every
  time. It can be reasoned about, it can be tested, and it cannot fail live in
  front of a reviewer.
- **LLM phrasing is a stretch, behind a flag, never on the critical path.** If
  used, it rewrites the coach's *wording*; the deterministic string is always
  the fallback. The demo must run with no API key.
- **Tokens are built dark-ready; MVP ships light only.** Light-first done
  perfectly beats two themes done adequately.

### Item 6 is the one to protect

Continuity is the differentiator and it is the easiest thing to cut under time
pressure, because it looks like polish. It isn't. Without the return state,
North is a nicer-looking dashboard with a conversational onboarding — a good
portfolio piece rather than a memorable one. **If the schedule slips, cut
polish from Decisions before cutting the return state.**

---

## 9. Explicitly excluded from MVP

The reasons matter more than the list.

### Cut because they produce no portfolio signal

| Excluded | Why |
|---|---|
| **Account linking / Plaid** | Weeks of integration, credentials, error states. Nothing a reviewer sees is better for it. The seam exists; the implementation doesn't. |
| **Auth, accounts, password reset** | Solved problem, invisible in a demo, real cost. |
| **Server persistence, database** | `localStorage` demonstrates the same product behavior. |
| **Notifications, email** | The push model is demonstrated by the return state without any infrastructure. |
| **Analytics, A/B, admin tooling** | There are no users to measure. |
| **Settings / profile editing** | Re-running the conversation is the edit path, and it is a better one. |

### Cut because they would weaken the product

| Excluded | Why |
|---|---|
| **Free-form chat with the coach** | The least differentiated surface in AI right now, the most expensive to make excellent, and the easiest to break in front of a reviewer who will try. Onboarding already proves conversational competence. Shipping a chat box makes North look like every GPT wrapper; **omitting it is a positioning statement.** Remains in the product vision — deferred, not rejected. |
| **Budgeting / envelopes** | Wrong emotional register, wrong user, and a direct fight with YNAB that adds nothing. |
| **Transaction feed and categorization** | A chore. Chores are the mechanism by which this category loses its users. |
| **Net worth tracking** | A vanity number that answers no job on the list. |
| **A "skip the conversation, fill in a form" path** | Faster, and it destroys the thesis. The conversation *is* the differentiator. |
| **Trajectory as a standalone surface** | The most expensive item in the original scope and the least load-bearing. It answers the ambient "am I okay?" — a feeling, not an action — while the core loop runs on actions. It is also the most generic surface in the plan; every competitor has charts. Survives as the horizon line on Today (§8), which sits the range next to the decision that moves it. Restore it post-MVP as the full surface it deserves to be. |
| **Persona picker at signup** | Structurally rejected. See [FOUNDATION §2](FOUNDATION.md). |
| **Gamification, streaks, badges** | Cleo's register. Incompatible with "calm and adult." |

### Cut as scope discipline

| Excluded | Why |
|---|---|
| **Couples / shared accounts** | Doubles state complexity for a narrower initial story. |
| **Native mobile app** | Mobile-first web demonstrates the same design thinking and is shareable by link — which matters enormously for a portfolio piece. |
| **Dark mode** | Tokens are built for it; the theme ships later. One theme, perfect. |
| **Multi-currency, non-US tax rules** | The Waterfall is US-shaped in MVP. Generalizing it is real work with no visible payoff. |
| **Investment execution, security recommendations** | Regulatory weight, zero differentiation, and against the coaching line on principle. |

### The standing rule

Every one of these is a defensible product someone could build. **The MVP is
not the list of good ideas — it is the shortest path to the thesis being
undeniable.** Anything that doesn't shorten that path is deferred, regardless of
how good it is.

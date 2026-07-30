# North — Voice

**Status: all four phases built (§7).** Voice input in onboarding (§9) and
Navigator, and North speaks when asked — discreet by default, full register
in the story (§10). Nothing here uses a model or a network call: the router
is deterministic and local, and every spoken sentence is composed by `core/`.

A plan for making North something you *talk to* rather than something you read.
Researched against how state-of-the-art voice agents are built in 2026, then
argued back against this product's own constraints — because most of what the
industry has settled on is wrong for North, and the places it is wrong are the
interesting part.

---

## 1. The one-line thesis

> **North already is a conversation. It just happens to be typed.**

Onboarding is ten spoken-register questions. Today is one sentence in a coach's
voice. Insights is a letter. The composer already carries a microphone and
renders your answer in Newsreader italic — *speech being written down*.

So this is not "add a voice assistant to a finance app". It is **finishing a
conversation the product already started**, and the work is mostly removing the
keyboard from paths that never wanted one.

What it is *not* is a voice mode. See §3 — the privacy constraint reshaped this
plan more than any technical finding did.

That framing matters because it rules out the default move: a floating orb in
the corner that answers anything. North does not answer anything. It answers
what its engine can compute, and it refuses the rest out loud
([UX-ARCHITECTURE §4.5](UX-ARCHITECTURE.md)).

---

## 2. What the state of the art actually looks like

### 2.1 Two architectures, and which one this needs

| | **Speech-to-speech** (realtime, single model) | **Cascaded** (STT → logic → TTS) |
|---|---|---|
| Latency | ~300–500ms, best-in-class | 600ms–1.2s tuned |
| Prosody | Keeps tone, hesitation, emphasis | Flattened by the transcript |
| Control | The model decides what is said | **You decide what is said** |
| Auditable | Hard — audio in, audio out | Every word is a string you own |

The industry is moving to speech-to-speech because it sounds better. **North
must use cascaded**, and this is the single most important decision in the
document.

The reason is a non-negotiable: *"the engine is the product's intelligence; it
never depends on a model call to produce an answer"* (CLAUDE.md). In a
speech-to-speech architecture the model **is** the thing speaking, which means
a hallucinated number is a spoken number, and a spoken number in personal
finance is the thing a regulator asks about. Research on voice AI in regulated
industries is explicit: an agent that speaks a wrong balance to someone who
cannot check it against a screen is a complaint, not a bug.

So: **the model never speaks.** It transcribes, and it routes. Every sentence
North says is composed by `core/` — the same `ReadSegment[]` the screens render
today — and handed to TTS as text the product wrote.

### 2.2 Turn-taking is the whole craft

The measured findings from production voice work, which we should adopt as
budgets rather than aspirations:

- **Barge-in must cut audio within ~60ms**, total handling under 150ms.
  Anything slower and the agent "talked over me".
- **Turn gaps of 200–450ms** feel human. Above 600ms feels slow.
- **Semantic turn detection beats silence thresholds.** Silence VAD cuts people
  off mid-thought; semantic endpointing waits for a finished idea. For a
  product whose opening question is *"What's the money thing you keep meaning
  to deal with?"* — a question people answer haltingly — this is not optional.
- A **200–300ms sustained-voice guard** before treating sound as speech drops
  false barge-ins by 60–80%.

### 2.3 What everyone agrees on, and North already does

Alexa, Google, Apple, IBM and Jellyvision converge on the same handful:
*be brief · take turns · one task at a time · remember what was said · fail
gracefully · don't advertise.* North's conversation design already satisfies
these on the typed path. Voice inherits them for free — which is the strongest
signal that this is the right product to speak.

---

## 3. The privacy constraint — and what it changes

**Reviewed and revised, July 2026.** The first draft of this plan treated voice
as a *mode*: onboarding and Navigator "primary", spoken end to end. That was
wrong, and the objection that broke it is the one that matters most in this
category.

> **This is money. People are not comfortable having it said out loud.**

North says things like *"Your $140,000 in cash is the problem, not the win."*
On a train, in an open-plan office, in a kitchen with family in it, that is an
exposure the user never agreed to. A voice feature that makes the product
unusable in public has not added a mode — it has taken one away.

### 3.1 The asymmetry the first draft missed

Speaking **to** North and North speaking **to you** are not the same risk, and
collapsing them into one "voice mode" is the error:

| | Exposure | Who controls it |
|---|---|---|
| **You speak** | You choose the words, and you can lower your voice or stop | **You do**, continuously |
| **North speaks** | It says your balance at whatever volume, to whoever is in the room | **Nobody**, once it has started |

Input is a keyboard replacement. Output is a disclosure. They deserve opposite
defaults, and the revised plan gives them opposite defaults.

### 3.2 The three rules

1. **Voice is never a mode.** There is no state you enter and have to leave.
   Every screen is the screen it already is; voice is an input method on
   controls that already exist, and a spoken reading you can ask for.
2. **Voice is never the only way.** Every spoken path has a typed twin that
   stays visible. Nothing is voice-only, ever.
3. **North is silent by default.** Speech output is off until asked for, every
   session. Not a preference you set once and forget in a quieter room than
   the one you are in now.

### 3.3 North can speak without saying your money

The strongest option this constraint opens up, and the one I would build:
**the voice carries the interpretation, the screen keeps the figures.**

> *Spoken:* "Your cash is the problem, not the win — you're holding far more
> than your floor, and the excess is sitting still. The numbers are on screen."
>
> *On screen, unchanged:* $140,000 · 11 months · 3 months · $104,000 · $19,500

This is not a compromise, it is the product's own thesis read aloud: *the
interpretation is the hero and the numbers live inside it*
([UX-ARCHITECTURE §4.3](UX-ARCHITECTURE.md)). Discreet speech simply declines
to voice the part that was always meant to be seen — and the confidence marks,
which cannot survive being spoken anyway, stay where they work.

So `spoken()` (§5.1) gains a second register:

| Register | Figures | For |
|---|---|---|
| **Discreet** — the default when speech is on | Elided: "that much", "the figure on screen" | Anywhere with other people in it |
| **Full** | Spoken in words, with hedges for assumed values | Alone, or on headphones |

### 3.4 Where the switch lives, given there is no settings screen

**No settings screen** is a non-negotiable (CLAUDE.md), so "a toggle in
preferences" is not available — and it would be the wrong shape anyway. A
privacy control set once, in a different room, is a control that will surprise
you.

The switch lives **on the thing it governs**, in two places and nowhere else:

- **The mic pill** the composer already has — it turns *input* on for that one
  answer. Unchanged from today, and it never causes North to speak.
- **A "Read this to me" action** on Today, Insights and the story. That is the
  switch: asking is the enabling. It starts in the **discreet** register, and
  the control that appears while it speaks offers *"Say the numbers too"* and
  *"Stop"*.

The state is per session and resets. There is no persistent "voice on".

### 3.5 Where voice belongs, revised

| Surface | Input | Output |
|---|---|---|
| **Onboarding** | **Yes — the best case.** Long free-text answers are the worst typing in the product | The questions may be read aloud on request; they contain none of your figures |
| **Navigator** | **Yes.** Ask in your own words | Answer on screen; read aloud on request |
| **Today** | Commit / defer by voice, on request | **Read this to me**, discreet by default |
| **The correction loop** | **Yes.** Correcting a figure is one spoken sentence | Not needed |
| **The story** | — | **The best fit in the product**: it is already narrated, and it is the one surface someone would deliberately sit and listen to |
| **Insights, Goals, Decisions** | No | Read aloud on request |

**Explicitly refused:** a wake word, an always-listening state, a floating
assistant, a persistent "voice mode", speech that starts on its own, and any
path that has no typed equivalent.

---

## 4. The visual language

This is where most voice products fail: they bolt on someone else's orb.
North has a drawn vocabulary already, and voice should be drawn in it.

### 4.1 `TurnGlyph` is the voice

We have a mark made of six hairline strokes on a uniform skeleton that morphs
between figures on a spring, with an ambient drift that stills under reduced
motion. **That is a voice visualiser that already exists.** Rather than
introducing a waveform or a pulsing sphere — the two most tired shapes in the
category — the turn glyph gains four states:

| State | Behaviour | Why this shape |
|---|---|---|
| **Idle** | Current ambient drift | Unchanged; the mark is already alive |
| **Listening** | Strokes swell and settle with input amplitude — the figure *breathes with your voice*, never a waveform | It is your speech moving the product's own mark |
| **Thinking** | Strokes draw inward, slow; `CoachPresence` dot appears | The considered pause the product already owns |
| **Speaking** | Gentle stroke-weight modulation on the spoken cadence | The mark is talking, not oscillating |

No waveform. No sphere. No colour change — the mark stays ink, and
`signal-coach` appears only on the live microphone, which is already the rule
for the open state.

### 4.2 The transcript is the interface

Every spoken turn writes into the same components the typed path uses:
your words in the composer's voice face, North's words in `ReadProse` with real
`Figure`s carrying their confidence.

This is not a convenience — it is a **requirement**. Three reasons:

1. **Numbers must be seen.** Ranges, dashed confidence rules and "$1.2M–$1.8M"
   cannot survive being spoken alone — and in the discreet register (§3.3) they
   are not spoken at all. The screen is where the figure and its confidence
   mark live in both registers; speech is never the only carrier of a number.
2. **Accessibility runs both ways.** A voice-only path excludes deaf and
   hard-of-hearing users exactly as a text-only path excludes others. Regulated
   voice guidance requires a non-audio alternative; ours is the product itself.
3. **It is the honest record.** North's whole posture is *interrogable*. Audio
   that vanishes is the opposite.

### 4.3 The one new component

`VoiceTurn` — a control that is the microphone, the state, and the transcript in
one object. It replaces nothing; the composer keeps its "Or say it" pill and
gains a full-conversation mode. One component, three states, no new colour.

---

## 5. Architecture

```
    mic ──► VAD (energy + classifier + 250ms guard)
             │
             ▼
        streaming STT  ──► partial transcript ──► [rendered live, greyed]
             │
             ▼
      semantic endpoint  ("did they finish a thought?")
             │
             ▼
   ┌─────────────────────────────────────────────┐
   │  THE ROUTER  — the only model call           │
   │  Input: transcript + the turn being answered │
   │  Output: a TYPED intent, never prose         │
   │    · onboarding answer → Answer              │
   │    · navigator question → ScenarioId | null  │
   │    · correction → TurnId + value             │
   │    · commit / defer / repeat / stop          │
   └─────────────────────────────────────────────┘
             │
             ▼
    core/  ── evaluate() · composeLetter() · answerScenario()
             │      (unchanged, deterministic, tested)
             ▼
      ReadSegment[]  ──►  spoken()  ──►  TTS  ──►  speaker
             └────────►  ReadProse  ──►  screen
```

**The load-bearing property: the model's output is a small typed value, never a
sentence.** If the router returns garbage, the worst case is North saying *"I
didn't catch that"* — the same refusal the typed Navigator already has. It can
never invent a number, because it is never given the chance to produce one.

This also means the existing `matchQuestion()` keyword router
(`core/navigator/match.ts`) is the **fallback**, not the primary — and the
product still works with the model switched off entirely.

### 5.1 `spoken()` — a new pure function in core

`ReadSegment[]` is written to be read. Speech needs different rules, and they
belong in `core/` with tests:

| Written | Spoken |
|---|---|
| `$1.2M–$1.8M` | "somewhere between one-point-two and one-point-eight million" |
| `11 months` | "eleven months" |
| `4 of 7 · tax-advantaged space` | "you're on the fourth of seven — tax-advantaged space" |
| dashed confidence rule | "…roughly" / "…as far as North can tell" |
| An em-dash aside | a real pause, not a word |

**Confidence has to survive the crossing.** A figure North guessed at is marked
dashed on screen; spoken, it must carry a hedge word, or voice would state
assumptions with more certainty than text — the exact inversion of this
product's ethics.

---

## 6. What could go wrong, and the answer

| Risk | Answer |
|---|---|
| A spoken number is wrong | The model never produces numbers. `core/` composes every figure. |
| It sounds like a robot reading a form | Cascaded TTS with SSML pauses at the em-dashes the copy already uses. The copy was written to be spoken. |
| Latency makes it feel dead | Budgets in §2.2, and `CoachPresence` covers the considered pause — a pattern the product already owns and already caps at 400–600ms. |
| Voice becomes the only way | Every voice path has a typed twin that stays visible. Voice is never required, and never a state you have to leave (§3.2). |
| **North says your balance out loud in public** | The one that reshaped this plan. Output is off by default, enabled only by asking, reset every session — and when it does speak it elides the figures unless you ask for them (§3.3). |
| Financial advice, spoken | Unchanged: North names gaps and frames tradeoffs; it never recommends a security. The refusal list is engine-side, so it holds in both modes. |
| Privacy | Audio is never stored. Transcripts are the user's own words and live in the same local store as everything else. Say this in the product, once, where it matters. |
| It's a gimmick | The test: **if voice does not make onboarding faster and warmer, cut it.** That is the one path where it must clearly win. |

---

## 7. What I would build, in order

**Phase 1 — Speaking to North, in onboarding.** Input only; North stays
silent. Ten questions, and the long free-text ones are the worst typing in the
product. `VoiceTurn` + the router constrained to the current turn's answer type
(the *smallest possible* model surface — often a choice from four). Nothing is
disclosed to a room, so this phase carries no privacy cost at all.

**Phase 2 — Navigator by voice.** Still input only. Speak a question, read the
answer. Reuses Phase 1 whole; the router gains one intent.

**Phase 3 — `spoken()` and the discreet register.** The first phase where
North makes a sound, and it ships with figures elided by default. "Read this to
me" on Today and Insights, with *"Say the numbers too"* available while it
speaks.

**Phase 4 — The story, narrated.** The one surface someone would deliberately
sit and listen to, and the best thing to demo. Full register is a reasonable
default *here only*, because choosing to play a story is already choosing to
listen.

Each phase is independently shippable and independently reversible.

---

## 8. Decisions

**Settled in review:**

- **Voice is not a mode, is never the only way, and North is silent by
  default.** Input and output carry opposite risks and get opposite defaults.
- **Discreet speech is the default register** when North does speak: the voice
  carries the interpretation, the screen keeps the figures.
- **The switch lives on the control, not in settings** — asking for a reading
  is what enables it, and it resets every session.

**Still open, and worth arguing:**

1. **Cascaded over speech-to-speech** — slower and less charming, but the model
   can never speak a number. I believe this is non-negotiable for a money
   product; worth disagreeing with me explicitly if you don't.
2. **The turn glyph as the voice, not an orb** — reuses the product's own mark
   and avoids the category's most tired shape. The risk is that it reads as
   *less* "voice-y" than users expect.
3. **Input first, output third** — Phases 1 and 2 ship without North ever
   making a sound. That is the cautious order; the alternative is to lead with
   the story narration, which is the better demo but the higher-exposure one.

---

## 9. What Phase 1 actually took to build *(July 2026)*

Onboarding's choice turns can now be answered by voice, end to end, with
North still making no sound at all. Twelve turns — everything except the one
free-text question, which already had dictation. Nothing here required a
model call or an API key; there is no hosted-model infrastructure in this
project at all, and per §2.1 that was never the plan for the router regardless.

**What shipped:**

- `core/onboarding/voice-match.ts` — the router, as a deterministic local
  matcher, not a model call. Scores every option on a turn by phrase overlap
  and numeric closeness (numbers are extracted from BOTH the transcript and
  the option's own label text, in natural units — "$20,000" and "twenty
  thousand" both read as 20000 — so the matcher never needs to know a turn's
  internal cents/basis-point encoding). Requires a confidence floor AND a
  decisive margin over the runner-up, or it returns `null` and the UI asks
  again — same refusal shape as `core/navigator/match.ts`. 45 tests,
  including one that round-trips every option's own label back through the
  matcher for all 12 live choice turns as a standing regression guard.
- `lib/use-speech-recognition.ts` — the Web Speech vendor shim, extracted out
  of `SpokenField` so both it and the new choice control share one
  implementation instead of two copies drifting apart.
- `lib/use-mic-amplitude.ts` — a `getUserMedia` + `AnalyserNode` RMS meter,
  written into a Motion `MotionValue` (not React state — this updates every
  frame, and routing that through `setState` would re-render 60 times a
  second for a number nothing in the tree branches on). Never connects its
  stream to the audio destination; it only measures, never plays anything
  back.
- `TurnGlyph` gained `listening` + `amplitude` props. While listening, the
  turn's own ambient life (swell/grow/bob/pivot/fan) holds still and the
  whole figure instead breathes on live mic level via `useTransform` — the
  same six-stroke mark the product already draws with, not a new waveform or
  orb. Both props are optional and every existing call site is unaffected.
- `VoiceChoice` — the "Or say it" control for a choice turn. A confident
  match calls the exact same `choose(turn, choice)` handler a tap already
  uses, so it inherits the existing pick-hold animation for free and adds no
  new "selected" state of its own. A miss shows a quiet retry line with what
  was actually heard still on screen, never an alarm.

**Two findings worth recording, because they'll matter for Phases 2–4 too:**

1. **The "thinking" state in §4.1 doesn't apply yet.** It was designed for a
   real network round-trip. A deterministic local matcher is synchronous —
   there is nothing to wait for, so nothing renders a thinking beat.
   Inventing a fake delay to show one would be exactly the kind of "no
   spinners, no workload meters" violation this product refuses elsewhere.
   The state stays reserved for if/when a real model call ever sits behind
   the router.
2. **A tie at a shared numeric boundary needs the WORD, not just the number.**
   "$200k–$400k" and "Over $400k" both score a perfect numeric hit at exactly
   400000 — the ranges touch. Token overlap alone didn't reliably break it
   ("$400k" and "400 thousand" tokenize differently). The fix was to treat an
   explicit "over"/"under" in the transcript as its own strong, direct signal
   toward whichever option's label opens the same way, rather than trusting
   incidental word overlap to carry it. Recorded in the matcher's own
   comments so Phase 2's `matchQuestion` extensions don't rediscover this the
   hard way.

**What I could not verify:** this sandbox's browser reports
`SpeechRecognition`/`getUserMedia`/`AudioContext` as present, but live capture
is blocked at the tool level. I confirmed the permission-denied path directly
— clicking "Or say it" correctly requests the mic, gets refused, and the
button reverts to idle with zero console errors and no stray "didn't catch a
match" message (since nothing was ever heard). I could not exercise a real
recognized utterance end to end outside of the 45 unit tests, which is the
actual correctness surface for the matcher regardless. Tap-only flow was
re-verified unaffected on two different choice turns after this change.

---

## 10. What Phases 2–4 took to build *(July 2026)*

North now speaks, and Navigator answers a spoken question without a tap.
Still no model, still no network call, still no API key.

**Phase 2 — Navigator by voice.** Smaller than the plan implied, because
`SpokenField` already carried the mic and `matchQuestion` was already the
router. What was missing was the *ending*: you dictated, then still had to
reach for "Think it through". `SpokenField` gained `onSpeechEnd`, which
hands the caller the transcript **directly rather than letting it read
`value` back out of state** — the recognition callback can land before the
render that committed it, and a caller reaching for the state variable would
sometimes route the previous sentence. Navigator wires it to the same
`submit` the button uses.

That change surfaced a latent bug worth recording: `submit` had been passed
straight to `onClick`, so making it take an optional question meant a
`MouseEvent` would arrive where a string was expected and reach `.trim()`.
Now `onClick={() => submit()}`, with the constraint written above the
function.

**Phase 3 — `spoken()` and the discreet register.** `core/speech/spoken.ts`,
pure and total, 27 tests. Numbers become words, `formatMonths`' own rule is
mirrored so 24 months is "two years" in the ear exactly as it is on screen,
and em-dashes become commas because a synthesiser either ignores them or
says "dash".

Two things only showed up against real engine output, not fixtures:

1. **The elision phrases had to be chosen against the copy, not in the
   abstract.** The reads put figures in noun-phrase slots — "You have
   ⟨figure⟩ set aside", "You're contributing ⟨figure⟩" — so "that much" /
   "that long" / "that many" stay grammatical where a per-figure `label`
   ("in cash", "of outgoings") duplicates the words that already follow it.
2. **The hedge doubled.** Several rules already write "about ⟨figure⟩", and
   the `assumed` hedge on top produced *"about roughly one thousand four
   hundred fifty dollars"*. Caught by reading Today's actual output, not by
   a test. `spoken()` now looks at the text immediately before a figure and
   drops its own hedge when the copy already hedged.

**Phase 4 — the story, narrated.** `ReadAloud` with `defaultRegister="full"`,
and only here: choosing to play a story back is already choosing to listen,
so eliding the figures would be protecting someone from the thing they
asked for.

Two guards this needed that the other surfaces did not: the control
`stopPropagation`s, because the whole story stage is a tap target that
advances the beat; and `ReadAloud` keys its "stop when the content changes"
effect on the segments' **content**, never their array identity — every
screen here recomposes its read during render, so depending on the array
would have stopped the speech on the tick after it started, every time.

**On the switch, in practice.** There is still no persistent "voice on".
`ReadAloud` holds its register in component state and starts from its
default on every reading, so "Say the numbers too" applies to the reading
you are in and nothing after it. Navigating away silences North on unmount.

**What I could not verify:** live microphone capture is blocked at the tool
level in this sandbox, so Phase 2's spoken question was exercised by
standing a fake recognition object in front of the same callback contract
the hook codes against — which drove the real matcher, the real submit path
and the real answer. Speech *output* was verified by capturing the exact
string handed to `speechSynthesis.speak` on Today, Insights and the story;
the audio itself was never played. What a synthesiser makes of the text is
the one thing here still unheard.

**One thing deliberately left unreviewed:** `SpeakMark` was drawn to unblock
this work. Every other mark in `ActionGlyphs.tsx` was chosen by the user
from candidates, and this one should get the same treatment before it counts
as locked.

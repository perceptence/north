# Membership — Free and Plus

Two tiers: **Free**, and **North Plus at $4.99/month**. This document is the
policy; `core/membership/rules.ts` is the same policy as data, and its tests
are what keep the two from drifting.

## The principle that decides every gate

**The coach's judgment is never paywalled; its time is.** North always tells
you the one thing that matters and what to do about it — the read on Today,
the decision loop, the letter, the typed coach — because a financial coach
that hides "your debt is costing you more than investing returns" behind
$4.99 is not a coach, and the register this product lives in does not
survive it.

What Plus buys is **room to think**: more what-ifs, the spoken conversation,
every goal instead of the first, the story replayed.

| | Free | Plus |
|---|---|---|
| Onboarding, Today, the whole decide→track→check-back loop | ● | ● |
| Typed coach — every question, every elaboration | ● | ● |
| Insights letter, and the rooms behind every dispatch | ● | ● |
| Derivations, assumptions, corrections, the record | ● | ● |
| Scenarios | `debt-first`, `contribute-more` | all five |
| Goals | the first, with pacing | every goal |
| Voice mode | — | ● |
| The story replay | — | ● |

**The ethics pin.** `debt-first` — the scenario that tells you to stop losing
money — is free forever. A test fails loudly if Plus ever widens to take it:
the product would have started charging for the warning.

**The structural guarantee.** Nothing in `core/waterfall`, `core/insights`,
`core/decisions`, `core/coach` or `core/goals` imports membership — guarded
by a source-reading test. `evaluate()` cannot give a poorer read to a free
user because it cannot ask who is asking.

## Where it lives

- **Compared** first: the sheet shows what BOTH tiers hold, from
  `TIER_LINES` in core, so a reader sees what they already have next to what
  they would be adding. A paywall listing only what you lack is an
  advertisement — and here it would also misrepresent the product, since
  most lines already say yes on both sides. A test asserts that stays true.
- **Bought** through a checkout that states the price, the renewal date and
  how to stop — but takes **no card**. There is no processor, and a card
  form would be a prop; the button says "demo, no card" and the line beneath
  it says where a released build would hand off.
- **Proposed** contextually, never as an interstitial: a locked scenario row
  (marked with a quiet `PLUS` overline — the word, not a padlock), the voice
  launcher on free, a second goal, the story link. Each opens the
  `MembershipSheet` at the moment the thing was reached for.
- **Worn** by the mark: a member's masthead carries the **Plus lockup** —
  NORTH with a compass-rose ensign, drawn on the wordmark's own pen (the
  rose's north point is the needle's filled shape at half scale; the locked
  mark itself is untouched). Tapping the lockup manages the membership. A
  free user's masthead stays exactly as quiet as it always was — status,
  never an ad.
- The sheet's comparison is **two panels**, not a table: Free lists
  everything it holds in full sentences (it is a complete coach and should
  look like one); Plus opens "Everything in Free, plus" and wears the same
  lockup a member's masthead does — the thing bought and the thing worn are
  one mark.
- Membership is an **overlay**, not a destination and not a settings screen —
  both hard rules hold (CLAUDE.md: four dock destinations; no settings
  screen).

## Ending is as easy as beginning

One tap each way. **Downgrade is cancel** (two tiers), it runs to period
end, everything stays until then, and "Keep Plus" undoes it in place. No
confirmation dialog, no retention flow, no discount at the door. The calm
register applies most where products usually abandon it.

The proposal carries its own limits on its face — `NEVER_GATED` in
`rules.ts` renders wherever Plus is offered, and the test suite asserts the
sentence still tells the truth.

## What "subscribing" means in this build

There is **no payment processor**. `beginPlus()` records state the way the
ledger records decisions without moving money; there is deliberately no card
form, because a fake one is dishonest engineering. In a real deployment the
store's writers become the receipt side of **platform billing** (App Store /
Play / a Stripe payment link) — which needs **no account**, so the privacy
promise made in onboarding's consent ("everything stays on this device;
there's no account and no server behind me") survives monetisation intact.

The demo panel on `/preview` carries a tier toggle, so a reviewer sees both
sides of every gate without walking the flow.

# The account, and moving between devices

North holds two records about you, and they are deliberately separate.

| | What it is | Where it lives |
|---|---|---|
| **Account** | Who you are — name, email, avatar, credential digest, consent | `core/account`, `state/account-store` |
| **Situation profile** | What you hold, owe and are working toward | `core/profile`, `state/profile-store` |

The profile is what the engine reasons over, and every field in it carries a
confidence. None of that is true of a name: North is not more or less sure of
your email, and no rung depends on it. Two records, two jobs — and the split
is also the line a backend would draw, so nothing here has to move when one
arrives.

## The opening flow

**Account → terms → the ten questions.** *(August 2026 amendment; the
questions used to come first.)*

The financial answers attach to somebody. Collected before an account
existed they sat in the air for two minutes with nothing to belong to, and
the day a backend lands the order has to invert anyway — so it inverts now,
while it costs nothing. The terms sit at signup, which is where a real
product puts them and where they are load-bearing: you agree to how North
works *before* it starts asking what you hold.

The step is **derived from what is stored**, never held in state: no account
→ signup; account without `consentAt` → terms; both → the conversation. The
first version held it in state and had a real bug because of it — completing
signup set the step *and* created the account in the same render, walking
straight past the terms nobody had agreed to. Deriving it makes that
unstateable, and a reload mid-flow resumes exactly where it was.

## The credential

The password field is real — masked, validated, confirmed — because a
sign-up flow with a mimed credential step is not a demo of signing up. What
is **stored** is a salted SHA-256 digest, computed at the edge with Web
Crypto. The password itself is never written anywhere.

This is **not** authentication and the product says so where it collects it:

> Everything stays on this device — only a scrambled fingerprint of your
> password is stored, never the password itself.

On a device-local product there is nothing for a password to defend; whoever
holds the device holds the data. The digest exists so the record has the
shape a backend will expect, and so `verifyPassword` has something to verify
against on the day a sign-in screen exists. Hashing lives in the store, not
in `core/` — it needs a platform API and it needs to be async, and `core/` is
synchronous pure functions. Same division as the clock.

## Moving to another device

With no server, a recovery *key* would point at nothing — and a key that
recovers nothing is worse than none, because it implies a safety net that
isn't there. So **the code carries the data**: account, profile, history,
ledger and membership, encoded into one string.

- `NORTH-1-<checksum>-<base64>`, wrapped for the eye at 48 characters
- Base64 over **UTF-8 bytes**, not `btoa` alone — the payload carries the
  user's own words, which is exactly where an em dash or an accented name
  lives
- The checksum is not security (anyone holding the code can recompute it).
  It catches the failure that actually happens: a code truncated by a chat
  client, or half a paste. "This code is damaged" beats a half-restored
  profile.
- Not encrypted, deliberately: the only available passphrase is one already
  stored on the device being left behind, and encryption whose key travels
  with the ciphertext is decoration. It is labelled as sensitive instead,
  which is the true statement.

**Import is all-or-nothing.** `decodeBundle` validates before anything is
written, then the four stores are written together. A partial restore — new
profile against an old ledger — would produce a letter diffing two lives.

The profile goes through `seedProfile`, not `saveProfile`: the bundle brings
its own history, and `saveProfile` would snapshot the outgoing state as
though the arriving profile were an edit. Restoring a device is not a
correction and must not enter the record as one.

## The account screen

Reached from the **masthead avatar**, not the dock — the four-destination cap
([CLAUDE.md](../CLAUDE.md)) is untouched, and it is not a settings screen:
no preferences, no toggles.

It holds identity, membership standing, and the transfer. Nothing financial
is editable there, deliberately — correcting what North knows about your
money is still the coach re-asking off a derivation
([UX-ARCHITECTURE §5.3](UX-ARCHITECTURE.md)). The day that screen grows a
field for cash-on-hand is the day the correction loop dies.

**Arriving from another device appears in BOTH states** — with an account and
without. It was only rendered for someone who already had one, which is
precisely backwards: the person who needs it is holding a phone with nothing
on it. Found by walking the move for real — export, wipe, arrive — which is
the only way that class of gap shows up.

"use client";

import {
  BUNDLE_VERSION,
  decodeBundle,
  encodeBundle,
  type RecoveryBundle,
} from "@/core/account";
import type { SituationProfile } from "@/core/profile/types";
import type { Membership } from "@/core/membership";
import type { Decision } from "@/core/decisions";
import { readAccount, saveAccount } from "@/state/account-store";
import { readDecisions, seedDecisions } from "@/state/decisions-store";
import { readMembership, seedMembership } from "@/state/membership-store";
import {
  readProfileAndHistory,
  seedProfile,
  type ProfileSnapshot,
} from "@/state/profile-store";

/**
 * Everything North knows, out of four stores and into one string — and back.
 *
 * ── WHY THIS IS ITS OWN FILE ──────────────────────────────────────────────
 * The four stores do not know about each other, and should not: each owns
 * one record and nothing else. But "move me to a new device" is a statement
 * about ALL of them at once, so exactly one place needs the whole picture.
 * Keeping that here means no store grows a dependency on its neighbours to
 * serve a feature none of them owns.
 *
 * ── AND WHY IMPORT IS ALL-OR-NOTHING ──────────────────────────────────────
 * `decodeBundle` validates before anything is written, and the writes then
 * happen together. A partial restore — a new profile against an old ledger —
 * would produce a letter diffing two lives, which is worse than a refusal.
 */

export function exportBundle(): string | null {
  const account = readAccount();
  if (!account) return null;

  const { profile, history } = readProfileAndHistory();
  return encodeBundle({
    version: BUNDLE_VERSION,
    exportedAt: new Date().toISOString(),
    account,
    profile,
    history,
    decisions: readDecisions(),
    membership: readMembership(),
  });
}

export type ImportOutcome =
  | { ok: true; bundle: RecoveryBundle }
  /** Named so the screen can say WHICH thing went wrong, in the coach's voice. */
  | { ok: false; reason: "unreadable" };

/**
 * Adopt a bundle wholesale. Validated first, written second, never half.
 *
 * The profile goes through `seedProfile` rather than `saveProfile`: the
 * bundle supplies its own history, and `saveProfile` would snapshot the
 * outgoing state as though the arriving profile were an edit. Restoring a
 * device is not a correction, and it must not enter the record as one.
 */
export function importBundle(code: string): ImportOutcome {
  const bundle = decodeBundle(code);
  if (!bundle) return { ok: false, reason: "unreadable" };

  saveAccount(bundle.account);
  seedProfile(
    bundle.profile as SituationProfile,
    (bundle.history ?? []) as ProfileSnapshot[],
  );
  seedDecisions((bundle.decisions ?? []) as Decision[]);
  seedMembership(bundle.membership as Membership);

  return { ok: true, bundle };
}

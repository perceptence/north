"use client";

import { useSyncExternalStore } from "react";
import { FREE, type Membership } from "@/core/membership";

/**
 * The persisted membership. Same shape as every other store: module-scope
 * snapshot, `useSyncExternalStore`, localStorage behind a try.
 *
 * ── WHAT "SUBSCRIBING" MEANS IN THIS BUILD ────────────────────────────────
 * There is no payment processor, so `beginPlus()` simply records the state —
 * the same way the ledger records decisions without moving money. In a real
 * deployment this store's writers become the receipt-side of platform
 * billing (App Store / Play / a Stripe link), which needs NO account: the
 * profile's privacy promise — everything stays on this device — survives
 * monetisation, and that is by design, not luck.
 *
 * ── CANCELLATION IS ONE WRITE ─────────────────────────────────────────────
 * `endPlus()` marks the period as ending and keeps everything until it does.
 * No confirmation dialog, no retention flow, no second screen — the calm
 * register applies MOST where products usually abandon it.
 */

const STORAGE_KEY = "north.membership";
const SCHEMA_VERSION = 1;

/** A month, for the simulated renewal date. Real billing owns this later. */
const PERIOD_DAYS = 30;

let snapshot: Membership = FREE;
let loaded = false;

const listeners = new Set<() => void>();
const emit = () => {
  for (const listener of listeners) listener();
};

function load(): void {
  if (loaded) return;
  loaded = true;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return;
    const parsed = JSON.parse(raw) as { version?: number; membership?: Membership };
    if (parsed.version === SCHEMA_VERSION && parsed.membership?.tier) {
      snapshot = parsed.membership;
    }
  } catch {
    // Unreadable or unavailable either way: free is the safe default, and
    // membership is the one record whose loss costs nothing irreplaceable.
  }
}

function persist(): void {
  try {
    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ version: SCHEMA_VERSION, membership: snapshot }),
    );
  } catch {
    // Session-only membership still works; it just won't survive a reload.
  }
}

function subscribe(onChange: () => void): () => void {
  listeners.add(onChange);
  return () => {
    listeners.delete(onChange);
  };
}

export function useMembership(): Membership {
  return useSyncExternalStore(
    subscribe,
    () => {
      load();
      return snapshot;
    },
    () => FREE,
  );
}

export function beginPlus(now: Date = new Date()): void {
  load();
  const renews = new Date(now.getTime() + PERIOD_DAYS * 86_400_000);
  snapshot = {
    tier: "plus",
    // Resubscribing after an end-of-period cancel keeps the original since —
    // you were a member; the lapse is not an identity reset.
    since: snapshot.tier === "plus" ? snapshot.since : now.toISOString(),
    renewsAt: renews.toISOString(),
    endsAtPeriodEnd: false,
  };
  persist();
  emit();
}

/** Cancel — running to period end. One write, no ceremony. */
export function endPlus(): void {
  load();
  if (snapshot.tier !== "plus") return;
  snapshot = { ...snapshot, endsAtPeriodEnd: true };
  persist();
  emit();
}

/** The undo, equally one write. */
export function keepPlus(): void {
  load();
  if (snapshot.tier !== "plus") return;
  snapshot = { ...snapshot, endsAtPeriodEnd: false };
  persist();
  emit();
}

/** For /demo and the panel: install a tier outright. */
export function seedMembership(membership: Membership): void {
  loaded = true;
  snapshot = membership;
  persist();
  emit();
}

export function clearMembership(): void {
  snapshot = FREE;
  loaded = true;
  try {
    window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    // Already free in memory; nothing else to do.
  }
  emit();
}

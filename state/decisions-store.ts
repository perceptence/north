"use client";

import { useSyncExternalStore } from "react";
import type { Decision, DecisionOutcome } from "@/core/decisions/types";

/**
 * The decision ledger.
 *
 * Same shape as the profile store and for the same reason: `localStorage`
 * doesn't exist on the server, so every read needs an explicit server snapshot
 * (docs/ARCHITECTURE.md §3).
 *
 * This is the moat made durable. Transaction history is portable and
 * commoditized; a record of the decisions someone made with North is not.
 */

const STORAGE_KEY = "north.decisions";
const SCHEMA_VERSION = 1;

interface Persisted {
  version: number;
  decisions: Decision[];
}

/** Stable across renders — `getSnapshot` is called during render. */
let snapshot: Decision[] = [];
let loaded = false;
let storageAvailable = true;

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

    const parsed = JSON.parse(raw) as Persisted;
    if (parsed.version !== SCHEMA_VERSION) {
      window.localStorage.removeItem(STORAGE_KEY);
      return;
    }
    snapshot = parsed.decisions;
  } catch {
    storageAvailable = false;
  }
}

function persist(): void {
  try {
    const payload: Persisted = {
      version: SCHEMA_VERSION,
      decisions: snapshot,
    };
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  } catch {
    storageAvailable = false;
  }
  emit();
}

const EMPTY: Decision[] = [];

function subscribe(onChange: () => void): () => void {
  listeners.add(onChange);
  return () => {
    listeners.delete(onChange);
  };
}

function getSnapshot(): Decision[] {
  load();
  return snapshot;
}

function getServerSnapshot(): Decision[] {
  return EMPTY;
}

/** Newest first. */
export function useDecisions(): Decision[] {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}

export function appendDecision(
  decision: Omit<Decision, "id" | "decidedAt"> & { decidedAt?: string },
): Decision {
  load();

  const created: Decision = {
    ...decision,
    id: crypto.randomUUID(),
    decidedAt: decision.decidedAt ?? new Date().toISOString(),
  };

  // Newest first — the ledger reads reverse-chronologically everywhere.
  snapshot = [created, ...snapshot];
  persist();
  return created;
}

/**
 * Resolve an open commitment.
 *
 * Note what is NOT possible here: there is no way to mark something failed.
 * A commitment that didn't happen goes back to `"open"` and the coach re-asks
 * (see core/decisions/types.ts).
 */
export function resolveDecision(id: string, outcome: DecisionOutcome): void {
  load();

  snapshot = snapshot.map((d) =>
    d.id === id
      ? {
          ...d,
          outcome,
          resolvedAt:
            outcome === "open" ? undefined : new Date().toISOString(),
        }
      : d,
  );
  persist();
}

/**
 * Replace the whole ledger. For `/demo`, and for the same reason the profile
 * store has one: this cache lives in module scope, so writing `localStorage`
 * directly is invisible to a session that has already read the store.
 */
export function seedDecisions(decisions: Decision[]): void {
  loaded = true;
  snapshot = decisions;
  persist();
  emit();
}

export function clearDecisions(): void {
  snapshot = [];
  loaded = true;
  try {
    window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    storageAvailable = false;
  }
  emit();
}

/** False when this session will not survive a reload. */
export function isPersistent(): boolean {
  return storageAvailable;
}

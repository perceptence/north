"use client";

import { useSyncExternalStore } from "react";
import type { SituationProfile } from "@/core/profile/types";

/**
 * The persisted profile — now with a short memory.
 *
 * `useSyncExternalStore` rather than Context + effect: `localStorage` doesn't
 * exist on the server, so every read renders a server snapshot and swaps after
 * mount (docs/ARCHITECTURE.md §3).
 *
 * ── v2: HISTORY ───────────────────────────────────────────────────────────
 * Every save snapshots the OUTGOING profile. That is what lets the Insights
 * letter say "your buffer grew from two months to three" as a diff of two real
 * states instead of a fabricated trend. Consecutive identical states are not
 * duplicated; the tail is capped. v1 payloads migrate by adopting the profile
 * with an empty history — nothing a user entered is discarded.
 *
 * This is still not a third store — history lives inside the profile's own
 * payload. The Zustand swap signal (docs/ARCHITECTURE.md §3) stays untripped.
 */

const STORAGE_KEY = "north.profile";
const SCHEMA_VERSION = 3;
const HISTORY_CAP = 30;

/** A pre-v3 profile carried a single optional goal. */
type LegacyProfile = SituationProfile & { goal?: SituationProfile["goals"] };

/**
 * v3 turns the single `goal` into a `goals` list.
 *
 * The old field becomes the list's first entry, keeping its own confidence
 * and `asOf` — a schema bump must never cost a user something they told us,
 * nor quietly upgrade an assumption into a stated fact.
 */
function toV3<T extends LegacyProfile>(profile: T): SituationProfile {
  if (!profile || typeof profile !== "object") return profile;
  const legacy = profile.goal as unknown as
    | NonNullable<SituationProfile["goals"]>[number]
    | undefined;
  if (!legacy) return profile;

  const rest = { ...profile };
  delete rest.goal;
  return { ...(rest as SituationProfile), goals: [legacy] };
}

export interface ProfileSnapshot {
  /** When this state was superseded. */
  at: string;
  profile: SituationProfile;
}

interface Persisted {
  version: number;
  profile: SituationProfile;
  history: ProfileSnapshot[];
}

/** Stable across renders — `getSnapshot` is called during render. */
let profileSnapshot: SituationProfile | null = null;
let historySnapshot: ProfileSnapshot[] = [];
let loaded = false;
let storageAvailable = true;

const EMPTY_HISTORY: ProfileSnapshot[] = [];
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

    const parsed = JSON.parse(raw) as Partial<Persisted> & {
      profile?: SituationProfile;
    };

    if (parsed.version === SCHEMA_VERSION && parsed.profile) {
      profileSnapshot = parsed.profile;
      historySnapshot = parsed.history ?? [];
      return;
    }

    // v2 → v3: the single goal becomes the goals list, in the profile and in
    // every snapshot the letter diffs against.
    if (parsed.version === 2 && parsed.profile) {
      profileSnapshot = toV3(parsed.profile as LegacyProfile);
      historySnapshot = (parsed.history ?? []).map((snapshot) => ({
        ...snapshot,
        profile: toV3(snapshot.profile as LegacyProfile),
      }));
      persist();
      return;
    }

    // v1 → v3: adopt the profile, start the history. A user's answers are
    // never the price of a schema bump.
    if (parsed.version === 1 && parsed.profile) {
      profileSnapshot = toV3(parsed.profile as LegacyProfile);
      historySnapshot = [];
      persist();
      return;
    }

    window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    storageAvailable = false;
  }
}

function persist(): void {
  try {
    const payload: Persisted = {
      version: SCHEMA_VERSION,
      profile: profileSnapshot as SituationProfile,
      history: historySnapshot,
    };
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  } catch {
    storageAvailable = false;
  }
}

function subscribe(onChange: () => void): () => void {
  listeners.add(onChange);
  return () => {
    listeners.delete(onChange);
  };
}

export function useProfile(): SituationProfile | null {
  return useSyncExternalStore(
    subscribe,
    () => {
      load();
      return profileSnapshot;
    },
    () => null,
  );
}

/** The state the current profile replaced, or null on day one. */
export function usePreviousProfile(): ProfileSnapshot | null {
  return useSyncExternalStore(
    subscribe,
    () => {
      load();
      return historySnapshot.length > 0
        ? historySnapshot[historySnapshot.length - 1]
        : null;
    },
    () => null,
  );
}

export function useProfileHistory(): ProfileSnapshot[] {
  return useSyncExternalStore(
    subscribe,
    () => {
      load();
      return historySnapshot.length > 0 ? historySnapshot : EMPTY_HISTORY;
    },
    () => EMPTY_HISTORY,
  );
}

export function saveProfile(profile: SituationProfile): void {
  load();

  // Snapshot the outgoing state — the letter diffs against this.
  if (
    profileSnapshot &&
    JSON.stringify(profileSnapshot) !== JSON.stringify(profile)
  ) {
    historySnapshot = [
      ...historySnapshot,
      { at: new Date().toISOString(), profile: profileSnapshot },
    ].slice(-HISTORY_CAP);
  }

  profileSnapshot = profile;
  persist();
  emit();
}

/**
 * Replace the whole store — profile AND history — in one go.
 *
 * Exists for `/demo`, which needs to install a past as well as a present so
 * the Insights letter has two real states to diff. It goes through the store
 * rather than writing `localStorage` directly BECAUSE the store caches in
 * module scope: any screen that has already called `useProfile()` marked the
 * cache loaded, so a behind-the-back write is never read and the seeded
 * session looks empty. That is exactly the bug that sent /demo to onboarding.
 *
 * Unlike `saveProfile` this does not snapshot the outgoing state — the caller
 * is supplying the history, not appending to it.
 */
export function seedProfile(
  profile: SituationProfile,
  history: ProfileSnapshot[] = [],
): void {
  loaded = true;
  profileSnapshot = profile;
  historySnapshot = history.slice(-HISTORY_CAP);
  persist();
  emit();
}

export function clearProfile(): void {
  profileSnapshot = null;
  historySnapshot = [];
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

"use client";

import { useMemo, useSyncExternalStore } from "react";
import { pickBaseline } from "@/core/insights";
import { parseProfile } from "@/core/profile/parse";
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

/**
 * The profile fields North re-asks about, and therefore the only ones a
 * confirmation may re-stamp. Narrower than `keyof SituationProfile` on
 * purpose: `goals` is a list and `openingConcern` is prose, and neither is a
 * figure that goes stale.
 */
export type FreshnessKey =
  | "liquidCents"
  | "monthlyOutCents"
  | "incomeBand"
  | "retirementBps"
  | "employerMatchBps"
  | "obligations"
  | "dependents"
  | "horizonMonths"
  | "financialConfidence";

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

  /**
   * READING the store and UNDERSTANDING what came back are separate failures,
   * and conflating them made `isPersistent()` lie.
   *
   * One `try` used to wrap both `getItem` — which throws in some privacy
   * modes — and `JSON.parse`, which throws on a corrupt payload. So a single
   * malformed record convinced the app that storage was unavailable, on a
   * browser where it works perfectly. Anything built on that flag would then
   * warn the wrong people, which is worse than not warning at all.
   */
  let raw: string | null;
  try {
    raw = window.localStorage.getItem(STORAGE_KEY);
  } catch {
    storageAvailable = false;
    return;
  }
  if (!raw) return;

  try {
    const parsed = JSON.parse(raw) as Partial<Persisted> & {
      profile?: SituationProfile;
    };

    /**
     * VALIDATED, not cast.
     *
     * The version was checked and the shape was not, so a record carrying the
     * right version and a wrong field went straight into the Waterfall — where
     * a missing `liquidCents` is not a crash but arithmetic on `undefined`,
     * and a coach stating a number with total confidence that means nothing.
     * `parseProfile` refuses the record whole; a `null` here falls through to
     * the same clear-and-start-clean path a corrupt payload already took,
     * which routes to onboarding.
     */
    if (parsed.version === SCHEMA_VERSION && parsed.profile) {
      const valid = parseProfile(parsed.profile);
      if (valid) {
        profileSnapshot = valid;
        // History feeds the letter's diff, never the engine, so one bad
        // snapshot costs a paragraph rather than a read — drop the bad ones
        // and keep the record.
        historySnapshot = (parsed.history ?? []).filter((s) =>
          Boolean(parseProfile(s.profile)),
        );
        return;
      }
    }

    // v2 → v3: the single goal becomes the goals list, in the profile and in
    // every snapshot the letter diffs against.
    if (parsed.version === 2 && parsed.profile) {
      const migrated = parseProfile(toV3(parsed.profile as LegacyProfile));
      if (migrated) {
        profileSnapshot = migrated;
        historySnapshot = (parsed.history ?? [])
          .map((snapshot) => ({
            ...snapshot,
            profile: toV3(snapshot.profile as LegacyProfile),
          }))
          .filter((s) => Boolean(parseProfile(s.profile)));
        persist();
        return;
      }
    }

    // v1 → v3: adopt the profile, start the history. A user's answers are
    // never the price of a schema bump.
    if (parsed.version === 1 && parsed.profile) {
      const migrated = parseProfile(toV3(parsed.profile as LegacyProfile));
      if (migrated) {
        profileSnapshot = migrated;
        historySnapshot = [];
        persist();
        return;
      }
    }

    window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    // Unreadable, not unavailable. Storage works — this record does not — so
    // clear it and start clean rather than telling the user their browser
    // cannot remember them.
    try {
      window.localStorage.removeItem(STORAGE_KEY);
    } catch {
      storageAvailable = false;
    }
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

/**
 * The state the current profile replaced, or null on day one.
 *
 * RARELY WHAT YOU WANT — this is literally the previous write, which after any
 * correction is the profile as it stood seconds ago. For anything that reports
 * on a period ("what's changed", the letter, the story) use
 * `useBaselineProfile`, which picks a state old enough to be worth comparing
 * against. See core/insights/baseline.ts.
 */
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

/**
 * The past state worth measuring against — "last time we looked".
 *
 * Built on `useProfileHistory` and a `useMemo` rather than a third
 * `useSyncExternalStore` selector, deliberately: the choice depends on the
 * clock, and `getSnapshot` must return a cached value that changes only when
 * the STORE changes. A time-dependent snapshot getter is the standard way to
 * trip React's "the result of getSnapshot should be cached" invariant. The
 * history array is already stable; the selection over it is a render concern.
 */
export function useBaselineProfile(now: Date): ProfileSnapshot | null {
  const history = useProfileHistory();
  return useMemo(() => pickBaseline(history, now), [history, now]);
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

/** Read once, outside React — for the transfer bundle. */
export function readProfileAndHistory(): {
  profile: SituationProfile | null;
  history: ProfileSnapshot[];
} {
  load();
  return { profile: profileSnapshot, history: historySnapshot };
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
 * "Still right" — re-stamps a field's `asOf` without touching its value.
 *
 * ── WHY CONFIRMING IS A REAL ANSWER ───────────────────────────────────────
 * When North re-asks a stale figure (see `core/profile/freshness.ts`), the
 * usual answer is that nothing has changed. Forcing that through the
 * correction turn would make the person re-enter a number they already gave,
 * to tell North it was right — which is the form this product refuses, and
 * which would train people to ignore the question.
 *
 * `Field.asOf` has always been documented as "the date the value was learned
 * OR LAST CONFIRMED", so this is the second half of a meaning the type
 * already carried and nothing ever wrote. Confirming genuinely changes what
 * North knows: not the figure, but how current it is.
 *
 * No history snapshot, deliberately. The letter diffs states to say what
 * CHANGED, and a confirmation changes nothing — recording one would put a
 * beat in the story where nothing happened.
 */
export function confirmField(key: FreshnessKey): void {
  load();
  if (!profileSnapshot) return;

  const field = profileSnapshot[key];
  if (!field) return;

  profileSnapshot = {
    ...profileSnapshot,
    [key]: { ...field, asOf: new Date().toISOString() },
  };
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

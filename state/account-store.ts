"use client";

import { useSyncExternalStore } from "react";
import type { Account, AccountSecret } from "@/core/account";

/**
 * The persisted account. Same shape as every other store here: module-scope
 * snapshot, `useSyncExternalStore`, `localStorage` behind a try.
 *
 * ── WHERE THE HASHING LIVES ───────────────────────────────────────────────
 * Here, not in `core/`. Digesting a password needs Web Crypto and needs to
 * be async, and `core/` is synchronous pure functions with no platform
 * reach — so the edge does the work and hands core a finished value. That is
 * the same division `now` already follows: the engine never reads a clock,
 * and it never reaches for a crypto API either.
 *
 * What is stored is a salted SHA-256 digest. It is NOT protection — anyone
 * holding this device holds the data the password would guard, so there is
 * nothing here for a password to defend. It exists so the signup flow is
 * real end to end and so the record has the shape a backend will expect on
 * the day one exists. `docs/ACCOUNT.md` says all of this out loud, and so
 * does the screen that collects it.
 */

const STORAGE_KEY = "north.account";
const SCHEMA_VERSION = 1;

let snapshot: Account | null = null;
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
    const parsed = JSON.parse(raw) as { version?: number; account?: Account };
    if (parsed.version === SCHEMA_VERSION && parsed.account?.id) {
      snapshot = parsed.account;
    }
  } catch {
    // Unreadable or unavailable: no account, which routes to signup. The
    // harmless direction — never a half-restored identity.
  }
}

function persist(): void {
  try {
    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ version: SCHEMA_VERSION, account: snapshot }),
    );
  } catch {
    // Session-only. The storage warning the shell already mounts covers it.
  }
}

function subscribe(onChange: () => void): () => void {
  listeners.add(onChange);
  return () => {
    listeners.delete(onChange);
  };
}

export function useAccount(): Account | null {
  return useSyncExternalStore(
    subscribe,
    () => {
      load();
      return snapshot;
    },
    () => null,
  );
}

/** Read once, outside React — for the transfer bundle. */
export function readAccount(): Account | null {
  load();
  return snapshot;
}

/* ── The credential, such as it is ──────────────────────────────────────── */

function toHex(buffer: ArrayBuffer): string {
  return [...new Uint8Array(buffer)]
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

/**
 * A salted digest of the password.
 *
 * Returns `undefined` where Web Crypto is unavailable (an insecure origin,
 * an ancient browser) rather than falling back to something weaker —
 * a hand-rolled hash would look like security while being none, and the
 * honest outcome is an account with no digest recorded.
 */
export async function digestPassword(
  password: string,
): Promise<AccountSecret | undefined> {
  const subtle = globalThis.crypto?.subtle;
  if (!subtle) return undefined;

  const salt = toHex(globalThis.crypto.getRandomValues(new Uint8Array(8)).buffer);
  const bytes = new TextEncoder().encode(`${salt}${password}`);
  const hash = toHex(await subtle.digest("SHA-256", bytes));
  return { hash, salt };
}

/** Whether a password matches the stored digest. For a future sign-in. */
export async function verifyPassword(
  password: string,
  secret: AccountSecret | undefined,
): Promise<boolean> {
  const subtle = globalThis.crypto?.subtle;
  if (!subtle || !secret) return false;
  const bytes = new TextEncoder().encode(`${secret.salt}${password}`);
  return toHex(await subtle.digest("SHA-256", bytes)) === secret.hash;
}

/* ── Writers ────────────────────────────────────────────────────────────── */

export function saveAccount(account: Account): void {
  loaded = true;
  snapshot = account;
  persist();
  emit();
}

/** Patch what the profile screen can change, leaving the rest alone. */
export function updateAccount(patch: Partial<Omit<Account, "id" | "createdAt">>): void {
  load();
  if (!snapshot) return;
  snapshot = { ...snapshot, ...patch };
  persist();
  emit();
}

export function clearAccount(): void {
  loaded = true;
  snapshot = null;
  try {
    window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    // Already gone in memory; nothing else to do.
  }
  emit();
}

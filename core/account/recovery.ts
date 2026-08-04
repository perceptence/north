import type { Account } from "./types.ts";

/**
 * Moving an account between devices, with no server to move it through.
 *
 * ── WHY THE CODE CARRIES THE DATA ─────────────────────────────────────────
 * A normal recovery key is a POINTER: you type it, a server looks it up, and
 * your data comes back. There is no server here, so a pointer would point at
 * nothing — a key that recovers nothing is worse than no key at all, because
 * it implies a safety net that is not there.
 *
 * So the code IS the data: the whole account, profile, history, ledger and
 * membership, encoded into one transferable string. Copy it, mail it to
 * yourself, put it in a password manager, paste it on the new device. That
 * is genuinely how you move, and it is honest about what it costs — the code
 * is long, because your record is not small.
 *
 * When a backend arrives this shape survives: the same bundle becomes the
 * sync payload, and the short human key at the front becomes the row it is
 * stored against. Nothing here is throwaway.
 *
 * ── AND WHY IT IS NOT ENCRYPTED ───────────────────────────────────────────
 * Encrypting it would need a passphrase to decrypt it, and the only
 * passphrase available is one already stored — as a digest — on the device
 * being left behind. Encryption whose key travels with the ciphertext is
 * decoration. Instead the code is plainly labelled as sensitive wherever it
 * is shown, which is the true statement: this is your financial picture, so
 * treat it like your financial picture.
 */

/** Bump when the shape changes; `decodeBundle` refuses what it cannot read. */
export const BUNDLE_VERSION = 1;

/** Every code starts with this, so a wrong paste fails loudly and early. */
const PREFIX = "NORTH-1-";

export interface RecoveryBundle {
  version: number;
  exportedAt: string;
  account: Account;
  /** Opaque here on purpose — `core/account` does not model the situation. */
  profile: unknown;
  history: unknown[];
  decisions: unknown[];
  membership: unknown;
}

/* ── The human-readable key ─────────────────────────────────────────────── */

/**
 * Unambiguous alphabet: no O/0, no I/1/L. Recovery keys get read aloud,
 * written on paper and retyped, and every one of those is where a zero
 * becomes an oh.
 */
const ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
const KEY_GROUPS = 4;
const KEY_GROUP_SIZE = 4;

/**
 * A short key naming this account — the part a person can actually hold.
 *
 * `random` is injected rather than reached for, so the generator is pure and
 * a test can pin every character of it. The edge passes `Math.random`.
 */
export function makeAccountKey(random: () => number): string {
  const groups: string[] = [];
  for (let g = 0; g < KEY_GROUPS; g++) {
    let group = "";
    for (let i = 0; i < KEY_GROUP_SIZE; i++) {
      group += ALPHABET[Math.floor(random() * ALPHABET.length)];
    }
    groups.push(group);
  }
  return groups.join("-");
}

/* ── The transferable code ──────────────────────────────────────────────── */

/**
 * Base64 over UTF-8 bytes, by hand.
 *
 * `btoa` alone mangles anything outside Latin-1 — and this payload carries a
 * user's own words, which is exactly where an em dash or an accented name
 * lives. Encoding to bytes first is what makes "A sabbatical — Zürich"
 * survive the round trip.
 */
const B64 = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";

function bytesToBase64(bytes: Uint8Array): string {
  let out = "";
  for (let i = 0; i < bytes.length; i += 3) {
    const a = bytes[i];
    const b = bytes[i + 1];
    const c = bytes[i + 2];
    out += B64[a >> 2];
    out += B64[((a & 3) << 4) | ((b ?? 0) >> 4)];
    out += b === undefined ? "=" : B64[((b & 15) << 2) | ((c ?? 0) >> 6)];
    out += c === undefined ? "=" : B64[c & 63];
  }
  return out;
}

function base64ToBytes(text: string): Uint8Array | null {
  const clean = text.replace(/=+$/, "");
  const bytes: number[] = [];
  let buffer = 0;
  let bits = 0;
  for (const char of clean) {
    const value = B64.indexOf(char);
    if (value < 0) return null;
    buffer = (buffer << 6) | value;
    bits += 6;
    if (bits >= 8) {
      bits -= 8;
      bytes.push((buffer >> bits) & 0xff);
    }
  }
  return new Uint8Array(bytes);
}

/**
 * A cheap integrity check over the payload.
 *
 * Not a security measure — it cannot be, since anyone holding the code can
 * recompute it. It catches the failure that actually happens: a code
 * truncated by a chat client, a line wrapped by an email, half a paste. The
 * difference between "this code is damaged" and a half-restored profile is
 * the whole reason it exists.
 */
export function checksum(text: string): string {
  let hash = 2166136261;
  for (let i = 0; i < text.length; i++) {
    hash ^= text.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0).toString(36).toUpperCase().padStart(7, "0");
}

export function encodeBundle(bundle: RecoveryBundle): string {
  const json = JSON.stringify(bundle);
  const body = bytesToBase64(new TextEncoder().encode(json));
  return `${PREFIX}${checksum(body)}-${body}`;
}

/**
 * `null` for anything unreadable — a wrong string, a damaged one, a future
 * version. The caller says so plainly rather than importing half a life.
 */
export function decodeBundle(code: string): RecoveryBundle | null {
  // Whitespace is what a paste from an email actually looks like.
  const clean = code.replace(/\s+/g, "");
  if (!clean.startsWith(PREFIX)) return null;

  const rest = clean.slice(PREFIX.length);
  const split = rest.indexOf("-");
  if (split < 0) return null;

  const stamp = rest.slice(0, split);
  const body = rest.slice(split + 1);
  if (checksum(body) !== stamp) return null;

  const bytes = base64ToBytes(body);
  if (!bytes) return null;

  try {
    const parsed = JSON.parse(new TextDecoder().decode(bytes)) as RecoveryBundle;
    if (parsed.version !== BUNDLE_VERSION) return null;
    if (!parsed.account?.id) return null;
    return parsed;
  } catch {
    return null;
  }
}

/**
 * The code, broken into lines a person can check by eye.
 *
 * A 2,000-character run of base64 is impossible to verify was copied whole;
 * fixed-width lines make a truncation visible. Purely presentational —
 * `decodeBundle` strips whitespace before it does anything else.
 */
export function formatCode(code: string, width = 48): string {
  const lines: string[] = [];
  for (let i = 0; i < code.length; i += width) {
    lines.push(code.slice(i, i + width));
  }
  return lines.join("\n");
}

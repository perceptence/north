/**
 * Who the account belongs to.
 *
 * ── WHY THIS IS SEPARATE FROM `SituationProfile` ──────────────────────────
 * The profile is a SITUATION — what you hold, what you owe, what you are
 * working toward — and every field in it carries a confidence because the
 * engine reasons over it. None of that is true of a name or an email: North
 * is not more or less sure of your address, and no rung depends on it. Two
 * records with two different jobs.
 *
 * It also draws the line the product needs when a server arrives. Everything
 * here is what a backend would own (identity, credentials, avatar); the
 * profile stays local reasoning material either way.
 *
 * ── AND WHY THERE IS NO PASSWORD HERE ─────────────────────────────────────
 * `secret` is a SALTED DIGEST, never the password. The field is collected for
 * real — masked, validated, confirmed — because the flow has to be the shape
 * a backend expects, and because an end-to-end demo of signing up is not a
 * demo if the credential step is mimed. But a raw password sitting in
 * `localStorage` would be a genuine liability dressed as thoroughness, so
 * what is written down is a hash it cannot be reversed from.
 *
 * This is a demo-local placeholder for a real credential exchange, and it
 * says so at every layer. It is NOT authentication: nothing here defends
 * anything, because on a device-local product there is nothing to defend
 * against — the data is already in the hands of whoever holds the device.
 * See `docs/ACCOUNT.md`.
 */

export interface AccountSecret {
  /** Hex SHA-256 of `salt + password`. Computed at the edge, never in core. */
  hash: string;
  /** Random per account, so identical passwords do not share a digest. */
  salt: string;
}

export interface Account {
  /**
   * Stable across renames and device moves — the thing a server would key
   * rows on, and the thing a recovery code carries.
   */
  id: string;
  name: string;
  email: string;
  /**
   * The picture, or absent to fall through to the stand-in and then to the
   * drawn initials.
   *
   * Normally a small square data URI — an uploaded photo is centre-cropped
   * and downscaled at the edge before it reaches here, because
   * `localStorage` is a few megabytes for the WHOLE product and a phone
   * camera photo is larger than that on its own.
   *
   * It may also be a plain URL, which is how the seeded demo character
   * carries a real portrait out of `public/` without spending storage on it.
   */
  avatar?: string;
  secret?: AccountSecret;
  createdAt: string;
  /**
   * When the terms were acknowledged — coaching-not-advice, figures-are-
   * readings, everything-stays-on-device.
   *
   * On the ACCOUNT rather than the profile, because that is what it is: a
   * thing this person agreed to, not a fact about their money. It also
   * survives every correction to the situation, which a field on the profile
   * would not.
   *
   * Absent until given, which is what lets the opening flow know whether to
   * show the terms or walk straight past them on a return visit.
   */
  consentAt?: string;
}

/** The two letters drawn when there is no avatar image. */
export function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

/**
 * Is this shaped like an email address?
 *
 * Deliberately permissive — one `@`, something either side, a dot in the
 * domain. Every stricter regex on the internet rejects addresses that are
 * genuinely valid, and the only thing that actually validates an email is
 * sending one. This catches typos, which is all client-side validation has
 * ever honestly done.
 */
export function looksLikeEmail(value: string): boolean {
  const trimmed = value.trim();
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed);
}

/** The floor a password has to clear. Length, because length is what helps. */
export const PASSWORD_MIN = 8;

export function passwordProblem(value: string): string | null {
  if (value.length === 0) return "Choose a password.";
  if (value.length < PASSWORD_MIN) {
    return `A little longer — ${PASSWORD_MIN} characters or more.`;
  }
  return null;
}

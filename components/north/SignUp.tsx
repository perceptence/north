"use client";

import { useRef, useState } from "react";
import { Button, FormField, RHYTHM, Text } from "@/components/nds";
import {
  initials,
  looksLikeEmail,
  passwordProblem,
  type Account,
} from "@/core/account";
import { cn } from "@/lib/cn";
import { digestPassword, saveAccount } from "@/state/account-store";
import { ActionLink, AjarMark } from "./ActionGlyphs";

/**
 * Creating the account — the one screen in North that is honestly a form.
 *
 * ── WHY IT IS A FORM AND NOT A CONVERSATION ───────────────────────────────
 * Everything else here is asked one question at a time, because each answer
 * changes what North asks next and because a situation is genuinely a
 * conversation. Signing up is not. Name, email and password are four fields
 * with no branching between them, and asking them one per viewport would
 * turn twenty seconds of typing into four page turns — ceremony charged to
 * the user for the product's benefit. A form is the honest shape of this,
 * so it wears one.
 *
 * It keeps the conversation's FRAME — the sky, the measure, the voice at the
 * top — so it reads as the same product opening its door, not a bolt-on.
 *
 * ── WHY IT COMES FIRST ────────────────────────────────────────────────────
 * The ten questions attach to somebody. Asking them before there is an
 * account meant the answers existed for a while with nowhere to belong, and
 * on the day a backend arrives that ordering has to invert anyway. It
 * inverts now, while it costs nothing.
 *
 * ── AND WHAT HAPPENS TO THE PASSWORD ──────────────────────────────────────
 * It is digested with a random salt and the digest is what gets stored; the
 * password itself is never written anywhere. The note under the field says
 * so, out loud, because a financial product that quietly implied real
 * account security it does not have would be lying in the one register it
 * cannot afford to. See `docs/ACCOUNT.md`.
 */

/** Downscaled hard: `localStorage` is a few MB for the WHOLE product. */
const AVATAR_PX = 128;

async function toSquareDataUrl(file: File): Promise<string | undefined> {
  const bitmap = await createImageBitmap(file).catch(() => null);
  if (!bitmap) return undefined;

  const side = Math.min(bitmap.width, bitmap.height);
  const canvas = document.createElement("canvas");
  canvas.width = AVATAR_PX;
  canvas.height = AVATAR_PX;
  const ctx = canvas.getContext("2d");
  if (!ctx) return undefined;

  // Centre crop, then scale — a portrait photo should not arrive squashed.
  ctx.drawImage(
    bitmap,
    (bitmap.width - side) / 2,
    (bitmap.height - side) / 2,
    side,
    side,
    0,
    0,
    AVATAR_PX,
    AVATAR_PX,
  );
  bitmap.close();
  return canvas.toDataURL("image/jpeg", 0.82);
}

export function AvatarMark({
  account,
  size = 40,
}: {
  account: Pick<Account, "name" | "avatar">;
  size?: number;
}) {
  const label = initials(account.name);
  return (
    <span
      aria-hidden="true"
      style={{ width: size, height: size }}
      className={cn(
        "inline-flex shrink-0 items-center justify-center overflow-hidden",
        "rounded-full border border-line-hairline bg-surface-sunken",
        "type-label text-text-secondary select-none",
      )}
    >
      {account.avatar ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={account.avatar}
          alt=""
          className="h-full w-full object-cover"
        />
      ) : (
        label
      )}
    </span>
  );
}

export function SignUp() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [avatar, setAvatar] = useState<string | undefined>();
  /** Only after a submit attempt — nobody should be scolded mid-typing. */
  const [tried, setTried] = useState(false);
  const [working, setWorking] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const nameProblem = name.trim() ? null : "What should I call you?";
  const emailProblem = looksLikeEmail(email)
    ? null
    : email.trim()
      ? "That address looks incomplete."
      : "An email, so this account has a name to it.";
  const pwProblem = passwordProblem(password);
  const ready = !nameProblem && !emailProblem && !pwProblem;

  const submit = async () => {
    setTried(true);
    if (!ready || working) return;
    setWorking(true);

    const secret = await digestPassword(password);
    const account: Account = {
      id:
        globalThis.crypto?.randomUUID?.() ??
        `acc_${Date.now().toString(36)}`,
      name: name.trim().replace(/\s+/g, " ").slice(0, 60),
      email: email.trim(),
      avatar,
      secret,
      createdAt: new Date().toISOString(),
    };
    // Saving IS the transition: the opening flow derives its step from the
    // stored record, so there is no second signal to keep in agreement.
    saveAccount(account);
  };

  return (
    <div className={cn("flex w-full flex-col", RHYTHM.heading)}>
      <div className={cn("flex items-center", RHYTHM.heading)}>
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          aria-label="Choose a picture"
          className="cursor-pointer rounded-full transition-opacity duration-[--motion-micro] hover:opacity-80"
        >
          <AvatarMark account={{ name: name || "?", avatar }} size={56} />
        </button>
        <div className="flex flex-col items-start">
          <ActionLink onClick={() => fileRef.current?.click()}>
            {avatar ? "Change picture" : "Add a picture"}
          </ActionLink>
          {avatar && (
            <ActionLink icon={<AjarMark />} onClick={() => setAvatar(undefined)}>
              Use my initials
            </ActionLink>
          )}
        </div>
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={async (event) => {
            const file = event.target.files?.[0];
            // Cleared immediately so picking the same file twice still fires.
            event.target.value = "";
            if (file) setAvatar(await toSquareDataUrl(file));
          }}
        />
      </div>

      <FormField
        label="Your name"
        value={name}
        onChange={setName}
        placeholder="Avery Chen"
        autoComplete="name"
        error={tried ? (nameProblem ?? undefined) : undefined}
      />

      <FormField
        label="Email"
        type="email"
        value={email}
        onChange={setEmail}
        placeholder="you@example.com"
        autoComplete="email"
        error={tried ? (emailProblem ?? undefined) : undefined}
      />

      <div className={cn("flex flex-col", RHYTHM.pair)}>
        <FormField
          label="Password"
          type="password"
          value={password}
          onChange={setPassword}
          autoComplete="new-password"
          error={tried ? (pwProblem ?? undefined) : undefined}
        />
        {/* Said plainly, where it is being collected — not buried in a
            policy nobody opens. NO `measure`: this is a caption under a
            full-width field, so it takes the field's width. Ragging early
            under a wide input reads as a stray column. */}
        <Text variant="meta" tone="tertiary">
          Everything stays on this device — only a scrambled fingerprint of
          your password is stored, never the password itself.
        </Text>
      </div>

      <Button variant="primary" onClick={submit} disabled={working}>
        {working ? "Setting up…" : "Create account"}
      </Button>
    </div>
  );
}

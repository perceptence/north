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
import { DEMO_NAME } from "@/lib/demo-story";
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

/**
 * The stand-in portrait, while there is no real one.
 *
 * ── THIS IS SCAFFOLDING, AND IT IS MARKED AS SUCH ─────────────────────────
 * An account with no uploaded picture used to draw its initials. That is the
 * correct end state — a face this person did not choose is not their face —
 * but it makes every demo account look like a placeholder, which is the one
 * thing a portfolio build cannot afford. So until avatars are real, an
 * account without a picture borrows a stock portrait.
 *
 * Keyed on the account id, NOT random per render: a face that changes when
 * you navigate is worse than initials. Same account, same person, every time.
 *
 * The initials survive underneath as the offline fallback — this is the only
 * outbound request the product makes, and it must be allowed to fail without
 * leaving a hole where someone's face goes.
 */
const STOCK_PORTRAIT = (id: string, px: number) =>
  `https://i.pravatar.cc/${px}?u=${encodeURIComponent(id)}`;

export function AvatarMark({
  account,
  size = 40,
}: {
  /**
   * `id` is optional because ONE caller has no account yet: the signup
   * form's live preview. It gets initials, and that is deliberate — a
   * stranger's face appearing in the picture slot before you have chosen a
   * picture would read as North having decided what you look like.
   */
  account: Pick<Account, "name" | "avatar"> & { id?: string };
  size?: number;
}) {
  const [failures, setFailures] = useState(0);
  const label = initials(account.name);

  /**
   * Their own picture, then the stand-in, then the initials — and each step
   * is reached only by the one before it FAILING.
   *
   * The first version short-circuited on `account.avatar`, so an avatar that
   * would not load left a broken image in the circle with no way down. The
   * demo character's portrait is a file on disk that a fresh clone may not
   * have yet, which makes that path ordinary rather than exotic.
   */
  const chain = [
    account.avatar,
    account.id ? STOCK_PORTRAIT(account.id, size * 2) : undefined,
  ].filter(Boolean) as string[];
  const src = chain[failures];

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
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={src}
          alt=""
          onError={() => setFailures((n) => n + 1)}
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
        placeholder={DEMO_NAME}
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

      {/* Full width, like every other action in the opening flow: these are
          the one thing to do on their screen, and a pill hugging its own
          label reads as one option among several when it is the only one. */}
      <Button variant="primary" fullWidth onClick={submit} disabled={working}>
        {working ? "Setting up…" : "Create account"}
      </Button>
    </div>
  );
}

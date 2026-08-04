"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Button,
  FormField,
  RHYTHM,
  SectionHeading,
  Text,
} from "@/components/nds";
import { formatCode } from "@/core/account";
import { PLUS_PRICE_CENTS } from "@/core/membership";
import { cn } from "@/lib/cn";
import { useHydrated } from "@/lib/use-hydrated";
import { exportBundle, importBundle } from "@/lib/transfer";
import { updateAccount, useAccount } from "@/state/account-store";
import { useMembership } from "@/state/membership-store";
import {
  ActionLink,
  AjarMark,
  DownloadMark,
  ReceiveMark,
  SalutationMark,
} from "./ActionGlyphs";
import { AvatarMark } from "./SignUp";
import { MembershipSheet } from "./MembershipSheet";

/**
 * The account — who this is, what they're on, and how they move.
 *
 * ── IT IS NOT A SETTINGS SCREEN, AND NOT A FIFTH DESTINATION ──────────────
 * CLAUDE.md refuses both, and both refusals survive. This is reached from
 * the masthead avatar rather than the dock, so the four-destination cap is
 * untouched; and it holds no preferences, no toggles, no notification
 * switches. What it holds is an identity, a membership standing, and the
 * one operation that genuinely has nowhere else to live: moving your record
 * to another device.
 *
 * Correcting what North knows about your MONEY still happens where it
 * always did — tap the figure, the coach re-asks (UX-ARCHITECTURE §5.3).
 * Nothing financial is editable here, deliberately: the day this screen
 * grows a field for cash-on-hand is the day the correction loop dies.
 *
 * ── WHY THE TRANSFER IS A CODE AND NOT A LOGIN ────────────────────────────
 * There is no server, so there is nothing to log in TO. The recovery code
 * carries the record itself (see core/account/recovery.ts) — copy it,
 * download it, paste it on the new phone. That is honestly how you move,
 * and pretending otherwise with a sign-in form would imply a safety net
 * that does not exist.
 */

const PRICE = `$${(PLUS_PRICE_CENTS / 100).toFixed(2)}`;

function dayWord(iso: string | undefined): string {
  if (!iso) return "";
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

/**
 * Arriving from another device — the inbound half of the move.
 *
 * ── IT REACHES BOTH DEVICES, BUT NOT IN THE SAME VOICE ────────────────────
 * It first shipped only for someone who ALREADY had an account, which is
 * precisely backwards: the person who needs it is holding a phone with
 * nothing on it. A blank device offered "no account yet — set one up" and
 * no way to bring an existing record across, so the recovery code was a
 * door that could only be opened from the inside. (Found by walking the
 * move for real: export, wipe, arrive.)
 *
 * The over-correction was to render it identically in both states. On a
 * device that is already set up, a standing form headed "Arriving from
 * another device" — open, empty, with a note that everything here will be
 * REPLACED — is an invitation to destroy your own record, offered to
 * someone who did not ask. It reads as a step still to do.
 *
 * So the shape follows the situation. A blank device gets it open, because
 * there it is one of only two ways forward. A device with an account gets a
 * quiet way in at the foot of the outbound section, where the subject
 * already is — one deliberate tap, and only then a field. Same capability,
 * and nobody is handed a loaded control they were not looking for.
 */
function Arrival({ open: openByDefault = false }: { open?: boolean }) {
  const router = useRouter();
  const [open, setOpen] = useState(openByDefault);
  const [incoming, setIncoming] = useState("");
  const [problem, setProblem] = useState<string | null>(null);

  if (!open) {
    return (
      <ActionLink icon={<ReceiveMark />} onClick={() => setOpen(true)}>
        Coming from another device instead
      </ActionLink>
    );
  }

  return (
    <div className={cn("flex w-full flex-col items-start", RHYTHM.heading)}>
      {openByDefault && (
        <SectionHeading>Arriving from another device</SectionHeading>
      )}
      <FormField
        label="Recovery code"
        value={incoming}
        onChange={(value) => {
          setIncoming(value);
          setProblem(null);
        }}
        placeholder="NORTH-1-…"
        autoFocus={!openByDefault}
        error={problem ?? undefined}
        hint={
          openByDefault
            ? "Everything on this device is replaced by what the code carries."
            : "This replaces everything on this device — the account, your situation, every decision — with what the code carries."
        }
      />
      <div className="flex flex-wrap items-center gap-x-5 gap-y-3">
        <Button
          variant="secondary"
          onClick={() => {
            const result = importBundle(incoming);
            if (!result.ok) {
              setProblem(
                "That code didn’t read cleanly — it may have been cut short in transit. Copy the whole thing and try again.",
              );
              return;
            }
            router.push("/today");
          }}
        >
          Bring it over
        </Button>
        {/* A way back out, for the device that already holds a record and
            opened this by choice. The blank device has nothing to cancel. */}
        {!openByDefault && (
          <ActionLink
            onClick={() => {
              setIncoming("");
              setProblem(null);
              setOpen(false);
            }}
          >
            Never mind
          </ActionLink>
        )}
      </div>
    </div>
  );
}

export function AccountScreen() {
  const router = useRouter();
  const hydrated = useHydrated();
  const account = useAccount();
  const membership = useMembership();

  const [name, setName] = useState<string | null>(null);
  const [managing, setManaging] = useState(false);
  /** The code, once asked for — never shown unbidden. */
  const [code, setCode] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  if (!hydrated) return null;
  if (!account) {
    return (
      <div className={cn("flex flex-col items-start pb-16", RHYTHM.screen)}>
        <div className={cn("flex flex-col items-start", RHYTHM.heading)}>
          <Text variant="voice-md" measure>
            There’s no account on this device yet.
          </Text>
          <Button variant="primary" onClick={() => router.push("/start")}>
            Set one up
          </Button>
        </div>
        {/* The other way in — and the one someone switching phones needs.
            Open on sight here: on a blank device this is one of only two
            ways forward, and there is nothing on it to overwrite. */}
        <Arrival open />
      </div>
    );
  }

  const editing = name !== null;

  return (
    <div className={cn("flex flex-col pb-16", RHYTHM.screen)}>
      {/* ── WHO THIS IS ──────────────────────────────────────────────────
          One block, because it is one subject.

          It used to be two. The identity sat up here, and underneath it a
          section headed "What I call you" that showed NO NAME — just a
          button — because the name was already above and the heading was
          quietly borrowing it. A heading that asks a question and then
          answers it somewhere else is not a section; and "Member since Jun
          28" was pinned to the foot of that same block, where it read as an
          answer to "what I call you" rather than a fact about the account.

          Now: the name IS the answer, the action to change it sits directly
          under the thing it changes, and the date joins the identity it
          belongs to. */}
      <div className={cn("flex flex-col", RHYTHM.heading)}>
        <h1 className="type-overline text-text-tertiary">Your account</h1>
        <div className={cn("flex items-center", RHYTHM.block)}>
          <AvatarMark account={account} size={56} />
          <div className="flex min-w-0 flex-col">
            <span className="type-voice-md text-text-primary">
              {account.name}
            </span>
            <span className="type-meta truncate text-text-tertiary">
              {account.email}
            </span>
          </div>
        </div>

        <Text variant="meta" tone="tertiary" measure>
          With North since {dayWord(account.createdAt)}.
        </Text>

        {/* The one editable thing, and it is editable because it is the one
            North says out loud — the letter's salutation. */}
        {editing ? (
          <div className={cn("flex w-full flex-col items-start", RHYTHM.heading)}>
            <FormField
              label="Your name"
              value={name}
              onChange={setName}
              autoFocus
              hint="It’s what North calls you when it writes."
              onSubmit={() => {
                if (name.trim()) updateAccount({ name: name.trim() });
                setName(null);
              }}
            />
            {/* `items-center`, and it now WORKS: ActionLink used to carry
                `self-start`, which overrode this and pinned "Never mind" to
                the top of the taller Save pill. `gap-x-5` because a bare
                text action beside a bordered pill needs more air than the
                4 they had, or the two read as one control. */}
            <div className="flex flex-wrap items-center gap-x-5 gap-y-3">
              <Button
                variant="secondary"
                onClick={() => {
                  if (name.trim()) updateAccount({ name: name.trim() });
                  setName(null);
                }}
              >
                Save
              </Button>
              <ActionLink onClick={() => setName(null)}>Never mind</ActionLink>
            </div>
          </div>
        ) : (
          <ActionLink
            icon={<SalutationMark />}
            onClick={() => setName(account.name)}
          >
            Call me something else
          </ActionLink>
        )}
      </div>

      {/* Membership standing — the same room, reached from the same place a
          member manages it in the masthead. */}
      <div className={cn("flex flex-col items-start", RHYTHM.heading)}>
        <SectionHeading>Membership</SectionHeading>
        <Text variant="body" tone="secondary" measure>
          {membership.tier === "plus"
            ? membership.endsAtPeriodEnd
              ? `North Plus, ending ${dayWord(membership.renewsAt)}. Everything stays until then.`
              : `North Plus, ${PRICE} a month. Renews ${dayWord(membership.renewsAt)}.`
            : "North Free — the whole coach, one thing at a time."}
        </Text>
        <Button variant="secondary" onClick={() => setManaging(true)}>
          {membership.tier === "plus" ? "Manage membership" : "Compare tiers"}
        </Button>
      </div>

      {/* ── MOVING DEVICES ──────────────────────────────────────────────── */}
      <div className={cn("flex flex-col items-start", RHYTHM.heading)}>
        <SectionHeading>Move to another device</SectionHeading>
        <Text variant="body" tone="secondary" measure>
          Everything North knows lives on this device. Your recovery code
          carries all of it — the account, your situation, every decision.
          Paste it into North on the new phone and you land exactly where you
          left off.
        </Text>

        {code ? (
          <div className={cn("flex w-full flex-col items-start", RHYTHM.pair)}>
            {/* Wrapped, in the figure face, so a truncated copy is visible
                to the eye rather than discovered on the other device. */}
            <pre className="type-figure max-h-40 w-full overflow-auto rounded-chip border border-line-hairline bg-surface-sunken p-3 text-text-secondary">
              {formatCode(code)}
            </pre>
            <div className="flex flex-wrap items-center gap-4">
              <Button
                variant="secondary"
                onClick={async () => {
                  try {
                    await navigator.clipboard.writeText(code);
                    setCopied(true);
                  } catch {
                    // Clipboard refused (insecure origin, permission). The
                    // code is on screen and selectable — say nothing rather
                    // than raise an error about a thing that still worked.
                  }
                }}
              >
                {copied ? "Copied" : "Copy code"}
              </Button>
              <ActionLink
                icon={<DownloadMark />}
                onClick={() => {
                  const blob = new Blob([code], { type: "text/plain" });
                  const url = URL.createObjectURL(blob);
                  const link = document.createElement("a");
                  link.href = url;
                  link.download = "north-recovery-code.txt";
                  link.click();
                  URL.revokeObjectURL(url);
                }}
              >
                Download it
              </ActionLink>
              <ActionLink icon={<AjarMark />} onClick={() => setCode(null)}>
                Hide it
              </ActionLink>
            </div>
            <Text variant="meta" tone="tertiary" measure>
              Treat this like your financial records, because that is what it
              is — anyone holding this code holds your picture.
            </Text>
          </div>
        ) : (
          <Button variant="secondary" onClick={() => setCode(exportBundle())}>
            Show my recovery code
          </Button>
        )}

        {/* The other direction, in the section that is already about moving —
            closed, so a device holding a record is never shown an open field
            offering to overwrite it. */}
        <Arrival />
      </div>

      <MembershipSheet open={managing} onClose={() => setManaging(false)} />
    </div>
  );
}

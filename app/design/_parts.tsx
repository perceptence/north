"use client";

import { useCallback, useRef, useSyncExternalStore, type ReactNode } from "react";
import { cn } from "@/lib/cn";
import { contrastRatio, gateFor, resolveTokenColor, type Gate } from "@/lib/contrast";

/* ── Layout ─────────────────────────────────────────────────────────────── */

export function Section({
  id,
  title,
  note,
  children,
}: {
  id: string;
  title: string;
  note?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section id={id} className="scroll-mt-8 border-t border-line-hairline pt-10">
      <h2 className="type-voice-md text-text-primary">{title}</h2>
      {note && <p className="type-body mt-2 max-w-[60ch] text-text-secondary">{note}</p>}
      <div className="mt-6 flex flex-col gap-10">{children}</div>
    </section>
  );
}

export function Specimen({
  name,
  note,
  children,
}: {
  name: string;
  note?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-col gap-1">
        <h3 className="type-figure text-text-primary">{name}</h3>
        {note && <p className="type-meta max-w-[64ch] text-text-tertiary">{note}</p>}
      </div>
      <div className="rounded-card border border-line-hairline bg-surface-raised p-5">
        {children}
      </div>
    </div>
  );
}

export function Grid({ children }: { children: ReactNode }) {
  return <div className="flex flex-wrap items-start gap-4">{children}</div>;
}

/* ── Live contrast measurement ──────────────────────────────────────────── */

const GATE_STYLE: Record<Gate, string> = {
  "AA body": "text-text-primary",
  "AA large": "text-text-secondary",
  "AA non-text": "text-text-secondary",
  decorative: "text-text-tertiary",
  fail: "text-signal-attention",
};

interface Measured {
  token: string;
  ratio: number | null;
  gate: Gate | null;
}

const SERVER_SNAPSHOT: Measured[] = [];
const subscribe = () => () => {};

/**
 * Reads the resolved CSS cascade — an external system, not React state — so
 * `useSyncExternalStore` is the right primitive rather than an effect that
 * calls setState. The snapshot is cached by token set so it stays
 * referentially stable across renders.
 */
function useMeasuredTokens(
  tokens: Array<{ token: string; use: string }>,
  against: string,
): Measured[] {
  const cache = useRef<{ key: string; rows: Measured[] } | null>(null);
  const key = `${against}|${tokens.map((t) => t.token).join(",")}`;

  const getSnapshot = useCallback((): Measured[] => {
    if (cache.current?.key !== key) {
      const surface = resolveTokenColor(against);
      cache.current = {
        key,
        rows: tokens.map(({ token }) => {
          const color = resolveTokenColor(token);
          const ratio = surface && color ? contrastRatio(color, surface) : null;
          return { token, ratio, gate: ratio === null ? null : gateFor(ratio) };
        }),
      };
    }
    return cache.current.rows;
  }, [key, against, tokens]);

  return useSyncExternalStore(subscribe, getSnapshot, () => SERVER_SNAPSHOT);
}

/**
 * Measures the LIVE token values in the browser rather than restating numbers
 * from the spec. If a token changes, this table changes with it — and a
 * regression shows up as a failing gate rather than a stale document.
 */
export interface ContrastTokenSpec {
  token: string;
  use: string;
  /**
   * This token is intentionally below the gate — it is barred from carrying
   * meaning rather than failing to. Without this distinction the table cries
   * wolf on a deliberate decision, which trains people to ignore it.
   */
  byDesign?: boolean;
}

export function ContrastTable({
  tokens,
  against,
  againstLabel,
  /** The gate each token is *required* to clear, for the verdict column. */
  requirement,
}: {
  tokens: ContrastTokenSpec[];
  against: string;
  againstLabel: string;
  requirement: number;
}) {
  const rows = useMeasuredTokens(tokens, against);

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[34rem] border-collapse text-left">
        <caption className="type-meta pb-3 text-left text-text-tertiary">
          Measured in-browser against{" "}
          <code className="type-figure">{againstLabel}</code> · requirement{" "}
          {requirement.toFixed(1)}:1
        </caption>
        <thead>
          <tr className="type-meta text-text-tertiary">
            <th className="pb-2 font-normal">Token</th>
            <th className="pb-2 font-normal">Use</th>
            <th className="pb-2 text-right font-normal">Ratio</th>
            <th className="pb-2 text-right font-normal">Verdict</th>
          </tr>
        </thead>
        <tbody>
          {tokens.map(({ token, use, byDesign }, index) => {
            const row = rows?.[index];
            const passes = row?.ratio != null && row.ratio >= requirement;
            const verdict =
              row?.ratio == null
                ? "—"
                : byDesign
                  ? "below gate, by design"
                  : passes
                    ? row.gate
                    : "BELOW GATE";
            return (
              <tr key={token} className="border-t border-line-hairline">
                <td className="py-2.5">
                  <span className="flex items-center gap-2">
                    <span
                      aria-hidden="true"
                      className="size-4 shrink-0 rounded-chip border border-line-hairline"
                      style={{ background: `var(${token})` }}
                    />
                    <code className="type-figure text-text-primary">{token}</code>
                  </span>
                </td>
                <td className="type-meta py-2.5 text-text-secondary">{use}</td>
                <td className="type-figure tabular py-2.5 text-right text-text-primary">
                  {row?.ratio ? row.ratio.toFixed(2) : "—"}
                </td>
                <td
                  className={cn(
                    "type-meta py-2.5 text-right",
                    byDesign
                      ? "text-text-tertiary"
                      : row?.gate
                        ? GATE_STYLE[row.gate]
                        : "text-text-tertiary",
                    !byDesign && row?.ratio != null && !passes && "text-signal-attention",
                  )}
                >
                  {verdict}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

/* ── Token specimens ────────────────────────────────────────────────────── */

export function SwatchRow({
  tokens,
}: {
  tokens: Array<{ token: string; label: string }>;
}) {
  return (
    <Grid>
      {tokens.map(({ token, label }) => (
        <div key={token} className="flex w-36 flex-col gap-2">
          <div
            className="h-14 rounded-chip border border-line-hairline"
            style={{ background: `var(${token})` }}
          />
          <code className="type-meta text-text-secondary">{label}</code>
        </div>
      ))}
    </Grid>
  );
}

export function ScaleRow({
  items,
}: {
  items: Array<{ label: string; px: number; kind: "space" | "radius" }>;
}) {
  return (
    <Grid>
      {items.map(({ label, px, kind }) => (
        <div key={label} className="flex w-28 flex-col gap-2">
          <div className="flex h-16 items-end">
            <div
              className="w-full bg-surface-sunken border border-line-hairline"
              style={
                kind === "space"
                  ? { height: px }
                  : { height: 56, borderRadius: px }
              }
            />
          </div>
          <code className="type-meta text-text-secondary">
            {label} · {px}px
          </code>
        </div>
      ))}
    </Grid>
  );
}

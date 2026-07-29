/**
 * WCAG 2.1 relative-luminance contrast.
 *
 * Used by /design to MEASURE the live tokens rather than restate numbers from a
 * document. If someone changes a token value, the gallery reports the new ratio
 * and fails visibly — a design system that verifies its own accessibility
 * claims is worth considerably more than one that documents them.
 */

export type Gate = "AA body" | "AA large" | "AA non-text" | "decorative" | "fail";

const channel = (value: number): number =>
  value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;

/** Accepts "#rgb", "#rrggbb", or "rgb(r, g, b)" — what getComputedStyle returns. */
export function parseColor(input: string): [number, number, number] | null {
  const value = input.trim();

  const rgb = value.match(/rgba?\(\s*([\d.]+)[\s,]+([\d.]+)[\s,]+([\d.]+)/i);
  if (rgb) {
    return [Number(rgb[1]) / 255, Number(rgb[2]) / 255, Number(rgb[3]) / 255];
  }

  const hex = value.match(/^#([0-9a-f]{3}|[0-9a-f]{6})$/i);
  if (hex) {
    const raw = hex[1];
    const full =
      raw.length === 3
        ? raw
            .split("")
            .map((c) => c + c)
            .join("")
        : raw;
    return [0, 2, 4].map((i) => parseInt(full.slice(i, i + 2), 16) / 255) as [
      number,
      number,
      number,
    ];
  }

  return null;
}

export function luminance(color: string): number | null {
  const parsed = parseColor(color);
  if (!parsed) return null;
  const [r, g, b] = parsed.map(channel);
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

export function contrastRatio(a: string, b: string): number | null {
  const la = luminance(a);
  const lb = luminance(b);
  if (la === null || lb === null) return null;
  const [hi, lo] = la > lb ? [la, lb] : [lb, la];
  return (hi + 0.05) / (lo + 0.05);
}

/** The strongest gate a ratio clears. */
export function gateFor(ratio: number): Gate {
  if (ratio >= 4.5) return "AA body";
  if (ratio >= 3) return "AA large";
  if (ratio >= 1.5) return "decorative";
  return "fail";
}

/**
 * Resolves a CSS custom property to a concrete color.
 *
 * `getPropertyValue` returns the *specified* value, so a Tier 2 token defined
 * as `var(--ink-800)` comes back as the literal string "var(--ink-800)". A
 * probe element forces the cascade to resolve it.
 */
export function resolveTokenColor(token: string): string | null {
  if (typeof document === "undefined") return null;

  const probe = document.createElement("span");
  probe.style.cssText = `position:absolute;visibility:hidden;color:var(${token})`;
  document.body.appendChild(probe);
  const resolved = getComputedStyle(probe).color;
  probe.remove();

  return resolved || null;
}

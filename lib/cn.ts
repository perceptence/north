/**
 * Minimal class joiner.
 *
 * Deliberately not `tailwind-merge`. NDS components own their appearance —
 * `className` is for *layout* concerns at the call site (margin, width,
 * alignment), never for restyling. If you find yourself needing to override a
 * component's colors or type, the component needs a variant, not an override
 * (docs/DESIGN-SYSTEM.md §10).
 */
export function cn(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(" ");
}

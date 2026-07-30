import { Suspense } from "react";
import type { Metadata } from "next";
import { DecisionsScreen } from "@/components/north/DecisionsScreen";

export const metadata: Metadata = { title: "Decisions · North" };

/**
 * The ledger. Open commitments are resolvable here; per-entry detail is
 * deferred and needs a profile history the product does not keep yet
 * (docs/BACKLOG.md, "Decision detail").
 *
 * The Suspense boundary is required, not decorative: `DecisionsScreen` reads
 * `useSearchParams` (to name its own way out), and Next fails the build of a
 * statically rendered page if that hook is not inside one. `fallback={null}`
 * on purpose — the screen already renders nothing until it has hydrated, so
 * a spinner here would be the product's one refused pattern
 * (docs/UX-ARCHITECTURE.md §11) standing in for a boundary that resolves in
 * the same tick.
 */
export default function DecisionsPage() {
  return (
    <main>
      <Suspense fallback={null}>
        <DecisionsScreen />
      </Suspense>
    </main>
  );
}

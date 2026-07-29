import type { Metadata } from "next";
import { DecisionsScreen } from "@/components/north/DecisionsScreen";

export const metadata: Metadata = { title: "Decisions · North" };

/**
 * The ledger. Minimal for now — decision detail and resolving open commitments
 * from here come with the fuller surface.
 */
export default function DecisionsPage() {
  return (
    <main>
      <DecisionsScreen />
    </main>
  );
}

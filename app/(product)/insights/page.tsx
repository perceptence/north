import type { Metadata } from "next";
import { InsightsScreen } from "@/components/north/InsightsScreen";

export const metadata: Metadata = { title: "Insights · North" };

/**
 * Insights — the coach reflecting. Everything is computed from the profile, the
 * ladder and the decision ledger; North has no transaction history and says so.
 */
export default function InsightsPage() {
  return (
    <main>
      <InsightsScreen />
    </main>
  );
}

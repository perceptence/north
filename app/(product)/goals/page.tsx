import type { Metadata } from "next";
import { GoalsScreen } from "@/components/north/GoalsScreen";

export const metadata: Metadata = { title: "Goals · North" };

/** Goals — "Where am I going?" One horizon under the sky; never a tracker. */
export default function GoalsPage() {
  return (
    <main>
      <GoalsScreen />
    </main>
  );
}

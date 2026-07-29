import type { Metadata } from "next";
import { TodayScreen } from "@/components/north/TodayScreen";

export const metadata: Metadata = { title: "North" };

/**
 * Today — the home surface. Column and navigation come from the product layout.
 */
export default function TodayPage() {
  return (
    <main>
      <TodayScreen />
    </main>
  );
}

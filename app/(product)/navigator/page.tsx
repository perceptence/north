import type { Metadata } from "next";
import { NavigatorScreen } from "@/components/north/NavigatorScreen";

export const metadata: Metadata = { title: "Navigator · North" };

/** The Navigator — "what if?", answered by transformation rather than generation. */
export default function NavigatorPage() {
  return (
    <main>
      <NavigatorScreen />
    </main>
  );
}

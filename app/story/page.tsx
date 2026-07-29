import type { Metadata } from "next";
import { StoryScreen } from "@/components/north/StoryScreen";

export const metadata: Metadata = { title: "Your story · North" };

/**
 * `/story` — the pitch surface.
 *
 * Deliberately outside the product IA and off the dock: this is Insights
 * given time, built to be shown to someone. If it earns a place in the
 * product later it becomes an entry point from the letter, and the screen
 * needs no change to get there.
 */
export default function StoryPage() {
  return <StoryScreen />;
}

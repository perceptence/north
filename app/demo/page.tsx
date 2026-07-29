"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { CoachPresence } from "@/components/nds";
import { seedDemoStory } from "@/lib/demo-story";

/**
 * `/demo` — the direct route to the seeded story.
 *
 * Arrival seeds inline so its wordmark can travel unbroken; this page exists
 * for anyone who types the URL, links to it, or wants to re-seed. Visiting
 * again re-seeds — it is its own reset.
 */
export default function DemoPage() {
  const router = useRouter();

  useEffect(() => {
    seedDemoStory();
    router.replace("/today");
  }, [router]);

  return (
    <div className="flex min-h-dvh items-center justify-center">
      <CoachPresence announce />
    </div>
  );
}

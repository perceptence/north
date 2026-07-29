import type { Metadata } from "next";
import { PreviewShell } from "@/components/north/PreviewShell";
import { Sky } from "@/components/north/Sky";

export const metadata: Metadata = { title: "Preview · North" };

/**
 * /preview — the app in real hardware, seeded with the demo story.
 *
 * The shareable pitch URL: open it on a laptop and the product is standing
 * there, mid-story. The iframe loads /demo, which cooks the flagship state
 * and lands on Home.
 *
 * RESIZE IS THE DEMO. The window picks the body — phone, tablet, or a wide
 * window with no frame at all — so one link shows every form factor without
 * a control to explain. The shell owns that decision and its own layout;
 * this page is the stage it stands on: the same atmosphere every product
 * header wears, deep sky settling into paper, hour-aware like the app inside.
 */
export default function PreviewPage() {
  return (
    <div className="relative min-h-dvh">
      <Sky className="h-full" />
      <PreviewShell />
    </div>
  );
}

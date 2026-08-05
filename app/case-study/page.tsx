import type { Metadata } from "next";
import { CaseStudy } from "./CaseStudy";

export const metadata: Metadata = {
  title: "North — a design case study",
  description:
    "How North was designed and built — the thesis, the judgment engine, the visual system, and the product standing live inside its own case study.",
};

/**
 * The case study is a page OF the product, not a screen IN it: same tokens,
 * same faces, same components, with the live app standing in device frames.
 * Like /design and /preview it is outside the product's IA — nothing in the
 * app routes here, and the dock never shows it.
 */
export default function CaseStudyPage() {
  return <CaseStudy />;
}

import type { Metadata } from "next";
import { OpeningFlow } from "@/components/north/OpeningFlow";

export const metadata: Metadata = {
  title: "North",
};

/**
 * The way in.
 *
 * A flow, not a surface — entered once, with no navigation out
 * (docs/UX-ARCHITECTURE.md §1). The page is composition only; `OpeningFlow`
 * decides which step you are on from what is stored, and hands the whole
 * viewport to the conversation once the account and the terms are behind
 * you. The script still lives in `core/`.
 */
export default function StartPage() {
  return <OpeningFlow />;
}

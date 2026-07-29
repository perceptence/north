import type { Metadata } from "next";
import { OnboardingConversation } from "@/components/north/OnboardingConversation";

export const metadata: Metadata = {
  title: "North",
};

/**
 * Onboarding.
 *
 * A flow, not a surface — entered once, with no navigation out
 * (docs/UX-ARCHITECTURE.md §1). The page is composition only; the conversation
 * owns the whole viewport now (one question per section, the sky pinned
 * overhead), so it also owns its own layout. The script still lives in `core/`.
 */
export default function StartPage() {
  return <OnboardingConversation />;
}

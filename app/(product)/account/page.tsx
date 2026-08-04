import type { Metadata } from "next";
import { AccountScreen } from "@/components/north/AccountScreen";

export const metadata: Metadata = {
  title: "Your account · North",
};

/**
 * The account — inside the product shell, but NOT one of the four dock
 * destinations (CLAUDE.md's hard cap). It is reached from the masthead's
 * avatar, the way an account always is, and it holds identity, membership
 * and the device transfer. Nothing financial is editable here; correcting
 * what North knows is still the coach re-asking (UX-ARCHITECTURE §5.3).
 */
export default function AccountPage() {
  return <AccountScreen />;
}

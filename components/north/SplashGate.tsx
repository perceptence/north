"use client";

import { usePathname } from "next/navigation";
import { Splash } from "./Splash";

/**
 * Where the launch beat plays — and where it never does.
 *
 * The splash lived in the product shell, which quietly excluded the two
 * launches that matter most: Arrival and onboarding, the first-time user's
 * actual first load. "Every fresh launch" means the ROOT, so it mounts here
 * and the routes opt OUT instead of in.
 *
 * The exceptions are the project's stagecraft, not the product: `/design`
 * is the system's proof sheet, `/preview` is the stage the app stands on —
 * a splash over the stage would then be followed by the framed app playing
 * its own, which is one launch too many. `/demo` keeps it: it seeds and
 * redirects, and the beat usefully covers that swap.
 */
const NO_SPLASH = ["/design", "/preview"];

export function SplashGate() {
  const pathname = usePathname();
  if (NO_SPLASH.some((route) => pathname.startsWith(route))) return null;
  return <Splash />;
}

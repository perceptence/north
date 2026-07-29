import { ArrivalScreen } from "@/components/north/ArrivalScreen";

/**
 * `/` — Arrival (docs/UX-ARCHITECTURE.md §4.1).
 *
 * Composition only; the screen owns its choreography. A visitor with a saved
 * profile gets the same page with the single action reading "Continue" — the
 * door recognizes its own.
 */
export default function Root() {
  return <ArrivalScreen />;
}

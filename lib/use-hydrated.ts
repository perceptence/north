"use client";

import { useSyncExternalStore } from "react";

/** Never changes — the value is a constant per environment. */
const subscribe = () => () => {};
const onClient = () => true;
const onServer = () => false;

/**
 * True once React has hydrated on the client.
 *
 * The stores read `localStorage`, which the server cannot see, so a surface
 * that depends on stored state would otherwise flash its empty state during
 * hydration before the real value arrives.
 *
 * Implemented with `useSyncExternalStore` rather than `useState` + an effect.
 * "Am I on the client?" is a question about an external system, and setting
 * state synchronously inside an effect to answer it causes a cascading render —
 * React's own guidance, and the lint rule that enforces it, are correct here.
 */
export function useHydrated(): boolean {
  return useSyncExternalStore(subscribe, onClient, onServer);
}

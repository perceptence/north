/**
 * North Design System — public surface.
 *
 * Spec: docs/DESIGN-SYSTEM.md
 * Gallery: /design — a component not in the gallery is not in the system.
 */

// Motion foundation
export { MotionProvider } from "./MotionProvider";
export type { MotionProviderProps } from "./MotionProvider";
export { DURATION, EASE, SPRING, TRANSITION, VIEWPORT } from "./motion";
/**
 * Re-exported so product code has one import site for motion, and so `m` is
 * the obvious choice over `motion` (which `LazyMotion strict` rejects anyway).
 */
export { m, AnimatePresence, useReducedMotion, useInView, useScroll } from "motion/react";
/**
 * `useMotionValue` + `useTransform`: the escape hatch for values that change
 * every frame (live mic amplitude). Writing into a MotionValue with `.set()`
 * repaints the styled element directly and never touches React state or
 * triggers a re-render — the only correct way to drive a 60fps signal in this
 * system. Reach for these ONLY for that; a value that changes on user action
 * still belongs in `useState`.
 */
export { useMotionValue, useTransform } from "motion/react";
export type { MotionValue } from "motion/react";

// Foundation
export { CompassMark, Wordmark } from "./Wordmark";
export type { CompassMarkProps, WordmarkProps } from "./Wordmark";
export { Text } from "./Text";
export type { TextProps, TextTone, TextVariant } from "./Text";
export { Figure } from "./Figure";
export type { FigureContext, FigureFormat, FigureProps } from "./Figure";

// Action
export { Button } from "./Button";
export type { ButtonProps, ButtonSize, ButtonVariant } from "./Button";
export { ChoiceChip, ChoiceChipGroup } from "./ChoiceChip";
export type { ChoiceChipGroupProps, ChoiceChipProps } from "./ChoiceChip";
export { TextField } from "./TextField";
export type { TextFieldProps } from "./TextField";
export { Slider } from "./Slider";
export type { SliderProps } from "./Slider";

// Containers
export { Card } from "./Card";
export type { CardProps, CardVariant } from "./Card";
export { Row } from "./Row";
export type { RowOutcome, RowProps } from "./Row";
export { Sheet } from "./Sheet";
export type { SheetProps } from "./Sheet";

// Data
export { HorizonBand } from "./HorizonBand";
export type { HorizonBandProps } from "./HorizonBand";
export { HorizonField } from "./HorizonField";
export type { HorizonFieldProps } from "./HorizonField";
export { RungIndicator, WATERFALL_LENGTH } from "./RungIndicator";
export type { RungIndicatorProps } from "./RungIndicator";

// Navigation
export { AppBar } from "./AppBar";
export type { AppBarProps } from "./AppBar";
export { ContinuityStrip } from "./ContinuityStrip";
export type { ContinuityStripProps } from "./ContinuityStrip";
export { TabBar } from "./TabBar";
export type { TabBarProps, TabItem } from "./TabBar";

// Conversation
export { ConversationTurn } from "./ConversationTurn";
export type { ConversationTurnProps } from "./ConversationTurn";
export { CoachPresence } from "./CoachPresence";
export type { CoachPresenceProps } from "./CoachPresence";

// State
export { EmptyState } from "./EmptyState";
export type { EmptyStateProps } from "./EmptyState";
export { ErrorState } from "./ErrorState";
export type { ErrorStateProps } from "./ErrorState";

export * from "./SectionHeading";
export * from "./rhythm";

export * from "./OutcomeMark";

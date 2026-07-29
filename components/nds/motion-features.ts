/**
 * The Motion feature bundle, isolated so it code-splits cleanly.
 *
 * `LazyMotion` accepts either a static import (which bundles the features into
 * the main chunk and saves nothing on first load) or an async loader (which
 * defers them into their own chunk). We use the async form — this file exists
 * purely to give the bundler a clean split point, which is Motion's documented
 * pattern.
 *
 * WHY `domMax` RATHER THAN `domAnimation`:
 *   domAnimation (~15kb) covers animations, variants, exit animations, and
 *   hover/tap/focus gestures. It does NOT include `drag` or `layout`.
 *
 *   North needs both:
 *     · layout — smooth layout transitions, and the origin-aware Sheet
 *     · drag   — Sheet's drag-to-dismiss (currently hand-rolled pointer handlers)
 *
 * If layout animation and drag are ever dropped, downgrade to `domAnimation`
 * and reclaim roughly 3kb gzipped.
 */
export { domMax as default } from "motion/react";

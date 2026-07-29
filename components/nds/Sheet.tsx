"use client";

import {
  useCallback,
  useEffect,
  useId,
  useRef,
  type PointerEvent as ReactPointerEvent,
  type ReactNode,
} from "react";
import { AnimatePresence, m, useDragControls } from "motion/react";
import { cn } from "@/lib/cn";
import { useMediaQuery } from "@/lib/use-media-query";
import { DURATION, EASE, TRANSITION } from "./motion";

/**
 * All four overlays: Derivation, Assumptions, Decision detail, Correction.
 *
 * Built on native `<dialog>`, which supplies the focus trap, Esc handling,
 * top-layer stacking, and focus restoration to the trigger — behaviors that are
 * subtly wrong in most hand-rolled implementations.
 *
 * Mobile is a bottom sheet with drag-to-dismiss; tablet and desktop are a
 * centered modal (docs/DESIGN-SYSTEM.md §8.3). A Sheet always has a live
 * parent — it is never a root route.
 *
 * Opening pushes a history entry so the system back gesture dismisses it.
 *
 * ── Why the dialog outlives `open` ────────────────────────────────────────
 * `dialog.close()` removes the element from the top layer immediately, which
 * would yank the panel out mid-animation. So `open` drives AnimatePresence and
 * `close()` is deferred to `onExitComplete`.
 *
 * The <dialog> itself is ALWAYS mounted — a closed dialog is `display:none`, so
 * it costs nothing, and keeping it in the tree avoids the "stay mounted through
 * exit" state that would otherwise be derived state living in an effect.
 *
 * ── Why drag is Motion's, not hand-rolled ─────────────────────────────────
 * The previous implementation set an inline `transform` from pointer events.
 * That fights Motion for ownership of the same property — a dismiss-by-drag
 * would snap back to origin before animating out. `drag` + `dragControls` also
 * removes ~25 lines of pointer bookkeeping.
 *
 * `dragListener={false}` means only the handle can start a drag, so content
 * inside the sheet still scrolls. The handle is `md:hidden` (display:none), so
 * drag is unreachable on pointer devices without any extra breakpoint logic.
 *
 * NOT YET IMPLEMENTED: animating from the element that spawned the sheet
 * (docs/VISUAL-DIRECTION.md §8.1) — that needs the trigger's rect threaded in.
 */

/** Past this displacement, release dismisses. */
const DRAG_DISMISS_OFFSET = 80;
/** Or past this downward flick speed, regardless of distance. */
const DRAG_DISMISS_VELOCITY = 500;

/**
 * How long to wait for the exit animation before closing regardless.
 * Comfortably past the ~220ms exit; short enough not to feel stuck.
 */
const EXIT_FALLBACK_MS = 600;

/** Exit uses a duration curve rather than a spring — springs read as floaty on the way out. */
const EXIT_TRANSITION = { duration: DURATION.standard, ease: EASE.out } as const;
const SCRIM_TRANSITION = { duration: DURATION.standard, ease: EASE.out } as const;

export interface SheetProps {
  open: boolean;
  onClose: () => void;
  /** Rendered as the sheet's heading and its accessible name. */
  title: string;
  children: ReactNode;
  className?: string;
}

export function Sheet({ open, onClose, title, children, className }: SheetProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const pushedRef = useRef(false);
  const dragControls = useDragControls();
  const isModal = useMediaQuery("(min-width: 40rem)");
  const titleId = useId();

  // Keeps the effects below keyed on `open` alone, so an unstable onClose from
  // the caller can't tear down and re-push history.
  const onCloseRef = useRef(onClose);
  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (open && dialog && !dialog.open) dialog.showModal();
  }, [open]);

  useEffect(() => {
    if (!open) return;

    window.history.pushState({ ndsSheet: true }, "");
    pushedRef.current = true;

    const handlePop = () => {
      pushedRef.current = false;
      onCloseRef.current();
    };
    window.addEventListener("popstate", handlePop);

    return () => {
      window.removeEventListener("popstate", handlePop);
      // Closed by button, Esc, or drag rather than by back — retire our entry
      // so the history stack doesn't accumulate dead states.
      if (pushedRef.current) {
        pushedRef.current = false;
        window.history.back();
      }
    };
  }, [open]);

  /** Deferred until the panel has finished animating out. */
  const handleExitComplete = useCallback(() => {
    dialogRef.current?.close();
  }, []);

  /**
   * Safety net: close even if the exit animation never finishes.
   *
   * `dialog.close()` is deferred to `onExitComplete` so the panel isn't yanked
   * out of the top layer mid-flight. That makes dismissal depend on an
   * animation completing — and Motion is driven by requestAnimationFrame, which
   * a browser parks in a hidden or backgrounded tab. Without this, closing the
   * sheet in a background tab leaves a modal that cannot be dismissed.
   *
   * A missing animation is a blemish. A trapped modal is a broken product.
   */
  useEffect(() => {
    if (open) return;
    const dialog = dialogRef.current;
    if (!dialog?.open) return;

    const timer = window.setTimeout(() => {
      if (dialog.open) dialog.close();
    }, EXIT_FALLBACK_MS);

    return () => window.clearTimeout(timer);
  }, [open]);

  const startDrag = useCallback(
    (event: ReactPointerEvent) => dragControls.start(event),
    [dragControls],
  );

  // The panel rises on mobile and settles in place on desktop. Under
  // `reducedMotion="user"` Motion drops the transform legs and keeps opacity,
  // so both degrade to a cross-fade without any extra branch here.
  // A per-variant transition belongs INSIDE the variant object. Motion has no
  // top-level `transition.exit` key — writing one silently applies the enter
  // spring to the exit too.
  const panelMotion = isModal
    ? {
        initial: { opacity: 0, scale: 0.97 },
        animate: { opacity: 1, scale: 1 },
        exit: { opacity: 0, scale: 0.98, transition: EXIT_TRANSITION },
      }
    : {
        initial: { y: "100%" },
        animate: { y: 0 },
        exit: { y: "100%", transition: EXIT_TRANSITION },
      };

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby={titleId}
      onCancel={(event) => {
        // Let the exit animation run instead of the browser's instant close.
        event.preventDefault();
        onClose();
      }}
      className={cn(
        "fixed inset-0 m-0 h-full max-h-full w-full max-w-full",
        "bg-transparent p-0 backdrop:bg-transparent",
      )}
    >
      <div className="relative flex h-full w-full items-end justify-center md:items-center">
        <AnimatePresence onExitComplete={handleExitComplete}>
          {open && (
            <m.div
              key="scrim"
              aria-hidden="true"
              onClick={onClose}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={SCRIM_TRANSITION}
              className="absolute inset-0 bg-surface-scrim"
            />
          )}

          {open && (
            <m.div
              key="panel"
              {...panelMotion}
              transition={TRANSITION.standard}
              drag={isModal ? false : "y"}
              dragControls={dragControls}
              dragListener={false}
              dragConstraints={{ top: 0, bottom: 0 }}
              dragElastic={{ top: 0, bottom: 1 }}
              onDragEnd={(_, info) => {
                if (
                  info.offset.y > DRAG_DISMISS_OFFSET ||
                  info.velocity.y > DRAG_DISMISS_VELOCITY
                ) {
                  onClose();
                }
              }}
              className={cn(
                "relative w-full bg-surface-sunken shadow-sheet",
                "rounded-t-sheet md:rounded-sheet",
                "max-h-[85dvh] overflow-y-auto md:max-w-[32.5rem]",
                className,
              )}
            >
              {/* Drag affordance — mobile only. `display:none` above md means
                  drag is simply unreachable on pointer devices. */}
              <div
                onPointerDown={startDrag}
                className="flex h-6 cursor-grab touch-none items-center justify-center md:hidden"
                aria-hidden="true"
              >
                <span className="h-1 w-9 rounded-full bg-action-border" />
              </div>

              <div className="px-6 pt-2 pb-8 md:pt-6">
                <h2 id={titleId} className="type-label text-text-tertiary">
                  {title}
                </h2>
                <div className="mt-4">{children}</div>
              </div>
            </m.div>
          )}
        </AnimatePresence>
      </div>
    </dialog>
  );
}

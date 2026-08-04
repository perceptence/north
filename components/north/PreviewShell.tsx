"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  DeviceFrame,
  SAFE_TOP,
  SCREEN,
  SHELL,
  type Device,
} from "./DeviceFrame";
import { DemoPanel, JOURNEYS, type Journey } from "./DemoPanel";

/**
 * The pitch stage — the window is the control.
 *
 * Resize and the presentation follows: a narrow window stands the app in a
 * phone, a mid window in a tablet, and a wide window drops the hardware
 * entirely and lets the app fill the glass. There are no device buttons,
 * because a row of them would be a second way to say what dragging the
 * window edge already says — and the honest desktop presentation is no
 * frame at all (a browser drawn inside a browser is a lie about what you're
 * looking at).
 *
 * ── WHY THE VIEWPORT ISN'T THE SCREEN SIZE ────────────────────────────────
 * A tablet body is twice a phone's, so fitting it in the same window scales
 * it far harder — rendering the app at a literal 834pt lands its 17px body
 * type at ~10 screen px against the phone's ~15, and the app reads "zoomed
 * out" even though the device is drawn correctly. So each framed device
 * declares the LOGICAL VIEWPORT its app renders at, then scales up to fill
 * the physical screen. 642pt is still firmly a tablet — bottom dock, capped
 * column — so the app composes exactly as it would on the hardware. Only the
 * apparent size changes, and it changes so both devices read at one size.
 */

/** Under this width the stage stands a phone; under TABLET_MAX, a tablet. */
const PHONE_MAX = 900;
const TABLET_MAX = 1400;

/** Breathing room around a framed body. */
const MARGIN_X = 56;
/**
 * Vertical breathing room around a framed body.
 *
 * The PANEL's height is measured rather than guessed and added on top — see
 * `panelH`. A constant was tried and is wrong by construction: the pills wrap
 * to a second row on a narrow window, so any single number is right at one
 * width and short at another, and being short means the page grows a
 * scrollbar around a device that was meant to fit exactly.
 */
const MARGIN_Y = 64;
/** Stage padding and the gap between panel and device — `py-6` + `gap-6`. */
const STAGE_GAP = 72;

const VIEWPORT: Record<Device, { width: number; height: number }> = {
  phone: SCREEN.phone,
  tablet: { width: 642, height: 919 },
};

export function PreviewShell() {
  const [box, setBox] = useState<{ w: number; h: number } | null>(null);
  /**
   * Which journey the framed app is showing, and how many times it has been
   * asked for.
   *
   * The counter is what makes re-pressing the SAME journey work: the iframe
   * is keyed on both, so asking for "the reveal" twice re-seeds and reloads
   * rather than doing nothing because `src` did not change. Pressing a
   * journey you are already on is the reset.
   */
  const [journey, setJourney] = useState<Journey>(JOURNEYS[0]);
  const [visit, setVisit] = useState(0);
  /** The panel's real height, so the device is scaled to the room it leaves. */
  const [panelH, setPanelH] = useState<number | null>(null);
  const observerRef = useRef<ResizeObserver | null>(null);

  /**
   * A CALLBACK ref, not `useRef` + an effect.
   *
   * The panel does not exist on the first render — nothing renders until the
   * window has been measured — so an effect with `[]` deps runs once, finds
   * no node, and never looks again. That left the device gated forever behind
   * a height that was never taken. A callback ref fires when the node
   * actually arrives, whenever that is.
   */
  const panelRef = useCallback((node: HTMLDivElement | null) => {
    observerRef.current?.disconnect();
    if (!node) return;
    // Observed rather than read once: the pills rewrap as the window narrows,
    // which changes the panel's height without changing anything else.
    const observer = new ResizeObserver(([entry]) =>
      setPanelH(entry.contentRect.height),
    );
    observer.observe(node);
    observerRef.current = observer;
  }, []);

  const go = (next: Journey) => {
    setJourney(next);
    setVisit((n) => n + 1);
  };

  useEffect(() => {
    const measure = () =>
      setBox({ w: window.innerWidth, h: window.innerHeight });
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, []);

  // Nothing to disconnect on unmount beyond what the callback ref already
  // does when React hands it `null`.

  // The server cannot know the window, so nothing renders until it is
  // measured. One quiet frame of sky beats a phone that pops into a desktop.
  if (!box) return null;

  // Wide: room for both, so show both. This used to drop the hardware and
  // hand the window to a bare full-width iframe, on the reasoning that a
  // desktop window already says "desktop". In practice it meant the frames
  // were invisible on the machine anyone actually opens the pitch link on —
  // and an unframed app filling a 1500px window is the weakest thing this
  // page can show, because North's column never widens past 600px, so most
  // of that glass is empty paper. Two devices side by side is what a wide
  // screen is FOR. The desktop layout is still one click away at the app's
  // own URL; it does not need a stage.
  // The panel has to be in the tree before it can be measured, so the stage
  // renders first and the hardware waits one frame — the same trade the
  // window measurement above already makes, and for the same reason.
  const ready = panelH !== null;
  /**
   * Vertical room the hardware does NOT get: margins, the panel, and the
   * stage's own padding and gap. Computed once and used by both layouts —
   * subtracting it in only one of them is exactly the bug that shipped a
   * 128px scrollbar under the side-by-side pair.
   */
  const reservedY = MARGIN_Y + (panelH ?? 0) + STAGE_GAP;

  if (box.w >= TABLET_MAX) {
    return (
      <Stage journey={journey} onGo={go} panelRef={panelRef}>
        {ready && (
          <Pair
            box={box}
            reservedY={reservedY}
            journey={journey}
            visit={visit}
          />
        )}
      </Stage>
    );
  }

  const device: Device = box.w >= PHONE_MAX ? "tablet" : "phone";
  const shell = SHELL[device];

  // Fit the body to the window on both axes; never enlarge past life size.
  const scale = Math.min(
    1,
    (box.w - MARGIN_X) / shell.width,
    (box.h - reservedY) / shell.height,
  );

  return (
    <Stage journey={journey} onGo={go} panelRef={panelRef}>
      {ready && (
        <Body device={device} scale={scale} journey={journey} visit={visit} />
      )}
    </Stage>
  );
}

/**
 * The stage: the panel, then whatever hardware is standing on it.
 *
 * A column rather than a floating overlay, so the panel cannot sit on top of
 * the glass it is meant to be driving — and so its height is a real part of
 * the layout the device is scaled to fit.
 */
function Stage({
  journey,
  onGo,
  panelRef,
  children,
}: {
  journey: Journey;
  onGo: (next: Journey) => void;
  panelRef: (node: HTMLDivElement | null) => void;
  children: React.ReactNode;
}) {
  return (
    <div className="relative flex min-h-dvh flex-col items-center justify-center gap-6 py-6">
      <div ref={panelRef}>
        <DemoPanel active={journey.id} onGo={onGo} />
      </div>
      {children}
    </div>
  );
}

/** Gap between the two bodies when both are on stage, at life size. */
const PAIR_GAP = 72;

/**
 * Both devices, standing together, scaled as one group.
 *
 * ONE scale for the pair, computed from their combined footprint — scaling
 * each to its own fit would make the phone as tall as the tablet, which is a
 * lie about the hardware and the first thing an eye checks. The tablet's
 * height governs; the phone sits on the same baseline beside it.
 */
function Pair({
  box,
  reservedY,
  journey,
  visit,
}: {
  box: { w: number; h: number };
  reservedY: number;
  journey: Journey;
  visit: number;
}) {
  const width = SHELL.tablet.width + PAIR_GAP + SHELL.phone.width;
  const height = SHELL.tablet.height;

  const scale = Math.min(
    1,
    (box.w - MARGIN_X) / width,
    (box.h - reservedY) / height,
  );

  // No full-height wrapper of its own — `Stage` owns the centring now, and
  // nesting a second `min-h-dvh` inside it is what put the panel's height
  // BELOW the fold instead of taking it out of the device's budget.
  return (
    <div>
      <div style={{ width: width * scale, height: height * scale }}>
        <div
          className="flex items-end"
          style={{
            width,
            height,
            gap: PAIR_GAP,
            transform: `scale(${scale})`,
            transformOrigin: "top left",
          }}
        >
          <Body device="tablet" scale={1} journey={journey} visit={visit} />
          <Body device="phone" scale={1} journey={journey} visit={visit} />
        </div>
      </div>
    </div>
  );
}

/**
 * One device at a given scale.
 *
 * The outer box carries the SCALED size so flex centring is honest and the
 * page never grows scrollbars around a shrunken device.
 */
function Body({
  device,
  scale,
  journey,
  visit,
}: {
  device: Device;
  scale: number;
  journey: Journey;
  visit: number;
}) {
  const shell = SHELL[device];
  const screen = SCREEN[device];
  const viewport = VIEWPORT[device];

  return (
    <div style={{ width: shell.width * scale, height: shell.height * scale }}>
      <div
        style={{
          width: shell.width,
          height: shell.height,
          transform: `scale(${scale})`,
          transformOrigin: "top left",
        }}
      >
        <DeviceFrame device={device}>
          {/* The app starts below the status bar, the way it would on the
              device. Its logical height shrinks by the same inset so the
              scaled result still fills the glass exactly.

              The inset carries the SKY, because on a real device the app's
              background runs edge to edge and the status bar is drawn over it.
              Left as paper, the strip read as a white letterbox and the white
              clock vanished into it. Every product screen opens on the deep
              sky, so continuing it here is the honest join. */}
          <div
            style={{
              // One pixel less inset, and one more of app: the iframe OVERLAPS
              // the strip. Scaling a framed body to fit lands the iframe's top
              // edge on a fraction of a pixel, and the sliver that showed
              // through was a pale hairline running the width of the glass.
              paddingTop: SAFE_TOP[device] - 1,
              background: "var(--surface-deep)",
            }}
          >
            <iframe
              // Keyed on the journey AND the visit count, so choosing the one
              // already showing remounts the frame and re-seeds — pressing
              // where you already are is how you reset.
              key={`${device}:${journey.id}:${visit}`}
              src={journey.href}
              title={
                device === "phone" ? "North on a phone" : "North on a tablet"
              }
              className="border-0"
              style={{
                width: viewport.width,
                // Deep, not paper. An iframe paints its own background before
                // the document inside it does, so a paper default is exactly
                // the wrong colour at the one edge that can ever show it.
                background: "var(--surface-deep)",
                height:
                  (screen.height - SAFE_TOP[device] + 1) /
                  (screen.width / viewport.width),
                transform: `scale(${screen.width / viewport.width})`,
                transformOrigin: "top left",
              }}
            />
          </div>
        </DeviceFrame>
      </div>
    </div>
  );
}

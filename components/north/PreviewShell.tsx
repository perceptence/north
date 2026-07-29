"use client";

import { useEffect, useState } from "react";
import {
  DeviceFrame,
  SAFE_TOP,
  SCREEN,
  SHELL,
  type Device,
} from "./DeviceFrame";

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
const MARGIN_Y = 64;

const VIEWPORT: Record<Device, { width: number; height: number }> = {
  phone: SCREEN.phone,
  tablet: { width: 642, height: 919 },
};

export function PreviewShell() {
  const [box, setBox] = useState<{ w: number; h: number } | null>(null);

  useEffect(() => {
    const measure = () =>
      setBox({ w: window.innerWidth, h: window.innerHeight });
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, []);

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
  if (box.w >= TABLET_MAX) {
    return <Pair box={box} />;
  }

  const device: Device = box.w >= PHONE_MAX ? "tablet" : "phone";
  const shell = SHELL[device];

  // Fit the body to the window on both axes; never enlarge past life size.
  const scale = Math.min(
    1,
    (box.w - MARGIN_X) / shell.width,
    (box.h - MARGIN_Y) / shell.height,
  );

  return (
    <div className="relative flex min-h-dvh items-center justify-center">
      <Body device={device} scale={scale} />
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
function Pair({ box }: { box: { w: number; h: number } }) {
  const width = SHELL.tablet.width + PAIR_GAP + SHELL.phone.width;
  const height = SHELL.tablet.height;

  const scale = Math.min(
    1,
    (box.w - MARGIN_X) / width,
    (box.h - MARGIN_Y) / height,
  );

  return (
    <div className="relative flex min-h-dvh items-center justify-center">
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
          <Body device="tablet" scale={1} />
          <Body device="phone" scale={1} />
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
function Body({ device, scale }: { device: Device; scale: number }) {
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
              key={device}
              src="/demo"
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

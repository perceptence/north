import type { CSSProperties, ReactNode } from "react";

/**
 * Device frames — remade from scratch after the ALBA port read flat.
 *
 * What a frame needs to feel like hardware is MATERIAL, not outline:
 *   · a machined metal band with a light gradient running across it (titanium
 *     catches light differently at each corner — a flat hex never will),
 *   · visible bezel DEPTH between band and glass,
 *   · keys that are metal objects attached to the band, not pencil lines,
 *   · layered shadows: a tight contact shadow plus a wide soft ambient one,
 *     warm-dark so they sit naturally on the paper end of the atmosphere.
 *
 * Two bodies:
 *   phone  — iPhone 17 Pro: 402×874 pt screen, titanium band, Dynamic Island
 *            with lens, five keys at their true positions.
 *   tablet — iPad Pro 11": 834×1194 pt, uniform bezel, top power key,
 *            right-edge volumes, front camera on the landscape edge.
 *
 * There is deliberately NO desktop body. A browser window drawn inside a
 * browser window is a lie about what the viewer is looking at — on a desk
 * North simply IS a web page, so /preview shows it unframed.
 *
 * Geometry is nested radii (screen r + bezel + band), all REAL layout — no
 * shadow-ring bezels, so nothing shears at the corners when /preview scales
 * a device to fit. Hardware colors are raw hex on purpose: this chrome
 * depicts an object, not product UI. Everything but the screen is aria-hidden.
 */

export type Device = "phone" | "tablet";

/** Logical screen sizes, so callers (the iframe) can match exactly. */
export const SCREEN: Record<Device, { width: number; height: number }> = {
  phone: { width: 402, height: 874 },
  tablet: { width: 834, height: 1194 },
};

/** Band + bezel thickness per side — the screen's surround. */
const SURROUND: Record<Device, number> = { phone: 3 + 7, tablet: 3 + 12 };

/**
 * Outer size of the whole body, derived rather than written down, so a change
 * to the bezel can never leave a caller scaling against a stale number.
 */
export const SHELL: Record<Device, { width: number; height: number }> = {
  phone: {
    width: SCREEN.phone.width + 2 * SURROUND.phone,
    height: SCREEN.phone.height + 2 * SURROUND.phone,
  },
  tablet: {
    width: SCREEN.tablet.width + 2 * SURROUND.tablet,
    height: SCREEN.tablet.height + 2 * SURROUND.tablet,
  },
};

/* Machined titanium: light enters high-left, glances off, returns low-right. */
const BAND =
  "linear-gradient(145deg,#82868e 0%,#3e4147 26%,#5d6168 50%,#2f3136 74%,#71757d 100%)";
/* A key is the same metal, lit along its length. */
const KEY_V = "linear-gradient(180deg,#6a6d74,#35373c 55%,#4d5056)";
const KEY_H = "linear-gradient(90deg,#6a6d74,#35373c 55%,#4d5056)";
const GLASS_EDGE = "inset 0 0 1px rgba(255,255,255,.14)";
/* Contact + ambient, warm-dark for the paper end of the atmosphere. */
const SHADOW =
  "0 2px 5px rgba(38,30,22,.35), 0 34px 70px -22px rgba(38,30,22,.55), inset 0 0 1px rgba(255,255,255,.45)";

/**
 * The OS status bar.
 *
 * Set in the SYSTEM face, not the product's — this is the operating system's
 * chrome sitting above the app, and rendering it in Geist would quietly claim
 * a pixel of the phone as North's. It is `aria-hidden` and unclickable: a
 * drawing of hardware state, not state.
 *
 * 9:41 is deliberate. Every Apple keynote and every store render uses it, so
 * it reads as "this is a device shot" rather than as a clock that stopped.
 * A live clock would also hydrate differently than it rendered.
 *
 * On the phone the bar's height is set so its centre line matches the Dynamic
 * Island's (island top 12 + half of 37 = 30.5, so 61). That is the alignment
 * that makes a frame look real: time and indicators reading level with the
 * island, not floating above or below it.
 */
const OS_FACE = 'system-ui, -apple-system, "Segoe UI", sans-serif';

function Cellular({ size }: { size: number }) {
  return (
    <svg viewBox="0 0 18 12" width={size} height={(size * 12) / 18} fill="currentColor">
      {[0, 1, 2, 3].map((i) => (
        <rect
          key={i}
          x={i * 4.6}
          y={9 - i * 2.7}
          width="3"
          height={3 + i * 2.7}
          rx="1"
          opacity={i === 3 ? 0.4 : 1}
        />
      ))}
    </svg>
  );
}

function Wifi({ size }: { size: number }) {
  return (
    <svg viewBox="0 0 16 12" width={size} height={(size * 12) / 16} fill="currentColor">
      <path d="M8 10.8a1.4 1.4 0 1 0 0-2.8 1.4 1.4 0 0 0 0 2.8Z" />
      <path
        d="M4.4 6.6a5.2 5.2 0 0 1 7.2 0"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
      <path
        d="M1.9 4a8.8 8.8 0 0 1 12.2 0"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
    </svg>
  );
}

function Battery({ size }: { size: number }) {
  return (
    <svg viewBox="0 0 27 12" width={size} height={(size * 12) / 27} fill="none">
      <rect
        x="0.6"
        y="0.6"
        width="22"
        height="10.8"
        rx="3"
        stroke="currentColor"
        strokeOpacity="0.4"
        strokeWidth="1"
      />
      <rect x="2.2" y="2.2" width="16" height="7.6" rx="1.8" fill="currentColor" />
      <path
        d="M24.4 4.2c1 .35 1.6 1 1.6 1.8s-.6 1.45-1.6 1.8Z"
        fill="currentColor"
        fillOpacity="0.4"
      />
    </svg>
  );
}

/**
 * How far the app must start below the top of the glass.
 *
 * A real device hands an app a safe-area inset and the app lays out beneath
 * it. The iframe has no such inset, so the frame supplies it — otherwise the
 * product's own masthead renders straight through the OS clock, which is
 * exactly what it did.
 */
export const SAFE_TOP: Record<Device, number> = { phone: 61, tablet: 34 };

function StatusBar({ device }: { device: Device }) {
  const phone = device === "phone";
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-x-0 top-0 flex items-center justify-between text-white"
      style={{
        // Phone: centred on the Dynamic Island's own centre line.
        height: SAFE_TOP[device],
        paddingLeft: phone ? 34 : 32,
        paddingRight: phone ? 30 : 32,
        fontFamily: OS_FACE,
        zIndex: 95,
      }}
    >
      <span
        style={{
          fontSize: phone ? 15 : 14,
          fontWeight: 600,
          letterSpacing: "0.01em",
        }}
      >
        9:41
      </span>
      <span
        className="flex items-center"
        style={{ gap: phone ? 6 : 7 }}
      >
        <Cellular size={phone ? 17 : 17} />
        <Wifi size={phone ? 16 : 16} />
        <Battery size={phone ? 25 : 25} />
      </span>
    </div>
  );
}

function Key({ style }: { style: CSSProperties }) {
  return (
    <i
      aria-hidden="true"
      className="absolute"
      style={{
        boxShadow:
          "0 1px 2px rgba(20,16,12,.4), inset 0 1px 0 rgba(255,255,255,.25)",
        ...style,
      }}
    />
  );
}

export function DeviceFrame({
  device = "phone",
  children,
}: {
  device?: Device;
  children: ReactNode;
}) {
  const { width, height } = SCREEN[device];

  if (device === "tablet") {
    /* band 3 + bezel 12 → screen r12, bezel r24, band r27.
       Shell = 864×1224; keys hang off it in px. */
    return (
      <div className="relative">
        {/* Top (power) key, right-of-centre. */}
        <Key
          style={{
            top: -2.5,
            right: 92,
            width: 68,
            height: 5,
            borderRadius: "2.5px 2.5px 0 0",
            background: KEY_H,
          }}
        />
        {/* Volume up / down, right edge near the top. */}
        <Key
          style={{
            right: -2.5,
            top: 62,
            width: 5,
            height: 56,
            borderRadius: "0 2.5px 2.5px 0",
            background: KEY_V,
          }}
        />
        <Key
          style={{
            right: -2.5,
            top: 128,
            width: 5,
            height: 56,
            borderRadius: "0 2.5px 2.5px 0",
            background: KEY_V,
          }}
        />
        <div
          className="relative"
          style={{
            padding: 3,
            borderRadius: 27,
            background: BAND,
            boxShadow: SHADOW,
          }}
        >
          <div
            className="relative"
            style={{
              padding: 12,
              borderRadius: 24,
              background: "#060607",
              boxShadow: GLASS_EDGE,
            }}
          >
            {/* Front camera — centred on the landscape (long) edge, so it
                sits mid-height of the right bezel in portrait. */}
            <span
              aria-hidden="true"
              className="absolute rounded-full"
              style={{
                right: 3.5,
                top: "50%",
                transform: "translateY(-50%)",
                width: 6,
                height: 6,
                background:
                  "radial-gradient(circle at 35% 35%, #2a3644, #0a0c10 70%)",
                boxShadow: "0 0 0 1px rgba(255,255,255,.08)",
              }}
            />
            <div
              className="relative overflow-hidden"
              style={{
                width,
                height,
                borderRadius: 12,
                background: "var(--surface-page)",
              }}
            >
              <StatusBar device="tablet" />
              {children}
            </div>
          </div>
        </div>
      </div>
    );
  }

  /* Phone: band 3 + bezel 7 → screen r56, bezel r63, band r66.
     Shell = 422×894; screen top sits 10px below shell top, and the key
     positions are ALBA's %-of-874 in px, plus that 10. */
  return (
    <div className="relative">
      {/* Action, Volume Up, Volume Down — left edge. */}
      <Key
        style={{ left: -2.5, top: 160, width: 5, height: 34, borderRadius: "2.5px 0 0 2.5px", background: KEY_V }}
      />
      <Key
        style={{ left: -2.5, top: 214, width: 5, height: 58, borderRadius: "2.5px 0 0 2.5px", background: KEY_V }}
      />
      <Key
        style={{ left: -2.5, top: 284, width: 5, height: 58, borderRadius: "2.5px 0 0 2.5px", background: KEY_V }}
      />
      {/* Side and Camera Control — right edge. */}
      <Key
        style={{ right: -2.5, top: 220, width: 5, height: 96, borderRadius: "0 2.5px 2.5px 0", background: KEY_V }}
      />
      <Key
        style={{ right: -2.5, top: 348, width: 5, height: 42, borderRadius: "0 2.5px 2.5px 0", background: KEY_V }}
      />
      <div
        className="relative"
        style={{
          padding: 3,
          borderRadius: 66,
          background: BAND,
          boxShadow: SHADOW,
        }}
      >
        <div
          className="relative"
          style={{
            padding: 7,
            borderRadius: 63,
            background: "#060607",
            boxShadow: GLASS_EDGE,
          }}
        >
          {/* Earpiece — a hairline slit in the glass-to-bezel seam. */}
          <span
            aria-hidden="true"
            className="absolute left-1/2 -translate-x-1/2"
            style={{
              top: 3,
              width: 40,
              height: 3,
              borderRadius: 1.5,
              background: "#17181a",
              boxShadow: "inset 0 1px 1px rgba(0,0,0,.6)",
              zIndex: 6,
            }}
          />
          <div
            className="relative overflow-hidden"
            style={{
              width,
              height,
              borderRadius: 56,
              background: "var(--surface-page)",
            }}
          >
            <StatusBar device="phone" />

            {/* Dynamic Island — 126×37 at 12pt, camera at its right end. */}
            <div
              aria-hidden="true"
              className="absolute left-1/2 -translate-x-1/2 rounded-[19px] bg-black"
              style={{ top: 12, width: 126, height: 37, zIndex: 90 }}
            >
              <span
                className="absolute top-1/2 right-3 size-[11px] -translate-y-1/2 rounded-full"
                style={{
                  background:
                    "radial-gradient(circle at 35% 35%, #1e2a3a, #000 65%)",
                }}
              />
            </div>
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}

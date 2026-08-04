import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono, Newsreader } from "next/font/google";
import { MotionProvider } from "@/components/nds/MotionProvider";
import { SafeArea } from "@/components/north/SafeArea";
import { SplashGate } from "@/components/north/SplashGate";
import "./globals.css";

/**
 * Three faces, three jobs (docs/VISUAL-DIRECTION.md §4.1):
 *   voice   — the coach speaking
 *   ui      — the interface getting out of the way
 *   figure  — the machine computing
 */
const voice = Newsreader({
  variable: "--font-newsreader",
  subsets: ["latin"],
  weight: ["400", "500"], // 400 for speech; 500 exists ONLY for emphasized figures
  style: ["normal", "italic"],
  display: "swap",
});

const ui = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: "swap",
});

const figure = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
});

/**
 * The browser's own chrome — the status bar on an installed or mobile tab —
 * takes the deepest sky, so the splash and every masthead meet the OS with
 * no seam. The literal is `--sky-900`; metadata cannot read CSS custom
 * properties, so the token's value is repeated here at the edge, like the
 * favicon.
 */
export const viewport: Viewport = {
  themeColor: "#20264E",
  /**
   * The app paints to the edges of the glass, including under the status bar,
   * and lays its own chrome out beneath the inset via `--safe-top`.
   *
   * Without `cover`, `env(safe-area-inset-top)` resolves to 0 on every device
   * — the browser letterboxes the page below the notch and never reports an
   * inset. The sky would then start below the status bar rather than running
   * behind it, which is the difference between an app and a web page in a
   * frame.
   */
  viewportFit: "cover",
};

export const metadata: Metadata = {
  title: "North",
  description:
    "Everyone else shows you where your money went. North tells you where you're going.",
};

/**
 * `MotionProvider` is a client boundary, not a contagion — `children` is passed
 * through from this server component and stays server-rendered.
 *
 * NB: nothing may sit between <html> and <body>, not even a JSX comment. The
 * whitespace text node it produces is invalid there and throws a hydration
 * error that lint and `next build` both pass silently.
 */
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${voice.variable} ${ui.variable} ${figure.variable} h-full`}
    >
      <body className="min-h-full">
        <MotionProvider>
          {/* The device's top inset, where the OS cannot report one. Ambient
              and read through CSS, so it must be set before any chrome
              measures itself against it. */}
          <SafeArea />
          {/* The launch beat, on every fresh load of the PRODUCT — the gate
              exempts the project tooling. At the root so the first-time
              user's first load (Arrival, onboarding) gets it too. */}
          <SplashGate />
          {children}
        </MotionProvider>
      </body>
    </html>
  );
}

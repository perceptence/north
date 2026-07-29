import type { Metadata } from "next";
import { Geist, Geist_Mono, Newsreader } from "next/font/google";
import { MotionProvider } from "@/components/nds/MotionProvider";
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
        <MotionProvider>{children}</MotionProvider>
      </body>
    </html>
  );
}

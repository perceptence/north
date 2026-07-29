"use client";

import { usePathname, useRouter } from "next/navigation";
import { TabBar, type TabItem } from "@/components/nds";

/**
 * Wires the design system's TabBar to the app router.
 *
 * NDS renders real anchors and knows nothing about Next; this is the only place
 * routing meets navigation. Modified clicks (new tab, new window) fall through
 * to the browser untouched.
 */

/**
 * Hand-drawn hairline glyphs — the SAME rendered stroke as every mark in the
 * app: 1.25px. They were 1.5 on a 20 grid and scaled up again at `md`, which
 * put a 1.8px stroke in the dock while the content beside it was drawn at
 * 1.25 — so the chrome was the boldest drawing on screen, which is exactly
 * backwards. No icon library; four drawings, each meaning its surface: a roof,
 * a compass needle, the letter, the peak.
 */
function Glyph({ children }: { children: React.ReactNode }) {
  return (
    <svg
      viewBox="0 0 20 20"
      className="size-5"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.25"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {children}
    </svg>
  );
}

const ITEMS: TabItem[] = [
  {
    href: "/today",
    label: "Home",
    icon: (
      <Glyph>
        <path d="M4 9.5 10 4.5l6 5" />
        <path d="M5.5 8.75V15.5h9V8.75" />
      </Glyph>
    ),
  },
  {
    href: "/navigator",
    label: "Navigator",
    icon: (
      <Glyph>
        <circle cx="10" cy="10" r="6.25" />
        <path d="M12.4 7.6l-1.3 3.5-3.5 1.3 1.3-3.5z" />
      </Glyph>
    ),
  },
  {
    href: "/insights",
    label: "Insights",
    icon: (
      <Glyph>
        <rect x="3.75" y="6" width="12.5" height="9" rx="1.5" />
        <path d="M4.5 7.5 10 11.25 15.5 7.5" />
      </Glyph>
    ),
  },
  {
    href: "/goals",
    label: "Goals",
    icon: (
      <Glyph>
        <path d="M3.75 15.5h12.5" />
        <path d="M6 15.5 10.25 7l2.5 4.5 1.5-2 2 6" />
      </Glyph>
    ),
  },
];

export function ProductNav() {
  const router = useRouter();
  const pathname = usePathname();

  return (
    <TabBar
      items={ITEMS}
      current={pathname}
      onNavigate={(href, event) => {
        // Leave cmd/ctrl/shift-click and middle-click to the browser.
        if (
          event.metaKey ||
          event.ctrlKey ||
          event.shiftKey ||
          event.button !== 0
        ) {
          return;
        }
        event.preventDefault();
        router.push(href);
      }}
    />
  );
}

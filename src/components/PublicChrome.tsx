"use client";

import { Suspense } from "react";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import Footer from "./Footer";

/**
 * The footer is hidden on dashboard, auth and payment pages. That decision
 * reads the URL, so it must sit behind a Suspense boundary to keep the rest
 * of the page in the static shell (Next.js Cache Components requirement).
 */
function ConditionalFooter() {
  const pathname = usePathname();
  const hideFooter =
    pathname?.startsWith("/dashboard") ||
    pathname?.startsWith("/payment") ||
    pathname === "/login" ||
    pathname === "/register";

  if (hideFooter) return null;
  return <Footer />;
}

/** Renders the marketing footer everywhere except the authenticated dashboard area. */
export default function PublicChrome({ children }: { children: ReactNode }) {
  return (
    <>
      <div className="flex min-h-screen flex-col">{children}</div>
      <Suspense fallback={null}>
        <ConditionalFooter />
      </Suspense>
    </>
  );
}

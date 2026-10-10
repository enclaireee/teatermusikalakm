import type { Metadata } from "next";
import { Suspense } from "react";

// Never indexed and never linked from the site. Auth is checked in each page and action (lib/admin.ts),
// not here: layouts don't re-render on navigation.
export const metadata: Metadata = { title: "Admin", robots: { index: false, follow: false } };

// Every admin page reads the session cookie first, so navigations here always wait for the server.
export const instant = false;

// Admin pages read the session cookie, which must sit inside <Suspense> with cacheComponents.
export default function AdminLayout({ children }: LayoutProps<"/admin">) {
  return <Suspense fallback={<div className="flex-1" />}>{children}</Suspense>;
}

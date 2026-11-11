import { Suspense } from "react";
import Link from "next/link";
import { NavLink } from "@/components/nav-link";

export function SiteHeader() {
  return (
    <header className="border-b bg-background">
      <div className="mx-auto flex h-14 w-full max-w-5xl items-center gap-6 px-6">
        <Link href="/" className="font-semibold tracking-tight">
          Mieterpost
        </Link>
        <nav className="flex items-center gap-1" aria-label="Main navigation">
          {/* NavLink reads the current URL, which is only known per request. */}
          <Suspense>
            <NavLink href="/">Inbox</NavLink>
            <NavLink href="/tenants">Tenants</NavLink>
            <NavLink href="/properties">Properties</NavLink>
          </Suspense>
        </nav>
      </div>
    </header>
  );
}

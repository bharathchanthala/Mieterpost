import { Suspense } from "react";
import Link from "next/link";
import { HeaderNav } from "@/components/header-nav";

export function SiteHeader() {
  return (
    <header className="border-b bg-background">
      <div className="mx-auto flex h-14 w-full max-w-5xl items-center gap-6 px-6">
        <Link href="/" className="font-semibold tracking-tight">
          Mieterpost
        </Link>
        {/* HeaderNav reads the current URL, which is only known per request. */}
        <Suspense>
          <HeaderNav />
        </Suspense>
      </div>
    </header>
  );
}

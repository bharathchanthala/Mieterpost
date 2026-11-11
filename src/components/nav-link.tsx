"use client";

// A Client Component: it runs in the browser because it needs to know the
// current URL (usePathname) to highlight the active link.
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

export function NavLink({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  // "/" is only active on the inbox and on message pages that belong to it.
  const isActive =
    href === "/"
      ? pathname === "/" || pathname.startsWith("/messages")
      : pathname.startsWith(href);

  return (
    <Link
      href={href}
      aria-current={isActive ? "page" : undefined}
      className={cn(
        "rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
        isActive
          ? "bg-muted text-foreground"
          : "text-muted-foreground hover:text-foreground",
      )}
    >
      {children}
    </Link>
  );
}

"use client";

import { usePathname } from "next/navigation";
import { LogOut } from "lucide-react";
import { logout } from "@/app/login/actions";
import { NavLink } from "@/components/nav-link";
import { Button } from "@/components/ui/button";

// Navigation and the sign-out button. Hidden on the login page, where the
// visitor is not signed in yet.
export function HeaderNav() {
  const pathname = usePathname();
  if (pathname === "/login") return null;

  return (
    <>
      <nav className="flex items-center gap-1" aria-label="Main navigation">
        <NavLink href="/">Inbox</NavLink>
        <NavLink href="/tenants">Tenants</NavLink>
        <NavLink href="/properties">Properties</NavLink>
      </nav>
      <form action={logout} className="ml-auto">
        <Button type="submit" variant="ghost" size="sm">
          <LogOut />
          Sign out
        </Button>
      </form>
    </>
  );
}

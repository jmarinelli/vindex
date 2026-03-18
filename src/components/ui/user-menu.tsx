"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import {
  ChevronDown,
  LayoutDashboard,
  Settings,
  Pencil,
  ExternalLink,
  LogOut,
} from "lucide-react";

function getInitials(name: string): string {
  const words = name.trim().split(/\s+/);
  if (words.length >= 2) {
    return (words[0][0] + words[1][0]).toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
}

interface UserMenuProps {
  userName: string;
  userRole?: string;
  /** "light" for dark backgrounds (white text), "default" for light backgrounds */
  variant?: "default" | "light";
  /** Called after sign out completes */
  onSignOut?: () => void;
  /** Node logo URL — shown as avatar when set */
  logoUrl?: string | null;
  /** Node slug — needed for the public profile link */
  nodeSlug?: string | null;
}

export function UserMenu({
  userName,
  userRole,
  variant = "default",
  onSignOut,
  logoUrl,
  nodeSlug,
}: UserMenuProps) {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();

  const firstName = userName.split(/\s+/)[0] || "";
  const initials = userName ? getInitials(userName) : "";
  const isAdmin = userRole === "platform_admin";

  const isLight = variant === "light";

  // Build quick links, filtering out the current page
  const links = [
    {
      href: isAdmin ? "/admin" : "/dashboard",
      label: isAdmin ? "Admin panel" : "Dashboard",
      icon: LayoutDashboard,
    },
    ...(!isAdmin
      ? [
          { href: "/dashboard/settings", label: "Configuración", icon: Settings },
          { href: "/dashboard/template", label: "Editor de Template", icon: Pencil },
          ...(nodeSlug
            ? [{ href: `/inspector/${nodeSlug}`, label: "Mi Perfil Público", icon: ExternalLink }]
            : []),
        ]
      : []),
  ].filter((link) => link.href !== pathname);

  // Close dropdown on outside click
  useEffect(() => {
    if (!dropdownOpen) return;
    function handleMouseDown(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleMouseDown);
    return () => document.removeEventListener("mousedown", handleMouseDown);
  }, [dropdownOpen]);

  // Close dropdown on Escape
  useEffect(() => {
    if (!dropdownOpen) return;
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setDropdownOpen(false);
      }
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [dropdownOpen]);

  async function handleSignOut() {
    await signOut({ redirect: false });
    setDropdownOpen(false);
    if (onSignOut) {
      onSignOut();
    } else {
      window.location.href = "/login";
    }
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        className="flex items-center gap-2"
        onClick={() => setDropdownOpen((prev) => !prev)}
        aria-haspopup="true"
        aria-expanded={dropdownOpen}
      >
        {logoUrl ? (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img
            src={`${logoUrl}?w=64&h=64&c=fill&g=face&f=auto`}
            alt={userName}
            className="size-8 rounded-full object-cover border border-gray-200"
          />
        ) : (
          <span
            className={`flex items-center justify-center size-8 rounded-full text-xs font-medium ${
              isLight ? "bg-white/20 text-white" : "bg-brand-primary text-white"
            }`}
          >
            {initials}
          </span>
        )}
        <span
          className={`text-sm font-medium ${
            isLight ? "text-white" : "text-gray-700"
          }`}
        >
          {firstName}
        </span>
        <ChevronDown
          className={`size-4 ${isLight ? "text-white" : "text-gray-700"}`}
        />
      </button>

      {dropdownOpen && (
        <div
          className="absolute right-0 top-full mt-2 min-w-[200px] bg-white rounded-md shadow-md border border-gray-200 z-50"
          role="menu"
        >
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="flex items-center gap-3 px-3 py-2.5 text-sm text-gray-700 hover:bg-gray-50"
              role="menuitem"
              onClick={() => setDropdownOpen(false)}
            >
              <link.icon className="size-4" />
              {link.label}
            </Link>
          ))}
          <div className="border-t border-gray-100" />
          <button
            className="flex items-center gap-3 px-3 py-2.5 text-sm text-gray-500 hover:bg-gray-50 w-full text-left"
            role="menuitem"
            onClick={handleSignOut}
          >
            <LogOut className="size-4" />
            Cerrar sesión
          </button>
        </div>
      )}
    </div>
  );
}

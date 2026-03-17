"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import { Menu, X } from "lucide-react";
import { Logo } from "@/components/ui/logo";
import { UserMenu } from "@/components/ui/user-menu";

const NAV_LINKS = [
  { label: "Cómo funciona", href: "#como-funciona" },
  { label: "Para compradores", href: "#compradores" },
  { label: "Para verificadores", href: "#verificadores" },
] as const;

function getInitials(name: string): string {
  const words = name.trim().split(/\s+/);
  if (words.length >= 2) {
    return (words[0][0] + words[1][0]).toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
}

export function LandingHeader() {
  const { data: session, status } = useSession();
  const isAuthenticated = status === "authenticated";
  const isLoading = status === "loading";

  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  const userName = session?.user?.name ?? "";
  const userRole = (session?.user as { role?: string } | undefined)?.role;
  const initials = userName ? getInitials(userName) : "";
  const isAdmin = userRole === "platform_admin";
  const dashboardHref = isAdmin ? "/admin" : "/dashboard";
  const dashboardLabel = isAdmin ? "Admin panel" : "Ir al dashboard";

  useEffect(() => {
    function handleScroll() {
      setScrolled(window.scrollY > 56);
    }
    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  function handleNavClick() {
    setMenuOpen(false);
  }

  function handleSignOut() {
    signOut({ redirect: false });
  }

  return (
    <>
      <header
        className={`fixed top-0 left-0 right-0 z-50 h-16 grid grid-cols-[auto_1fr_auto] items-center px-4 min-[900px]:px-12 transition-all duration-200 ${
          scrolled
            ? "bg-white shadow-sm"
            : "bg-brand-primary"
        }`}
      >
        <Link href="#" className="shrink-0">
          <Logo size="sm" className={scrolled ? "" : "[&>span]:text-white"} />
        </Link>

        {/* Desktop nav */}
        <nav className="hidden min-[900px]:flex items-center justify-center gap-8 absolute left-1/2 -translate-x-1/2" aria-label="Navegación principal">
          {NAV_LINKS.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className={`text-sm font-medium transition-colors ${
                scrolled ? "text-gray-700 hover:text-gray-900" : "text-white/90 hover:text-white"
              }`}
            >
              {link.label}
            </a>
          ))}
        </nav>

        <div className="flex items-center justify-end gap-3">
          {/* Desktop right-side: loading / authenticated / unauthenticated */}
          {isLoading ? (
            <div className="hidden min-[900px]:block w-24" />
          ) : isAuthenticated ? (
            <div className="hidden min-[900px]:block">
              <UserMenu
                userName={userName}
                userRole={userRole}
                variant={scrolled ? "default" : "light"}
                showDashboardLink
                onSignOut={() => { window.location.href = "/"; }}
              />
            </div>
          ) : (
            <Link
              href="/login"
              className={`hidden min-[900px]:inline-flex items-center justify-center h-9 px-6 rounded-sm text-sm font-medium transition-colors ${
                scrolled
                  ? "border border-gray-200 text-gray-700 hover:bg-gray-50"
                  : "border border-white/40 text-white hover:bg-white/10"
              }`}
            >
              Login
            </Link>
          )}

          {/* Mobile: avatar (when authenticated) + hamburger */}
          {isAuthenticated && (
            <span className={`min-[900px]:hidden flex items-center justify-center size-8 rounded-full text-xs font-medium ${scrolled ? "bg-brand-primary text-white" : "bg-white/20 text-white"}`}>
              {initials}
            </span>
          )}

          <button
            className="min-[900px]:hidden p-2 -mr-2"
            onClick={() => setMenuOpen(true)}
            aria-label="Abrir menú"
            aria-expanded={menuOpen}
          >
            <Menu className={`size-6 ${scrolled ? "text-gray-700" : "text-white"}`} />
          </button>
        </div>
      </header>

      {/* Mobile menu overlay */}
      {menuOpen && (
        <div className="fixed inset-0 z-50 bg-white flex flex-col p-8" role="dialog" aria-modal="true">
          <button
            className="absolute top-4 right-4 p-2"
            onClick={() => setMenuOpen(false)}
            aria-label="Cerrar menú"
          >
            <X className="size-6 text-gray-700" />
          </button>

          {isAuthenticated && (
            <div className="flex items-center gap-3 mt-6">
              <span className="flex items-center justify-center size-10 rounded-full bg-brand-primary text-white text-sm font-medium">
                {initials}
              </span>
              <span className="text-lg font-medium text-gray-800">{userName}</span>
            </div>
          )}

          <nav className={`flex flex-col gap-6 ${isAuthenticated ? "mt-6" : "mt-12"}`} aria-label="Navegación principal">
            {NAV_LINKS.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="text-xl font-medium text-gray-800"
                onClick={handleNavClick}
              >
                {link.label}
              </a>
            ))}
            <a
              href="#contacto"
              className="text-xl font-medium text-gray-800"
              onClick={handleNavClick}
            >
              Contacto
            </a>
          </nav>

          {isAuthenticated ? (
            <>
              <Link
                href={dashboardHref}
                className="mt-8 inline-flex items-center justify-center h-12 rounded-sm bg-brand-primary text-white font-medium w-full"
                onClick={handleNavClick}
              >
                {dashboardLabel}
              </Link>
              <button
                className="mt-3 text-base font-medium text-gray-500 text-center w-full"
                onClick={() => {
                  handleSignOut();
                  setMenuOpen(false);
                }}
              >
                Cerrar sesión
              </button>
            </>
          ) : (
            <Link
              href="/login"
              className="mt-8 inline-flex items-center justify-center h-12 rounded-sm bg-brand-primary text-white font-medium w-full"
              onClick={handleNavClick}
            >
              Iniciar sesión
            </Link>
          )}
        </div>
      )}
    </>
  );
}

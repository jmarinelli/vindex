"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Menu, X } from "lucide-react";
import { Logo } from "@/components/ui/logo";

const NAV_LINKS = [
  { label: "Cómo funciona", href: "#como-funciona" },
  { label: "Para compradores", href: "#compradores" },
  { label: "Para inspectores", href: "#inspectores" },
] as const;

export function LandingHeader() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

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
        <nav className="hidden min-[900px]:flex items-center justify-center gap-8" aria-label="Navegación principal">
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

          {/* Mobile hamburger */}
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

          <nav className="flex flex-col gap-6 mt-12" aria-label="Navegación principal">
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

          <Link
            href="/login"
            className="mt-8 inline-flex items-center justify-center h-12 rounded-sm bg-brand-primary text-white font-medium w-full"
            onClick={handleNavClick}
          >
            Iniciar sesión
          </Link>
        </div>
      )}
    </>
  );
}

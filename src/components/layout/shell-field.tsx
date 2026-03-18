"use client";

import { X } from "lucide-react";

interface ShellFieldProps {
  children: React.ReactNode;
  title?: string;
  progress?: string;
  syncIndicator?: React.ReactNode;
  sectionTabs?: React.ReactNode;
  bottomBar?: React.ReactNode;
  onClose?: () => void;
}

export function ShellField({
  children,
  title,
  progress,
  syncIndicator,
  sectionTabs,
  bottomBar,
  onClose,
}: ShellFieldProps) {
  return (
    <div className="h-[100svh] flex flex-col bg-gray-50 overflow-hidden">
      {/* Safe-area spacer for notch/Dynamic Island */}
      <div className="bg-white shrink-0 h-[env(safe-area-inset-top)]" />
      {/* Fixed top bar — 48px */}
      <header className="h-12 border-b border-gray-200 bg-white flex items-center justify-between px-4 shrink-0">
        <span className="text-sm font-medium text-gray-800 truncate max-w-[40%]">
          {title ?? "Verificación"}
        </span>
        <div className="flex items-center gap-3">
          {progress && (
            <span className="text-xs text-gray-500">{progress}</span>
          )}
          {syncIndicator}
          {onClose && (
            <button
              onClick={onClose}
              className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-gray-600"
              aria-label="Cerrar"
            >
              <X className="h-5 w-5" />
            </button>
          )}
        </div>
      </header>

      {/* Section tabs */}
      {sectionTabs}

      {/* Scrollable content */}
      <main className="flex-1 overflow-y-auto">{children}</main>

      {/* Fixed bottom bar — 56px */}
      {bottomBar ?? (
        <footer className="h-14 border-t border-gray-200 bg-white flex items-center justify-between px-4 shrink-0 shadow-[0_-2px_4px_rgba(0,0,0,0.05)]">
          <button className="text-sm text-gray-600 h-12 px-4">
            ◀ Anterior
          </button>
          <button className="text-sm text-gray-600 h-12 px-4">
            Siguiente ▶
          </button>
        </footer>
      )}
      {/* Safe-area spacer — only needed in PWA standalone (Safari browser handles its own bottom) */}
      <div className="bg-white shrink-0 hidden [@media(display-mode:standalone)]:block [@media(display-mode:standalone)]:h-2" />
    </div>
  );
}

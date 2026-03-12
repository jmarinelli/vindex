"use client";

export function ShellField({
  children,
  title,
  progress,
  onClose,
}: {
  children: React.ReactNode;
  title?: string;
  progress?: string;
  onClose?: () => void;
}) {
  return (
    <div className="h-screen flex flex-col bg-gray-50">
      {/* Fixed top bar — 48px */}
      <header className="h-12 border-b border-gray-200 bg-white flex items-center justify-between px-4 shrink-0">
        <span className="text-sm font-medium text-gray-800 truncate">
          {title ?? "Inspección"}
        </span>
        <div className="flex items-center gap-2">
          {progress && (
            <span className="text-xs text-gray-500">{progress}</span>
          )}
          {onClose && (
            <button
              onClick={onClose}
              className="w-8 h-8 flex items-center justify-center text-gray-500 hover:text-gray-700"
              aria-label="Cerrar"
            >
              ✕
            </button>
          )}
        </div>
      </header>

      {/* Scrollable content */}
      <main className="flex-1 overflow-y-auto">{children}</main>

      {/* Fixed bottom bar — 56px */}
      <footer className="h-14 border-t border-gray-200 bg-white flex items-center justify-between px-4 shrink-0 shadow-top">
        <button className="text-sm text-gray-600 h-12 px-4">◀ Anterior</button>
        <button className="text-sm text-gray-600 h-12 px-4">Siguiente ▶</button>
      </footer>
    </div>
  );
}

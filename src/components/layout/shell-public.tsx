import Link from "next/link";

export function ShellPublic({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      {/* Top bar — 56px */}
      <header className="h-14 border-b border-gray-200 bg-white flex items-center px-4">
        <Link href="/" className="text-lg font-bold text-brand-primary">
          VinDex
        </Link>
      </header>

      {/* Content area — max 768px centered */}
      <main className="flex-1 w-full max-w-3xl mx-auto px-4 py-6">
        {children}
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-200 bg-white py-4 px-4 text-center text-sm text-gray-500">
        Verificado en{" "}
        <Link href="/" className="text-brand-primary font-medium">
          VinDex
        </Link>
      </footer>
    </div>
  );
}

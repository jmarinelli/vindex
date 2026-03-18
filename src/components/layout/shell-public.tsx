import Link from "next/link";
import { Logo } from "@/components/ui/logo";
import { AuthUserMenu } from "@/components/ui/auth-user-menu";

export function ShellPublic({ children, hideHeader = false }: { children: React.ReactNode; hideHeader?: boolean }) {
  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      {/* Top bar — 56px */}
      {!hideHeader && (
        <header className="h-14 border-b border-gray-200 bg-white flex items-center justify-between px-4 pt-[env(safe-area-inset-top)]">
          <Link href="/">
            <Logo size="sm" />
          </Link>
          <AuthUserMenu />
        </header>
      )}

      {/* Content area — max 768px centered */}
      <main className="flex-1 w-full max-w-3xl mx-auto px-4 py-6">
        {children}
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-200 bg-white py-4 px-4 text-center text-sm text-gray-500 flex items-center justify-center gap-1.5">
        Registrado en
        <Link href="/">
          <Logo size="sm" />
        </Link>
      </footer>
    </div>
  );
}

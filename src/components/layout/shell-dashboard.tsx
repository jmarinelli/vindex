"use client";

import Link from "next/link";
import { useSession, signOut } from "next-auth/react";

export function ShellDashboard({ children }: { children: React.ReactNode }) {
  const { data: session } = useSession();

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      {/* Top bar — 64px */}
      <header className="h-16 border-b border-gray-200 bg-white flex items-center justify-between px-4">
        <Link href="/dashboard" className="text-lg font-bold text-brand-primary">
          VinDex
        </Link>
        <span className="text-sm font-medium text-gray-700 hidden sm:block">
          Dashboard
        </span>
        <div className="flex items-center gap-3">
          <span className="text-sm text-gray-600">
            {session?.user?.name ?? ""}
          </span>
          <button
            onClick={() => signOut({ callbackUrl: "/login" })}
            className="text-sm text-gray-500 hover:text-gray-700"
          >
            Salir
          </button>
        </div>
      </header>

      {/* Content area — max 1024px centered */}
      <main className="flex-1 w-full max-w-5xl mx-auto px-4 py-6">
        {children}
      </main>
    </div>
  );
}

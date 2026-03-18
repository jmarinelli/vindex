"use client";

import Link from "next/link";
import { useSession } from "next-auth/react";
import { Logo } from "@/components/ui/logo";
import { UserMenu } from "@/components/ui/user-menu";

export function ShellDashboard({
  children,
  title = "Dashboard",
}: {
  children: React.ReactNode;
  title?: string;
}) {
  const { data: session } = useSession();

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      {/* Top bar — 64px */}
      <header className="relative h-16 border-b border-gray-200 bg-white flex items-center justify-between px-4 pt-[env(safe-area-inset-top)]">
        <Link href="/dashboard">
          <Logo size="sm" />
        </Link>
        <span className="absolute inset-0 flex items-center justify-center pointer-events-none text-sm font-medium text-gray-700 hidden sm:flex">
          {title}
        </span>
        {session?.user?.name && (
          <UserMenu
            userName={session.user.name}
            userRole={session.user.role}
            logoUrl={session.user.logoUrl}
            nodeSlug={session.user.nodeSlug}
          />
        )}
      </header>

      {/* Content area — max 1024px centered */}
      <main className="flex-1 w-full max-w-5xl mx-auto px-4 py-6">
        {children}
      </main>
    </div>
  );
}

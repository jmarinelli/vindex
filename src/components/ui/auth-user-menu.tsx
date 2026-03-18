"use client";

import { useSession } from "next-auth/react";
import { UserMenu } from "@/components/ui/user-menu";

export function AuthUserMenu() {
  const { data: session } = useSession();

  if (!session?.user?.name) return null;

  return (
    <UserMenu
      userName={session.user.name}
      userRole={session.user.role}
      logoUrl={session.user.logoUrl}
      nodeSlug={session.user.nodeSlug}
    />
  );
}

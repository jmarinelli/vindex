import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

export default auth((req) => {
  const { pathname } = req.nextUrl;

  // Public routes — no auth check
  if (
    pathname === "/" ||
    pathname === "/login" ||
    pathname.startsWith("/report/") ||
    pathname.startsWith("/vehicle/") ||
    pathname.startsWith("/inspector/") ||
    pathname.startsWith("/review/") ||
    pathname.startsWith("/api/auth/")
  ) {
    return NextResponse.next();
  }

  // Protected routes — require auth
  if (!req.auth) {
    const loginUrl = new URL("/login", req.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Admin routes — require platform_admin role
  if (pathname.startsWith("/admin") && req.auth.user.role !== "platform_admin") {
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|manifest.json|sw.js|offline.html|icons|logo-principal.png).*)",
  ],
};

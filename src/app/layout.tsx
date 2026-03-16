import type { Metadata } from "next";
import { SessionProvider } from "next-auth/react";
import { Toaster } from "@/components/ui/sonner";
import { ServiceWorkerRegister } from "@/components/pwa/service-worker-register";
import { InstallPrompt } from "@/components/pwa/install-prompt";
import "./globals.css";

export const metadata: Metadata = {
  title: "VinDex — Historial vehicular verificado",
  description:
    "Inspecciones vehiculares firmadas digitalmente. Historial verificable para cada VIN.",
  manifest: "/manifest.json",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <head>
        <meta name="theme-color" content="#1E293B" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
      </head>
      <body className="antialiased">
        <SessionProvider>
          {children}
          <Toaster position="bottom-right" />
          <ServiceWorkerRegister />
          <InstallPrompt />
        </SessionProvider>
      </body>
    </html>
  );
}

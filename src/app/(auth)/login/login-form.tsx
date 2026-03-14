"use client";

import { signIn, getSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { Logo } from "@/components/ui/logo";

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const formData = new FormData(e.currentTarget);
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;

    const result = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    if (result?.error) {
      setError("Email o contraseña incorrectos");
      setLoading(false);
    } else {
      if (callbackUrl) {
        router.push(callbackUrl);
      } else {
        const session = await getSession();
        router.push(
          session?.user?.role === "platform_admin" ? "/admin" : "/dashboard"
        );
      }
    }
  }

  return (
    <div className="w-full max-w-[400px] flex flex-col items-center gap-6">
      <Logo size="lg" />
      <div className="w-full bg-white rounded-lg shadow-sm border border-gray-200 p-6 sm:p-8">
        <h2 className="text-xl font-semibold text-gray-800 sm:text-2xl sm:font-bold">
          Iniciar sesión
        </h2>
        <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-6">
          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="email"
              className="text-sm font-medium text-gray-700"
            >
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              className="w-full h-10 px-3 text-base border border-gray-200 rounded-sm focus:outline-none focus:ring-2 focus:ring-brand-accent focus:border-brand-accent"
              placeholder="tu@email.com"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="password"
              className="text-sm font-medium text-gray-700"
            >
              Contraseña
            </label>
            <input
              id="password"
              name="password"
              type="password"
              required
              className="w-full h-10 px-3 text-base border border-gray-200 rounded-sm focus:outline-none focus:ring-2 focus:ring-brand-accent focus:border-brand-accent"
            />
          </div>
          {error && <p className="text-sm text-error">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="w-full h-10 sm:h-11 bg-brand-primary text-white rounded-sm font-medium hover:bg-brand-primary-hover disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? "Ingresando..." : "Ingresar"}
          </button>
        </form>
      </div>
    </div>
  );
}

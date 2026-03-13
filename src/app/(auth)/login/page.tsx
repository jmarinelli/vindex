import { Suspense } from "react";
import { LoginForm } from "./login-form";

export default function LoginPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 px-6 gap-6">
      <Suspense fallback={<div className="text-gray-400">Cargando...</div>}>
        <LoginForm />
      </Suspense>
      <p className="text-xs text-gray-400 tracking-widest">
        Inspecciones vehiculares verificadas
      </p>
    </div>
  );
}

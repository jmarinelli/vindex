import Link from "next/link";
import { Search } from "lucide-react";

export function ProfileNotFound() {
  return (
    <div className="flex flex-col items-center gap-4 py-16 text-center" data-testid="profile-not-found">
      <Search className="w-12 h-12 text-gray-400" aria-hidden="true" />
      <h1 className="text-xl font-bold text-gray-800">
        Inspector no encontrado
      </h1>
      <p className="text-base text-gray-500">
        El perfil que buscás no existe o no está disponible.
      </p>
      <Link
        href="/"
        className="text-sm font-medium text-brand-accent hover:underline"
      >
        Ir al inicio →
      </Link>
    </div>
  );
}

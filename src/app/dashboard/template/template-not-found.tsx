import Link from "next/link";
import { TriangleAlert } from "lucide-react";

export function TemplateNotFound() {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <TriangleAlert className="size-12 text-gray-400 mb-4" />
      <h2 className="text-lg font-medium text-gray-800 mb-2">
        No se encontró un template
      </h2>
      <p className="text-gray-500 mb-6">Contactá soporte.</p>
      <Link
        href="/dashboard"
        className="text-sm font-medium text-brand-primary hover:text-brand-primary-hover"
      >
        Volver al Dashboard
      </Link>
    </div>
  );
}

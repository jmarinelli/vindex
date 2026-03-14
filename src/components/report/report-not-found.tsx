import { Search } from "lucide-react";
import Link from "next/link";

export function ReportNotFound() {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <Search className="w-12 h-12 text-gray-400 mb-4" aria-hidden="true" />
      <h1 className="text-xl font-bold text-gray-800 mb-2">
        Reporte no encontrado
      </h1>
      <p className="text-base text-gray-500 mb-6">
        El reporte que buscás no existe o no está disponible.
      </p>
      <Link
        href="/"
        className="text-sm text-gray-500 hover:text-gray-700 border border-gray-200 rounded-md px-4 py-2 transition-colors"
      >
        Ir al inicio →
      </Link>
    </div>
  );
}

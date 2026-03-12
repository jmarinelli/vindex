import { ShellPublic } from "@/components/layout/shell-public";
import Link from "next/link";

export default function LandingPage() {
  return (
    <ShellPublic>
      <div className="py-12 text-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">
          Historial vehicular verificado
        </h1>
        <p className="text-lg text-gray-600 mb-8 max-w-md mx-auto">
          Inspecciones firmadas digitalmente. Un historial confiable y
          verificable para cada vehículo.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            href="/login"
            className="inline-flex items-center justify-center h-12 px-6 rounded-sm bg-brand-primary text-white font-medium hover:bg-brand-primary-hover"
          >
            Iniciar sesión
          </Link>
        </div>
        <p className="mt-12 text-sm text-gray-500">
          ¿Sos inspector?{" "}
          <a
            href="mailto:contacto@vindex.app"
            className="text-brand-accent underline"
          >
            Contactanos
          </a>
        </p>
      </div>
    </ShellPublic>
  );
}

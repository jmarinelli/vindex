import { ShieldCheck } from "lucide-react";

interface VerificationBadgeProps {
  signedAt: Date;
  signerName: string;
  nodeName: string;
}

export function VerificationBadge({
  signedAt,
  signerName,
  nodeName,
}: VerificationBadgeProps) {
  const date = new Date(signedAt);
  const formattedDate = date.toLocaleDateString("es-AR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
  const formattedTime = date.toLocaleTimeString("es-AR", {
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <section
      role="status"
      className="bg-status-good-bg border border-status-good rounded-md p-4 flex gap-3"
    >
      <ShieldCheck
        className="w-6 h-6 text-status-good shrink-0"
        aria-hidden="true"
      />
      <div className="flex flex-col gap-1">
        <h2 className="text-base font-bold text-status-good">Verificación firmada</h2>
        <p className="text-sm text-gray-700">
          Firmada el {formattedDate} a las {formattedTime}
        </p>
        <p className="text-sm text-gray-700">
          por {signerName} · {nodeName}
        </p>
        <p className="text-xs text-gray-500">
          Este reporte no puede ser modificado.
        </p>
      </div>
    </section>
  );
}

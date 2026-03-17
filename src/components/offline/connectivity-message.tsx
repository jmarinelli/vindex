import Link from "next/link";
import { CloudOff } from "lucide-react";

interface ConnectivityMessageProps {
  title: string;
  subtitle: string;
  backHref?: string;
  backLabel?: string;
}

export function ConnectivityMessage({
  title,
  subtitle,
  backHref = "/dashboard",
  backLabel = "Volver al Dashboard",
}: ConnectivityMessageProps) {
  return (
    <div className="flex flex-col items-center justify-center py-12 space-y-4">
      <CloudOff className="h-12 w-12 text-gray-400" />
      <h2 className="text-lg font-medium text-gray-700">{title}</h2>
      <p className="text-sm text-gray-500 text-center max-w-sm">{subtitle}</p>
      <Link
        href={backHref}
        className="text-sm text-blue-600 hover:text-blue-700 font-medium"
      >
        {backLabel}
      </Link>
    </div>
  );
}

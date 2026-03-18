import Link from "next/link";
import { BadgeCheck, Mail, Phone, MapPin, Pencil } from "lucide-react";
import type { Node } from "@/db/schema";

interface IdentityCardProps {
  node: Node;
  isOwner?: boolean;
}

export function IdentityCard({ node, isOwner = false }: IdentityCardProps) {
  return (
    <div
      className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden"
      data-testid="identity-card"
    >
      {/* Platform brand top border */}
      <div
        className="h-[3px] w-full bg-brand-primary"
      />

      <div className="flex flex-col gap-3 p-4 sm:p-5">
        {/* Logo + Name Row */}
        <div className="flex items-center gap-3 sm:gap-4">
          {/* Logo or fallback */}
          {node.logoUrl ? (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img
              src={node.logoUrl}
              alt={`${node.displayName} logo`}
              className="w-12 h-12 sm:w-16 sm:h-16 rounded-lg border border-gray-200 object-cover shrink-0"
            />
          ) : (
            <div
              className="w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-brand-primary flex items-center justify-center shrink-0"
              aria-label={node.displayName}
            >
              <span className="text-white text-xl sm:text-2xl font-bold">
                {node.displayName.charAt(0).toUpperCase()}
              </span>
            </div>
          )}

          <div className="flex flex-col gap-0.5 flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-bold text-gray-800 truncate">
                {node.displayName}
              </h1>
              {isOwner && (
                <Link
                  href="/dashboard/settings"
                  className="shrink-0 flex items-center gap-1 px-2 py-1 text-xs font-medium text-gray-500 border border-gray-200 rounded-md hover:bg-gray-50 transition-colors"
                  aria-label="Editar perfil"
                >
                  <Pencil className="w-3 h-3" />
                  Editar
                </Link>
              )}
            </div>
            <div
              className="flex items-center gap-1"
              aria-label="Verificador registrado en VinDex"
            >
              <BadgeCheck
                className="w-4 h-4 text-status-good"
                aria-hidden="true"
              />
              <span className="text-xs font-medium text-status-good">
                Verificador registrado
              </span>
            </div>
          </div>
        </div>

        {/* Bio */}
        {node.bio && (
          <p className="text-sm text-gray-600 leading-relaxed">{node.bio}</p>
        )}

        {/* Contact Info */}
        <div className="flex flex-col gap-2">
          {node.contactEmail && (
            <a
              href={`mailto:${node.contactEmail}`}
              className="flex items-center gap-2 text-sm text-gray-600 hover:underline"
            >
              <Mail
                className="w-4 h-4 text-gray-400 shrink-0"
                aria-hidden="true"
              />
              {node.contactEmail}
            </a>
          )}
          {node.contactPhone && (
            <a
              href={`tel:${node.contactPhone}`}
              className="flex items-center gap-2 text-sm text-gray-600 hover:underline"
            >
              <Phone
                className="w-4 h-4 text-gray-400 shrink-0"
                aria-hidden="true"
              />
              {node.contactPhone}
            </a>
          )}
          {node.address && (
            <span className="flex items-center gap-2 text-sm text-gray-600">
              <MapPin
                className="w-4 h-4 text-gray-400 shrink-0"
                aria-hidden="true"
              />
              {node.address}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

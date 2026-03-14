import { BadgeCheck, Mail, Phone, ExternalLink } from "lucide-react";
import Link from "next/link";
import type { Node } from "@/db/schema";

interface InspectorCardProps {
  node: Node;
}

export function InspectorCard({ node }: InspectorCardProps) {
  const brandColor = node.brandColor || undefined;

  return (
    <div
      className="bg-white border border-gray-200 rounded-md shadow-sm p-4 flex gap-3"
      style={brandColor ? { borderTopWidth: 3, borderTopColor: brandColor } : undefined}
    >
      {/* Logo or fallback */}
      {node.logoUrl ? (
        /* eslint-disable-next-line @next/next/no-img-element */
        <img
          src={node.logoUrl}
          alt={`Logo de ${node.displayName}`}
          className="w-12 h-12 rounded-md border border-gray-200 object-cover shrink-0"
        />
      ) : (
        <div className="w-12 h-12 rounded-md bg-brand-primary flex items-center justify-center shrink-0">
          <span className="text-white text-[22px] font-bold">
            {node.displayName.charAt(0).toUpperCase()}
          </span>
        </div>
      )}

      <div className="flex flex-col gap-1.5 min-w-0">
        <h3 className="text-base font-semibold text-gray-800">
          {node.displayName}
        </h3>
        <div className="flex items-center gap-1">
          <BadgeCheck className="w-3.5 h-3.5 text-status-good" aria-hidden="true" />
          <span className="text-xs font-medium text-status-good">
            Inspector verificado
          </span>
        </div>
        {node.contactEmail && (
          <a
            href={`mailto:${node.contactEmail}`}
            className="flex items-center gap-1.5 text-[13px] text-gray-600 hover:underline"
          >
            <Mail className="w-3.5 h-3.5 text-gray-400" aria-hidden="true" />
            {node.contactEmail}
          </a>
        )}
        {node.contactPhone && (
          <a
            href={`tel:${node.contactPhone}`}
            className="flex items-center gap-1.5 text-[13px] text-gray-600 hover:underline"
          >
            <Phone className="w-3.5 h-3.5 text-gray-400" aria-hidden="true" />
            {node.contactPhone}
          </a>
        )}
        <Link
          href={`/inspector/${node.slug}`}
          className="inline-flex items-center gap-1 text-[13px] font-medium text-brand-accent hover:underline"
        >
          <ExternalLink className="w-3.5 h-3.5" aria-hidden="true" />
          Ver perfil del inspector
        </Link>
      </div>
    </div>
  );
}

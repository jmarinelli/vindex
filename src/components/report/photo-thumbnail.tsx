import type { EventPhoto } from "@/db/schema";

interface PhotoThumbnailProps {
  photo: EventPhoto;
  alt: string;
  onClick: () => void;
}

export function PhotoThumbnail({ photo, alt, onClick }: PhotoThumbnailProps) {
  return (
    <button
      type="button"
      className="shrink-0 w-16 h-16 sm:w-20 sm:h-20 lg:w-[100px] lg:h-[100px] rounded-sm border border-gray-200 overflow-hidden cursor-pointer hover:opacity-80 transition-opacity"
      onClick={onClick}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={photo.url}
        alt={alt}
        className="w-full h-full object-cover"
        loading="lazy"
      />
    </button>
  );
}

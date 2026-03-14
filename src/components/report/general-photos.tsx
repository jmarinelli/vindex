import type { EventPhoto } from "@/db/schema";
import { PhotoThumbnail } from "./photo-thumbnail";

interface GeneralPhotosProps {
  photos: EventPhoto[];
  onPhotoClick: (photoUrl: string, allPhotos: EventPhoto[]) => void;
}

export function GeneralPhotos({ photos, onPhotoClick }: GeneralPhotosProps) {
  if (photos.length === 0) return null;

  return (
    <div className="flex flex-col gap-3">
      <h3 className="text-base font-semibold text-gray-800">
        Fotos generales
      </h3>
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-2">
        {photos.map((photo, idx) => (
          <button
            key={photo.id}
            type="button"
            className="aspect-[4/3] rounded-sm border border-gray-200 overflow-hidden cursor-pointer hover:opacity-80 transition-opacity"
            onClick={() => onPhotoClick(photo.url, photos)}
          >
            <img
              src={photo.url}
              alt={`Foto general ${idx + 1}`}
              className="w-full h-full object-cover"
              loading="lazy"
            />
          </button>
        ))}
      </div>
    </div>
  );
}

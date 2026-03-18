"use client";

const CLOUD_NAME = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME ?? "";
const UPLOAD_PRESET = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET ?? "";

export async function uploadToCloudinary(params: {
  blob: Blob;
  eventId: string;
  photoType: "finding" | "vehicle";
  photoId: string;
}): Promise<string> {
  const formData = new FormData();
  formData.append("file", params.blob);
  formData.append("upload_preset", UPLOAD_PRESET);
  formData.append("folder", `vindex/events/${params.eventId}`);
  formData.append("public_id", `${params.photoType}-${params.photoId}`);

  const response = await fetch(
    `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`,
    { method: "POST", body: formData }
  );

  if (!response.ok) {
    throw new Error(`Cloudinary upload failed: ${response.status}`);
  }

  const data = await response.json();
  return data.secure_url;
}

export async function uploadNodeLogo(params: {
  blob: Blob;
  nodeId: string;
}): Promise<string> {
  const formData = new FormData();
  formData.append("file", params.blob);
  formData.append("upload_preset", UPLOAD_PRESET);
  formData.append("folder", `vindex/inspectors/${params.nodeId}`);
  formData.append("public_id", `logo-${crypto.randomUUID()}`);

  const response = await fetch(
    `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`,
    { method: "POST", body: formData }
  );

  if (!response.ok) {
    throw new Error(`Cloudinary upload failed: ${response.status}`);
  }

  const data = await response.json();
  return data.secure_url;
}

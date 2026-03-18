"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { ArrowLeft, Upload, Trash2, Loader2 } from "lucide-react";
import { toast } from "sonner";
import type { Node } from "@/db/schema";
import {
  updateNodeBrandingAction,
  updateNodeLogoAction,
} from "@/lib/actions/node";
import { uploadNodeLogo } from "@/lib/services/cloudinary";
import { compressImage } from "@/offline/photo-queue";

const HEX_REGEX = /^#[0-9A-Fa-f]{6}$/;
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ACCEPTED_TYPES = ["image/jpeg", "image/png", "image/webp"];

interface SettingsFormProps {
  node: Node;
}

export function SettingsForm({ node }: SettingsFormProps) {
  // ─── Form State ──────────────────────────────────────────────────────
  const [contactEmail, setContactEmail] = useState(node.contactEmail);
  const [contactPhone, setContactPhone] = useState(node.contactPhone ?? "");
  const [address, setAddress] = useState(node.address ?? "");
  const [bio, setBio] = useState(node.bio ?? "");
  const [brandColor, setBrandColor] = useState(node.brandColor ?? "");
  const [brandAccent, setBrandAccent] = useState(node.brandAccent ?? "");

  // ─── Logo State ──────────────────────────────────────────────────────
  const [logoUrl, setLogoUrl] = useState(node.logoUrl);
  const [logoUploading, setLogoUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ─── Save State ──────────────────────────────────────────────────────
  const [saving, setSaving] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Track if form is dirty
  const isDirty =
    contactEmail !== node.contactEmail ||
    contactPhone !== (node.contactPhone ?? "") ||
    address !== (node.address ?? "") ||
    bio !== (node.bio ?? "") ||
    brandColor !== (node.brandColor ?? "") ||
    brandAccent !== (node.brandAccent ?? "");

  // ─── Color sync helpers ──────────────────────────────────────────────
  const [brandColorText, setBrandColorText] = useState(brandColor);
  const [brandAccentText, setBrandAccentText] = useState(brandAccent);

  useEffect(() => {
    setBrandColorText(brandColor);
  }, [brandColor]);

  useEffect(() => {
    setBrandAccentText(brandAccent);
  }, [brandAccent]);

  // ─── Handlers ────────────────────────────────────────────────────────

  async function handleSave() {
    setSaving(true);
    try {
      const result = await updateNodeBrandingAction({
        contactEmail,
        contactPhone: contactPhone || null,
        address: address || null,
        bio: bio || null,
        brandColor: brandColor || null,
        brandAccent: brandAccent || null,
      });

      if (result.success) {
        toast.success("Cambios guardados");
        // Update the "initial" values so isDirty resets
        node.contactEmail = contactEmail;
        node.contactPhone = contactPhone || null;
        node.address = address || null;
        node.bio = bio || null;
        node.brandColor = brandColor || null;
        node.brandAccent = brandAccent || null;
      } else {
        toast.error(result.error ?? "Error al guardar");
      }
    } catch {
      toast.error("Error al guardar los cambios");
    } finally {
      setSaving(false);
    }
  }

  async function handleLogoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    // Reset input so re-selecting same file triggers change
    e.target.value = "";

    if (!ACCEPTED_TYPES.includes(file.type)) {
      toast.error("Solo se aceptan imágenes JPG, PNG o WebP");
      return;
    }

    if (file.size > MAX_FILE_SIZE) {
      toast.error("La imagen no puede superar los 5MB");
      return;
    }

    setLogoUploading(true);
    try {
      const compressed = await compressImage(file, 512, 0.85);
      const url = await uploadNodeLogo({ blob: compressed, nodeId: node.id });
      const result = await updateNodeLogoAction({ logoUrl: url });
      if (result.success) {
        setLogoUrl(url);
        toast.success("Logo actualizado");
      } else {
        toast.error(result.error ?? "Error al guardar el logo");
      }
    } catch {
      toast.error("Error al subir el logo");
    } finally {
      setLogoUploading(false);
    }
  }

  async function handleLogoRemove() {
    setShowDeleteConfirm(false);
    setLogoUploading(true);
    try {
      const result = await updateNodeLogoAction({ logoUrl: null });
      if (result.success) {
        setLogoUrl(null);
        toast.success("Logo eliminado");
      } else {
        toast.error(result.error ?? "Error al eliminar el logo");
      }
    } catch {
      toast.error("Error al eliminar el logo");
    } finally {
      setLogoUploading(false);
    }
  }

  return (
    <div className="space-y-6 pb-24 sm:pb-6">
      {/* Back Link */}
      <Link
        href="/dashboard"
        className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700"
      >
        <ArrowLeft className="h-4 w-4" />
        Volver al dashboard
      </Link>

      {/* ─── Logo e Identidad ──────────────────────────────────────────── */}
      <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-4 sm:p-6 space-y-4">
        <h2 className="text-lg font-semibold text-gray-800">
          Logo e identidad
        </h2>

        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4">
          {/* Logo preview */}
          <div className="relative shrink-0">
            {logoUrl ? (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img
                src={logoUrl}
                alt={`Logo de ${node.displayName}`}
                className="w-16 h-16 sm:w-20 sm:h-20 rounded-lg border border-gray-200 object-cover"
              />
            ) : (
              <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-lg bg-gray-100 flex items-center justify-center">
                <span className="text-2xl sm:text-3xl font-bold text-gray-400">
                  {node.displayName.charAt(0).toUpperCase()}
                </span>
              </div>
            )}
            {logoUploading && (
              <div className="absolute inset-0 bg-white/70 flex items-center justify-center rounded-lg">
                <Loader2 className="h-5 w-5 animate-spin text-gray-500" />
              </div>
            )}
          </div>

          <div className="flex flex-col items-center sm:items-start gap-2">
            <p className="text-base font-medium text-gray-800">
              {node.displayName}
            </p>

            {/* Avatar preview */}
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-500">Avatar:</span>
              {logoUrl ? (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img
                  src={logoUrl}
                  alt="Avatar preview"
                  className="w-8 h-8 rounded-full object-cover border border-gray-200"
                />
              ) : (
                <div className="w-8 h-8 rounded-full bg-brand-primary flex items-center justify-center">
                  <span className="text-white text-xs font-medium">
                    {node.displayName.slice(0, 2).toUpperCase()}
                  </span>
                </div>
              )}
            </div>

            <div className="flex gap-2 mt-1">
              <button
                type="button"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-md hover:bg-gray-50 disabled:opacity-50"
                onClick={() => fileInputRef.current?.click()}
                disabled={logoUploading}
              >
                <Upload className="h-3.5 w-3.5" />
                Cambiar logo
              </button>
              {logoUrl && (
                <button
                  type="button"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-red-600 bg-white border border-gray-200 rounded-md hover:bg-red-50 disabled:opacity-50"
                  onClick={() => setShowDeleteConfirm(true)}
                  disabled={logoUploading}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  Eliminar
                </button>
              )}
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="hidden"
              onChange={handleLogoUpload}
            />
          </div>
        </div>
      </div>

      {/* ─── Colores de Marca ──────────────────────────────────────────── */}
      <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-4 sm:p-6 space-y-4">
        <h2 className="text-lg font-semibold text-gray-800">
          Colores de marca
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Primary Color */}
          <div className="space-y-1.5">
            <label htmlFor="brandColor" className="text-sm font-medium text-gray-700">
              Color primario
            </label>
            <div className="flex items-center gap-2">
              <input
                type="color"
                id="brandColorPicker"
                value={brandColor || "#1E293B"}
                onChange={(e) => {
                  setBrandColor(e.target.value);
                  setBrandColorText(e.target.value);
                }}
                className="w-10 h-10 rounded border border-gray-200 cursor-pointer p-0.5"
              />
              <input
                type="text"
                id="brandColor"
                value={brandColorText}
                onChange={(e) => {
                  setBrandColorText(e.target.value);
                  if (HEX_REGEX.test(e.target.value)) {
                    setBrandColor(e.target.value);
                  }
                }}
                placeholder="#1E293B"
                className="flex-1 h-10 px-3 text-sm border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                maxLength={7}
              />
            </div>
          </div>

          {/* Accent Color */}
          <div className="space-y-1.5">
            <label htmlFor="brandAccent" className="text-sm font-medium text-gray-700">
              Color de acento
            </label>
            <div className="flex items-center gap-2">
              <input
                type="color"
                id="brandAccentPicker"
                value={brandAccent || "#0EA5E9"}
                onChange={(e) => {
                  setBrandAccent(e.target.value);
                  setBrandAccentText(e.target.value);
                }}
                className="w-10 h-10 rounded border border-gray-200 cursor-pointer p-0.5"
              />
              <input
                type="text"
                id="brandAccent"
                value={brandAccentText}
                onChange={(e) => {
                  setBrandAccentText(e.target.value);
                  if (HEX_REGEX.test(e.target.value)) {
                    setBrandAccent(e.target.value);
                  }
                }}
                placeholder="#0EA5E9"
                className="flex-1 h-10 px-3 text-sm border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                maxLength={7}
              />
            </div>
          </div>
        </div>

        {/* Live Preview */}
        <div className="mt-2">
          <p className="text-xs text-gray-500 mb-2">Vista previa</p>
          <div
            className="border border-gray-200 rounded-md p-3"
            style={{ borderTopWidth: 3, borderTopColor: brandColor || "#1E293B" }}
          >
            <p className="text-sm text-gray-700">Ejemplo de tarjeta con borde primario</p>
            <a
              href="#"
              className="text-sm font-medium mt-1 inline-block"
              style={{ color: brandAccent || "#0EA5E9" }}
              onClick={(e) => e.preventDefault()}
            >
              Enlace con color de acento →
            </a>
          </div>
        </div>

        <p className="text-xs text-gray-400">
          Para restaurar los colores por defecto, dejá los campos vacíos y guardá.
        </p>
      </div>

      {/* ─── Información de Contacto ──────────────────────────────────── */}
      <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-4 sm:p-6 space-y-4">
        <h2 className="text-lg font-semibold text-gray-800">
          Información de contacto
        </h2>

        <div className="space-y-4">
          {/* Email */}
          <div className="space-y-1.5">
            <label htmlFor="contactEmail" className="text-sm font-medium text-gray-700">
              Email <span className="text-red-500">*</span>
            </label>
            <input
              type="email"
              id="contactEmail"
              value={contactEmail}
              onChange={(e) => setContactEmail(e.target.value)}
              required
              className="w-full h-10 px-3 text-sm border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Phone */}
          <div className="space-y-1.5">
            <label htmlFor="contactPhone" className="text-sm font-medium text-gray-700">
              Teléfono
            </label>
            <input
              type="tel"
              id="contactPhone"
              value={contactPhone}
              onChange={(e) => setContactPhone(e.target.value)}
              className="w-full h-10 px-3 text-sm border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Address */}
          <div className="space-y-1.5">
            <label htmlFor="address" className="text-sm font-medium text-gray-700">
              Dirección
            </label>
            <input
              type="text"
              id="address"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className="w-full h-10 px-3 text-sm border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              maxLength={500}
            />
          </div>

          {/* Bio */}
          <div className="space-y-1.5">
            <label htmlFor="bio" className="text-sm font-medium text-gray-700">
              Bio
            </label>
            <textarea
              id="bio"
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              rows={3}
              maxLength={500}
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
            />
            <p className="text-xs text-gray-400 text-right">
              {bio.length}/500
            </p>
          </div>
        </div>
      </div>

      {/* ─── Save Button ──────────────────────────────────────────────── */}
      {/* Desktop: static */}
      <div className="hidden sm:block">
        <button
          type="button"
          onClick={handleSave}
          disabled={!isDirty || saving}
          className="w-full h-12 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-200 disabled:text-gray-400 text-white font-medium rounded-md transition-colors flex items-center justify-center gap-2"
        >
          {saving && <Loader2 className="h-4 w-4 animate-spin" />}
          Guardar cambios
        </button>
      </div>

      {/* Mobile: sticky bottom */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t border-gray-200 sm:hidden z-40">
        <button
          type="button"
          onClick={handleSave}
          disabled={!isDirty || saving}
          className="w-full h-12 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-200 disabled:text-gray-400 text-white font-medium rounded-md transition-colors flex items-center justify-center gap-2"
        >
          {saving && <Loader2 className="h-4 w-4 animate-spin" />}
          Guardar cambios
        </button>
      </div>

      {/* ─── Delete Confirm Dialog ────────────────────────────────────── */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-sm w-full p-6 space-y-4">
            <h3 className="text-lg font-semibold text-gray-800">
              ¿Eliminar logo?
            </h3>
            <p className="text-sm text-gray-600">
              Se eliminará el logo y se mostrará la inicial como avatar.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                type="button"
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-md hover:bg-gray-50"
                onClick={() => setShowDeleteConfirm(false)}
              >
                Cancelar
              </button>
              <button
                type="button"
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700"
                onClick={handleLogoRemove}
              >
                Eliminar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

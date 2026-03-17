"use client";

import { useState, useTransition } from "react";
import { Check, Loader2 } from "lucide-react";
import { contactFormSchema } from "@/lib/validators";
import { submitContactFormAction } from "@/lib/actions/contact";
import { toast } from "sonner";

type FieldErrors = Partial<Record<"name" | "email" | "phone" | "message", string>>;

export function ContactForm() {
  const [isPending, startTransition] = useTransition();
  const [success, setSuccess] = useState(false);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    message: "",
  });

  function handleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name as keyof FieldErrors]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    const parsed = contactFormSchema.safeParse(formData);
    if (!parsed.success) {
      const fieldErrors: FieldErrors = {};
      for (const issue of parsed.error.issues) {
        const field = issue.path[0] as keyof FieldErrors;
        if (!fieldErrors[field]) {
          fieldErrors[field] = issue.message;
        }
      }
      setErrors(fieldErrors);
      return;
    }

    setErrors({});
    startTransition(async () => {
      const result = await submitContactFormAction(parsed.data);
      if (result.success) {
        setSuccess(true);
        setTimeout(() => {
          setSuccess(false);
          setFormData({ name: "", email: "", phone: "", message: "" });
        }, 3000);
      } else {
        toast.error(result.error || "Error al enviar. Intentá de nuevo.");
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
      <FormField
        label="Nombre"
        name="name"
        type="text"
        placeholder="Tu nombre"
        value={formData.name}
        onChange={handleChange}
        error={errors.name}
        disabled={isPending}
        required
      />
      <FormField
        label="Email"
        name="email"
        type="email"
        placeholder="tu@email.com"
        value={formData.email}
        onChange={handleChange}
        error={errors.email}
        disabled={isPending}
        required
      />
      <FormField
        label="Teléfono (opcional)"
        name="phone"
        type="tel"
        placeholder="+54 11 1234-5678"
        value={formData.phone}
        onChange={handleChange}
        error={errors.phone}
        disabled={isPending}
      />
      <div className="flex flex-col gap-1.5">
        <label htmlFor="message" className="text-sm font-medium text-gray-700">
          Mensaje
        </label>
        <textarea
          id="message"
          name="message"
          placeholder="Contanos sobre tu taller o servicio de verificación..."
          value={formData.message}
          onChange={handleChange}
          disabled={isPending}
          required
          rows={3}
          aria-describedby={errors.message ? "message-error" : undefined}
          className={`w-full rounded-sm border px-3 py-3 text-base leading-relaxed placeholder:text-gray-400 focus:outline-none focus:border-brand-accent focus:ring-2 focus:ring-brand-accent/50 disabled:opacity-50 resize-none ${
            errors.message ? "border-error" : "border-gray-200"
          }`}
        />
        {errors.message && (
          <p id="message-error" className="text-xs text-error">
            {errors.message}
          </p>
        )}
      </div>

      <button
        type="submit"
        disabled={isPending || success}
        className={`w-full h-12 rounded-sm font-semibold text-base text-white transition-colors disabled:opacity-70 ${
          success
            ? "bg-success"
            : "bg-brand-primary hover:bg-brand-primary-hover"
        }`}
        aria-busy={isPending}
      >
        {isPending ? (
          <span className="inline-flex items-center gap-2">
            <Loader2 className="size-4 animate-spin" />
            Enviando...
          </span>
        ) : success ? (
          <span className="inline-flex items-center gap-2">
            <Check className="size-4" />
            ¡Mensaje enviado!
          </span>
        ) : (
          "Enviar mensaje"
        )}
      </button>
    </form>
  );
}

function FormField({
  label,
  name,
  type,
  placeholder,
  value,
  onChange,
  error,
  disabled,
  required,
}: {
  label: string;
  name: string;
  type: string;
  placeholder: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  error?: string;
  disabled?: boolean;
  required?: boolean;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={name} className="text-sm font-medium text-gray-700">
        {label}
      </label>
      <input
        id={name}
        name={name}
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        disabled={disabled}
        required={required}
        aria-describedby={error ? `${name}-error` : undefined}
        className={`h-10 w-full rounded-sm border px-3 text-base placeholder:text-gray-400 focus:outline-none focus:border-brand-accent focus:ring-2 focus:ring-brand-accent/50 disabled:opacity-50 ${
          error ? "border-error" : "border-gray-200"
        }`}
      />
      {error && (
        <p id={`${name}-error`} className="text-xs text-error">
          {error}
        </p>
      )}
    </div>
  );
}

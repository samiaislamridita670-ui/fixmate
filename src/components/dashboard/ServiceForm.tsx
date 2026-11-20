"use client";

import { useState, type FormEvent } from "react";
import { api } from "@/lib/api";
import { SERVICE_CATEGORIES, SERVICE_MODES } from "@/lib/constants";
import Button from "@/components/ui/Button";
import { useToast } from "@/components/Toast";

export interface ServiceFormValues {
  title: string;
  category: string;
  description: string;
  image: string;
  basePrice: string;
  estimatedDuration: string;
  serviceMode: string;
  serviceArea: string;
}

export const EMPTY_SERVICE_FORM: ServiceFormValues = {
  title: "",
  category: String(SERVICE_CATEGORIES[0]),
  description: "",
  image: "",
  basePrice: "",
  estimatedDuration: "",
  serviceMode: String(SERVICE_MODES[0]),
  serviceArea: "",
};

interface ServiceFormProps {
  initialValue?: ServiceFormValues;
  submitLabel: string;
  submitting?: boolean;
  onSubmit: (values: ServiceFormValues) => Promise<void> | void;
  footerNote?: string;
}

/** Shared create/edit form for technician services (ImgBB upload included). */
export default function ServiceForm({
  initialValue = EMPTY_SERVICE_FORM,
  submitLabel,
  submitting = false,
  onSubmit,
  footerNote,
}: ServiceFormProps) {
  const toast = useToast();
  const [form, setForm] = useState<ServiceFormValues>(initialValue);
  const [uploading, setUploading] = useState(false);
  const [localError, setLocalError] = useState("");

  function update<K extends keyof ServiceFormValues>(key: K, value: ServiceFormValues[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  async function handleImageUpload(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    setLocalError("");

    if (!file.type.startsWith("image/")) {
      setLocalError("Please select a valid image file.");
      event.target.value = "";
      return;
    }
    if (file.size > 4 * 1024 * 1024) {
      setLocalError("Image must be 4MB or smaller.");
      event.target.value = "";
      return;
    }

    setUploading(true);
    try {
      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () =>
          typeof reader.result === "string"
            ? resolve(reader.result)
            : reject(new Error("Could not read the image."));
        reader.onerror = () => reject(new Error("Could not read the image."));
        reader.readAsDataURL(file);
      });

      const data = await api.post<{ imageUrl?: string }>("/api/services/upload-image", {
        imageBase64: base64,
      });
      if (!data?.imageUrl) throw new Error("Upload failed.");
      update("image", data.imageUrl);
      toast.success("Image uploaded to ImgBB.");
    } catch (err) {
      setLocalError(err instanceof Error ? err.message : "Image upload failed.");
    } finally {
      setUploading(false);
      event.target.value = "";
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLocalError("");

    if (!form.title.trim() || form.title.trim().length < 3) {
      setLocalError("Title must be at least 3 characters.");
      return;
    }
    if (form.description.trim().length < 20) {
      setLocalError("Description must contain at least 20 characters.");
      return;
    }
    if (!form.image) {
      setLocalError("Please upload a service image first.");
      return;
    }
    const price = Number(form.basePrice);
    if (!Number.isFinite(price) || price <= 0) {
      setLocalError("Base price must be greater than zero.");
      return;
    }
    if (!form.estimatedDuration.trim() || !form.serviceArea.trim()) {
      setLocalError("Estimated duration and service area are required.");
      return;
    }

    await onSubmit(form);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5" noValidate>
      <div className="grid gap-5 md:grid-cols-2">
        <div className="md:col-span-2">
          <label htmlFor="svc-title" className="label">
            Service title *
          </label>
          <input
            id="svc-title"
            className="input"
            required
            minLength={3}
            maxLength={100}
            placeholder="e.g. Smartphone screen replacement"
            value={form.title}
            onChange={(event) => update("title", event.target.value)}
          />
        </div>

        <div>
          <label htmlFor="svc-category" className="label">
            Category *
          </label>
          <select
            id="svc-category"
            className="input"
            value={form.category}
            onChange={(event) => update("category", event.target.value)}
          >
            {SERVICE_CATEGORIES.map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="svc-price" className="label">
            Base price (USD) *
          </label>
          <input
            id="svc-price"
            type="number"
            className="input"
            required
            min={1}
            step="0.01"
            placeholder="e.g. 45"
            value={form.basePrice}
            onChange={(event) => update("basePrice", event.target.value)}
          />
        </div>

        <div>
          <label htmlFor="svc-duration" className="label">
            Estimated duration *
          </label>
          <input
            id="svc-duration"
            className="input"
            required
            placeholder="e.g. 45–60 minutes"
            value={form.estimatedDuration}
            onChange={(event) => update("estimatedDuration", event.target.value)}
          />
        </div>

        <div>
          <label htmlFor="svc-mode" className="label">
            Service mode *
          </label>
          <select
            id="svc-mode"
            className="input"
            value={form.serviceMode}
            onChange={(event) => update("serviceMode", event.target.value)}
          >
            {SERVICE_MODES.map((mode) => (
              <option key={mode} value={mode}>
                {mode}
              </option>
            ))}
          </select>
        </div>

        <div className="md:col-span-2">
          <label htmlFor="svc-area" className="label">
            Service area *
          </label>
          <input
            id="svc-area"
            className="input"
            required
            placeholder="e.g. Dhaka (Dhanmondi, Gulshan, Mirpur)"
            value={form.serviceArea}
            onChange={(event) => update("serviceArea", event.target.value)}
          />
        </div>

        <div className="md:col-span-2">
          <label htmlFor="svc-description" className="label">
            Description *
          </label>
          <textarea
            id="svc-description"
            className="input min-h-32"
            required
            minLength={20}
            maxLength={2000}
            placeholder="Describe what the service includes, required parts and any important details…"
            value={form.description}
            onChange={(event) => update("description", event.target.value)}
          />
          <p className="mt-1.5 text-right text-xs text-slate-400">
            {form.description.length}/2000 (minimum 20)
          </p>
        </div>

        <div className="md:col-span-2">
          <label htmlFor="svc-image" className="label">
            Service image * (max 4MB, uploaded to ImgBB)
          </label>
          <input
            id="svc-image"
            type="file"
            accept="image/*"
            className="input cursor-pointer"
            onChange={handleImageUpload}
            disabled={uploading}
          />
          {uploading && (
            <p className="mt-2 text-sm font-semibold text-emerald-700">
              Uploading image to ImgBB…
            </p>
          )}
          {form.image && (
            <div className="mt-3 flex items-center gap-3">
              <img onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = "/images/image-fallback.svg"; }}
                src={form.image}
                alt="Service preview"
                className="h-24 w-32 rounded-lg border border-slate-200 object-cover"
              />
              <div>
                <p className="text-sm font-bold text-emerald-700">✓ Image ready</p>
                <button
                  type="button"
                  className="mt-1 text-xs font-bold text-red-600 hover:underline"
                  onClick={() => update("image", "")}
                >
                  Remove image
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {localError && (
        <div
          className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-700"
          role="alert"
        >
          {localError}
        </div>
      )}

      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-5">
        <p className="text-xs leading-5 text-slate-500">
          {footerNote || "New services are submitted for admin approval."}
        </p>
        <Button type="submit" loading={submitting || uploading}>
          {submitLabel}
        </Button>
      </div>
    </form>
  );
}


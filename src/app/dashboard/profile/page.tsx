"use client";

import { useEffect, useState, type FormEvent } from "react";
import { authClient } from "@/lib/auth-client";
import { api } from "@/lib/api";
import { ROLE_META } from "@/lib/constants";
import type { AppUser } from "@/lib/types";
import { RoleBadge } from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import { ErrorState, PageLoader } from "@/components/ui/Feedback";
import { useToast } from "@/components/Toast";

export default function ProfilePage() {
  const toast = useToast();
  const { data: session, isPending, refetch } = authClient.useSession();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("customer");
  const [phone, setPhone] = useState("");
  const [area, setArea] = useState("");
  const [bio, setBio] = useState("");
  const [image, setImage] = useState("");

  useEffect(() => {
    if (isPending) return;
    let cancelled = false;

    async function loadProfile() {
      try {
        const data = await api.get<{ user?: AppUser }>("/api/users/me");
        const user = data?.user;
        if (!user || cancelled) return;
        setName(user.name || "");
        setEmail(user.email || "");
        setRole(String(user.role || "customer"));
        setPhone(user.phone || "");
        setArea(user.area || "");
        setBio(user.bio || "");
        setImage(user.image || "");
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Could not load your profile.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadProfile();
    return () => {
      cancelled = true;
    };
  }, [isPending]);

  async function handleImageUpload(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Please choose a valid image file.");
      event.target.value = "";
      return;
    }
    if (file.size > 4 * 1024 * 1024) {
      toast.error("Image must be 4MB or smaller.");
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

      const data = await api.post<{ imageUrl?: string }>("/api/users/upload-image", {
        imageBase64: base64,
      });
      if (!data?.imageUrl) throw new Error("Upload failed.");
      setImage(data.imageUrl);
      toast.success("Profile photo uploaded.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Image upload failed.");
    } finally {
      setUploading(false);
      event.target.value = "";
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (name.trim().length < 2) {
      toast.error("Please enter your full name.");
      return;
    }

    setSaving(true);
    try {
      await api.patch("/api/users/me", {
        name: name.trim(),
        phone: phone.trim(),
        area: area.trim(),
        bio: bio.trim(),
        image,
      });

      // Sync the BetterAuth session so the navbar updates immediately.
      try {
        await authClient.updateUser({ name: name.trim(), image });
      } catch {
        /* session refresh fallback below */
      }
      await refetch?.();
      toast.success("Profile updated successfully.");
      setError("");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Could not update the profile.";
      setError(message);
      toast.error(message);
    } finally {
      setSaving(false);
    }
  }

  if (isPending || loading) {
    return (
      <div className="space-y-4">
        <div className="skeleton h-8 w-48 rounded-lg" />
        <div className="skeleton h-96 w-full rounded-2xl" />
        <PageLoader label="Loading your profile…" />
      </div>
    );
  }

  if (!session) return null;

  const roleMeta = ROLE_META[role as keyof typeof ROLE_META];

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs font-black uppercase tracking-widest text-emerald-600">
          Account settings
        </p>
        <h1 className="mt-2 text-2xl font-black tracking-tight text-slate-950 sm:text-3xl">
          My Profile
        </h1>
        <p className="mt-1.5 text-sm text-slate-500">
          Email and role are managed by FixMate and cannot be changed here.
        </p>
      </div>

      {error && <ErrorState description={error} />}

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Avatar card */}
        <section className="card card-pad self-start text-center">
          <div className="relative mx-auto h-28 w-28">
            {image ? (
              <img onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = "/images/image-fallback.svg"; }}
                src={image}
                alt=""
                className="h-28 w-28 rounded-full border-4 border-emerald-100 object-cover"
              />
            ) : (
              <div className="flex h-28 w-28 items-center justify-center rounded-full border-4 border-emerald-100 bg-emerald-600 text-4xl font-black text-white">
                {name?.charAt(0)?.toUpperCase() || "U"}
              </div>
            )}
            {uploading && (
              <span className="absolute inset-0 flex items-center justify-center rounded-full bg-slate-950/50 text-xs font-bold text-white">
                Uploading…
              </span>
            )}
          </div>

          <h2 className="mt-4 text-lg font-black text-slate-950">{name || "—"}</h2>
          <p className="truncate text-sm text-slate-500">{email}</p>
          <div className="mt-3 flex justify-center">
            <RoleBadge role={role} />
          </div>

          <label className="btn btn-outline btn-sm mt-5 cursor-pointer">
            {uploading ? "Uploading…" : "Change photo"}
            <input
              type="file"
              accept="image/*"
              className="sr-only"
              onChange={handleImageUpload}
              disabled={uploading}
            />
          </label>
          <p className="hint">JPG or PNG · max 4MB · uploaded via ImgBB</p>

          <div className="mt-5 rounded-xl bg-slate-50 p-4 text-left">
            <p className="text-xs font-black uppercase tracking-wide text-slate-400">
              Account role
            </p>
            <p className="mt-1.5 text-sm font-bold capitalize text-slate-800">
              {roleMeta?.label || role}
            </p>
            <p className="mt-2 text-[11px] leading-5 text-slate-500">
              Need a different role? Contact support — admins assign roles manually.
            </p>
          </div>
        </section>

        {/* Edit form */}
        <form onSubmit={handleSubmit} className="card card-pad space-y-5 lg:col-span-2">
          <h2 className="text-base font-black text-slate-950">Personal information</h2>

          <div className="grid gap-5 sm:grid-cols-2">
            <div>
              <label htmlFor="profile-name" className="label">
                Full name
              </label>
              <input
                id="profile-name"
                value={name}
                onChange={(event) => setName(event.target.value)}
                className="input"
                required
                minLength={2}
                placeholder="Your full name"
              />
            </div>
            <div>
              <label htmlFor="profile-email" className="label">
                Email address
              </label>
              <input
                id="profile-email"
                value={email}
                className="input cursor-not-allowed bg-slate-50 text-slate-500"
                readOnly
                disabled
                title="Email cannot be changed"
              />
              <p className="hint">Read-only · verified by BetterAuth</p>
            </div>
            <div>
              <label htmlFor="profile-phone" className="label">
                Phone number
              </label>
              <input
                id="profile-phone"
                type="tel"
                value={phone}
                onChange={(event) => setPhone(event.target.value)}
                className="input"
                placeholder="+880 1XXXXXXXXX"
              />
            </div>
            <div>
              <label htmlFor="profile-area" className="label">
                Area / District
              </label>
              <input
                id="profile-area"
                value={area}
                onChange={(event) => setArea(event.target.value)}
                className="input"
                placeholder="e.g. Dhanmondi, Dhaka"
              />
            </div>
          </div>

          <div>
            <label htmlFor="profile-bio" className="label">
              Bio
            </label>
            <textarea
              id="profile-bio"
              value={bio}
              onChange={(event) => setBio(event.target.value)}
              rows={4}
              maxLength={500}
              className="input"
              placeholder="Tell customers a little about you (for technicians: your experience and specialties)…"
            />
            <p className="mt-1.5 text-right text-xs text-slate-400">{bio.length}/500</p>
          </div>

          <div>
            <label className="label">Role</label>
            <input
              value={roleMeta?.label || role}
              className="input cursor-not-allowed bg-slate-50 text-slate-500"
              readOnly
              disabled
            />
            <p className="hint">Read-only · changed by FixMate administrators</p>
          </div>

          <div className="flex justify-end gap-3 border-t border-slate-100 pt-5">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setName(session.user.name);
                setEmail(session.user.email);
                setPhone(String((session.user as { phone?: string }).phone || ""));
                setArea(String((session.user as { area?: string }).area || ""));
                setBio(String((session.user as { bio?: string }).bio || ""));
                setImage(session.user.image || "");
              }}
            >
              Reset
            </Button>
            <Button type="submit" loading={saving}>
              {saving ? "Saving…" : "Save Changes"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}


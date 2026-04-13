"use client";

import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import { clientApiFetch } from "@/lib/api";
import type { EmployeePublic } from "@business-profile/shared";
import Image from "next/image";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

interface Props {
  employee?: EmployeePublic;
}

interface SocialLinkInput {
  platform: string;
  url: string;
}

const inputClass =
  "w-full px-3.5 py-2.5 bg-surface-raised border rounded-lg text-ink text-sm placeholder:text-ink-tertiary focus:outline-none focus:ring-2 focus:ring-accent focus:border-accent transition-colors";

export function EmployeeForm({ employee }: Props) {
  const router = useRouter();
  const isEdit = !!employee;

  const [form, setForm] = useState({
    full_name: employee?.full_name ?? "",
    designation: employee?.designation ?? "",
    bio: employee?.bio ?? "",
    email: employee?.email ?? "",
    phone: employee?.phone ?? "",
    linkedin_url: employee?.linkedin_url ?? "",
    website_url: employee?.website_url ?? "",
    address: employee?.address ?? "",
  });

  const [socialLinks, setSocialLinks] = useState<SocialLinkInput[]>(
    employee?.social_links?.map((s) => ({
      platform: s.platform,
      url: s.url,
    })) ?? [],
  );

  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(
    employee?.profile_image ? `${API_URL}${employee.profile_image}` : null,
  );
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  function handleChange(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  function handleImageChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  }

  function addSocialLink() {
    setSocialLinks((prev) => [...prev, { platform: "", url: "" }]);
  }

  function updateSocialLink(
    index: number,
    field: keyof SocialLinkInput,
    value: string,
  ) {
    setSocialLinks((prev) =>
      prev.map((s, i) => (i === index ? { ...s, [field]: value } : s)),
    );
  }

  function removeSocialLink(index: number) {
    setSocialLinks((prev) => prev.filter((_, i) => i !== index));
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setSaving(true);

    try {
      const fd = new FormData();
      Object.entries(form).forEach(([key, val]) => {
        if (val) fd.append(key, val);
      });

      const validLinks = socialLinks.filter((s) => s.platform && s.url);
      if (validLinks.length > 0) {
        fd.append("social_links", JSON.stringify(validLinks));
      }

      if (imageFile) {
        fd.append("profile_image", imageFile);
      }

      if (isEdit) {
        await clientApiFetch(`/employees/${employee.id}`, {
          method: "PUT",
          body: fd,
        });
      } else {
        await clientApiFetch("/employees", {
          method: "POST",
          body: fd,
        });
      }

      router.push("/admin");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-2xl mx-auto">
      {error && (
        <div className="mb-8 py-3 px-4 bg-danger-subtle text-danger text-sm rounded-lg">
          {error}
        </div>
      )}

      {/* ── Section: Profile ── */}
      <fieldset className="space-y-6">
        <legend className="text-[11px] font-semibold tracking-[0.15em] uppercase text-ink-tertiary mb-5">
          Profile
        </legend>

        {/* Image upload */}
        <label className="flex items-center gap-5 cursor-pointer group">
          {imagePreview ? (
            <Image
              src={imagePreview}
              alt="Preview"
              width={80}
              height={80}
              className="w-20 h-20 rounded-xl object-cover"
            />
          ) : (
            <div className="w-20 h-20 rounded-xl border-2 border-dashed border-[var(--border-strong)] flex flex-col items-center justify-center text-ink-tertiary group-hover:border-accent group-hover:text-accent transition-colors">
              <svg
                className="w-5 h-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={1.5}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5"
                />
              </svg>
              <span className="text-[10px] mt-1 font-medium">Upload</span>
            </div>
          )}
          <div>
            <p className="text-sm font-medium text-ink-secondary group-hover:text-ink transition-colors">
              Profile photo
            </p>
            <p className="text-xs text-ink-tertiary mt-0.5">
              JPEG, PNG or WebP. Max 5 MB.
            </p>
          </div>
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={handleImageChange}
            className="hidden"
          />
        </label>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <div>
            <label className="block text-sm font-medium text-ink-secondary mb-1.5">
              Full Name *
            </label>
            <input
              required
              value={form.full_name}
              onChange={(e) => handleChange("full_name", e.target.value)}
              className={inputClass}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-ink-secondary mb-1.5">
              Designation *
            </label>
            <input
              required
              value={form.designation}
              onChange={(e) => handleChange("designation", e.target.value)}
              className={inputClass}
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-ink-secondary mb-1.5">
            Bio
          </label>
          <textarea
            rows={3}
            value={form.bio}
            onChange={(e) => handleChange("bio", e.target.value)}
            className={inputClass}
          />
        </div>
      </fieldset>

      {/* ── Section: Contact ── */}
      <fieldset className="mt-10 space-y-5">
        <legend className="text-[11px] font-semibold tracking-[0.15em] uppercase text-ink-tertiary mb-5">
          Contact
        </legend>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <div>
            <label className="block text-sm font-medium text-ink-secondary mb-1.5">
              Email *
            </label>
            <input
              type="email"
              required
              value={form.email}
              onChange={(e) => handleChange("email", e.target.value)}
              className={inputClass}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-ink-secondary mb-1.5">
              Phone *
            </label>
            <input
              required
              value={form.phone}
              onChange={(e) => handleChange("phone", e.target.value)}
              className={inputClass}
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-ink-secondary mb-1.5">
            Address
          </label>
          <input
            value={form.address}
            onChange={(e) => handleChange("address", e.target.value)}
            className={inputClass}
          />
        </div>
      </fieldset>

      {/* ── Section: Links ── */}
      <fieldset className="mt-10 space-y-5">
        <legend className="text-[11px] font-semibold tracking-[0.15em] uppercase text-ink-tertiary mb-5">
          Links
        </legend>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <div>
            <label className="block text-sm font-medium text-ink-secondary mb-1.5">
              LinkedIn URL
            </label>
            <input
              type="url"
              value={form.linkedin_url}
              onChange={(e) => handleChange("linkedin_url", e.target.value)}
              placeholder="https://linkedin.com/in/..."
              className={inputClass}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-ink-secondary mb-1.5">
              Website URL
            </label>
            <input
              type="url"
              value={form.website_url}
              onChange={(e) => handleChange("website_url", e.target.value)}
              placeholder="https://..."
              className={inputClass}
            />
          </div>
        </div>

        {/* Social links */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <label className="block text-sm font-medium text-ink-secondary">
              Social Links
            </label>
            <button
              type="button"
              onClick={addSocialLink}
              className="text-sm font-medium text-accent hover:text-accent-hover transition-colors"
            >
              + Add link
            </button>
          </div>
          <div className="space-y-3">
            {socialLinks.map((link, i) => (
              <div key={i} className="flex gap-3">
                <input
                  placeholder="Platform"
                  value={link.platform}
                  onChange={(e) =>
                    updateSocialLink(i, "platform", e.target.value)
                  }
                  className={`w-1/3 ${inputClass}`}
                />
                <input
                  placeholder="URL"
                  value={link.url}
                  onChange={(e) => updateSocialLink(i, "url", e.target.value)}
                  className={`flex-1 ${inputClass}`}
                />
                <button
                  type="button"
                  onClick={() => removeSocialLink(i)}
                  className="px-3 py-2 text-ink-tertiary hover:text-danger transition-colors"
                >
                  &times;
                </button>
              </div>
            ))}
          </div>
        </div>
      </fieldset>

      {/* Submit */}
      <div className="flex gap-3 mt-10 pt-8 border-t">
        <button
          type="submit"
          disabled={saving}
          className="btn-primary px-6 py-2.5 bg-accent text-surface-raised font-semibold text-sm rounded-lg disabled:opacity-50"
        >
          {saving ? "Saving..." : isEdit ? "Update Employee" : "Create Employee"}
        </button>
        <button
          type="button"
          onClick={() => router.push("/admin")}
          className="px-6 py-2.5 border text-ink-secondary font-medium text-sm rounded-lg hover:bg-accent-subtle transition-colors"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}

"use client";

import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import { clientApiFetch } from "@/lib/api";
import type { EmployeePublic } from "@business-profile/shared";
import Image from "next/image";
import { resolveImageUrl } from "@/lib/image";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { countryCodes } from "@/lib/country-codes";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

interface Props {
  employee?: EmployeePublic;
}

interface SocialLinkInput {
  platform: string;
  url: string;
}

const SOCIAL_PLATFORMS = [
  { key: "linkedin", label: "LinkedIn", icon: "/profile/icon-linkedin.svg", placeholder: "https://linkedin.com/in/username", type: "url" },
  { key: "whatsapp", label: "WhatsApp", icon: "/profile/icon-whatsapp.svg", placeholder: "WhatsApp number with country code (e.g. +919058140003)", type: "tel" },
  { key: "telegram", label: "Telegram", icon: "/profile/icon-telegram.svg", placeholder: "https://t.me/username", type: "url" },
  { key: "website", label: "Website", icon: "/profile/icon-website.svg", placeholder: "https://www.example.com", type: "url" },
  { key: "twitter", label: "X (Twitter)", icon: "/profile/icon-website.svg", placeholder: "https://x.com/username", type: "url" },
  { key: "instagram", label: "Instagram", icon: "/profile/icon-website.svg", placeholder: "https://instagram.com/username", type: "url" },
  { key: "youtube", label: "YouTube", icon: "/profile/icon-website.svg", placeholder: "https://youtube.com/@channel", type: "url" },
  { key: "facebook", label: "Facebook", icon: "/profile/icon-website.svg", placeholder: "https://facebook.com/page", type: "url" },
  { key: "github", label: "GitHub", icon: "/profile/icon-website.svg", placeholder: "https://github.com/username", type: "url" },
] as const;

interface PhoneNumberInput {
  country_code: string;
  number: string;
  label: string;
  is_primary: boolean;
}

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

  // Build initial social profiles from existing data
  function buildInitialProfiles(): Record<string, string> {
    const profiles: Record<string, string> = {};
    if (employee?.linkedin_url) profiles.linkedin = employee.linkedin_url;
    if (employee?.website_url) profiles.website = employee.website_url;
    employee?.social_links?.forEach((s) => {
      const key = s.platform.toLowerCase();
      profiles[key] = s.url;
    });
    return profiles;
  }

  const [socialProfiles, setSocialProfiles] = useState<Record<string, string>>(
    buildInitialProfiles,
  );

  const [socialLinks, setSocialLinks] = useState<SocialLinkInput[]>([]);

  const [phoneNumbers, setPhoneNumbers] = useState<PhoneNumberInput[]>(
    employee?.phone_numbers?.map((p) => ({
      country_code: p.country_code,
      number: p.number,
      label: p.label ?? "",
      is_primary: p.is_primary,
    })) ?? [{ country_code: "+1", number: "", label: "", is_primary: true }],
  );

  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(
    resolveImageUrl(employee?.profile_image),
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

  function addPhoneNumber() {
    setPhoneNumbers((prev) => [
      ...prev,
      { country_code: "+1", number: "", label: "", is_primary: false },
    ]);
  }

  function updatePhoneNumber(
    index: number,
    field: keyof PhoneNumberInput,
    value: string | boolean,
  ) {
    setPhoneNumbers((prev) =>
      prev.map((p, i) => (i === index ? { ...p, [field]: value } : p)),
    );
  }

  function removePhoneNumber(index: number) {
    setPhoneNumbers((prev) => {
      const next = prev.filter((_, i) => i !== index);
      if (next.length > 0 && !next.some((p) => p.is_primary)) {
        next[0].is_primary = true;
      }
      return next;
    });
  }

  function setPrimaryPhone(index: number) {
    setPhoneNumbers((prev) =>
      prev.map((p, i) => ({ ...p, is_primary: i === index })),
    );
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setSaving(true);

    try {
      const fd = new FormData();

      // Set linkedin_url and website_url from social profiles
      const formWithProfiles = {
        ...form,
        linkedin_url: socialProfiles.linkedin || "",
        website_url: socialProfiles.website || "",
      };
      Object.entries(formWithProfiles).forEach(([key, val]) => {
        if (val) fd.append(key, val);
      });

      // Convert social profiles to social_links (exclude linkedin/website — they have dedicated fields)
      const socialLinksFromProfiles = Object.entries(socialProfiles)
        .filter(([key, url]) => url && key !== "linkedin" && key !== "website")
        .map(([key, url]) => {
          const platform = SOCIAL_PLATFORMS.find((p) => p.key === key);
          return { platform: platform?.label ?? key, url };
        });
      if (socialLinksFromProfiles.length > 0) {
        fd.append("social_links", JSON.stringify(socialLinksFromProfiles));
      }

      const validPhones = phoneNumbers.filter((p) => p.number);
      if (validPhones.length > 0) {
        fd.append("phone_numbers", JSON.stringify(validPhones));
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
    <form onSubmit={handleSubmit} className="max-w-2xl mx-auto space-y-6">
      {error && (
        <div className="py-2.5 px-3 bg-destructive/10 text-destructive text-sm rounded-lg">
          {error}
        </div>
      )}

      {/* Profile Section */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Profile</CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          {/* Image upload */}
          <div>
            <Label className="mb-2 block">Profile Photo</Label>
            <label className="flex items-center gap-4 cursor-pointer group">
              {imagePreview ? (
                <Image
                  src={imagePreview}
                  alt="Preview"
                  width={72}
                  height={72}
                  className="w-[72px] h-[72px] rounded-xl object-cover"
                />
              ) : (
                <div className="w-[72px] h-[72px] rounded-xl border-2 border-dashed border-muted-foreground/30 flex flex-col items-center justify-center text-muted-foreground group-hover:border-primary group-hover:text-primary transition-colors">
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
                <p className="text-sm font-medium group-hover:text-primary transition-colors">
                  Choose file
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
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
          </div>

          <Separator />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="full_name">Full Name *</Label>
              <Input
                id="full_name"
                required
                value={form.full_name}
                onChange={(e) => handleChange("full_name", e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="designation">Designation *</Label>
              <Input
                id="designation"
                required
                value={form.designation}
                onChange={(e) => handleChange("designation", e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="bio">Bio</Label>
            <textarea
              id="bio"
              rows={3}
              value={form.bio}
              onChange={(e) => handleChange("bio", e.target.value)}
              className="flex min-h-[60px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-base shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 md:text-sm"
            />
          </div>
        </CardContent>
      </Card>

      {/* Contact Section */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Contact</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email *</Label>
              <Input
                id="email"
                type="email"
                required
                value={form.email}
                onChange={(e) => handleChange("email", e.target.value)}
              />
            </div>
          </div>

          {/* Phone Numbers */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <Label>Phone Numbers *</Label>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={addPhoneNumber}
                className="text-primary"
              >
                <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                </svg>
                Add Number
              </Button>
            </div>
            <div className="space-y-3">
              {phoneNumbers.map((pn, i) => (
                <div key={i} className="flex gap-2 items-start">
                  {/* Country code */}
                  <select
                    value={pn.country_code}
                    onChange={(e) => updatePhoneNumber(i, "country_code", e.target.value)}
                    className="flex h-9 w-[100px] shrink-0 rounded-md border border-input bg-transparent px-2 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  >
                    {countryCodes.map((cc) => (
                      <option key={`${cc.code}-${cc.country}`} value={cc.code}>
                        {cc.code} {cc.country}
                      </option>
                    ))}
                  </select>
                  {/* Number */}
                  <Input
                    placeholder="Phone number"
                    required={i === 0}
                    value={pn.number}
                    onChange={(e) => updatePhoneNumber(i, "number", e.target.value)}
                    className="flex-1"
                  />
                  {/* Label */}
                  <Input
                    placeholder="Label (e.g. Work)"
                    value={pn.label}
                    onChange={(e) => updatePhoneNumber(i, "label", e.target.value)}
                    className="w-[120px] shrink-0"
                  />
                  {/* Primary toggle */}
                  <button
                    type="button"
                    onClick={() => setPrimaryPhone(i)}
                    title={pn.is_primary ? "Primary number" : "Set as primary"}
                    className={`shrink-0 w-9 h-9 rounded-md flex items-center justify-center transition-colors ${
                      pn.is_primary
                        ? "bg-primary text-primary-foreground"
                        : "border border-input text-muted-foreground hover:bg-accent"
                    }`}
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                    </svg>
                  </button>
                  {/* Remove */}
                  {phoneNumbers.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => removePhoneNumber(i)}
                      className="text-muted-foreground hover:text-destructive shrink-0"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="address">Address</Label>
            <Input
              id="address"
              value={form.address}
              onChange={(e) => handleChange("address", e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Social Profiles Section */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Social Profiles</CardTitle>
          <p className="text-sm text-muted-foreground">
            Add your social links — only filled profiles will appear on the card
          </p>
        </CardHeader>
        <CardContent className="space-y-3">
          {SOCIAL_PLATFORMS.map((platform) => (
            <div key={platform.key} className="flex items-center gap-3">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={platform.icon}
                alt=""
                className="w-8 h-8 shrink-0 rounded-lg"
              />
              <div className="flex-1 min-w-0">
                <Label className="text-xs text-muted-foreground mb-1 block">
                  {platform.label}
                </Label>
                <Input
                  type={platform.type === "tel" ? "text" : "url"}
                  value={socialProfiles[platform.key] ?? ""}
                  onChange={(e) =>
                    setSocialProfiles((prev) => ({
                      ...prev,
                      [platform.key]: e.target.value,
                    }))
                  }
                  placeholder={platform.placeholder}
                />
              </div>
              {socialProfiles[platform.key] && (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() =>
                    setSocialProfiles((prev) => {
                      const next = { ...prev };
                      delete next[platform.key];
                      return next;
                    })
                  }
                  className="text-muted-foreground hover:text-destructive shrink-0 mt-5"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </Button>
              )}
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Submit */}
      <div className="flex gap-3 pt-2">
        <Button type="submit" disabled={saving}>
          {saving
            ? "Saving..."
            : isEdit
              ? "Update Employee"
              : "Create Employee"}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => router.push("/admin")}
        >
          Cancel
        </Button>
      </div>
    </form>
  );
}

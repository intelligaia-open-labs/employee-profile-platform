"use client";

import { useEffect, useState, FormEvent } from "react";
import { useEmployeeAuth } from "@/lib/useEmployeeAuth";
import { clientApiFetch } from "@/lib/api";
import type { EmployeePublic } from "@business-profile/shared";
import Link from "next/link";
import Image from "next/image";
import { resolveImageUrl } from "@/lib/image";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { countryCodes } from "@/lib/country-codes";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

interface PhoneNumberInput {
  country_code: string;
  number: string;
  label: string;
  is_primary: boolean;
}

interface SocialLinkInput {
  platform: string;
  url: string;
}

const SOCIAL_PLATFORMS = [
  { key: "linkedin", label: "LinkedIn", placeholder: "https://linkedin.com/in/username" },
  { key: "whatsapp", label: "WhatsApp", placeholder: "WhatsApp number with country code" },
  { key: "telegram", label: "Telegram", placeholder: "https://t.me/username" },
  { key: "website", label: "Website", placeholder: "https://www.example.com" },
  { key: "twitter", label: "X (Twitter)", placeholder: "https://x.com/username" },
  { key: "instagram", label: "Instagram", placeholder: "https://instagram.com/username" },
  { key: "youtube", label: "YouTube", placeholder: "https://youtube.com/@channel" },
  { key: "facebook", label: "Facebook", placeholder: "https://facebook.com/page" },
  { key: "github", label: "GitHub", placeholder: "https://github.com/username" },
];

export default function EmployeePortal() {
  const { employee: auth, loading: authLoading, logout, hasPermission } = useEmployeeAuth();
  const [profile, setProfile] = useState<EmployeePublic | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);

  // Form state
  const [fullName, setFullName] = useState("");
  const [designation, setDesignation] = useState("");
  const [bio, setBio] = useState("");
  const [email, setEmail] = useState("");
  const [address, setAddress] = useState("");
  const [linkedinUrl, setLinkedinUrl] = useState("");
  const [websiteUrl, setWebsiteUrl] = useState("");
  const [phoneNumbers, setPhoneNumbers] = useState<PhoneNumberInput[]>([]);
  const [socialLinks, setSocialLinks] = useState<SocialLinkInput[]>([]);
  const [profileImageFile, setProfileImageFile] = useState<File | null>(null);
  const [profileImagePreview, setProfileImagePreview] = useState<string | null>(null);

  useEffect(() => {
    if (auth) fetchProfile();
  }, [auth]);

  async function fetchProfile() {
    try {
      const res = await clientApiFetch<{ data: EmployeePublic }>("/portal/profile");
      const p = res.data;
      setProfile(p);
      populateForm(p);
    } catch {
      toast.error("Failed to load profile");
    } finally {
      setLoading(false);
    }
  }

  function populateForm(p: EmployeePublic) {
    setFullName(p.full_name);
    setDesignation(p.designation);
    setBio(p.bio || "");
    setEmail(p.email);
    setAddress(p.address || "");
    setLinkedinUrl(p.linkedin_url || "");
    setWebsiteUrl(p.website_url || "");
    setPhoneNumbers(
      p.phone_numbers?.length > 0
        ? p.phone_numbers.map((pn) => ({ country_code: pn.country_code, number: pn.number, label: pn.label || "", is_primary: pn.is_primary }))
        : [{ country_code: "+91", number: "", label: "", is_primary: true }]
    );
    const existing: SocialLinkInput[] = [];
    p.social_links.forEach((sl) => {
      if (sl.platform.toLowerCase() !== "linkedin" && sl.platform.toLowerCase() !== "website" && sl.platform.toLowerCase() !== "webpage") {
        existing.push({ platform: sl.platform, url: sl.url });
      }
    });
    setSocialLinks(existing);
    setProfileImageFile(null);
    setProfileImagePreview(null);
  }

  async function handleSave(e: FormEvent) {
    e.preventDefault();
    if (!hasPermission("profile:edit")) {
      toast.error("You don't have permission to edit your profile");
      return;
    }

    setSaving(true);
    try {
      const formData = new FormData();
      formData.append("full_name", fullName);
      formData.append("designation", designation);
      formData.append("bio", bio);
      formData.append("email", email);
      formData.append("address", address);
      formData.append("linkedin_url", linkedinUrl);
      formData.append("website_url", websiteUrl);
      formData.append("phone_numbers", JSON.stringify(phoneNumbers.filter((p) => p.number)));
      formData.append("social_links", JSON.stringify(socialLinks.filter((s) => s.url)));
      if (profileImageFile) {
        formData.append("profile_image", profileImageFile);
      }

      const res = await clientApiFetch<{ data: EmployeePublic }>("/portal/profile", {
        method: "PUT",
        body: formData,
      });
      setProfile(res.data);
      populateForm(res.data);
      setEditing(false);
      toast.success("Profile updated successfully");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to save";
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  }

  function handleImageChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setProfileImageFile(file);
    setProfileImagePreview(URL.createObjectURL(file));
  }

  const canEdit = hasPermission("profile:edit");

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-muted/40">
        <header className="border-b bg-background">
          <div className="max-w-3xl mx-auto px-4 h-14 flex items-center justify-between">
            <Skeleton className="h-5 w-32" />
            <Skeleton className="h-5 w-24" />
          </div>
        </header>
        <main className="max-w-3xl mx-auto px-4 py-8 space-y-6">
          <Card><CardContent className="py-8"><div className="flex items-center gap-4"><Skeleton className="w-20 h-20 rounded-full" /><div className="space-y-2"><Skeleton className="h-6 w-40" /><Skeleton className="h-4 w-28" /></div></div></CardContent></Card>
          <Card><CardContent className="py-6 space-y-4">{[1,2,3].map(i => <Skeleton key={i} className="h-10 w-full" />)}</CardContent></Card>
        </main>
      </div>
    );
  }

  if (!profile) return null;

  const displayImage = profileImagePreview || (profile.profile_image ? resolveImageUrl(profile.profile_image) : null);

  return (
    <div className="min-h-screen bg-muted/40">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="max-w-3xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/profile/logo-dark.svg" alt="Logo" className="h-5 w-auto" />
            <Separator orientation="vertical" className="h-5" />
            <span className="text-sm font-medium text-muted-foreground">My Profile</span>
          </div>
          <div className="flex items-center gap-3">
            <Badge variant="secondary" className="text-xs capitalize">{auth?.role}</Badge>
            <Button variant="ghost" size="sm" onClick={logout} className="text-muted-foreground hover:text-destructive">
              Sign out
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-8">
        {/* Profile header card */}
        <Card className="mb-6">
          <CardContent className="py-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-full border-2 border-muted overflow-hidden shrink-0">
                  {displayImage ? (
                    <Image src={displayImage} alt={profile.full_name} width={64} height={64} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full bg-muted flex items-center justify-center">
                      <span className="text-2xl font-bold text-muted-foreground">{profile.full_name.charAt(0)}</span>
                    </div>
                  )}
                </div>
                <div>
                  <h1 className="text-xl font-bold">{profile.full_name}</h1>
                  <p className="text-sm text-muted-foreground">{profile.designation}</p>
                  <p className="text-xs text-muted-foreground mt-1">{profile.email}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" asChild>
                  <Link href={`/p/${profile.slug}`} target="_blank">
                    <svg className="w-4 h-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" /></svg>
                    View Public Profile
                  </Link>
                </Button>
                {canEdit && !editing && (
                  <Button size="sm" onClick={() => setEditing(true)}>
                    <svg className="w-4 h-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" /></svg>
                    Edit Profile
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* View mode */}
        {!editing && (
          <div className="space-y-6">
            {/* Bio */}
            {profile.bio && (
              <Card>
                <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Bio</CardTitle></CardHeader>
                <CardContent><p className="text-sm">{profile.bio}</p></CardContent>
              </Card>
            )}

            {/* Contact */}
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Contact Information</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Email</span>
                  <span>{profile.email}</span>
                </div>
                {profile.phone_numbers?.map((pn, i) => (
                  <div key={i} className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Phone {pn.label ? `(${pn.label})` : ""} {pn.is_primary && "★"}</span>
                    <span>{pn.country_code} {pn.number}</span>
                  </div>
                ))}
                {profile.address && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Address</span>
                    <span className="text-right max-w-[60%]">{profile.address}</span>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Social Links */}
            {(profile.linkedin_url || profile.website_url || profile.social_links.length > 0) && (
              <Card>
                <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Social Links</CardTitle></CardHeader>
                <CardContent className="space-y-2">
                  {profile.linkedin_url && (
                    <a href={profile.linkedin_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-sm hover:underline">
                      <span className="text-muted-foreground w-20">LinkedIn</span>
                      <span className="truncate">{profile.linkedin_url}</span>
                    </a>
                  )}
                  {profile.website_url && (
                    <a href={profile.website_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-sm hover:underline">
                      <span className="text-muted-foreground w-20">Website</span>
                      <span className="truncate">{profile.website_url}</span>
                    </a>
                  )}
                  {profile.social_links.map((sl) => (
                    <a key={sl.id} href={sl.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-sm hover:underline">
                      <span className="text-muted-foreground w-20">{sl.platform}</span>
                      <span className="truncate">{sl.url}</span>
                    </a>
                  ))}
                </CardContent>
              </Card>
            )}

            {/* QR Code */}
            {profile.qr_code && (
              <Card>
                <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">QR Code</CardTitle></CardHeader>
                <CardContent className="flex items-center gap-4">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={profile.qr_code!.qr_url} alt="QR Code" className="w-24 h-24 border rounded-lg" />
                  <div>
                    <p className="text-sm font-medium">{profile.qr_code.scan_count} scans</p>
                    <p className="text-xs text-muted-foreground mt-1">Share this QR code for people to view your profile</p>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {/* Edit mode */}
        {editing && canEdit && (
          <form onSubmit={handleSave} className="space-y-6">
            {/* Profile Image */}
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Profile Photo</CardTitle></CardHeader>
              <CardContent>
                <div className="flex items-center gap-4">
                  <div className="w-20 h-20 rounded-full border-2 border-muted overflow-hidden shrink-0">
                    {displayImage ? (
                      <Image src={displayImage} alt="Preview" width={80} height={80} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full bg-muted flex items-center justify-center">
                        <span className="text-2xl font-bold text-muted-foreground">{fullName.charAt(0)}</span>
                      </div>
                    )}
                  </div>
                  <div>
                    <input type="file" accept="image/jpeg,image/png,image/webp" onChange={handleImageChange} className="text-sm" />
                    <p className="text-xs text-muted-foreground mt-1">JPEG, PNG, or WebP. Max 10MB.</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Basic Info */}
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Basic Information</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Full Name</Label>
                    <Input value={fullName} onChange={(e) => setFullName(e.target.value)} required />
                  </div>
                  <div className="space-y-2">
                    <Label>Designation</Label>
                    <Input value={designation} onChange={(e) => setDesignation(e.target.value)} required />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Bio</Label>
                  <textarea
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    maxLength={500}
                    rows={3}
                    className="w-full border rounded-md px-3 py-2 text-sm bg-background resize-none"
                    placeholder="Brief description..."
                  />
                </div>
                <div className="space-y-2">
                  <Label>Email</Label>
                  <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
                </div>
                <div className="space-y-2">
                  <Label>Address</Label>
                  <Input value={address} onChange={(e) => setAddress(e.target.value)} />
                </div>
              </CardContent>
            </Card>

            {/* Phone Numbers */}
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Phone Numbers</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                {phoneNumbers.map((pn, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <select
                      value={pn.country_code}
                      onChange={(e) => {
                        const arr = [...phoneNumbers];
                        arr[i].country_code = e.target.value;
                        setPhoneNumbers(arr);
                      }}
                      className="border rounded-md px-2 py-2 text-sm bg-background w-24"
                    >
                      {countryCodes.map((cc) => (
                        <option key={cc.code} value={cc.code}>{cc.code}</option>
                      ))}
                    </select>
                    <Input
                      value={pn.number}
                      onChange={(e) => {
                        const arr = [...phoneNumbers];
                        arr[i].number = e.target.value;
                        setPhoneNumbers(arr);
                      }}
                      placeholder="Phone number"
                      className="flex-1"
                    />
                    <Input
                      value={pn.label}
                      onChange={(e) => {
                        const arr = [...phoneNumbers];
                        arr[i].label = e.target.value;
                        setPhoneNumbers(arr);
                      }}
                      placeholder="Label"
                      className="w-24"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        const arr = [...phoneNumbers];
                        arr[i].is_primary = true;
                        arr.forEach((p, j) => { if (j !== i) p.is_primary = false; });
                        setPhoneNumbers(arr);
                      }}
                      className={`text-lg ${pn.is_primary ? "text-amber-500" : "text-muted-foreground/30"}`}
                      title={pn.is_primary ? "Primary" : "Set as primary"}
                    >
                      ★
                    </button>
                    {phoneNumbers.length > 1 && (
                      <button
                        type="button"
                        onClick={() => setPhoneNumbers(phoneNumbers.filter((_, j) => j !== i))}
                        className="text-muted-foreground hover:text-destructive text-sm"
                      >
                        ✕
                      </button>
                    )}
                  </div>
                ))}
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setPhoneNumbers([...phoneNumbers, { country_code: "+91", number: "", label: "", is_primary: false }])}
                >
                  + Add Phone
                </Button>
              </CardContent>
            </Card>

            {/* Social Links */}
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Social Links</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>LinkedIn</Label>
                  <Input value={linkedinUrl} onChange={(e) => setLinkedinUrl(e.target.value)} placeholder="https://linkedin.com/in/username" />
                </div>
                <div className="space-y-2">
                  <Label>Website</Label>
                  <Input value={websiteUrl} onChange={(e) => setWebsiteUrl(e.target.value)} placeholder="https://www.example.com" />
                </div>
                {socialLinks.map((sl, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <select
                      value={sl.platform}
                      onChange={(e) => {
                        const arr = [...socialLinks];
                        arr[i].platform = e.target.value;
                        setSocialLinks(arr);
                      }}
                      className="border rounded-md px-2 py-2 text-sm bg-background w-32"
                    >
                      {SOCIAL_PLATFORMS.map((p) => (
                        <option key={p.key} value={p.label}>{p.label}</option>
                      ))}
                    </select>
                    <Input
                      value={sl.url}
                      onChange={(e) => {
                        const arr = [...socialLinks];
                        arr[i].url = e.target.value;
                        setSocialLinks(arr);
                      }}
                      placeholder="URL"
                      className="flex-1"
                    />
                    <button
                      type="button"
                      onClick={() => setSocialLinks(socialLinks.filter((_, j) => j !== i))}
                      className="text-muted-foreground hover:text-destructive text-sm"
                    >
                      ✕
                    </button>
                  </div>
                ))}
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setSocialLinks([...socialLinks, { platform: "WhatsApp", url: "" }])}
                >
                  + Add Social Link
                </Button>
              </CardContent>
            </Card>

            {/* Actions */}
            <div className="flex items-center gap-3">
              <Button type="submit" disabled={saving}>
                {saving ? "Saving..." : "Save Changes"}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setEditing(false);
                  if (profile) populateForm(profile);
                }}
              >
                Cancel
              </Button>
            </div>
          </form>
        )}
      </main>
    </div>
  );
}

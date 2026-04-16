"use client";

import { useEffect, useState, FormEvent, useCallback } from "react";
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
import {
  Eye,
  TrendingUp,
  Users,
  CalendarDays,
  QrCode,
  Share2,
  ExternalLink,
  Pencil,
  LogOut,
  Copy,
  Check,
  Download,
  Monitor,
  Smartphone,
  Globe,
  ArrowUpRight,
  Sparkles,
  X,
  Plus,
  Star,
  Trash2,
  ChevronRight,
  BarChart3,
  UserCircle,
  Link as LinkIcon,
  Mail,
  Phone,
  MapPin,
} from "lucide-react";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";
const APP_URL = typeof window !== "undefined" ? window.location.origin : "";

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

interface EmployeeAnalytics {
  overview: {
    totalViews: number;
    todayViews: number;
    weekViews: number;
    monthViews: number;
    uniqueVisitors: number;
  };
  devices: { device: string; count: number }[];
  sources: { source: string; count: number }[];
  countries: { country: string; count: number }[];
  daily: { date: string; count: number }[];
  recent: {
    id: string;
    device_type: string | null;
    browser: string | null;
    os: string | null;
    country: string | null;
    city: string | null;
    source: string;
    created_at: string;
  }[];
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

function getProfileCompleteness(profile: EmployeePublic): { percent: number; missing: string[] } {
  const checks = [
    { label: "Profile photo", done: !!profile.profile_image },
    { label: "Bio", done: !!profile.bio },
    { label: "Phone number", done: (profile.phone_numbers?.length ?? 0) > 0 },
    { label: "LinkedIn", done: !!profile.linkedin_url },
    { label: "Address", done: !!profile.address },
    { label: "Social links", done: (profile.social_links?.length ?? 0) > 0 },
  ];
  const done = checks.filter((c) => c.done).length;
  const missing = checks.filter((c) => !c.done).map((c) => c.label);
  return { percent: Math.round((done / checks.length) * 100), missing };
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

type ActiveTab = "dashboard" | "profile" | "edit";

export default function EmployeePortal() {
  const { employee: auth, loading: authLoading, logout, hasPermission } = useEmployeeAuth();
  const [profile, setProfile] = useState<EmployeePublic | null>(null);
  const [analytics, setAnalytics] = useState<EmployeeAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<ActiveTab>("dashboard");
  const [saving, setSaving] = useState(false);
  const [copied, setCopied] = useState(false);
  const [qrModalOpen, setQrModalOpen] = useState(false);

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

  const fetchProfile = useCallback(async () => {
    try {
      const res = await clientApiFetch<{ data: EmployeePublic }>("/portal/profile");
      setProfile(res.data);
      populateForm(res.data);
    } catch {
      toast.error("Failed to load profile");
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchAnalytics = useCallback(async () => {
    if (!hasPermission("analytics:view")) return;
    try {
      const res = await clientApiFetch<{ data: EmployeeAnalytics }>("/portal/analytics");
      setAnalytics(res.data);
    } catch {
      // Analytics might not be available
    }
  }, [hasPermission]);

  useEffect(() => {
    if (auth) {
      fetchProfile();
      fetchAnalytics();
    }
  }, [auth, fetchProfile, fetchAnalytics]);

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
      if (profileImageFile) formData.append("profile_image", profileImageFile);

      const res = await clientApiFetch<{ data: EmployeePublic }>("/portal/profile", {
        method: "PUT",
        body: formData,
      });
      setProfile(res.data);
      populateForm(res.data);
      setActiveTab("profile");
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

  async function copyProfileLink() {
    if (!profile) return;
    const url = `${APP_URL}/p/${profile.slug}`;
    await navigator.clipboard.writeText(url);
    setCopied(true);
    toast.success("Profile link copied!");
    setTimeout(() => setCopied(false), 2000);
  }

  async function downloadQR() {
    if (!profile?.qr_code) return;
    try {
      const response = await fetch(profile.qr_code.qr_url);
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${profile.full_name}-qr.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success("QR code downloaded!");
    } catch {
      toast.error("Failed to download QR code");
    }
  }

  const canEdit = hasPermission("profile:edit");

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-muted/40">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
          <div className="flex items-center gap-4 mb-8">
            <Skeleton className="w-16 h-16 rounded-2xl" />
            <div className="space-y-2">
              <Skeleton className="h-6 w-48" />
              <Skeleton className="h-4 w-32" />
            </div>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-24 rounded-xl" />
            ))}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Skeleton className="h-80 rounded-xl lg:col-span-2" />
            <Skeleton className="h-80 rounded-xl" />
          </div>
        </div>
      </div>
    );
  }

  if (!profile) return null;

  const displayImage = profileImagePreview || (profile.profile_image ? resolveImageUrl(profile.profile_image) : null);
  const completeness = getProfileCompleteness(profile);
  const profileUrl = `${APP_URL}/p/${profile.slug}`;
  const overview = analytics?.overview;
  const daily = analytics?.daily || [];
  const maxDaily = Math.max(...daily.map((d) => d.count), 1);

  return (
    <div className="min-h-screen bg-muted/40">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/profile/logo-dark.svg" alt="Logo" className="h-5 w-auto" />
            <Separator orientation="vertical" className="h-5" />
            <span className="text-sm font-medium text-muted-foreground">Employee Portal</span>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="text-xs capitalize hidden sm:inline-flex">{auth?.role}</Badge>
            <Button variant="ghost" size="sm" onClick={logout} className="text-muted-foreground hover:text-destructive gap-1.5">
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Sign out</span>
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        {/* Profile Hero */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-6 mb-6">
          <div className="flex items-center gap-4 flex-1 min-w-0">
            <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl border-2 border-muted overflow-hidden shrink-0 shadow-sm">
              {displayImage ? (
                <Image src={displayImage} alt={profile.full_name} width={64} height={64} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
                  <span className="text-2xl font-bold text-primary/60">{profile.full_name.charAt(0)}</span>
                </div>
              )}
            </div>
            <div className="min-w-0">
              <h1 className="text-lg sm:text-xl font-bold truncate">{profile.full_name}</h1>
              <p className="text-sm text-muted-foreground truncate">{profile.designation}</p>
              {completeness.percent < 100 && (
                <div className="flex items-center gap-2 mt-1.5">
                  <div className="w-24 h-1.5 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary rounded-full transition-all duration-500"
                      style={{ width: `${completeness.percent}%` }}
                    />
                  </div>
                  <span className="text-[11px] text-muted-foreground">{completeness.percent}% complete</span>
                </div>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Button variant="outline" size="sm" className="gap-1.5" onClick={copyProfileLink}>
              {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              {copied ? "Copied" : "Copy Link"}
            </Button>
            <Button variant="outline" size="sm" asChild className="gap-1.5">
              <Link href={`/p/${profile.slug}`} target="_blank">
                <ExternalLink className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">View Public Profile</span>
                <span className="sm:hidden">View</span>
              </Link>
            </Button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-1 mb-6 border-b">
          {[
            { id: "dashboard" as ActiveTab, label: "Dashboard", icon: BarChart3 },
            { id: "profile" as ActiveTab, label: "Profile", icon: UserCircle },
            ...(canEdit ? [{ id: "edit" as ActiveTab, label: "Edit Profile", icon: Pencil }] : []),
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-1.5 px-3 sm:px-4 py-2.5 text-sm font-medium border-b-2 transition-colors -mb-[1px] ${
                activeTab === tab.id
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground hover:border-muted-foreground/30"
              }`}
            >
              <tab.icon className="w-4 h-4" />
              <span className="hidden sm:inline">{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Dashboard Tab */}
        {activeTab === "dashboard" && (
          <div className="space-y-6 animate-in fade-in duration-300">
            {/* Stats Row */}
            {overview && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
                {[
                  { label: "Total Views", value: overview.totalViews, icon: Eye, color: "text-blue-600" },
                  { label: "This Week", value: overview.weekViews, icon: TrendingUp, color: "text-emerald-600" },
                  { label: "This Month", value: overview.monthViews, icon: CalendarDays, color: "text-violet-600" },
                  { label: "Unique Visitors", value: overview.uniqueVisitors, icon: Users, color: "text-amber-600" },
                ].map((stat) => (
                  <Card key={stat.label} className="relative overflow-hidden">
                    <CardContent className="py-4 px-4">
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="text-xs font-medium text-muted-foreground mb-1">{stat.label}</p>
                          <p className="text-2xl font-bold tabular-nums">{stat.value.toLocaleString()}</p>
                        </div>
                        <div className={`p-2 rounded-lg bg-muted/50 ${stat.color}`}>
                          <stat.icon className="w-4 h-4" />
                        </div>
                      </div>
                      {stat.label === "This Week" && overview.todayViews > 0 && (
                        <p className="text-[11px] text-emerald-600 mt-1.5 flex items-center gap-0.5">
                          <ArrowUpRight className="w-3 h-3" />
                          {overview.todayViews} today
                        </p>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}

            {!overview && hasPermission("analytics:view") && (
              <Card>
                <CardContent className="py-8 text-center">
                  <BarChart3 className="w-8 h-8 text-muted-foreground/40 mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">Analytics are loading...</p>
                </CardContent>
              </Card>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Views Chart */}
              {daily.length > 0 && (
                <Card className="lg:col-span-2">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">Profile Views — Last 30 Days</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-end gap-[3px] h-[140px] pt-4">
                      {daily.map((d, i) => {
                        const height = Math.max((d.count / maxDaily) * 100, 3);
                        const isToday = i === daily.length - 1;
                        return (
                          <div
                            key={d.date}
                            className="group relative flex-1 flex flex-col items-center justify-end"
                          >
                            <div className="absolute -top-6 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-foreground text-background text-[10px] px-1.5 py-0.5 rounded whitespace-nowrap pointer-events-none z-10">
                              {d.count} views
                            </div>
                            <div
                              className={`w-full rounded-t-sm transition-all duration-200 min-h-[3px] ${
                                isToday
                                  ? "bg-primary shadow-sm"
                                  : "bg-primary/40 group-hover:bg-primary/70"
                              }`}
                              style={{ height: `${height}%` }}
                            />
                          </div>
                        );
                      })}
                    </div>
                    <div className="flex justify-between mt-2 text-[10px] text-muted-foreground">
                      <span>{daily[0]?.date}</span>
                      <span>Today</span>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* QR Code & Share */}
              <Card className={daily.length === 0 ? "lg:col-span-3 max-w-sm" : ""}>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <QrCode className="w-4 h-4" />
                    Your QR Code
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {profile.qr_code ? (
                    <>
                      <button
                        onClick={() => setQrModalOpen(true)}
                        className="w-full aspect-square max-w-[180px] mx-auto block rounded-xl border-2 border-muted overflow-hidden hover:border-primary/30 hover:shadow-md transition-all cursor-pointer"
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={profile.qr_code.qr_url}
                          alt="QR Code"
                          className="w-full h-full object-contain p-2"
                        />
                      </button>
                      <div className="text-center space-y-2">
                        <p className="text-sm font-medium tabular-nums">
                          {profile.qr_code.scan_count.toLocaleString()} scans
                        </p>
                        <div className="flex gap-2">
                          <Button variant="outline" size="sm" className="flex-1 gap-1.5" onClick={downloadQR}>
                            <Download className="w-3.5 h-3.5" />
                            Download
                          </Button>
                          <Button variant="outline" size="sm" className="flex-1 gap-1.5" onClick={copyProfileLink}>
                            <Share2 className="w-3.5 h-3.5" />
                            Share
                          </Button>
                        </div>
                      </div>
                    </>
                  ) : (
                    <div className="text-center py-6">
                      <QrCode className="w-10 h-10 text-muted-foreground/30 mx-auto mb-2" />
                      <p className="text-sm text-muted-foreground">No QR code generated yet</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Bottom Row: Sources + Devices + Completeness */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Traffic Sources */}
              {analytics && analytics.sources.length > 0 && (
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium flex items-center gap-2">
                      <Globe className="w-4 h-4" />
                      Traffic Sources
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2.5">
                    {analytics.sources.slice(0, 5).map((s) => {
                      const total = analytics.sources.reduce((a, b) => a + b.count, 0);
                      const pct = total > 0 ? (s.count / total) * 100 : 0;
                      return (
                        <div key={s.source} className="space-y-1">
                          <div className="flex items-center justify-between text-sm">
                            <span className="capitalize text-muted-foreground">{s.source}</span>
                            <span className="font-medium tabular-nums">{s.count}</span>
                          </div>
                          <div className="h-1 bg-muted rounded-full overflow-hidden">
                            <div className="h-full bg-primary/50 rounded-full" style={{ width: `${pct}%` }} />
                          </div>
                        </div>
                      );
                    })}
                  </CardContent>
                </Card>
              )}

              {/* Devices */}
              {analytics && analytics.devices.length > 0 && (
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium flex items-center gap-2">
                      <Monitor className="w-4 h-4" />
                      Devices
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {analytics.devices.map((d) => {
                      const total = analytics.devices.reduce((a, b) => a + b.count, 0);
                      const pct = total > 0 ? Math.round((d.count / total) * 100) : 0;
                      const Icon = d.device.toLowerCase().includes("mobile") ? Smartphone : Monitor;
                      return (
                        <div key={d.device} className="flex items-center gap-3">
                          <div className="p-1.5 rounded-md bg-muted">
                            <Icon className="w-3.5 h-3.5 text-muted-foreground" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between text-sm">
                              <span className="capitalize">{d.device}</span>
                              <span className="text-muted-foreground tabular-nums">{pct}%</span>
                            </div>
                            <div className="h-1 bg-muted rounded-full overflow-hidden mt-1">
                              <div className="h-full bg-primary/50 rounded-full" style={{ width: `${pct}%` }} />
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </CardContent>
                </Card>
              )}

              {/* Profile Completeness */}
              {completeness.percent < 100 && (
                <Card className="border-primary/20 bg-primary/[0.02]">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-primary" />
                      Complete Your Profile
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center gap-3">
                      <div className="relative w-14 h-14 shrink-0">
                        <svg className="w-14 h-14 -rotate-90" viewBox="0 0 56 56">
                          <circle cx="28" cy="28" r="24" fill="none" stroke="currentColor" strokeWidth="4" className="text-muted/50" />
                          <circle
                            cx="28" cy="28" r="24" fill="none" stroke="currentColor" strokeWidth="4"
                            className="text-primary"
                            strokeDasharray={`${2 * Math.PI * 24}`}
                            strokeDashoffset={`${2 * Math.PI * 24 * (1 - completeness.percent / 100)}`}
                            strokeLinecap="round"
                          />
                        </svg>
                        <span className="absolute inset-0 flex items-center justify-center text-xs font-bold">{completeness.percent}%</span>
                      </div>
                      <div className="text-sm text-muted-foreground">
                        <p className="font-medium text-foreground mb-0.5">Almost there!</p>
                        <p className="text-xs">Complete your profile to make a great impression</p>
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      {completeness.missing.map((item) => (
                        <button
                          key={item}
                          onClick={() => setActiveTab("edit")}
                          className="flex items-center gap-2 w-full text-left text-sm text-muted-foreground hover:text-foreground transition-colors group py-0.5"
                        >
                          <div className="w-4 h-4 rounded-full border-2 border-muted-foreground/30 group-hover:border-primary transition-colors shrink-0" />
                          <span>Add {item.toLowerCase()}</span>
                          <ChevronRight className="w-3 h-3 ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />
                        </button>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Recent Visitors */}
            {analytics && analytics.recent.length > 0 && (
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Recent Visitors</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2.5">
                    {analytics.recent.slice(0, 8).map((v) => (
                      <div key={v.id} className="flex items-center justify-between text-sm py-1">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center shrink-0">
                            {v.device_type === "mobile" ? (
                              <Smartphone className="w-3.5 h-3.5 text-muted-foreground" />
                            ) : (
                              <Monitor className="w-3.5 h-3.5 text-muted-foreground" />
                            )}
                          </div>
                          <div className="min-w-0">
                            <p className="text-xs font-medium truncate">
                              {v.browser} {v.os ? `on ${v.os}` : ""}
                            </p>
                            <p className="text-[11px] text-muted-foreground truncate">
                              {[v.city, v.country].filter(Boolean).join(", ") || "Unknown"} &middot; <span className="capitalize">{v.source}</span>
                            </p>
                          </div>
                        </div>
                        <span className="text-[11px] text-muted-foreground shrink-0 ml-3">
                          {timeAgo(v.created_at)}
                        </span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {/* Profile Tab */}
        {activeTab === "profile" && (
          <div className="space-y-6 animate-in fade-in duration-300">
            {/* Bio */}
            {profile.bio && (
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Bio</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm leading-relaxed">{profile.bio}</p>
                </CardContent>
              </Card>
            )}

            {/* Contact Info */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Contact Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-3 text-sm">
                  <Mail className="w-4 h-4 text-muted-foreground shrink-0" />
                  <span className="text-muted-foreground w-16">Email</span>
                  <span className="font-medium">{profile.email}</span>
                </div>
                {profile.phone_numbers?.map((pn, i) => (
                  <div key={i} className="flex items-center gap-3 text-sm">
                    <Phone className="w-4 h-4 text-muted-foreground shrink-0" />
                    <span className="text-muted-foreground w-16">
                      Phone {pn.is_primary && <Star className="w-3 h-3 inline text-amber-500" />}
                    </span>
                    <span className="font-medium">{pn.country_code} {pn.number}</span>
                    {pn.label && <Badge variant="secondary" className="text-[10px]">{pn.label}</Badge>}
                  </div>
                ))}
                {profile.address && (
                  <div className="flex items-center gap-3 text-sm">
                    <MapPin className="w-4 h-4 text-muted-foreground shrink-0" />
                    <span className="text-muted-foreground w-16">Address</span>
                    <span className="font-medium">{profile.address}</span>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Social Links */}
            {(profile.linkedin_url || profile.website_url || profile.social_links.length > 0) && (
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Social Links</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2.5">
                  {profile.linkedin_url && (
                    <a href={profile.linkedin_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 text-sm hover:text-primary transition-colors group">
                      <LinkIcon className="w-4 h-4 text-muted-foreground shrink-0" />
                      <span className="text-muted-foreground w-16">LinkedIn</span>
                      <span className="truncate group-hover:underline">{profile.linkedin_url}</span>
                      <ExternalLink className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
                    </a>
                  )}
                  {profile.website_url && (
                    <a href={profile.website_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 text-sm hover:text-primary transition-colors group">
                      <LinkIcon className="w-4 h-4 text-muted-foreground shrink-0" />
                      <span className="text-muted-foreground w-16">Website</span>
                      <span className="truncate group-hover:underline">{profile.website_url}</span>
                      <ExternalLink className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
                    </a>
                  )}
                  {profile.social_links.map((sl) => (
                    <a key={sl.id} href={sl.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 text-sm hover:text-primary transition-colors group">
                      <LinkIcon className="w-4 h-4 text-muted-foreground shrink-0" />
                      <span className="text-muted-foreground w-16">{sl.platform}</span>
                      <span className="truncate group-hover:underline">{sl.url}</span>
                      <ExternalLink className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
                    </a>
                  ))}
                </CardContent>
              </Card>
            )}

            {/* QR Code */}
            {profile.qr_code && (
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">QR Code</CardTitle>
                </CardHeader>
                <CardContent className="flex items-center gap-4">
                  <button onClick={() => setQrModalOpen(true)} className="shrink-0 hover:opacity-80 transition-opacity">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={profile.qr_code.qr_url} alt="QR Code" className="w-24 h-24 border rounded-lg" />
                  </button>
                  <div>
                    <p className="text-sm font-medium">{profile.qr_code.scan_count.toLocaleString()} scans</p>
                    <p className="text-xs text-muted-foreground mt-1">Share this QR code for people to view your profile</p>
                    <div className="flex gap-2 mt-2">
                      <Button variant="outline" size="sm" className="h-7 text-xs gap-1" onClick={downloadQR}>
                        <Download className="w-3 h-3" /> Download
                      </Button>
                      <Button variant="outline" size="sm" className="h-7 text-xs gap-1" onClick={copyProfileLink}>
                        <Copy className="w-3 h-3" /> Copy Link
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Quick Actions */}
            <div className="flex flex-wrap gap-2">
              {canEdit && (
                <Button size="sm" onClick={() => setActiveTab("edit")} className="gap-1.5">
                  <Pencil className="w-3.5 h-3.5" /> Edit Profile
                </Button>
              )}
              <Button variant="outline" size="sm" asChild className="gap-1.5">
                <Link href={`/p/${profile.slug}`} target="_blank">
                  <ExternalLink className="w-3.5 h-3.5" /> View Public Profile
                </Link>
              </Button>
            </div>
          </div>
        )}

        {/* Edit Tab */}
        {activeTab === "edit" && canEdit && (
          <form onSubmit={handleSave} className="space-y-6 animate-in fade-in duration-300">
            {/* Profile Image */}
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Profile Photo</CardTitle></CardHeader>
              <CardContent>
                <div className="flex items-center gap-4">
                  <div className="w-20 h-20 rounded-2xl border-2 border-muted overflow-hidden shrink-0">
                    {displayImage ? (
                      <Image src={displayImage} alt="Preview" width={80} height={80} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
                        <span className="text-2xl font-bold text-primary/60">{fullName.charAt(0)}</span>
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
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                    className="w-full border rounded-md px-3 py-2 text-sm bg-background resize-none focus:outline-none focus:ring-2 focus:ring-ring"
                    placeholder="Tell people about yourself..."
                  />
                  <p className="text-xs text-muted-foreground text-right">{bio.length}/500</p>
                </div>
                <div className="space-y-2">
                  <Label>Email</Label>
                  <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
                </div>
                <div className="space-y-2">
                  <Label>Address</Label>
                  <Input value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Office or mailing address" />
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
                        const arr = [...phoneNumbers]; arr[i].country_code = e.target.value; setPhoneNumbers(arr);
                      }}
                      className="border rounded-md px-2 py-2 text-sm bg-background w-24"
                    >
                      {countryCodes.map((cc) => (<option key={cc.code} value={cc.code}>{cc.code}</option>))}
                    </select>
                    <Input
                      value={pn.number}
                      onChange={(e) => { const arr = [...phoneNumbers]; arr[i].number = e.target.value; setPhoneNumbers(arr); }}
                      placeholder="Phone number"
                      className="flex-1"
                    />
                    <Input
                      value={pn.label}
                      onChange={(e) => { const arr = [...phoneNumbers]; arr[i].label = e.target.value; setPhoneNumbers(arr); }}
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
                      className={`p-1.5 rounded-md transition-colors ${pn.is_primary ? "text-amber-500 bg-amber-50" : "text-muted-foreground/30 hover:text-amber-400"}`}
                      title={pn.is_primary ? "Primary" : "Set as primary"}
                    >
                      <Star className="w-4 h-4" fill={pn.is_primary ? "currentColor" : "none"} />
                    </button>
                    {phoneNumbers.length > 1 && (
                      <button
                        type="button"
                        onClick={() => setPhoneNumbers(phoneNumbers.filter((_, j) => j !== i))}
                        className="p-1.5 rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                ))}
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="gap-1.5"
                  onClick={() => setPhoneNumbers([...phoneNumbers, { country_code: "+91", number: "", label: "", is_primary: false }])}
                >
                  <Plus className="w-3.5 h-3.5" /> Add Phone
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
                      onChange={(e) => { const arr = [...socialLinks]; arr[i].platform = e.target.value; setSocialLinks(arr); }}
                      className="border rounded-md px-2 py-2 text-sm bg-background w-32"
                    >
                      {SOCIAL_PLATFORMS.map((p) => (<option key={p.key} value={p.label}>{p.label}</option>))}
                    </select>
                    <Input
                      value={sl.url}
                      onChange={(e) => { const arr = [...socialLinks]; arr[i].url = e.target.value; setSocialLinks(arr); }}
                      placeholder="URL"
                      className="flex-1"
                    />
                    <button
                      type="button"
                      onClick={() => setSocialLinks(socialLinks.filter((_, j) => j !== i))}
                      className="p-1.5 rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="gap-1.5"
                  onClick={() => setSocialLinks([...socialLinks, { platform: "WhatsApp", url: "" }])}
                >
                  <Plus className="w-3.5 h-3.5" /> Add Social Link
                </Button>
              </CardContent>
            </Card>

            {/* Actions */}
            <div className="flex items-center gap-3 pb-8">
              <Button type="submit" disabled={saving} className="gap-1.5">
                {saving ? "Saving..." : "Save Changes"}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setActiveTab("profile");
                  if (profile) populateForm(profile);
                }}
              >
                Cancel
              </Button>
            </div>
          </form>
        )}
      </main>

      {/* QR Code Modal */}
      {qrModalOpen && profile.qr_code && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={() => setQrModalOpen(false)}>
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
          <div
            className="relative bg-background rounded-2xl p-6 max-w-sm w-full shadow-2xl animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setQrModalOpen(false)}
              className="absolute top-3 right-3 p-1.5 rounded-full hover:bg-muted transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
            <div className="text-center space-y-4">
              <h3 className="font-semibold">Your QR Code</h3>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={profile.qr_code.qr_url}
                alt="QR Code"
                className="w-64 h-64 mx-auto border-2 border-muted rounded-xl p-3"
              />
              <p className="text-sm text-muted-foreground">
                Scan to view your profile at<br />
                <span className="font-mono text-xs text-foreground">{profileUrl}</span>
              </p>
              <div className="flex gap-2">
                <Button variant="outline" className="flex-1 gap-1.5" onClick={downloadQR}>
                  <Download className="w-4 h-4" /> Download
                </Button>
                <Button className="flex-1 gap-1.5" onClick={copyProfileLink}>
                  {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  {copied ? "Copied!" : "Copy Link"}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

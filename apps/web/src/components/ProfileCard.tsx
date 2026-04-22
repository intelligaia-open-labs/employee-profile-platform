"use client";

import { useState } from "react";
import { toast } from "sonner";
import type { EmployeePublic } from "@business-profile/shared";
import Image from "next/image";
import { MeetingDialog } from "./MeetingDialog";
import { resolveImageUrl } from "@/lib/image";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

function shareUrl(source: string): string {
  if (typeof window === "undefined") return "";
  const url = new URL(window.location.href);
  url.searchParams.set("source", source);
  return url.toString();
}

interface Props {
  employee: EmployeePublic;
}

const VISIBLE_SOCIAL_COUNT = 4;

/** Yellow filled circle — shared style for quick actions (52px) and social rows (48px). */
function YellowCircle({
  size,
  children,
  className = "",
}: {
  size: number;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <span
      className={`flex items-center justify-center rounded-full bg-[#f9d852] text-[#121212] shrink-0 ${className}`}
      style={{ width: size, height: size }}
    >
      {children}
    </span>
  );
}

/** Inline glyph set — keeps visuals under our control across light/dark circles. */
const Glyph = {
  phone: (size = 22) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
    </svg>
  ),
  email: (size = 22) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <path d="M3 7l9 6 9-6" />
    </svg>
  ),
  whatsapp: (size = 22) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
      <path d="M20.52 3.48A11.87 11.87 0 0 0 12.04 0C5.5 0 .19 5.32.18 11.86c0 2.09.55 4.12 1.58 5.93L0 24l6.4-1.68a11.86 11.86 0 0 0 5.63 1.43h.01c6.54 0 11.85-5.32 11.86-11.86a11.81 11.81 0 0 0-3.38-8.41zM12.04 21.8h-.01a9.86 9.86 0 0 1-5.02-1.37l-.36-.21-3.8 1 1.01-3.71-.23-.38a9.82 9.82 0 0 1-1.51-5.26c0-5.44 4.43-9.86 9.87-9.86 2.64 0 5.11 1.03 6.98 2.9a9.78 9.78 0 0 1 2.89 6.97c0 5.44-4.43 9.86-9.86 9.86zm5.41-7.38c-.29-.15-1.76-.87-2.03-.97-.27-.1-.47-.15-.67.15-.2.29-.77.97-.94 1.17-.17.2-.35.22-.64.07-.29-.15-1.25-.46-2.38-1.47-.88-.79-1.47-1.76-1.64-2.05-.17-.29-.02-.45.13-.6.13-.13.29-.35.44-.52.15-.17.2-.29.3-.49.1-.2.05-.37-.02-.52-.07-.15-.67-1.6-.91-2.2-.24-.58-.49-.5-.67-.51-.17-.01-.37-.01-.57-.01-.2 0-.52.07-.79.37-.27.29-1.04 1.02-1.04 2.48 0 1.46 1.07 2.88 1.22 3.08.15.2 2.1 3.21 5.09 4.5.71.31 1.27.49 1.7.63.71.23 1.36.2 1.87.12.57-.09 1.76-.72 2.01-1.42.25-.7.25-1.29.17-1.42-.07-.12-.27-.2-.56-.34z" />
    </svg>
  ),
  userPlus: (size = 22) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <line x1="19" y1="8" x2="19" y2="14" />
      <line x1="22" y1="11" x2="16" y2="11" />
    </svg>
  ),
  calendar: (size = 22) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="18" rx="2" />
      <line x1="16" y1="2" x2="16" y2="6" />
      <line x1="8" y1="2" x2="8" y2="6" />
      <line x1="3" y1="10" x2="21" y2="10" />
    </svg>
  ),
  linkedin: (size = 22) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
      <path d="M20.45 20.45h-3.56v-5.57c0-1.33-.02-3.03-1.85-3.03-1.85 0-2.13 1.45-2.13 2.94v5.66H9.35V9h3.41v1.56h.05c.48-.9 1.63-1.85 3.36-1.85 3.6 0 4.27 2.37 4.27 5.46v6.28zM5.34 7.43a2.06 2.06 0 1 1 0-4.13 2.06 2.06 0 0 1 0 4.13zM3.56 20.45H7.1V9H3.56v11.45zM22.22 0H1.77C.8 0 0 .77 0 1.72v20.56C0 23.23.79 24 1.77 24h20.45C23.2 24 24 23.23 24 22.28V1.72C24 .77 23.2 0 22.22 0z" />
    </svg>
  ),
  telegram: (size = 22) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
      <path d="M9.78 18.65l.28-4.23 7.68-6.92c.34-.31-.07-.46-.52-.19L7.74 13.3 3.64 12c-.88-.25-.89-.86.2-1.3l15.97-6.16c.73-.33 1.43.18 1.15 1.3l-2.72 12.81c-.19.91-.74 1.13-1.5.71L12.6 16.3l-1.99 1.93c-.23.23-.42.42-.83.42z" />
    </svg>
  ),
  globe: (size = 22) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <line x1="2" y1="12" x2="22" y2="12" />
      <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
    </svg>
  ),
  instagram: (size = 22) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="2" width="20" height="20" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.5" cy="6.5" r="0.75" fill="currentColor" />
    </svg>
  ),
  twitter: (size = 22) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  ),
  youtube: (size = 22) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
      <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
    </svg>
  ),
  facebook: (size = 22) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
      <path d="M24 12.073C24 5.405 18.627 0 12 0S0 5.405 0 12.073c0 6.025 4.388 11.018 10.125 11.927v-8.437H7.078v-3.49h3.047V9.412c0-3.017 1.791-4.684 4.533-4.684 1.313 0 2.686.235 2.686.235v2.965H15.83c-1.491 0-1.956.93-1.956 1.887v2.268h3.328l-.532 3.49h-2.796V24C19.612 23.09 24 18.1 24 12.073z" />
    </svg>
  ),
  github: (size = 22) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12" />
    </svg>
  ),
  chevronRight: (size = 20) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="9 18 15 12 9 6" />
    </svg>
  ),
  paperPlane: (size = 12) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 2L11 13" />
      <path d="M22 2l-7 20-4-9-9-4 20-7z" />
    </svg>
  ),
};

/** Map platform key → glyph and subtitle for social rows. */
const platformGlyph: Record<string, { glyph: (size?: number) => React.ReactElement; subtitle: string; label: string }> = {
  linkedin: { glyph: Glyph.linkedin, subtitle: "Connect with us on LinkedIn", label: "LinkedIn" },
  whatsapp: { glyph: Glyph.whatsapp, subtitle: "Chat with us on WhatsApp", label: "WhatsApp" },
  telegram: { glyph: Glyph.telegram, subtitle: "Join our Telegram channel", label: "Telegram" },
  website: { glyph: Glyph.globe, subtitle: "Visit our company website", label: "Webpage" },
  webpage: { glyph: Glyph.globe, subtitle: "Visit our company website", label: "Webpage" },
  instagram: { glyph: Glyph.instagram, subtitle: "Follow us on Instagram", label: "Instagram" },
  "x (twitter)": { glyph: Glyph.twitter, subtitle: "Follow us on X", label: "X (Twitter)" },
  twitter: { glyph: Glyph.twitter, subtitle: "Follow us on X", label: "X (Twitter)" },
  youtube: { glyph: Glyph.youtube, subtitle: "Watch us on YouTube", label: "YouTube" },
  facebook: { glyph: Glyph.facebook, subtitle: "Follow us on Facebook", label: "Facebook" },
  github: { glyph: Glyph.github, subtitle: "View our code on GitHub", label: "GitHub" },
};

export function ProfileCard({ employee }: Props) {
  const [meetingOpen, setMeetingOpen] = useState(false);
  const [showAllSocial, setShowAllSocial] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const [qrOpen, setQrOpen] = useState(false);
  const [qrLoaded, setQrLoaded] = useState(false);

  function handleAddToContact() {
    const vcardUrl = `${API_URL}/public/vcard/${employee.slug}`;
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
    if (isMobile) {
      window.location.href = vcardUrl;
      return;
    }
    fetch(vcardUrl)
      .then((res) => res.text())
      .then((vcfText) => {
        const blob = new Blob([vcfText], { type: "text/vcard" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `${employee.full_name}.vcf`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      })
      .catch(() => {
        window.location.href = vcardUrl;
      });
  }

  const primaryPhone =
    employee.phone_numbers?.find((p) => p.is_primary) ??
    employee.phone_numbers?.[0];
  const displayPhone = primaryPhone
    ? `${primaryPhone.country_code} ${primaryPhone.number}`
    : employee.phone;
  const phoneDigits = (primaryPhone?.number ?? employee.phone).replace(/[^0-9]/g, "");
  const allPhones =
    employee.phone_numbers?.length > 0
      ? employee.phone_numbers
      : [{ country_code: "", number: employee.phone, label: null, is_primary: true, id: "legacy" }];

  function resolveHref(platform: string, url: string): string {
    const key = platform.toLowerCase();
    if (key === "whatsapp") {
      const digits = url.replace(/[^0-9]/g, "");
      return `https://wa.me/${digits}`;
    }
    if (url.startsWith("http://") || url.startsWith("https://")) return url;
    return `https://${url}`;
  }

  type SocialItem = {
    key: string;
    glyph: (size?: number) => React.ReactElement;
    label: string;
    subtitle: string;
    href: string;
  };
  const socialItems: SocialItem[] = [];
  const fallback = platformGlyph.website;

  if (employee.linkedin_url) {
    const m = platformGlyph.linkedin;
    socialItems.push({ key: "linkedin", glyph: m.glyph, label: m.label, subtitle: m.subtitle, href: resolveHref("linkedin", employee.linkedin_url) });
  }
  employee.social_links.forEach((s) => {
    const key = s.platform.toLowerCase();
    const m = platformGlyph[key] ?? { ...fallback, label: s.platform, subtitle: `Visit ${s.platform}` };
    socialItems.push({ key: s.id, glyph: m.glyph, label: m.label, subtitle: m.subtitle, href: resolveHref(s.platform, s.url) });
  });
  if (employee.website_url) {
    const m = platformGlyph.website;
    socialItems.push({ key: "website", glyph: m.glyph, label: m.label, subtitle: m.subtitle, href: resolveHref("website", employee.website_url) });
  }

  const whatsappHref = `https://wa.me/${phoneDigits}`;
  const telegramLink = employee.social_links.find((s) => s.platform.toLowerCase() === "telegram");

  const focusRing = "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#f9d852] focus-visible:ring-offset-2 focus-visible:ring-offset-white";

  return (
    <div className="relative w-full bg-white border-b-4 border-[#f9d852] min-h-screen overflow-hidden pb-[120px]">
      {/* ── FULL-BLEED hero: spans the full viewport width; height stays
           close to Figma's 258 so the profile photo always overlaps the
           bottom edge (and the name sits on white, not on the dark hero). ── */}
      <div
        className="absolute inset-x-0 top-0 bg-[#121212] overflow-hidden z-0"
        style={{ height: "clamp(220px, 44vw, 260px)" }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/profile/bg.png"
          alt=""
          aria-hidden="true"
          className="absolute inset-0 w-full h-full object-cover object-center pointer-events-none select-none"
          draggable={false}
        />
        {/* Subtle gradient at bottom for photo contrast */}
        <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/30 to-transparent pointer-events-none" />
      </div>

      {/* ── CONSTRAINED content column — capped at 560px, centered ── */}
      <div className="relative z-10 w-full max-w-[560px] mx-auto p-[24px] flex flex-col gap-[58px] items-center">
        {/* Logo band — wordmark vertically centered over hero, at content-column's left edge */}
        <div className="relative h-[80px] w-full">
          <div className="absolute left-0 top-1/2 -translate-y-1/2 flex flex-col items-start gap-[2px]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/profile/logo.svg"
              alt="Intelligaia"
              className="h-[30px] w-auto select-none"
              draggable={false}
            />
            <p className="text-[9.47px] leading-[14px] text-white font-normal tracking-[0.01em]">
              humanizing AI for enterprises
            </p>
          </div>
        </div>

        {/* ── Profile + cards ── */}
        <div className="flex flex-col gap-[36px] items-center w-full">
        {/* Profile photo — clamps size on very small screens */}
        <div
          className="rounded-full border-4 border-white overflow-hidden shrink-0 shadow-[0_4px_20px_rgba(0,0,0,0.12)]"
          style={{ width: "clamp(140px, 44vw, 164px)", height: "clamp(140px, 44vw, 164px)" }}
        >
          {employee.profile_image ? (
            <Image
              src={resolveImageUrl(employee.profile_image)!}
              alt={employee.full_name}
              width={164}
              height={164}
              priority
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full bg-[#a8bbc8] flex items-center justify-center">
              <span className="text-5xl font-bold text-white">
                {employee.full_name.charAt(0)}
              </span>
            </div>
          )}
        </div>

        {/* Name block + quick actions */}
        <div className="flex flex-col gap-[28px] items-center w-full">
          <div className="flex flex-col gap-[8px] items-center text-center text-[#121212] w-full">
            <h1
              className="font-bold tracking-[-0.01em]"
              style={{
                fontSize: "clamp(26px, 7vw, 31px)",
                lineHeight: 1.1,
              }}
            >
              {employee.full_name}
            </h1>
            <div className="flex flex-col gap-[4px] text-[16px] w-full px-[8px]">
              <p className="font-medium leading-[20px]">{employee.designation}</p>
              <p className="font-bold leading-[20px]">Intelligaia Technologies Pvt. Ltd.</p>
              <p className="font-medium leading-[20px]">intelligaia.com</p>
            </div>
          </div>

          {/* Quick actions — 52px yellow circles */}
          <div className="flex gap-[6px] items-center">
            {(employee.quick_actions ?? ["call", "email", "whatsapp", "add_contact"]).map((action) => {
              const base = `hover:brightness-95 transition-[filter] rounded-full ${focusRing}`;
              switch (action) {
                case "call":
                  return (
                    <a key="call" href={`tel:${displayPhone}`} aria-label="Call" className={base}>
                      <YellowCircle size={52}>{Glyph.phone(22)}</YellowCircle>
                    </a>
                  );
                case "email":
                  return (
                    <a key="email" href={`mailto:${employee.email}`} aria-label="Email" className={base}>
                      <YellowCircle size={52}>{Glyph.email(22)}</YellowCircle>
                    </a>
                  );
                case "whatsapp":
                  return (
                    <a key="whatsapp" href={whatsappHref} target="_blank" rel="noopener noreferrer" aria-label="WhatsApp" className={base}>
                      <YellowCircle size={52}>{Glyph.whatsapp(22)}</YellowCircle>
                    </a>
                  );
                case "add_contact":
                  return (
                    <button key="add_contact" onClick={handleAddToContact} aria-label="Add to contacts" className={base}>
                      <YellowCircle size={52}>{Glyph.userPlus(22)}</YellowCircle>
                    </button>
                  );
                case "calendar":
                  if (!employee.calendar_url) return null;
                  return (
                    <a key="calendar" href={employee.calendar_url} target="_blank" rel="noopener noreferrer" aria-label="Book a meeting" className={base}>
                      <YellowCircle size={52}>{Glyph.calendar(22)}</YellowCircle>
                    </a>
                  );
                case "linkedin":
                  if (!employee.linkedin_url) return null;
                  return (
                    <a key="linkedin" href={resolveHref("linkedin", employee.linkedin_url)} target="_blank" rel="noopener noreferrer" aria-label="LinkedIn" className={base}>
                      <YellowCircle size={52}>{Glyph.linkedin(22)}</YellowCircle>
                    </a>
                  );
                case "telegram":
                  if (!telegramLink) return null;
                  return (
                    <a key="telegram" href={resolveHref("telegram", telegramLink.url)} target="_blank" rel="noopener noreferrer" aria-label="Telegram" className={base}>
                      <YellowCircle size={52}>{Glyph.telegram(22)}</YellowCircle>
                    </a>
                  );
                case "website":
                  if (!employee.website_url) return null;
                  return (
                    <a key="website" href={resolveHref("website", employee.website_url)} target="_blank" rel="noopener noreferrer" aria-label="Website" className={base}>
                      <YellowCircle size={52}>{Glyph.globe(22)}</YellowCircle>
                    </a>
                  );
                default:
                  return null;
              }
            })}
          </div>
        </div>

        {/* ── Cards stack ── */}
        <div className="flex flex-col gap-[18px] items-start w-full">
          {/* Contact Us */}
          <div className="bg-white rounded-[18px] p-[16px] w-full flex flex-col gap-[16px]">
            <div className="flex gap-[12px] items-center w-full">
              <YellowCircle size={44}>{Glyph.phone(22)}</YellowCircle>
              <p className="text-[16px] font-medium text-[#121212] leading-[18px]">Contact Us</p>
            </div>
            <div className="flex flex-col w-full">
              <p className="text-[12px] font-normal text-[#727272] leading-[18px]">Contact Us</p>
              {allPhones.map((pn) => (
                <a
                  key={pn.id}
                  href={`tel:${pn.country_code}${pn.number}`}
                  className={`text-[14px] font-medium text-[#121212] leading-[20px] hover:underline rounded ${focusRing}`}
                >
                  {pn.country_code} {pn.number}
                  {pn.label && (
                    <span className="text-[12px] font-normal text-[#727272]"> ({pn.label})</span>
                  )}
                </a>
              ))}
            </div>
            <div className="flex flex-col w-full">
              <p className="text-[12px] font-normal text-[#727272] leading-[18px]">Email</p>
              <a
                href={`mailto:${employee.email}`}
                className={`text-[14px] font-medium text-[#121212] leading-[18px] hover:underline break-all rounded ${focusRing}`}
              >
                {employee.email}
              </a>
            </div>
          </div>

          <DashedDivider />

          {/* Social Links */}
          {socialItems.length > 0 && (
            <>
              <div className="bg-white rounded-[18px] p-[16px] w-full flex flex-col gap-[16px]">
                <CardHeader title="Social Links" subtitle="Follow us for more info on" />
                {(showAllSocial
                  ? socialItems
                  : socialItems.slice(0, VISIBLE_SOCIAL_COUNT)
                ).map((item) => (
                  <a
                    key={item.key}
                    href={item.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`flex gap-[12px] items-center w-full group rounded-[12px] -mx-1 px-1 py-1 hover:bg-[#fafafa] transition-colors ${focusRing}`}
                  >
                    <YellowCircle size={48}>{item.glyph(22)}</YellowCircle>
                    <div className="flex flex-col gap-[2px] flex-1 min-w-0">
                      <p className="text-[16px] font-medium text-[#121212] leading-[18px] group-hover:underline truncate">
                        {item.label}
                      </p>
                      <p className="text-[12px] font-normal text-[#727272] leading-[14px] truncate">
                        {item.subtitle}
                      </p>
                    </div>
                    <span className="text-[#121212] shrink-0">{Glyph.chevronRight(20)}</span>
                  </a>
                ))}
                {socialItems.length > VISIBLE_SOCIAL_COUNT && (
                  <button
                    onClick={() => setShowAllSocial(!showAllSocial)}
                    className={`flex items-center justify-center gap-2 w-full py-2 text-[13px] font-medium text-[#727272] hover:text-[#121212] transition-colors rounded ${focusRing}`}
                  >
                    {showAllSocial ? (
                      <>Show less
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 15l7-7 7 7" />
                        </svg>
                      </>
                    ) : (
                      <>See all {socialItems.length} links
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                        </svg>
                      </>
                    )}
                  </button>
                )}
              </div>
              <DashedDivider />
            </>
          )}

          {/* Schedule a Meeting */}
          <div className="bg-white rounded-[18px] p-[16px] w-full flex flex-col gap-[16px]">
            <CardHeader
              title="Schedule a Meeting"
              subtitle="Schedule a meeting to discuss potential opportunities for collaboration"
            />
            <div className="flex flex-col gap-[8px] w-full">
              <a
                href={whatsappHref}
                target="_blank"
                rel="noopener noreferrer"
                className={`w-full bg-[#f9d852] text-[#121212] text-[12px] font-medium leading-[14px] py-[10px] px-[16px] rounded-full text-center hover:brightness-95 transition-[filter] ${focusRing}`}
              >
                Contact on WhatsApp
              </a>
              {employee.calendar_url ? (
                <a
                  href={employee.calendar_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`w-full border border-[#121212] text-[#121212] text-[12px] font-medium leading-[14px] py-[10px] px-[16px] rounded-full text-center hover:bg-[#f5f5f5] transition-colors ${focusRing}`}
                >
                  Add to Calendar
                </a>
              ) : (
                <button
                  onClick={() => setMeetingOpen(true)}
                  className={`w-full border border-[#121212] text-[#121212] text-[12px] font-medium leading-[14px] py-[10px] px-[16px] rounded-full text-center hover:bg-[#f5f5f5] transition-colors ${focusRing}`}
                >
                  Add to Calendar
                </button>
              )}
            </div>
          </div>

          <DashedDivider />

          {/* Company */}
          <div className="bg-white rounded-[18px] p-[16px] w-full flex flex-col gap-[16px]">
            <CardHeader
              title="Intelligaia Technologies Pvt. Ltd."
              subtitle="AI-Centered Design & Engineering"
            />
            <div className="flex gap-[12px] items-start w-full">
              <p className="flex-1 text-[12px] font-normal text-[#727272] leading-[14px] pt-[2px]">
                Address
              </p>
              <div className="flex flex-col gap-[12px] items-end min-w-0">
                <p className="text-[12px] font-medium text-[#727272] leading-[16px] text-right">
                  Plot I-63,<br />
                  Sector 83, Alpha I.T. City,<br />
                  Mohali, Punjab - 140306<br />
                  India
                </p>
                <a
                  href="https://maps.app.goo.gl/x33db9KgBQ7Skz3Z9"
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`inline-flex gap-[6px] items-center justify-center bg-[#f9d852] text-[#121212] text-[12px] font-medium leading-[18px] px-[16px] py-[6px] rounded-full hover:brightness-95 transition-[filter] whitespace-nowrap ${focusRing}`}
                >
                  {Glyph.paperPlane(12)}
                  Get directions
                </a>
              </div>
            </div>
          </div>
        </div>
        {/* end of cards stack */}
      </div>
      {/* end of profile+cards */}
      </div>
      {/* end of constrained content column */}

      {/* ── Floating QR + Share FABs (bottom-left) ── */}
      <div className="fixed bottom-[20px] left-[20px] z-50 flex gap-[10px]">
        <button
          onClick={() => { setQrLoaded(false); setQrOpen(true); }}
          aria-label="Show QR code"
          className={`w-[46px] h-[46px] rounded-full bg-[#121212] text-white shadow-lg flex items-center justify-center hover:bg-[#2a2a2a] transition-colors ${focusRing}`}
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 4.875c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5A1.125 1.125 0 013.75 9.375v-4.5zM3.75 14.625c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5a1.125 1.125 0 01-1.125-1.125v-4.5zM13.5 4.875c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5A1.125 1.125 0 0113.5 9.375v-4.5z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 14.625v2.25m0 2.25h2.25m2.25 0h-2.25m0 0v-2.25m0 0h2.25" />
          </svg>
        </button>

        <div className="relative">
          {shareOpen && (
            <div className="absolute bottom-[52px] left-0 bg-white rounded-2xl shadow-xl border border-[#e5e5e5] p-3 w-[200px] animate-slide-up">
              <p className="text-[11px] font-semibold text-[#727272] uppercase tracking-wider mb-2 px-1">
                Share Profile
              </p>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(shareUrl("shared"));
                  toast.success("Link copied to clipboard");
                  setShareOpen(false);
                }}
                className={`flex items-center gap-3 w-full px-2 py-2.5 rounded-xl hover:bg-[#f5f5f5] transition-colors text-left ${focusRing}`}
              >
                <svg className="w-5 h-5 text-[#121212] shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.666 3.888A2.25 2.25 0 0013.5 2.25h-3c-1.03 0-1.9.693-2.166 1.638m7.332 0c.055.194.084.4.084.612v0a.75.75 0 01-.75.75H9.75a.75.75 0 01-.75-.75v0c0-.212.03-.418.084-.612m7.332 0c.646.049 1.288.11 1.927.184 1.1.128 1.907 1.077 1.907 2.185V19.5a2.25 2.25 0 01-2.25 2.25H6.75A2.25 2.25 0 014.5 19.5V6.257c0-1.108.806-2.057 1.907-2.185a48.208 48.208 0 011.927-.184" />
                </svg>
                <span className="text-[13px] font-medium text-[#121212]">Copy Link</span>
              </button>
              <a
                href={`https://wa.me/?text=${encodeURIComponent(employee.full_name + " - " + shareUrl("whatsapp"))}`}
                target="_blank" rel="noopener noreferrer"
                className={`flex items-center gap-3 w-full px-2 py-2.5 rounded-xl hover:bg-[#f5f5f5] transition-colors ${focusRing}`}
                onClick={() => setShareOpen(false)}
              >
                <YellowCircle size={20}>{Glyph.whatsapp(12)}</YellowCircle>
                <span className="text-[13px] font-medium text-[#121212]">WhatsApp</span>
              </a>
              <a
                href={`mailto:?subject=${encodeURIComponent(employee.full_name + "'s Profile")}&body=${encodeURIComponent(shareUrl("email"))}`}
                className={`flex items-center gap-3 w-full px-2 py-2.5 rounded-xl hover:bg-[#f5f5f5] transition-colors ${focusRing}`}
                onClick={() => setShareOpen(false)}
              >
                <svg className="w-5 h-5 text-[#121212] shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
                </svg>
                <span className="text-[13px] font-medium text-[#121212]">Email</span>
              </a>
              <a
                href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl("linkedin"))}`}
                target="_blank" rel="noopener noreferrer"
                className={`flex items-center gap-3 w-full px-2 py-2.5 rounded-xl hover:bg-[#f5f5f5] transition-colors ${focusRing}`}
                onClick={() => setShareOpen(false)}
              >
                <YellowCircle size={20}>{Glyph.linkedin(12)}</YellowCircle>
                <span className="text-[13px] font-medium text-[#121212]">LinkedIn</span>
              </a>
            </div>
          )}
          <button
            onClick={() => setShareOpen(!shareOpen)}
            aria-label="Share profile"
            className={`w-[46px] h-[46px] rounded-full bg-[#121212] text-white shadow-lg flex items-center justify-center hover:bg-[#2a2a2a] transition-colors ${focusRing}`}
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M7.217 10.907a2.25 2.25 0 100 2.186m0-2.186c.18.324.283.696.283 1.093s-.103.77-.283 1.093m0-2.186l9.566-5.314m-9.566 7.5l9.566 5.314m0 0a2.25 2.25 0 103.935 2.186 2.25 2.25 0 00-3.935-2.186zm0-12.814a2.25 2.25 0 103.933-2.185 2.25 2.25 0 00-3.933 2.185z" />
            </svg>
          </button>
        </div>
      </div>

      {shareOpen && (
        <div className="fixed inset-0 z-40" onClick={() => setShareOpen(false)} />
      )}

      {/* Floating Schedule a Meeting */}
      <button
        onClick={() => setMeetingOpen(true)}
        className={`fixed bottom-[20px] right-[20px] z-50 flex gap-[8px] items-center justify-center bg-[#121212] text-white pl-[16px] pr-[6px] py-[6px] rounded-full shadow-lg hover:bg-[#2a2a2a] transition-colors ${focusRing}`}
      >
        <span className="text-[12px] font-medium leading-[14px]">Schedule a Meeting</span>
        <span className="w-[34px] h-[34px] rounded-full bg-[#f9d852] text-[#121212] flex items-center justify-center shrink-0">
          {Glyph.calendar(18)}
        </span>
      </button>

      {/* QR Modal */}
      {qrOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setQrOpen(false)} />
          <div className="relative bg-white rounded-2xl shadow-2xl p-6 max-w-[300px] w-full mx-4 text-center animate-slide-up">
            <button
              onClick={() => setQrOpen(false)}
              aria-label="Close"
              className={`absolute top-3 right-3 text-[#727272] hover:text-[#121212] rounded ${focusRing}`}
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            <p className="text-[16px] font-semibold text-[#121212] mb-1">{employee.full_name}</p>
            <p className="text-[12px] text-[#727272] mb-4">Scan to view profile</p>
            <div className="relative w-[200px] h-[200px] mx-auto">
              {!qrLoaded && <div className="absolute inset-0 bg-[#f0f0f0] rounded-xl animate-pulse" />}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={employee.qr_code?.qr_url || `${API_URL}/public/qr/${employee.slug}`}
                alt="QR Code"
                className={`w-[200px] h-[200px] border rounded-xl transition-opacity duration-300 ${qrLoaded ? "opacity-100" : "opacity-0"}`}
                onLoad={() => setQrLoaded(true)}
                onError={(e) => {
                  const qrUrl = new URL(window.location.href);
                  qrUrl.searchParams.set("source", "qr");
                  (e.target as HTMLImageElement).src = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(qrUrl.toString())}`;
                }}
              />
            </div>
            <div className="flex gap-2 mt-5">
              <button
                onClick={() => { setQrOpen(false); handleAddToContact(); }}
                className={`flex-1 bg-[#121212] text-white text-[12px] font-medium py-2.5 rounded-full text-center hover:bg-[#2a2a2a] transition-colors ${focusRing}`}
              >
                Save Contact
              </button>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(shareUrl("shared"));
                  setQrOpen(false);
                }}
                className={`flex-1 border border-[#e5e5e5] text-[#121212] text-[12px] font-medium py-2.5 rounded-full text-center hover:bg-[#f5f5f5] transition-colors ${focusRing}`}
              >
                Copy Link
              </button>
            </div>
          </div>
        </div>
      )}

      <MeetingDialog
        slug={employee.slug}
        employeeName={employee.full_name}
        open={meetingOpen}
        onClose={() => setMeetingOpen(false)}
      />
    </div>
  );
}

/** Centered header block — matches Figma's w-[250px] items-start text-center pattern. */
function CardHeader({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div className="w-full flex justify-center">
      <div className="flex flex-col gap-[10px] text-center max-w-[250px]">
        <p className="text-[20px] font-semibold text-[#121212] leading-[24px]">{title}</p>
        <p className="text-[12px] font-normal text-[#727272] leading-[14px]">{subtitle}</p>
      </div>
    </div>
  );
}

/** Dashed separator between cards. */
function DashedDivider() {
  return (
    <div
      className="w-full h-px my-[2px]"
      style={{
        backgroundImage:
          "repeating-linear-gradient(to right, #b8b8b8 0, #b8b8b8 4px, transparent 4px, transparent 8px)",
      }}
    />
  );
}

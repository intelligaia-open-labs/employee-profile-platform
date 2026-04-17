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

export function ProfileCard({ employee }: Props) {
  const [meetingOpen, setMeetingOpen] = useState(false);
  const [showAllSocial, setShowAllSocial] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const [qrOpen, setQrOpen] = useState(false);
  const [qrLoaded, setQrLoaded] = useState(false);

  /** Add to contact — platform-aware approach */
  function handleAddToContact() {
    const vcardUrl = `${API_URL}/public/vcard/${employee.slug}`;

    // Mobile (iOS + Android): direct navigation to vCard URL
    // iOS Safari: opens Contacts app directly
    // Android Chrome: downloads .vcf, tapping notification opens Contacts
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
    if (isMobile) {
      window.location.href = vcardUrl;
      return;
    }

    // Desktop: fetch and download as file
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

  // Use phone_numbers if available, fall back to legacy phone field
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

  // Platform icon and subtitle mapping
  const platformMeta: Record<string, { icon: string; subtitle: string }> = {
    linkedin: { icon: "/profile/icon-linkedin.svg", subtitle: "Connect with us on LinkedIn" },
    whatsapp: { icon: "/profile/icon-whatsapp.svg", subtitle: "Chat with us on WhatsApp" },
    telegram: { icon: "/profile/icon-telegram.svg", subtitle: "Join our Telegram channel" },
    website: { icon: "/profile/icon-website.svg", subtitle: "Visit our company website" },
    webpage: { icon: "/profile/icon-website.svg", subtitle: "Visit our company website" },
    instagram: { icon: "/profile/icon-instagram.svg", subtitle: "Follow us on Instagram" },
    "x (twitter)": { icon: "/profile/icon-twitter.svg", subtitle: "Follow us on X" },
    twitter: { icon: "/profile/icon-twitter.svg", subtitle: "Follow us on X" },
    youtube: { icon: "/profile/icon-youtube.svg", subtitle: "Watch us on YouTube" },
    facebook: { icon: "/profile/icon-facebook.svg", subtitle: "Follow us on Facebook" },
    github: { icon: "/profile/icon-github.svg", subtitle: "View our code on GitHub" },
  };

  function resolveHref(platform: string, url: string): string {
    const key = platform.toLowerCase();
    if (key === "whatsapp") {
      const digits = url.replace(/[^0-9]/g, "");
      return `https://wa.me/${digits}`;
    }
    if (url.startsWith("http://") || url.startsWith("https://")) return url;
    return `https://${url}`;
  }

  // Build social items from dedicated fields + social_links
  const socialItems: { key: string; icon: string; label: string; subtitle: string; href: string }[] = [];

  if (employee.linkedin_url) {
    socialItems.push({
      key: "linkedin",
      ...platformMeta.linkedin,
      label: "LinkedIn",
      href: resolveHref("linkedin", employee.linkedin_url),
    });
  }

  employee.social_links.forEach((s) => {
    const key = s.platform.toLowerCase();
    const meta = platformMeta[key] ?? { icon: "/profile/icon-website.svg", subtitle: `Visit ${s.platform}` };
    socialItems.push({
      key: s.id,
      icon: meta.icon,
      label: s.platform,
      subtitle: meta.subtitle,
      href: resolveHref(s.platform, s.url),
    });
  });

  if (employee.website_url) {
    socialItems.push({
      key: "website",
      ...platformMeta.website,
      label: "Webpage",
      href: resolveHref("website", employee.website_url),
    });
  }

  return (
    <div
      className="relative w-full mx-auto min-h-screen pb-[90px] pt-[36px] px-[16px]"
    >
      {/* Content */}
      <div className="relative flex flex-col gap-[58px] items-start w-full">
        {/* ── Logo ── */}
        <div className="flex flex-col items-center justify-end w-full h-[80px]">
          <div className="flex flex-col items-center">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/profile/logo.svg"
              alt="Logo"
              className="h-[32px] w-auto"
            />
            <p className="text-[9.778px] text-white leading-[18px] font-normal">
              humanizing AI for enterprises
            </p>
          </div>
        </div>

        {/* ── Profile + Cards ── */}
        <div className="flex flex-col gap-[36px] items-center w-full">
          {/* Profile Photo */}
          <div className="w-[164px] h-[164px] rounded-full border-4 border-white overflow-hidden shrink-0">
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

          {/* Name + Title + Actions */}
          <div className="flex flex-col gap-[28px] items-center w-full">
            {/* Name block */}
            <div className="flex flex-col gap-[8px] items-center text-center text-white w-full">
              <h1 className="text-[31px] font-bold leading-[34px] w-full">
                {employee.full_name}
              </h1>
              <div className="flex flex-col gap-[4px] text-[16px] w-full">
                <p className="font-medium leading-[18px]">
                  {employee.designation}
                </p>
              </div>
            </div>

            {/* Quick action buttons */}
            <div className="flex gap-[6px] items-center">
              {/* Call */}
              <a
                href={`tel:${displayPhone}`}
                className="w-[52px] h-[52px] rounded-full overflow-hidden hover:opacity-90 transition-opacity"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/profile/icon-call.svg"
                  alt="Call"
                  className="w-full h-full"
                />
              </a>
              {/* Email */}
              <a
                href={`mailto:${employee.email}`}
                className="w-[52px] h-[52px] rounded-full overflow-hidden hover:opacity-90 transition-opacity"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/profile/icon-email.svg"
                  alt="Email"
                  className="w-full h-full"
                />
              </a>
              {/* WhatsApp */}
              <a
                href={`https://wa.me/${phoneDigits}`}
                target="_blank"
                rel="noopener noreferrer"
                className="w-[52px] h-[52px] rounded-full overflow-hidden hover:opacity-90 transition-opacity"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/profile/icon-sms.svg"
                  alt="WhatsApp"
                  className="w-full h-full"
                />
              </a>
              {/* Add to Contact */}
              <button
                onClick={handleAddToContact}
                className="w-[52px] h-[52px] rounded-full bg-white flex items-center justify-center overflow-hidden hover:opacity-90 transition-opacity"
              >
                <svg
                  className="w-[24px] h-[24px] text-[#121212]"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={1.8}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M19 7.5v3m0 0v3m0-3h3m-3 0h-3m-2.25-4.125a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zM4 19.235v-.11a6.375 6.375 0 0112.75 0v.109A12.318 12.318 0 0110.374 21c-2.331 0-4.512-.645-6.374-1.766z"
                  />
                </svg>
              </button>
              {/* Book a Meeting — Google Calendar */}
              {employee.calendar_url && (
                <a
                  href={employee.calendar_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-[52px] h-[52px] rounded-full bg-[#4285f4] flex items-center justify-center overflow-hidden hover:bg-[#3367d6] transition-colors shadow-md"
                >
                  <svg className="w-[24px] h-[24px] text-white" viewBox="0 0 24 24" fill="none">
                    <rect x="3" y="4" width="18" height="18" rx="3" stroke="currentColor" strokeWidth="1.6" />
                    <path d="M3 9h18" stroke="currentColor" strokeWidth="1.6" />
                    <path d="M8 3v3M16 3v3" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
                    <path d="M9.5 13.5l2 2 3.5-4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </a>
              )}
            </div>
          </div>

          {/* ── Cards ── */}
          <div className="flex flex-col gap-[18px] items-start w-full">
            {/* ── Contact Us Card ── */}
            <div className="bg-white rounded-[18px] p-[16px] w-full flex flex-col gap-[16px]">
              {/* Header */}
              <div className="flex gap-[12px] items-center w-full">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/profile/icon-contact-header.svg"
                  alt=""
                  className="w-[44px] h-[44px] shrink-0"
                />
                <p className="text-[16px] font-medium text-[#121212] leading-[18px]">
                  Contact Us
                </p>
              </div>

              {/* Divider */}
              <div className="w-full h-px bg-[#e5e5e5]" />

              {/* Phone Numbers */}
              <div className="flex items-start w-full">
                <div className="flex-1">
                  <p className="text-[12px] font-normal text-[#727272] leading-[18px]">
                    Contact Us
                  </p>
                {allPhones.map((pn) => (
                  <a
                    key={pn.id}
                    href={`tel:${pn.country_code}${pn.number}`}
                    className="text-[14px] font-medium text-[#121212] leading-[20px] hover:underline"
                  >
                    {pn.country_code} {pn.number}
                    {pn.label && (
                      <span className="text-[12px] font-normal text-[#727272]">
                        {" "}({pn.label})
                      </span>
                    )}
                  </a>
                ))}
                </div>
                <button
                  onClick={handleAddToContact}
                  className="inline-flex gap-[10.732px] items-center justify-center bg-[#121212] text-white text-[12px] font-medium leading-[18px] px-[16px] py-[6px] rounded-full hover:bg-[#2a2a2a] transition-colors shrink-0 self-end"
                >
                  <svg className="w-[12px] h-[12px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 7.5v3m0 0v3m0-3h3m-3 0h-3m-2.25-4.125a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zM4 19.235v-.11a6.375 6.375 0 0112.75 0v.109A12.318 12.318 0 0110.374 21c-2.331 0-4.512-.645-6.374-1.766z" />
                  </svg>
                  Add to Contact
                </button>
              </div>

              {/* Email */}
              <div className="flex flex-col w-full">
                <p className="text-[12px] font-normal text-[#727272] leading-[18px]">
                  Email
                </p>
                <a
                  href={`mailto:${employee.email}`}
                  className="text-[14px] font-medium text-[#121212] leading-[18px] hover:underline"
                >
                  {employee.email}
                </a>
              </div>

            </div>

            {/* ── Social Links Card ── */}
            {socialItems.length > 0 && (
              <div className="bg-white rounded-[18px] p-[16px] w-full flex flex-col gap-[16px]">
                {/* Header */}
                <div className="flex flex-col gap-[10px] items-start text-center w-full">
                  <p className="text-[20px] font-semibold text-[#121212] leading-[18px] w-full">
                    Social Links
                  </p>
                  <p className="text-[12px] font-normal text-[#727272] leading-[14px] w-full">
                    Follow us for more info on
                  </p>
                </div>

                {/* Divider */}
                <div className="w-full h-px bg-[#e5e5e5]" />

                {/* Social link rows — show first 4, expand on click */}
                {(showAllSocial
                  ? socialItems
                  : socialItems.slice(0, VISIBLE_SOCIAL_COUNT)
                ).map((item) => (
                  <a
                    key={item.key}
                    href={item.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex gap-[12px] items-center w-full group"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={item.icon}
                      alt=""
                      className="w-[48px] h-[48px] shrink-0 rounded-full"
                    />
                    <div className="flex flex-col gap-[2px] flex-1 min-w-0">
                      <p className="text-[16px] font-medium text-[#121212] leading-[18px] group-hover:underline">
                        {item.label}
                      </p>
                      <p className="text-[12px] font-normal text-[#727272] leading-[14px]">
                        {item.subtitle}
                      </p>
                    </div>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src="/profile/icon-chevron.svg"
                      alt=""
                      className="w-[20px] h-[20px] shrink-0"
                    />
                  </a>
                ))}

                {/* See more / See less toggle */}
                {socialItems.length > VISIBLE_SOCIAL_COUNT && (
                  <button
                    onClick={() => setShowAllSocial(!showAllSocial)}
                    className="flex items-center justify-center gap-2 w-full py-2 text-[13px] font-medium text-[#727272] hover:text-[#121212] transition-colors"
                  >
                    {showAllSocial ? (
                      <>
                        Show less
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 15l7-7 7 7" />
                        </svg>
                      </>
                    ) : (
                      <>
                        See all {socialItems.length} links
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                        </svg>
                      </>
                    )}
                  </button>
                )}
              </div>
            )}

            {/* ── Schedule a Meeting Card ── */}
            <div className="bg-white rounded-[18px] p-[16px] w-full flex flex-col gap-[16px]">
              {/* Header */}
              <div className="flex flex-col gap-[10px] items-start text-center w-full">
                <p className="text-[20px] font-semibold text-[#121212] leading-[18px] w-full">
                  Schedule a Meeting
                </p>
                <p className="text-[12px] font-normal text-[#727272] leading-[14px] w-full">
                  Schedule a meeting to discuss potential opportunities for
                  collaboration
                </p>
              </div>

              {/* Divider */}
              <div className="w-full h-px bg-[#e5e5e5]" />

              {/* Google Calendar Booking */}
              {employee.calendar_url && (
                <a
                  href={employee.calendar_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-[12px] w-full p-[12px] rounded-[14px] border border-[#e5e5e5] hover:border-[#4285f4]/30 hover:bg-[#4285f4]/[0.03] transition-all group"
                >
                  {/* Google Calendar icon */}
                  <div className="w-[44px] h-[44px] rounded-[12px] bg-gradient-to-br from-[#4285f4] to-[#1a73e8] flex items-center justify-center shrink-0 shadow-sm">
                    <svg className="w-[22px] h-[22px] text-white" viewBox="0 0 24 24" fill="none">
                      <rect x="3" y="4" width="18" height="18" rx="3" stroke="currentColor" strokeWidth="1.8" />
                      <path d="M3 9h18" stroke="currentColor" strokeWidth="1.8" />
                      <path d="M8 3v3M16 3v3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                      <circle cx="12" cy="15.5" r="1.5" fill="currentColor" />
                      <circle cx="8" cy="15.5" r="1.5" fill="currentColor" />
                      <circle cx="16" cy="15.5" r="1.5" fill="currentColor" />
                    </svg>
                  </div>
                  <div className="flex flex-col gap-[2px] flex-1 min-w-0">
                    <p className="text-[14px] font-semibold text-[#121212] leading-[18px] group-hover:text-[#1a73e8] transition-colors">
                      Book on Google Calendar
                    </p>
                    <p className="text-[11px] font-normal text-[#727272] leading-[14px]">
                      Pick a time that works for you
                    </p>
                  </div>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src="/profile/icon-chevron.svg"
                    alt=""
                    className="w-[20px] h-[20px] shrink-0"
                  />
                </a>
              )}

              {/* Buttons */}
              <div className="flex flex-col gap-[8px] w-full">
                <button
                  onClick={() => setMeetingOpen(true)}
                  className="w-full bg-[#121212] text-white text-[12px] font-medium leading-[14px] py-[10px] px-[16px] rounded-full text-center hover:bg-[#2a2a2a] transition-colors"
                >
                  Schedule a Meeting
                </button>
                <a
                  href={`https://wa.me/${phoneDigits}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full bg-[#121212] text-white text-[12px] font-medium leading-[14px] py-[10px] px-[16px] rounded-full text-center hover:bg-[#2a2a2a] transition-colors"
                >
                  Contact on WhatsApp
                </a>
              </div>
            </div>

            {/* ── Company Info Card (fixed content) ── */}
            <div className="bg-white rounded-[18px] p-[16px] w-full flex flex-col gap-[16px] relative overflow-visible">
              {/* Header */}
              <div className="flex flex-col gap-[10px] items-start text-center w-full">
                <p className="text-[20px] font-semibold text-[#121212] leading-[normal] w-full">
                  Intelligaia Technologies Pvt. Ltd.
                </p>
                <p className="text-[12px] font-normal text-[#727272] leading-[14px] w-full">
                  AI-Centered Design &amp; Engineering
                </p>
              </div>

              {/* Divider */}
              <div className="w-full h-px bg-[#e5e5e5]" />

              {/* Address */}
              <div className="flex gap-[12px] items-start w-full">
                <p className="flex-1 text-[12px] font-normal text-[#727272] leading-[14px]">
                  Address
                </p>
                <div className="flex flex-col gap-[12px] items-end">
                  <p className="text-[12px] font-medium text-[#727272] leading-[normal] text-right">
                    Plot I-63,<br />
                    Sector 83, Alpha I.T. City,<br />
                    Mohali, Punjab - 140306<br />
                    India
                  </p>
                  <a
                    href="https://maps.app.goo.gl/x33db9KgBQ7Skz3Z9"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex gap-[10.732px] items-center justify-center bg-[#121212] text-white text-[12px] font-medium leading-[18px] px-[16px] py-[6px] rounded-full hover:bg-[#2a2a2a] transition-colors"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src="/profile/icon-location.svg"
                      alt=""
                      className="w-[12px] h-[12px] rotate-180 -scale-y-100 brightness-0 invert"
                    />
                    Get directions
                  </a>
                </div>
              </div>

              {/* Website */}
              <div className="flex gap-[12px] items-start text-[12px] text-[#727272] w-full">
                <p className="flex-1 font-normal leading-[14px]">Website</p>
                <a
                  href="https://www.intelligaia.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-medium leading-[14px] text-right hover:underline"
                >
                  www.intelligaia.com
                </a>
              </div>
            </div>

          </div>
        </div>
      </div>

      {/* Fixed QR + Share FABs — bottom left */}
      <div className="fixed bottom-[20px] left-[20px] z-50 flex gap-[10px]">
        {/* QR Button */}
        <button
          onClick={() => { setQrLoaded(false); setQrOpen(true); }}
          className="w-[46px] h-[46px] rounded-full bg-[#121212] text-white shadow-lg flex items-center justify-center hover:bg-[#2a2a2a] transition-colors"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 4.875c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5A1.125 1.125 0 013.75 9.375v-4.5zM3.75 14.625c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5a1.125 1.125 0 01-1.125-1.125v-4.5zM13.5 4.875c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5A1.125 1.125 0 0113.5 9.375v-4.5z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 14.625v2.25m0 2.25h2.25m2.25 0h-2.25m0 0v-2.25m0 0h2.25" />
          </svg>
        </button>

        {/* Share Button */}
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
                className="flex items-center gap-3 w-full px-2 py-2.5 rounded-xl hover:bg-[#f5f5f5] transition-colors text-left"
              >
                <svg className="w-5 h-5 text-[#121212] shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.666 3.888A2.25 2.25 0 0013.5 2.25h-3c-1.03 0-1.9.693-2.166 1.638m7.332 0c.055.194.084.4.084.612v0a.75.75 0 01-.75.75H9.75a.75.75 0 01-.75-.75v0c0-.212.03-.418.084-.612m7.332 0c.646.049 1.288.11 1.927.184 1.1.128 1.907 1.077 1.907 2.185V19.5a2.25 2.25 0 01-2.25 2.25H6.75A2.25 2.25 0 014.5 19.5V6.257c0-1.108.806-2.057 1.907-2.185a48.208 48.208 0 011.927-.184" />
                </svg>
                <span className="text-[13px] font-medium text-[#121212]">Copy Link</span>
              </button>
              <a
                href={`https://wa.me/?text=${encodeURIComponent(employee.full_name + " - " + shareUrl("whatsapp"))}`}
                target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-3 w-full px-2 py-2.5 rounded-xl hover:bg-[#f5f5f5] transition-colors"
                onClick={() => setShareOpen(false)}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/profile/icon-whatsapp.svg" alt="" className="w-5 h-5 rounded-full shrink-0" />
                <span className="text-[13px] font-medium text-[#121212]">WhatsApp</span>
              </a>
              <a
                href={`mailto:?subject=${encodeURIComponent(employee.full_name + "'s Profile")}&body=${encodeURIComponent(shareUrl("email"))}`}
                className="flex items-center gap-3 w-full px-2 py-2.5 rounded-xl hover:bg-[#f5f5f5] transition-colors"
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
                className="flex items-center gap-3 w-full px-2 py-2.5 rounded-xl hover:bg-[#f5f5f5] transition-colors"
                onClick={() => setShareOpen(false)}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/profile/icon-linkedin.svg" alt="" className="w-5 h-5 rounded-full shrink-0" />
                <span className="text-[13px] font-medium text-[#121212]">LinkedIn</span>
              </a>
            </div>
          )}
          <button
            onClick={() => setShareOpen(!shareOpen)}
            className="w-[46px] h-[46px] rounded-full bg-[#121212] text-white shadow-lg flex items-center justify-center hover:bg-[#2a2a2a] transition-colors"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M7.217 10.907a2.25 2.25 0 100 2.186m0-2.186c.18.324.283.696.283 1.093s-.103.77-.283 1.093m0-2.186l9.566-5.314m-9.566 7.5l9.566 5.314m0 0a2.25 2.25 0 103.935 2.186 2.25 2.25 0 00-3.935-2.186zm0-12.814a2.25 2.25 0 103.933-2.185 2.25 2.25 0 00-3.933 2.185z" />
            </svg>
          </button>
        </div>
      </div>

      {/* Backdrop to close share menu */}
      {shareOpen && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setShareOpen(false)}
        />
      )}

      {/* Fixed Schedule a Meeting FAB — sticks to bottom of viewport */}
      <button
        onClick={() => setMeetingOpen(true)}
        className="fixed bottom-[20px] right-[20px] z-50 flex gap-[10.732px] items-center justify-center bg-[#121212] text-white pl-[16px] pr-[6px] py-[6px] rounded-full shadow-lg hover:bg-[#2a2a2a] transition-colors"
      >
        <span className="text-[12px] font-medium leading-[14px] w-[64px]">
          Schedule a Meeting
        </span>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/profile/icon-calendar.svg"
          alt=""
          className="w-[34px] h-[34px] shrink-0"
        />
      </button>

      {/* QR Preview Modal */}
      {qrOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setQrOpen(false)} />
          <div className="relative bg-white rounded-2xl shadow-2xl p-6 max-w-[300px] w-full mx-4 text-center animate-slide-up">
            <button
              onClick={() => setQrOpen(false)}
              className="absolute top-3 right-3 text-[#727272] hover:text-[#121212]"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            <p className="text-[16px] font-semibold text-[#121212] mb-1">
              {employee.full_name}
            </p>
            <p className="text-[12px] text-[#727272] mb-4">
              Scan to view profile
            </p>
            <div className="relative w-[200px] h-[200px] mx-auto">
              {!qrLoaded && (
                <div className="absolute inset-0 bg-[#f0f0f0] rounded-xl animate-pulse" />
              )}
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
                className="flex-1 bg-[#121212] text-white text-[12px] font-medium py-2.5 rounded-full text-center hover:bg-[#2a2a2a] transition-colors"
              >
                Save Contact
              </button>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(shareUrl("shared"));
                  setQrOpen(false);
                }}
                className="flex-1 border border-[#e5e5e5] text-[#121212] text-[12px] font-medium py-2.5 rounded-full text-center hover:bg-[#f5f5f5] transition-colors"
              >
                Copy Link
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Meeting Request Dialog */}
      <MeetingDialog
        slug={employee.slug}
        employeeName={employee.full_name}
        open={meetingOpen}
        onClose={() => setMeetingOpen(false)}
      />
    </div>
  );
}

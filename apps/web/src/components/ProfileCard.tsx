"use client";

import type { EmployeePublic } from "@business-profile/shared";
import Image from "next/image";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

interface Props {
  employee: EmployeePublic;
}

export function ProfileCard({ employee }: Props) {
  const phoneDigits = employee.phone.replace(/[^0-9]/g, "");

  const telegramLinks = employee.social_links.filter(
    (s) => s.platform.toLowerCase() === "telegram",
  );
  const otherLinks = employee.social_links.filter(
    (s) => s.platform.toLowerCase() !== "telegram",
  );

  const socialItems: {
    key: string;
    icon: string;
    label: string;
    subtitle: string;
    href: string;
  }[] = [];

  if (employee.linkedin_url) {
    socialItems.push({
      key: "linkedin",
      icon: "/profile/icon-linkedin.svg",
      label: "LinkedIn",
      subtitle: "Connect with us on LinkedIn",
      href: employee.linkedin_url,
    });
  }

  socialItems.push({
    key: "whatsapp",
    icon: "/profile/icon-whatsapp.svg",
    label: "WhatsApp",
    subtitle: "Chat with us on WhatsApp",
    href: `https://wa.me/${phoneDigits}`,
  });

  telegramLinks.forEach((s) => {
    socialItems.push({
      key: s.id,
      icon: "/profile/icon-telegram.svg",
      label: "Telegram",
      subtitle: "Join our Telegram channel",
      href: s.url,
    });
  });

  if (employee.website_url) {
    socialItems.push({
      key: "website",
      icon: "/profile/icon-website.svg",
      label: "Webpage",
      subtitle: "Visit our company website",
      href: employee.website_url,
    });
  }

  otherLinks.forEach((s) => {
    socialItems.push({
      key: s.id,
      icon: "/profile/icon-website.svg",
      label: s.platform,
      subtitle: `Visit ${s.platform}`,
      href: s.url,
    });
  });

  return (
    <div
      className="relative w-full max-w-md mx-auto min-h-screen pb-[60px] pt-[36px] px-[16px]"
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
                src={`${API_URL}${employee.profile_image}`}
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
              {/* Phone */}
              <a
                href={`tel:${employee.phone}`}
                className="w-[52px] h-[52px] rounded-full bg-white flex items-center justify-center overflow-hidden hover:opacity-90 transition-opacity"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/profile/icon-phone-action.svg"
                  alt="Call"
                  className="w-[22px] h-[22px]"
                />
              </a>
              {/* Call */}
              <a
                href={`tel:${employee.phone}`}
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
              {/* SMS / WhatsApp */}
              <a
                href={`https://wa.me/${phoneDigits}`}
                target="_blank"
                rel="noopener noreferrer"
                className="w-[52px] h-[52px] rounded-full overflow-hidden hover:opacity-90 transition-opacity"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/profile/icon-sms.svg"
                  alt="Message"
                  className="w-full h-full"
                />
              </a>
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

              {/* Phone */}
              <div className="flex flex-col w-full">
                <p className="text-[12px] font-normal text-[#727272] leading-[18px]">
                  Contact Us
                </p>
                <p className="text-[14px] font-medium text-[#121212] leading-[20px]">
                  {employee.phone}
                </p>
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

                {/* Social link rows */}
                {socialItems.map((item) => (
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
                      className="w-[48px] h-[48px] shrink-0"
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

              {/* Buttons */}
              <div className="flex flex-col gap-[8px] w-full">
                <a
                  href={`https://wa.me/${phoneDigits}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full bg-[#121212] text-white text-[12px] font-medium leading-[14px] py-[10px] px-[16px] rounded-full text-center hover:bg-[#2a2a2a] transition-colors"
                >
                  Contact on WhatsApp
                </a>
                <a
                  href={`mailto:${employee.email}?subject=Meeting%20Request`}
                  className="w-full bg-[#121212] text-white text-[12px] font-medium leading-[14px] py-[10px] px-[16px] rounded-full text-center hover:bg-[#2a2a2a] transition-colors"
                >
                  Add to Calendar
                </a>
              </div>
            </div>

            {/* ── Company Info Card ── */}
            <div className="bg-white rounded-[18px] p-[16px] w-full flex flex-col gap-[16px] relative overflow-visible">
              {/* Header */}
              <div className="flex flex-col gap-[10px] items-start text-center w-full">
                <p className="text-[20px] font-semibold text-[#121212] leading-[normal] w-full">
                  {employee.full_name}
                </p>
                <p className="text-[12px] font-normal text-[#727272] leading-[14px] w-full">
                  {employee.designation}
                </p>
              </div>

              {/* Divider */}
              <div className="w-full h-px bg-[#e5e5e5]" />

              {/* Address */}
              {employee.address && (
                <div className="flex gap-[12px] items-start w-full">
                  <p className="flex-1 text-[12px] font-normal text-[#727272] leading-[14px]">
                    Address
                  </p>
                  <div className="flex flex-col gap-[12px] items-end">
                    <p className="text-[12px] font-medium text-[#727272] leading-[normal] text-right w-[157px]">
                      {employee.address}
                    </p>
                    {/* Get directions button */}
                    <a
                      href={`https://maps.google.com/?q=${encodeURIComponent(employee.address)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex gap-[10.732px] items-center justify-center bg-[#121212] text-white text-[12px] font-medium leading-[18px] px-[16px] py-[6px] rounded-full hover:bg-[#2a2a2a] transition-colors"
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src="/profile/icon-location.svg"
                        alt=""
                        className="w-[12px] h-[12px] rotate-180 -scale-y-100 invert"
                      />
                      Get directions
                    </a>
                  </div>
                </div>
              )}

              {/* Website */}
              {employee.website_url && (
                <div className="flex gap-[12px] items-start text-[12px] text-[#727272] w-full">
                  <p className="flex-1 font-normal leading-[14px]">Website</p>
                  <a
                    href={employee.website_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-medium leading-[14px] text-right w-[157px] hover:underline"
                  >
                    {employee.website_url.replace(/^https?:\/\//, "")}
                  </a>
                </div>
              )}

            </div>

            {/* Save Contact — full width below cards */}
            <a
              href={`${API_URL}/public/vcard/${employee.slug}`}
              className="w-full bg-[#121212] text-white text-[14px] font-medium leading-[18px] py-[12px] px-[16px] rounded-full text-center hover:bg-[#2a2a2a] transition-colors mt-[8px]"
            >
              Save Contact
            </a>
          </div>
        </div>
      </div>

      {/* Fixed Schedule a Meeting FAB — sticks to bottom of viewport */}
      <a
        href={`https://wa.me/${phoneDigits}`}
        target="_blank"
        rel="noopener noreferrer"
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
      </a>
    </div>
  );
}

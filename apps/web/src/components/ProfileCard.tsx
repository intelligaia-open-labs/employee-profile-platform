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
  const hasSecondaryLinks =
    employee.linkedin_url ||
    employee.website_url ||
    telegramLinks.length > 0 ||
    otherLinks.length > 0;

  return (
    <div className="w-full max-w-md mx-auto px-6 pt-12 pb-16">
      {/* Photo */}
      <div className="animate-fade-up stagger-1">
        {employee.profile_image ? (
          <Image
            src={`${API_URL}${employee.profile_image}`}
            alt={employee.full_name}
            width={140}
            height={140}
            className="rounded-2xl object-cover w-[140px] h-[140px]"
          />
        ) : (
          <div className="w-[140px] h-[140px] rounded-2xl bg-accent-subtle flex items-center justify-center">
            <span className="text-5xl font-semibold text-accent">
              {employee.full_name.charAt(0)}
            </span>
          </div>
        )}
      </div>

      {/* Name & Title */}
      <div className="animate-fade-up stagger-2">
        <p className="mt-8 text-[11px] font-semibold tracking-[0.2em] uppercase text-ink-tertiary">
          {employee.designation}
        </p>
        <h1 className="mt-2 text-[clamp(1.75rem,6vw,2.5rem)] font-bold leading-[1.1] tracking-tight text-ink">
          {employee.full_name}
        </h1>
      </div>

      {/* Bio */}
      {employee.bio && (
        <div className="animate-fade-up stagger-3">
          <p className="mt-5 font-body text-ink-secondary leading-relaxed max-w-[50ch]">
            {employee.bio}
          </p>
        </div>
      )}

      {/* Divider */}
      <div className="animate-fade-up stagger-4">
        <div className="mt-8 border-t border-[var(--border-strong)]" />

        {/* Save Contact — Primary CTA */}
        <a
          href={`${API_URL}/public/vcard/${employee.slug}`}
          className="mt-6 flex items-center justify-center gap-2.5 w-full py-3.5 bg-accent text-surface-raised font-semibold rounded-xl hover:bg-accent-hover transition-colors"
        >
          <svg
            className="w-[18px] h-[18px] shrink-0"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
            />
          </svg>
          Save Contact
        </a>
      </div>

      {/* Contact Methods */}
      <div className="animate-fade-up stagger-5">
        <div className="mt-6 divide-y">
          {/* Phone */}
          <a
            href={`tel:${employee.phone}`}
            className="flex items-center gap-4 py-4 group"
          >
            <svg
              className="w-5 h-5 shrink-0 text-ink-tertiary group-hover:text-accent transition-colors"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1.5}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
              />
            </svg>
            <div>
              <p className="text-[11px] font-medium tracking-wide uppercase text-ink-tertiary">
                Phone
              </p>
              <p className="text-sm font-medium text-ink group-hover:text-accent transition-colors">
                {employee.phone}
              </p>
            </div>
          </a>

          {/* Email */}
          <a
            href={`mailto:${employee.email}`}
            className="flex items-center gap-4 py-4 group"
          >
            <svg
              className="w-5 h-5 shrink-0 text-ink-tertiary group-hover:text-accent transition-colors"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1.5}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
              />
            </svg>
            <div>
              <p className="text-[11px] font-medium tracking-wide uppercase text-ink-tertiary">
                Email
              </p>
              <p className="text-sm font-medium text-ink group-hover:text-accent transition-colors">
                {employee.email}
              </p>
            </div>
          </a>

          {/* WhatsApp */}
          <a
            href={`https://wa.me/${phoneDigits}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-4 py-4 group"
          >
            <svg
              className="w-5 h-5 shrink-0 text-ink-tertiary group-hover:text-accent transition-colors"
              viewBox="0 0 24 24"
              fill="currentColor"
            >
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
            </svg>
            <div>
              <p className="text-[11px] font-medium tracking-wide uppercase text-ink-tertiary">
                WhatsApp
              </p>
              <p className="text-sm font-medium text-ink group-hover:text-accent transition-colors">
                Message
              </p>
            </div>
          </a>
        </div>
      </div>

      {/* Secondary Links */}
      {hasSecondaryLinks && (
        <div className="animate-fade-up stagger-6">
          <div className="mt-2 border-t border-[var(--border-strong)]" />
          <div className="mt-5 flex flex-wrap gap-x-5 gap-y-3">
            {employee.linkedin_url && (
              <a
                href={employee.linkedin_url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 text-sm text-ink-secondary hover:text-accent transition-colors"
              >
                <svg
                  className="w-4 h-4 shrink-0"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                >
                  <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                </svg>
                LinkedIn
              </a>
            )}

            {employee.website_url && (
              <a
                href={employee.website_url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 text-sm text-ink-secondary hover:text-accent transition-colors"
              >
                <svg
                  className="w-4 h-4 shrink-0"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={1.5}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9"
                  />
                </svg>
                Website
              </a>
            )}

            {telegramLinks.map((s) => (
              <a
                key={s.id}
                href={s.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 text-sm text-ink-secondary hover:text-accent transition-colors"
              >
                <svg
                  className="w-4 h-4 shrink-0"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                >
                  <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.479.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z" />
                </svg>
                Telegram
              </a>
            ))}

            {otherLinks.map((s) => (
              <a
                key={s.id}
                href={s.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 text-sm text-ink-secondary hover:text-accent transition-colors"
              >
                <svg
                  className="w-4 h-4 shrink-0"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={1.5}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"
                  />
                </svg>
                {s.platform}
              </a>
            ))}
          </div>
        </div>
      )}

      {/* Address */}
      {employee.address && (
        <div className="animate-fade-up stagger-6">
          <div className="mt-6 border-t border-[var(--border-strong)]" />
          <div className="mt-5 flex items-start gap-3 text-sm text-ink-tertiary">
            <svg
              className="w-4 h-4 mt-0.5 shrink-0"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1.5}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
              />
            </svg>
            <span>{employee.address}</span>
          </div>
        </div>
      )}
    </div>
  );
}

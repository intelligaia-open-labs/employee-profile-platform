"use client";

import type { EmployeePublic } from "@business-profile/shared";
import Image from "next/image";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

interface Props {
  employee: EmployeePublic;
}

function nameHue(name: string): number {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return Math.abs(hash) % 360;
}

export function ProfileCard({ employee }: Props) {
  const phoneDigits = employee.phone.replace(/[^0-9]/g, "");
  const hue = nameHue(employee.full_name);

  const telegramLinks = employee.social_links.filter(
    (s) => s.platform.toLowerCase() === "telegram",
  );
  const otherLinks = employee.social_links.filter(
    (s) => s.platform.toLowerCase() !== "telegram",
  );
  const hasConnectLinks =
    employee.linkedin_url ||
    employee.website_url ||
    telegramLinks.length > 0 ||
    otherLinks.length > 0;

  return (
    <div className="w-full max-w-md mx-auto pb-10">
      {/* ── Dark hero area ── */}
      <div
        className="relative pt-16 pb-28"
        style={{
          background: `radial-gradient(ellipse at 50% 60%, var(--profile-glow), var(--profile-bg))`,
        }}
      >
        {/* Subtle decorative line */}
        <div
          className="absolute top-8 left-1/2 -translate-x-1/2 w-10 h-px"
          style={{ backgroundColor: "oklch(0.30 0.02 260)" }}
        />
      </div>

      {/* ── Main content card ── */}
      <div
        className="relative -mt-24 mx-4 rounded-3xl bg-surface-raised pb-8 animate-card-up"
        style={{ boxShadow: "var(--shadow-profile-card)" }}
      >
        {/* ── Photo overlapping dark/card boundary ── */}
        <div className="flex justify-center -mt-[64px] animate-photo-in stagger-1">
          {employee.profile_image ? (
            <Image
              src={`${API_URL}${employee.profile_image}`}
              alt={employee.full_name}
              width={128}
              height={128}
              priority
              className="w-[128px] h-[128px] rounded-full object-cover shadow-lg"
              style={{
                border: "4px solid var(--surface-raised)",
              }}
            />
          ) : (
            <div
              className="w-[128px] h-[128px] rounded-full flex items-center justify-center shadow-lg"
              style={{
                border: "4px solid var(--surface-raised)",
                backgroundColor: `oklch(0.92 0.04 ${hue})`,
                color: `oklch(0.35 0.12 ${hue})`,
              }}
            >
              <span className="text-5xl font-bold">
                {employee.full_name.charAt(0)}
              </span>
            </div>
          )}
        </div>

        {/* ── Name & Title ── */}
        <div className="text-center mt-5 px-6 animate-reveal stagger-2">
          <h1 className="text-[1.625rem] font-bold leading-tight tracking-tight text-ink">
            {employee.full_name}
          </h1>
          <p className="mt-1.5 text-sm text-ink-secondary">
            {employee.designation}
          </p>
        </div>

        {/* ── Quick action buttons ── */}
        <div className="flex justify-center gap-6 mt-7 px-6 animate-reveal stagger-3">
          {/* Call */}
          <a
            href={`tel:${employee.phone}`}
            className="group flex flex-col items-center gap-2"
          >
            <span
              className="w-[52px] h-[52px] rounded-full bg-accent flex items-center justify-center text-surface-raised group-hover:-translate-y-1 transition-all duration-200"
              style={{
                boxShadow: "var(--shadow-action)",
              }}
              onMouseEnter={(e) =>
                ((e.currentTarget as HTMLElement).style.boxShadow =
                  "var(--shadow-action-hover)")
              }
              onMouseLeave={(e) =>
                ((e.currentTarget as HTMLElement).style.boxShadow =
                  "var(--shadow-action)")
              }
            >
              <svg
                className="w-5 h-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                />
              </svg>
            </span>
            <span className="text-[10px] font-semibold tracking-wide uppercase text-ink-tertiary">
              Call
            </span>
          </a>

          {/* Email */}
          <a
            href={`mailto:${employee.email}`}
            className="group flex flex-col items-center gap-2"
          >
            <span
              className="w-[52px] h-[52px] rounded-full bg-accent flex items-center justify-center text-surface-raised group-hover:-translate-y-1 transition-all duration-200"
              style={{ boxShadow: "var(--shadow-action)" }}
              onMouseEnter={(e) =>
                ((e.currentTarget as HTMLElement).style.boxShadow =
                  "var(--shadow-action-hover)")
              }
              onMouseLeave={(e) =>
                ((e.currentTarget as HTMLElement).style.boxShadow =
                  "var(--shadow-action)")
              }
            >
              <svg
                className="w-5 h-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                />
              </svg>
            </span>
            <span className="text-[10px] font-semibold tracking-wide uppercase text-ink-tertiary">
              Email
            </span>
          </a>

          {/* WhatsApp */}
          <a
            href={`https://wa.me/${phoneDigits}`}
            target="_blank"
            rel="noopener noreferrer"
            className="group flex flex-col items-center gap-2"
          >
            <span
              className="w-[52px] h-[52px] rounded-full bg-accent flex items-center justify-center text-surface-raised group-hover:-translate-y-1 transition-all duration-200"
              style={{ boxShadow: "var(--shadow-action)" }}
              onMouseEnter={(e) =>
                ((e.currentTarget as HTMLElement).style.boxShadow =
                  "var(--shadow-action-hover)")
              }
              onMouseLeave={(e) =>
                ((e.currentTarget as HTMLElement).style.boxShadow =
                  "var(--shadow-action)")
              }
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
              </svg>
            </span>
            <span className="text-[10px] font-semibold tracking-wide uppercase text-ink-tertiary">
              WhatsApp
            </span>
          </a>
        </div>

        {/* ── About section ── */}
        {employee.bio && (
          <div className="animate-reveal stagger-4">
            <div className="mx-6 mt-7 border-t border-[var(--border)]" />
            <div className="px-6 mt-5">
              <h2 className="text-[11px] font-semibold tracking-[0.15em] uppercase text-ink-tertiary">
                About
              </h2>
              <p className="mt-3 font-body text-[0.9375rem] text-ink-secondary leading-[1.75]">
                {employee.bio}
              </p>
            </div>
          </div>
        )}

        {/* ── Contact section ── */}
        <div className="animate-reveal stagger-5">
          <div className="mx-6 mt-6 border-t border-[var(--border)]" />
          <div className="px-6 mt-5">
            <h2 className="text-[11px] font-semibold tracking-[0.15em] uppercase text-ink-tertiary">
              Contact
            </h2>
            <div className="mt-3 space-y-0.5">
              {/* Phone */}
              <a
                href={`tel:${employee.phone}`}
                className="flex items-center gap-3.5 py-3 -mx-3 px-3 rounded-xl hover:bg-accent-subtle transition-colors group"
              >
                <span className="w-8 h-8 rounded-lg bg-accent-subtle flex items-center justify-center shrink-0 group-hover:bg-accent group-hover:text-surface-raised transition-colors">
                  <svg
                    className="w-4 h-4"
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
                </span>
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
                className="flex items-center gap-3.5 py-3 -mx-3 px-3 rounded-xl hover:bg-accent-subtle transition-colors group"
              >
                <span className="w-8 h-8 rounded-lg bg-accent-subtle flex items-center justify-center shrink-0 group-hover:bg-accent group-hover:text-surface-raised transition-colors">
                  <svg
                    className="w-4 h-4"
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
                </span>
                <div>
                  <p className="text-[11px] font-medium tracking-wide uppercase text-ink-tertiary">
                    Email
                  </p>
                  <p className="text-sm font-medium text-ink group-hover:text-accent transition-colors">
                    {employee.email}
                  </p>
                </div>
              </a>

              {/* Address */}
              {employee.address && (
                <div className="flex items-start gap-3.5 py-3 -mx-3 px-3">
                  <span className="w-8 h-8 rounded-lg bg-accent-subtle flex items-center justify-center shrink-0 mt-0.5">
                    <svg
                      className="w-4 h-4 text-ink-tertiary"
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
                  </span>
                  <div>
                    <p className="text-[11px] font-medium tracking-wide uppercase text-ink-tertiary">
                      Address
                    </p>
                    <p className="text-sm text-ink-secondary leading-relaxed">
                      {employee.address}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ── Connect section ── */}
        {hasConnectLinks && (
          <div className="animate-reveal stagger-6">
            <div className="mx-6 mt-5 border-t border-[var(--border)]" />
            <div className="px-6 mt-5">
              <h2 className="text-[11px] font-semibold tracking-[0.15em] uppercase text-ink-tertiary">
                Connect
              </h2>
              <div className="mt-3 space-y-0.5">
                {employee.linkedin_url && (
                  <a
                    href={employee.linkedin_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3.5 py-3 -mx-3 px-3 rounded-xl hover:bg-accent-subtle transition-colors group"
                  >
                    <span className="w-8 h-8 rounded-lg bg-accent-subtle flex items-center justify-center shrink-0 group-hover:bg-accent group-hover:text-surface-raised transition-colors">
                      <svg
                        className="w-4 h-4"
                        viewBox="0 0 24 24"
                        fill="currentColor"
                      >
                        <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                      </svg>
                    </span>
                    <div>
                      <p className="text-sm font-medium text-ink group-hover:text-accent transition-colors">
                        LinkedIn
                      </p>
                      <p className="text-xs text-ink-tertiary">
                        View profile
                      </p>
                    </div>
                  </a>
                )}

                {employee.website_url && (
                  <a
                    href={employee.website_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3.5 py-3 -mx-3 px-3 rounded-xl hover:bg-accent-subtle transition-colors group"
                  >
                    <span className="w-8 h-8 rounded-lg bg-accent-subtle flex items-center justify-center shrink-0 group-hover:bg-accent group-hover:text-surface-raised transition-colors">
                      <svg
                        className="w-4 h-4"
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
                    </span>
                    <div>
                      <p className="text-sm font-medium text-ink group-hover:text-accent transition-colors">
                        Website
                      </p>
                      <p className="text-xs text-ink-tertiary">
                        Visit site
                      </p>
                    </div>
                  </a>
                )}

                {telegramLinks.map((s) => (
                  <a
                    key={s.id}
                    href={s.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3.5 py-3 -mx-3 px-3 rounded-xl hover:bg-accent-subtle transition-colors group"
                  >
                    <span className="w-8 h-8 rounded-lg bg-accent-subtle flex items-center justify-center shrink-0 group-hover:bg-accent group-hover:text-surface-raised transition-colors">
                      <svg
                        className="w-4 h-4"
                        viewBox="0 0 24 24"
                        fill="currentColor"
                      >
                        <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.479.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z" />
                      </svg>
                    </span>
                    <div>
                      <p className="text-sm font-medium text-ink group-hover:text-accent transition-colors">
                        Telegram
                      </p>
                      <p className="text-xs text-ink-tertiary">
                        Message us
                      </p>
                    </div>
                  </a>
                ))}

                {otherLinks.map((s) => (
                  <a
                    key={s.id}
                    href={s.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3.5 py-3 -mx-3 px-3 rounded-xl hover:bg-accent-subtle transition-colors group"
                  >
                    <span className="w-8 h-8 rounded-lg bg-accent-subtle flex items-center justify-center shrink-0 group-hover:bg-accent group-hover:text-surface-raised transition-colors">
                      <svg
                        className="w-4 h-4"
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
                    </span>
                    <div>
                      <p className="text-sm font-medium text-ink group-hover:text-accent transition-colors">
                        {s.platform}
                      </p>
                    </div>
                  </a>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── Save Contact CTA ── */}
        <div className="px-6 mt-8 animate-reveal stagger-7">
          <a
            href={`${API_URL}/public/vcard/${employee.slug}`}
            className="btn-primary flex items-center justify-center gap-2.5 w-full py-4 bg-accent text-surface-raised font-semibold text-[0.9375rem] rounded-xl"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
              />
            </svg>
            Save Contact
          </a>
        </div>
      </div>

      {/* ── Branding ── */}
      <p
        className="mt-8 text-center text-[10px] font-medium tracking-[0.25em] uppercase animate-reveal stagger-8"
        style={{ color: "oklch(0.40 0.015 260)" }}
      >
        Business Profile
      </p>
    </div>
  );
}

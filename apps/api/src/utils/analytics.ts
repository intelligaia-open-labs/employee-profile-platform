import type { Request } from "express";
import { prisma } from "@business-profile/db";

interface VisitInfo {
  visitor_ip: string | null;
  user_agent: string | null;
  device_type: string;
  browser: string;
  os: string;
  country: string | null;
  city: string | null;
  referrer: string | null;
  source: string;
}

function parseUserAgent(ua: string): { device_type: string; browser: string; os: string } {
  const uaLower = ua.toLowerCase();

  // Device type
  let device_type = "desktop";
  if (/mobile|android.*mobile|iphone|ipod|blackberry|opera mini|iemobile/i.test(ua)) {
    device_type = "mobile";
  } else if (/tablet|ipad|android(?!.*mobile)/i.test(ua)) {
    device_type = "tablet";
  }

  // Browser
  let browser = "Other";
  if (uaLower.includes("edg/")) browser = "Edge";
  else if (uaLower.includes("opr/") || uaLower.includes("opera")) browser = "Opera";
  else if (uaLower.includes("chrome") && !uaLower.includes("edg")) browser = "Chrome";
  else if (uaLower.includes("safari") && !uaLower.includes("chrome")) browser = "Safari";
  else if (uaLower.includes("firefox")) browser = "Firefox";
  else if (uaLower.includes("msie") || uaLower.includes("trident")) browser = "IE";

  // OS
  let os = "Other";
  if (uaLower.includes("windows")) os = "Windows";
  else if (uaLower.includes("mac os")) os = "macOS";
  else if (uaLower.includes("iphone") || uaLower.includes("ipad")) os = "iOS";
  else if (uaLower.includes("android")) os = "Android";
  else if (uaLower.includes("linux")) os = "Linux";

  return { device_type, browser, os };
}

function detectSource(req: Request): string {
  const ref = req.get("referer") || req.get("referrer") || "";
  const query = req.query;

  if (query.utm_source) return String(query.utm_source);
  if (query.source === "qr") return "qr";
  if (!ref) return "direct";

  const refLower = ref.toLowerCase();
  if (refLower.includes("linkedin.com")) return "linkedin";
  if (refLower.includes("whatsapp")) return "whatsapp";
  if (refLower.includes("t.me") || refLower.includes("telegram")) return "telegram";
  if (refLower.includes("facebook.com") || refLower.includes("fb.com")) return "facebook";
  if (refLower.includes("twitter.com") || refLower.includes("x.com")) return "twitter";
  if (refLower.includes("instagram.com")) return "instagram";
  if (refLower.includes("google")) return "google";

  return "referral";
}

function extractVisitInfo(req: Request): VisitInfo {
  const ua = req.get("user-agent") || "";
  const { device_type, browser, os } = parseUserAgent(ua);

  // Get IP — trust proxy headers
  const forwarded = req.get("x-forwarded-for");
  const ip = forwarded ? forwarded.split(",")[0].trim() : req.ip || null;

  // Get country from Cloudflare headers (if behind CF)
  const country = req.get("cf-ipcountry") || req.get("x-vercel-ip-country") || null;
  const city = req.get("cf-ipcity") || req.get("x-vercel-ip-city") || null;

  const referrer = req.get("referer") || req.get("referrer") || null;
  const source = detectSource(req);

  return {
    visitor_ip: ip,
    user_agent: ua || null,
    device_type,
    browser,
    os,
    country,
    city,
    referrer,
    source,
  };
}

/** Log a profile view — fire and forget, never throws */
export async function trackProfileView(employeeId: string, req: Request): Promise<void> {
  try {
    const info = extractVisitInfo(req);
    await prisma.profileView.create({
      data: {
        employee_id: employeeId,
        ...info,
      },
    });
  } catch {
    // Silent — analytics should never break the request
  }
}

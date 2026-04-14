"use client";

import { useEffect } from "react";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

export function ProfileTracker({ slug }: { slug: string }) {
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const source = params.get("source") || params.get("utm_source") || "direct";
    const referrer = document.referrer || undefined;

    fetch(`${API_URL}/public/track/${slug}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ source, referrer }),
    }).catch(() => {}); // silent
  }, [slug]);

  return null;
}

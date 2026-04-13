"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { clientApiFetch } from "./api";

interface Admin {
  adminId: string;
  email: string;
  role: string;
}

export function useAuth() {
  const router = useRouter();
  const [admin, setAdmin] = useState<Admin | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    clientApiFetch<{ success: boolean; data: Admin }>("/auth/me")
      .then((res) => setAdmin(res.data))
      .catch(() => router.push("/admin/login"))
      .finally(() => setLoading(false));
  }, [router]);

  async function logout() {
    await clientApiFetch("/auth/logout", { method: "POST" });
    router.push("/admin/login");
  }

  return { admin, loading, logout };
}

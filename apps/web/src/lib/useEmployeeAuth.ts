"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { clientApiFetch } from "./api";

interface EmployeeAuth {
  employeeId: string;
  credentialId: string;
  email: string;
  role: string;
  permissions: string[];
  fullName: string;
  slug: string;
}

export function useEmployeeAuth() {
  const router = useRouter();
  const [employee, setEmployee] = useState<EmployeeAuth | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    clientApiFetch<{ success: boolean; data: EmployeeAuth }>("/auth/employee/me")
      .then((res) => setEmployee(res.data))
      .catch(() => router.push("/employee/login"))
      .finally(() => setLoading(false));
  }, [router]);

  const logout = useCallback(async () => {
    await clientApiFetch("/auth/employee/logout", { method: "POST" });
    router.push("/employee/login");
  }, [router]);

  const hasPermission = useCallback(
    (perm: string): boolean => {
      if (!employee) return false;
      if (employee.role === "admin") return true;
      return employee.permissions.includes(perm);
    },
    [employee]
  );

  return { employee, loading, logout, hasPermission };
}

"use client";

import { useEffect, useState, use } from "react";
import { useAuth } from "@/lib/useAuth";
import { clientApiFetch } from "@/lib/api";
import { EmployeeForm } from "@/components/EmployeeForm";
import type { EmployeePublic, ApiResponse } from "@business-profile/shared";
import Link from "next/link";
import Image from "next/image";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

export default function EditEmployeePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { loading: authLoading } = useAuth();
  const [employee, setEmployee] = useState<EmployeePublic | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    clientApiFetch<ApiResponse<EmployeePublic>>(`/employees/${id}`)
      .then((res) => setEmployee(res.data ?? null))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [id]);

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-5 h-5 border-2 border-ink-tertiary border-t-accent rounded-full animate-spin" />
      </div>
    );
  }

  if (!employee) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-ink-tertiary">Employee not found</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface">
      <header className="border-b">
        <div className="max-w-6xl mx-auto px-6 h-14 flex items-center gap-4">
          <Link
            href="/admin"
            className="text-sm text-ink-tertiary hover:text-ink transition-colors"
          >
            &larr; Dashboard
          </Link>
          <h1 className="text-sm font-semibold text-ink">Edit Employee</h1>
        </div>
      </header>
      <main className="py-10 px-6">
        <EmployeeForm employee={employee} />

        {employee.qr_code && (
          <div className="max-w-2xl mx-auto mt-10 pt-8 border-t">
            <h2 className="text-sm font-semibold tracking-wide uppercase text-ink-tertiary mb-5">
              QR Code
            </h2>
            <div className="flex items-center gap-6">
              <Image
                src={`${API_URL}${employee.qr_code.qr_url}`}
                alt="QR Code"
                width={140}
                height={140}
                className="border rounded-xl"
              />
              <div>
                <p className="text-sm text-ink-secondary">
                  Scans: <strong className="font-semibold text-ink tabular-nums">{employee.qr_code.scan_count}</strong>
                </p>
                <p className="mt-1 text-sm text-ink-tertiary">
                  <code className="text-xs bg-accent-subtle px-1.5 py-0.5 rounded">/p/{employee.slug}</code>
                </p>
                <a
                  href={`${API_URL}${employee.qr_code.qr_url}`}
                  download={`${employee.slug}-qr.png`}
                  className="mt-4 inline-block px-4 py-2 bg-accent text-surface-raised text-sm font-semibold rounded-lg hover:bg-accent-hover transition-colors"
                >
                  Download QR
                </a>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

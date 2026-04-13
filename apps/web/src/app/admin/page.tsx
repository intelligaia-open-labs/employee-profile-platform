"use client";

import { useEffect, useState, useCallback } from "react";
import { useAuth } from "@/lib/useAuth";
import { clientApiFetch } from "@/lib/api";
import type {
  EmployeePublic,
  PaginatedResponse,
} from "@business-profile/shared";
import Link from "next/link";
import Image from "next/image";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

function nameHue(name: string): number {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return Math.abs(hash) % 360;
}

export default function AdminDashboard() {
  const { admin, loading: authLoading, logout } = useAuth();
  const [employees, setEmployees] = useState<EmployeePublic[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  const fetchEmployees = useCallback(async () => {
    try {
      const res = await clientApiFetch<PaginatedResponse<EmployeePublic>>(
        "/employees",
      );
      setEmployees(res.data || []);
      setTotal(res.total);
    } catch {
      // auth redirect handles 401
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (admin) fetchEmployees();
  }, [admin, fetchEmployees]);

  async function toggleActive(id: string) {
    await clientApiFetch(`/employees/${id}/toggle-active`, { method: "PATCH" });
    fetchEmployees();
  }

  async function deleteEmployee(id: string) {
    if (!confirm("Are you sure you want to delete this employee?")) return;
    await clientApiFetch(`/employees/${id}`, { method: "DELETE" });
    fetchEmployees();
  }

  const activeCount = employees.filter((e) => e.is_active).length;
  const totalScans = employees.reduce(
    (sum, e) => sum + (e.qr_code?.scan_count ?? 0),
    0,
  );

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-5 h-5 border-2 border-ink-tertiary border-t-accent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface">
      {/* Header */}
      <header className="border-b">
        <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between">
          <Link
            href="/admin"
            className="text-sm font-bold tracking-tight text-ink"
          >
            Business Profile
          </Link>
          <div className="flex items-center gap-4">
            <span className="text-sm text-ink-tertiary">{admin?.email}</span>
            <button
              onClick={logout}
              className="text-sm font-medium text-ink-secondary hover:text-danger transition-colors"
            >
              Sign out
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-10">
        {/* Title + Stats */}
        <div className="flex items-end justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-ink">Employees</h1>
            <p className="mt-1 text-sm text-ink-tertiary tabular-nums">
              {total} total
              <span className="mx-1.5" style={{ color: "var(--border-strong)" }}>
                ·
              </span>
              {activeCount} active
              <span className="mx-1.5" style={{ color: "var(--border-strong)" }}>
                ·
              </span>
              {totalScans} scans
            </p>
          </div>
          <Link
            href="/admin/employees/new"
            className="btn-primary px-4 py-2 bg-accent text-surface-raised text-sm font-semibold rounded-lg"
          >
            Add employee
          </Link>
        </div>

        {/* Table */}
        {employees.length === 0 ? (
          <div className="py-20 text-center">
            <p className="text-ink-secondary">No employees yet</p>
            <p className="mt-1.5 text-sm text-ink-tertiary max-w-xs mx-auto">
              Add your first employee to generate their digital profile and QR
              code.
            </p>
          </div>
        ) : (
          <div className="overflow-hidden rounded-xl border">
            <table className="w-full">
              <thead>
                <tr className="border-b bg-accent-subtle">
                  <th className="px-5 py-3 text-left text-[11px] font-semibold text-ink-secondary tracking-wide uppercase">
                    Employee
                  </th>
                  <th className="px-5 py-3 text-left text-[11px] font-semibold text-ink-secondary tracking-wide uppercase">
                    Designation
                  </th>
                  <th className="px-5 py-3 text-left text-[11px] font-semibold text-ink-secondary tracking-wide uppercase">
                    Status
                  </th>
                  <th className="px-5 py-3 text-left text-[11px] font-semibold text-ink-secondary tracking-wide uppercase">
                    QR Scans
                  </th>
                  <th className="px-5 py-3 text-left text-[11px] font-semibold text-ink-secondary tracking-wide uppercase">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {employees.map((emp) => {
                  const hue = nameHue(emp.full_name);
                  return (
                    <tr
                      key={emp.id}
                      className="hover:bg-accent-subtle transition-colors"
                    >
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          {emp.profile_image ? (
                            <Image
                              src={`${API_URL}${emp.profile_image}`}
                              alt={emp.full_name}
                              width={36}
                              height={36}
                              className="rounded-lg object-cover w-9 h-9"
                            />
                          ) : (
                            <div
                              className="w-9 h-9 rounded-lg flex items-center justify-center"
                              style={{
                                backgroundColor: `oklch(0.92 0.04 ${hue})`,
                                color: `oklch(0.40 0.12 ${hue})`,
                              }}
                            >
                              <span className="text-sm font-semibold">
                                {emp.full_name.charAt(0)}
                              </span>
                            </div>
                          )}
                          <div>
                            <p className="text-sm font-medium text-ink">
                              {emp.full_name}
                            </p>
                            <p className="text-xs text-ink-tertiary">
                              {emp.email}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-4 text-sm text-ink-secondary">
                        {emp.designation}
                      </td>
                      <td className="px-5 py-4">
                        <button
                          onClick={() => toggleActive(emp.id)}
                          className="flex items-center gap-2 group"
                        >
                          <span
                            className={`w-2 h-2 rounded-full ${
                              emp.is_active ? "bg-success" : "bg-ink-tertiary"
                            }`}
                          />
                          <span className="text-sm text-ink-secondary group-hover:text-ink transition-colors">
                            {emp.is_active ? "Active" : "Inactive"}
                          </span>
                        </button>
                      </td>
                      <td className="px-5 py-4 text-sm text-ink-secondary tabular-nums">
                        {emp.qr_code?.scan_count ?? 0}
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <Link
                            href={`/p/${emp.slug}`}
                            target="_blank"
                            className="text-sm text-ink-tertiary hover:text-accent transition-colors"
                          >
                            View
                          </Link>
                          <Link
                            href={`/admin/employees/${emp.id}`}
                            className="text-sm text-ink-tertiary hover:text-accent transition-colors"
                          >
                            Edit
                          </Link>
                          {emp.qr_code && (
                            <a
                              href={`${API_URL}${emp.qr_code.qr_url}`}
                              download={`${emp.slug}-qr.png`}
                              className="text-sm text-ink-tertiary hover:text-accent transition-colors"
                            >
                              QR
                            </a>
                          )}
                          <button
                            onClick={() => deleteEmployee(emp.id)}
                            className="text-sm text-ink-tertiary hover:text-danger transition-colors"
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </div>
  );
}

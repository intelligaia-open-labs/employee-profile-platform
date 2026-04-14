"use client";

import { useEffect, useState, use } from "react";
import { useAuth } from "@/lib/useAuth";
import { clientApiFetch } from "@/lib/api";
import { EmployeeForm } from "@/components/EmployeeForm";
import type { EmployeePublic, ApiResponse } from "@business-profile/shared";
import Link from "next/link";
import Image from "next/image";
import { resolveImageUrl } from "@/lib/image";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

export default function EditEmployeePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
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
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="w-5 h-5 border-2 border-muted-foreground border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  if (!employee) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <p className="text-muted-foreground">Employee not found</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted/40">
      <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" asChild>
              <Link href="/admin">
                <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                </svg>
                Back
              </Link>
            </Button>
            <Separator orientation="vertical" className="h-5" />
            <span className="text-sm font-semibold">Edit Employee</span>
          </div>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/profile/logo.svg" alt="Logo" className="h-5 w-auto opacity-50 dark:invert" />
        </div>
      </header>
      <main className="py-8 px-4 sm:px-6">
        <EmployeeForm employee={employee} />

        {/* QR Code */}
        {employee.qr_code && (
          <Card className="max-w-2xl mx-auto mt-8">
            <CardHeader>
              <CardTitle className="text-base">QR Code</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-6">
                <Image
                  src={resolveImageUrl(employee.qr_code.qr_url)!}
                  alt="QR Code"
                  width={120}
                  height={120}
                  className="border rounded-xl"
                />
                <div>
                  <p className="text-sm text-muted-foreground">
                    Scans:{" "}
                    <strong className="font-semibold text-foreground tabular-nums">
                      {employee.qr_code.scan_count}
                    </strong>
                  </p>
                  <p className="mt-1.5 text-sm text-muted-foreground">
                    <code className="text-xs bg-muted px-1.5 py-0.5 rounded">
                      /p/{employee.slug}
                    </code>
                  </p>
                  <Button asChild size="sm" className="mt-3">
                    <a
                      href={resolveImageUrl(employee.qr_code.qr_url)!}
                      download={`${employee.slug}-qr.png`}
                    >
                      Download QR
                    </a>
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
}

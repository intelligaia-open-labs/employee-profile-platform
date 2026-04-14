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
import { resolveImageUrl } from "@/lib/image";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

function nameHue(name: string): number {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return Math.abs(hash) % 360;
}

interface MeetingRequestData {
  id: string;
  visitor_name: string;
  visitor_email: string;
  visitor_phone: string | null;
  message: string | null;
  preferred_date: string | null;
  status: string;
  created_at: string;
  employee: { full_name: string; slug: string };
}

export default function AdminDashboard() {
  const { admin, loading: authLoading, logout } = useAuth();
  const [employees, setEmployees] = useState<EmployeePublic[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [meetings, setMeetings] = useState<MeetingRequestData[]>([]);
  const [qrPreview, setQrPreview] = useState<{ url: string; name: string; slug: string } | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);

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

  const fetchMeetings = useCallback(async () => {
    try {
      const res = await clientApiFetch<{ data: MeetingRequestData[] }>(
        "/meeting-requests",
      );
      setMeetings(res.data || []);
    } catch {
      // silent
    }
  }, []);

  useEffect(() => {
    if (admin) {
      fetchEmployees();
      fetchMeetings();
    }
  }, [admin, fetchEmployees, fetchMeetings]);

  async function toggleActive(id: string) {
    try {
      await clientApiFetch(`/employees/${id}/toggle-active`, { method: "PATCH" });
      fetchEmployees();
      toast.success("Status updated");
    } catch {
      toast.error("Failed to update status");
    }
  }

  async function deleteEmployee(id: string) {
    try {
      await clientApiFetch(`/employees/${id}`, { method: "DELETE" });
      fetchEmployees();
      toast.success("Employee deleted");
    } catch {
      toast.error("Failed to delete employee");
    } finally {
      setDeleteTarget(null);
    }
  }

  async function updateMeetingStatus(id: string, status: string) {
    try {
      await clientApiFetch(`/meeting-requests/${id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      fetchMeetings();
      toast.success(`Meeting ${status}`);
    } catch {
      toast.error("Failed to update meeting");
    }
  }

  const activeCount = employees.filter((e) => e.is_active).length;
  const pendingMeetings = meetings.filter((m) => m.status === "pending").length;
  const totalScans = employees.reduce(
    (sum, e) => sum + (e.qr_code?.scan_count ?? 0),
    0,
  );

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-muted/40">
        <header className="border-b bg-background">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
            <Skeleton className="h-5 w-24" />
            <Skeleton className="h-5 w-32" />
          </div>
        </header>
        <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
            {[1, 2, 3, 4].map((i) => (
              <Card key={i}>
                <CardHeader className="pb-2">
                  <Skeleton className="h-4 w-24" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-9 w-16" />
                </CardContent>
              </Card>
            ))}
          </div>
          <div className="flex items-center justify-between mb-4">
            <Skeleton className="h-6 w-24" />
            <Skeleton className="h-9 w-32" />
          </div>
          <Card>
            <div className="p-4 space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-center gap-3">
                  <Skeleton className="h-9 w-9 rounded-lg" />
                  <div className="flex-1 space-y-1.5">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-3 w-48" />
                  </div>
                  <Skeleton className="h-4 w-16" />
                  <Skeleton className="h-6 w-14 rounded-full" />
                </div>
              ))}
            </div>
          </Card>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted/40">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/profile/logo-dark.svg" alt="Logo" className="h-5 w-auto" />
            <Separator orientation="vertical" className="h-5" />
            <span className="text-sm font-medium text-muted-foreground">Dashboard</span>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground hidden sm:inline">
              {admin?.email}
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={logout}
              className="text-muted-foreground hover:text-destructive"
            >
              Sign out
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Employees
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold tabular-nums">{total}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Active Profiles
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold tabular-nums text-green-600">
                {activeCount}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total QR Scans
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold tabular-nums">{totalScans}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Meeting Requests
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold tabular-nums text-amber-600">
                {pendingMeetings}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Employees Section */}
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-lg font-semibold">Employees</h1>
          </div>
          <Button asChild size="sm">
            <Link href="/admin/employees/new">
              <svg className="w-4 h-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
              </svg>
              Add Employee
            </Link>
          </Button>
        </div>

        {employees.length === 0 ? (
          <Card>
            <CardContent className="py-16 text-center">
              <div className="mx-auto w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
                </svg>
              </div>
              <p className="font-medium text-foreground">No employees yet</p>
              <p className="mt-1 text-sm text-muted-foreground max-w-xs mx-auto">
                Add your first employee to generate their digital profile and QR code.
              </p>
              <Button asChild size="sm" className="mt-4">
                <Link href="/admin/employees/new">Add Employee</Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Employee</TableHead>
                  <TableHead className="hidden sm:table-cell">Designation</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Scans</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {employees.map((emp) => {
                  const hue = nameHue(emp.full_name);
                  return (
                    <TableRow key={emp.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className="h-9 w-9 rounded-lg">
                            {emp.profile_image ? (
                              <AvatarImage
                                src={resolveImageUrl(emp.profile_image)!}
                                alt={emp.full_name}
                                className="object-cover"
                              />
                            ) : null}
                            <AvatarFallback
                              className="rounded-lg text-sm font-semibold"
                              style={{
                                backgroundColor: `oklch(0.92 0.04 ${hue})`,
                                color: `oklch(0.40 0.12 ${hue})`,
                              }}
                            >
                              {emp.full_name.charAt(0)}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="text-sm font-medium leading-tight">
                              {emp.full_name}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {emp.email}
                            </p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="hidden sm:table-cell text-sm text-muted-foreground">
                        {emp.designation}
                      </TableCell>
                      <TableCell>
                        <button onClick={() => toggleActive(emp.id)}>
                          <Badge
                            variant={emp.is_active ? "default" : "secondary"}
                            className={`cursor-pointer text-xs ${
                              emp.is_active
                                ? "bg-green-100 text-green-800 hover:bg-green-200 border-0"
                                : ""
                            }`}
                          >
                            {emp.is_active ? "Active" : "Inactive"}
                          </Badge>
                        </button>
                      </TableCell>
                      <TableCell className="text-right text-sm tabular-nums text-muted-foreground">
                        {emp.qr_code?.scan_count ?? 0}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button variant="ghost" size="sm" asChild>
                            <Link href={`/p/${emp.slug}`} target="_blank">
                              View
                            </Link>
                          </Button>
                          <Button variant="ghost" size="sm" asChild>
                            <Link href={`/admin/employees/${emp.id}`}>
                              Edit
                            </Link>
                          </Button>
                          {emp.qr_code && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() =>
                                setQrPreview({
                                  url: resolveImageUrl(emp.qr_code!.qr_url)!,
                                  name: emp.full_name,
                                  slug: emp.slug,
                                })
                              }
                            >
                              <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 4.875c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5A1.125 1.125 0 013.75 9.375v-4.5zM3.75 14.625c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5a1.125 1.125 0 01-1.125-1.125v-4.5zM13.5 4.875c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5A1.125 1.125 0 0113.5 9.375v-4.5z" />
                                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 14.625v2.25m0 2.25h2.25m2.25 0h-2.25m0 0v-2.25m0 0h2.25" />
                              </svg>
                              QR
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setDeleteTarget(emp.id)}
                            className="text-muted-foreground hover:text-destructive"
                          >
                            Delete
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </Card>
        )}

        {/* Meeting Requests Section */}
        {meetings.length > 0 && (
          <>
            <div className="flex items-center justify-between mt-10 mb-4">
              <h2 className="text-lg font-semibold">Meeting Requests</h2>
              <Badge variant="secondary">{pendingMeetings} pending</Badge>
            </div>
            <Card>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Visitor</TableHead>
                    <TableHead className="hidden sm:table-cell">For</TableHead>
                    <TableHead className="hidden md:table-cell">Date</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {meetings.map((m) => (
                    <TableRow key={m.id}>
                      <TableCell>
                        <div>
                          <p className="text-sm font-medium">{m.visitor_name}</p>
                          <p className="text-xs text-muted-foreground">{m.visitor_email}</p>
                          {m.visitor_phone && (
                            <p className="text-xs text-muted-foreground">{m.visitor_phone}</p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="hidden sm:table-cell text-sm text-muted-foreground">
                        {m.employee.full_name}
                      </TableCell>
                      <TableCell className="hidden md:table-cell text-sm text-muted-foreground">
                        {m.preferred_date || "Not specified"}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            m.status === "confirmed"
                              ? "default"
                              : m.status === "declined"
                                ? "destructive"
                                : "secondary"
                          }
                          className={
                            m.status === "confirmed"
                              ? "bg-green-100 text-green-800 border-0"
                              : m.status === "pending"
                                ? "bg-amber-100 text-amber-800 border-0"
                                : ""
                          }
                        >
                          {m.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        {m.status === "pending" && (
                          <div className="flex items-center justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => updateMeetingStatus(m.id, "confirmed")}
                              className="text-green-600 hover:text-green-700 hover:bg-green-50"
                            >
                              Confirm
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => updateMeetingStatus(m.id, "declined")}
                              className="text-muted-foreground hover:text-destructive"
                            >
                              Decline
                            </Button>
                          </div>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Card>
          </>
        )}
      </main>

      {/* QR Preview Modal */}
      {qrPreview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setQrPreview(null)}
          />
          <div className="relative bg-background rounded-xl shadow-2xl p-6 max-w-sm w-full mx-4">
            <button
              onClick={() => setQrPreview(null)}
              className="absolute top-3 right-3 text-muted-foreground hover:text-foreground"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            <h3 className="text-lg font-semibold mb-1">{qrPreview.name}</h3>
            <p className="text-sm text-muted-foreground mb-4">
              <code className="text-xs bg-muted px-1.5 py-0.5 rounded">
                /p/{qrPreview.slug}
              </code>
            </p>
            <div className="flex justify-center mb-4">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={qrPreview.url}
                alt={`QR code for ${qrPreview.name}`}
                className="w-[200px] h-[200px] border rounded-lg"
              />
            </div>
            <div className="flex gap-2">
              <Button asChild className="flex-1">
                <a href={qrPreview.url} download={`${qrPreview.slug}-qr.png`}>
                  <svg className="w-4 h-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                  Download
                </a>
              </Button>
              <Button variant="outline" asChild>
                <Link href={`/p/${qrPreview.slug}`} target="_blank">
                  View Profile
                </Link>
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      <ConfirmDialog
        open={!!deleteTarget}
        title="Delete Employee"
        description="This will permanently delete this employee's profile, QR code, and all associated data. This action cannot be undone."
        confirmLabel="Delete"
        onConfirm={() => deleteTarget && deleteEmployee(deleteTarget)}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}

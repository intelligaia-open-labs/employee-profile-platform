"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { useAuth } from "@/lib/useAuth";
import { clientApiFetch } from "@/lib/api";
import type {
  EmployeePublic,
  PaginatedResponse,
  EmployeeCredentialPublic,
} from "@business-profile/shared";
import Link from "next/link";
import { resolveImageUrl } from "@/lib/image";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
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

type Tab = "employees" | "meetings" | "credentials" | "analytics";
type StatusFilter = "all" | "active" | "inactive";
type MeetingFilter = "all" | "pending" | "confirmed" | "declined";

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

interface CredentialWithEmployee extends EmployeeCredentialPublic {
  employee: { id: string; full_name: string; designation: string; profile_image: string | null };
}

interface AnalyticsData {
  overview: { totalViews: number; todayViews: number; weekViews: number; monthViews: number; uniqueVisitors: number };
  byEmployee: { employee: { full_name: string; slug: string; designation: string; profile_image: string | null }; views: number }[];
  devices: { device: string; count: number }[];
  browsers: { browser: string; count: number }[];
  os: { os: string; count: number }[];
  sources: { source: string; count: number }[];
  countries: { country: string; count: number }[];
  daily: { date: string; count: number }[];
  recent: { id: string; device_type: string; browser: string; os: string; country: string | null; city: string | null; source: string; referrer: string | null; created_at: string; employee: { full_name: string; slug: string } }[];
}

const ROLE_COLORS: Record<string, string> = {
  admin: "bg-purple-100 text-purple-800",
  editor: "bg-blue-100 text-blue-800",
  viewer: "bg-gray-100 text-gray-700",
};

const PERMISSIONS_OPTIONS = [
  { value: "profile:view", label: "View Profile" },
  { value: "profile:edit", label: "Edit Profile" },
  { value: "meetings:view", label: "View Meetings" },
  { value: "meetings:manage", label: "Manage Meetings" },
  { value: "analytics:view", label: "View Analytics" },
];

export default function AdminDashboard() {
  const { admin, loading: authLoading, logout } = useAuth();
  const [employees, setEmployees] = useState<EmployeePublic[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [meetings, setMeetings] = useState<MeetingRequestData[]>([]);
  const [credentials, setCredentials] = useState<CredentialWithEmployee[]>([]);
  const [qrPreview, setQrPreview] = useState<{ url: string; name: string; slug: string } | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);

  // Tab & filter state
  const [activeTab, setActiveTab] = useState<Tab>("employees");
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [meetingFilter, setMeetingFilter] = useState<MeetingFilter>("all");
  const [sortField, setSortField] = useState<"name" | "designation" | "scans" | "created">("created");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");

  // Credential modal state
  const [credModalOpen, setCredModalOpen] = useState(false);
  const [credEditId, setCredEditId] = useState<string | null>(null);
  const [credForm, setCredForm] = useState({
    employee_id: "",
    email: "",
    password: "",
    role: "viewer" as string,
    permissions: ["profile:view", "profile:edit"] as string[],
  });
  const [credSaving, setCredSaving] = useState(false);
  const [credDeleteTarget, setCredDeleteTarget] = useState<string | null>(null);
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [analyticsLoading, setAnalyticsLoading] = useState(false);

  const fetchEmployees = useCallback(async () => {
    try {
      const res = await clientApiFetch<PaginatedResponse<EmployeePublic>>("/employees?limit=100");
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
      const res = await clientApiFetch<{ data: MeetingRequestData[] }>("/meeting-requests");
      setMeetings(res.data || []);
    } catch { /* silent */ }
  }, []);

  const fetchCredentials = useCallback(async () => {
    try {
      const res = await clientApiFetch<{ data: CredentialWithEmployee[] }>("/credentials");
      setCredentials(res.data || []);
    } catch { /* silent */ }
  }, []);

  const fetchAnalytics = useCallback(async () => {
    setAnalyticsLoading(true);
    try {
      const res = await clientApiFetch<{ data: AnalyticsData }>("/analytics");
      setAnalytics(res.data);
    } catch { /* silent */ }
    finally { setAnalyticsLoading(false); }
  }, []);

  useEffect(() => {
    if (admin) {
      fetchEmployees();
      fetchMeetings();
      fetchCredentials();
    }
  }, [admin, fetchEmployees, fetchMeetings, fetchCredentials]);

  // Filtered & sorted employees
  const filteredEmployees = useMemo(() => {
    let list = [...employees];

    // Search
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        (e) =>
          e.full_name.toLowerCase().includes(q) ||
          e.email.toLowerCase().includes(q) ||
          e.designation.toLowerCase().includes(q)
      );
    }

    // Status filter
    if (statusFilter === "active") list = list.filter((e) => e.is_active);
    if (statusFilter === "inactive") list = list.filter((e) => !e.is_active);

    // Sort
    list.sort((a, b) => {
      let cmp = 0;
      switch (sortField) {
        case "name":
          cmp = a.full_name.localeCompare(b.full_name);
          break;
        case "designation":
          cmp = a.designation.localeCompare(b.designation);
          break;
        case "scans":
          cmp = (a.qr_code?.scan_count ?? 0) - (b.qr_code?.scan_count ?? 0);
          break;
        case "created":
          cmp = 0; // already sorted by API
          break;
      }
      return sortDir === "asc" ? cmp : -cmp;
    });

    return list;
  }, [employees, searchQuery, statusFilter, sortField, sortDir]);

  // Filtered meetings
  const filteredMeetings = useMemo(() => {
    if (meetingFilter === "all") return meetings;
    return meetings.filter((m) => m.status === meetingFilter);
  }, [meetings, meetingFilter]);

  // Unique designations for reference
  const designations = useMemo(
    () => [...new Set(employees.map((e) => e.designation))].sort(),
    [employees]
  );

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
      fetchCredentials();
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

  function handleSort(field: typeof sortField) {
    if (sortField === field) {
      setSortDir(sortDir === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDir("asc");
    }
  }

  function SortIcon({ field }: { field: typeof sortField }) {
    if (sortField !== field) return <svg className="w-3 h-3 ml-1 opacity-30" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M8 9l4-4 4 4M16 15l-4 4-4-4" /></svg>;
    return sortDir === "asc"
      ? <svg className="w-3 h-3 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M5 15l7-7 7 7" /></svg>
      : <svg className="w-3 h-3 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" /></svg>;
  }

  // Credential CRUD
  function openCreateCredential(employeeId?: string) {
    setCredEditId(null);
    const emp = employeeId ? employees.find((e) => e.id === employeeId) : undefined;
    setCredForm({
      employee_id: employeeId || "",
      email: emp?.email || "",
      password: "",
      role: "viewer",
      permissions: ["profile:view", "profile:edit"],
    });
    setCredModalOpen(true);
  }

  function openEditCredential(cred: CredentialWithEmployee) {
    setCredEditId(cred.id);
    setCredForm({
      employee_id: cred.employee_id,
      email: cred.email,
      password: "",
      role: cred.role,
      permissions: [...cred.permissions],
    });
    setCredModalOpen(true);
  }

  async function saveCredential() {
    setCredSaving(true);
    try {
      if (credEditId) {
        const body: Record<string, unknown> = {
          email: credForm.email,
          role: credForm.role,
          permissions: credForm.permissions,
        };
        if (credForm.password) body.password = credForm.password;
        await clientApiFetch(`/credentials/${credEditId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
        toast.success("Credential updated");
      } else {
        await clientApiFetch("/credentials", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(credForm),
        });
        toast.success("Credential created");
      }
      setCredModalOpen(false);
      fetchCredentials();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to save credential";
      toast.error(msg);
    } finally {
      setCredSaving(false);
    }
  }

  async function deleteCredential(id: string) {
    try {
      await clientApiFetch(`/credentials/${id}`, { method: "DELETE" });
      fetchCredentials();
      toast.success("Credential deleted");
    } catch {
      toast.error("Failed to delete credential");
    } finally {
      setCredDeleteTarget(null);
    }
  }

  const activeCount = employees.filter((e) => e.is_active).length;
  const pendingMeetings = meetings.filter((m) => m.status === "pending").length;
  const totalScans = employees.reduce((sum, e) => sum + (e.qr_code?.scan_count ?? 0), 0);
  const employeesWithCreds = new Set(credentials.map((c) => c.employee_id));
  const employeesWithoutCreds = employees.filter((e) => !employeesWithCreds.has(e.id));

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
                <CardHeader className="pb-2"><Skeleton className="h-4 w-24" /></CardHeader>
                <CardContent><Skeleton className="h-9 w-16" /></CardContent>
              </Card>
            ))}
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
            <span className="text-sm text-muted-foreground hidden sm:inline">{admin?.email}</span>
            <Button variant="ghost" size="sm" onClick={logout} className="text-muted-foreground hover:text-destructive">
              Sign out
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
          <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => { setActiveTab("employees"); setStatusFilter("all"); }}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" /></svg>
                Total Employees
              </CardTitle>
            </CardHeader>
            <CardContent><p className="text-3xl font-bold tabular-nums">{total}</p></CardContent>
          </Card>
          <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => { setActiveTab("employees"); setStatusFilter("active"); }}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <svg className="w-4 h-4 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                Active Profiles
              </CardTitle>
            </CardHeader>
            <CardContent><p className="text-3xl font-bold tabular-nums text-green-600">{activeCount}</p></CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 4.875c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5A1.125 1.125 0 013.75 9.375v-4.5z" /></svg>
                Total QR Scans
              </CardTitle>
            </CardHeader>
            <CardContent><p className="text-3xl font-bold tabular-nums">{totalScans}</p></CardContent>
          </Card>
          <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => { setActiveTab("meetings"); setMeetingFilter("pending"); }}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <svg className="w-4 h-4 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" /></svg>
                Pending Meetings
              </CardTitle>
            </CardHeader>
            <CardContent><p className="text-3xl font-bold tabular-nums text-amber-600">{pendingMeetings}</p></CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-1 mb-6 border-b">
          {(["employees", "meetings", "credentials", "analytics"] as Tab[]).map((tab) => (
            <button
              key={tab}
              onClick={() => { setActiveTab(tab); if (tab === "analytics" && !analytics) fetchAnalytics(); }}
              className={`px-4 py-2.5 text-sm font-medium capitalize transition-colors relative ${
                activeTab === tab
                  ? "text-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {tab}
              {tab === "meetings" && pendingMeetings > 0 && (
                <span className="ml-1.5 inline-flex items-center justify-center px-1.5 py-0.5 text-[10px] font-bold rounded-full bg-amber-100 text-amber-800">
                  {pendingMeetings}
                </span>
              )}
              {tab === "credentials" && (
                <span className="ml-1.5 inline-flex items-center justify-center px-1.5 py-0.5 text-[10px] font-bold rounded-full bg-muted text-muted-foreground">
                  {credentials.length}
                </span>
              )}
              {activeTab === tab && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-foreground rounded-full" />
              )}
            </button>
          ))}
        </div>

        {/* ═══════════ EMPLOYEES TAB ═══════════ */}
        {activeTab === "employees" && (
          <>
            {/* Toolbar */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4">
              <div className="flex items-center gap-2 flex-1 w-full sm:w-auto">
                <div className="relative flex-1 max-w-sm">
                  <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" /></svg>
                  <Input
                    placeholder="Search employees..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9 h-9"
                  />
                </div>
                <div className="flex items-center gap-1">
                  {(["all", "active", "inactive"] as StatusFilter[]).map((f) => (
                    <button
                      key={f}
                      onClick={() => setStatusFilter(f)}
                      className={`px-3 py-1.5 text-xs font-medium rounded-full transition-colors capitalize ${
                        statusFilter === f
                          ? "bg-foreground text-background"
                          : "bg-muted text-muted-foreground hover:bg-muted/80"
                      }`}
                    >
                      {f}
                    </button>
                  ))}
                </div>
              </div>
              <Button asChild size="sm">
                <Link href="/admin/employees/new">
                  <svg className="w-4 h-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>
                  Add Employee
                </Link>
              </Button>
            </div>

            <p className="text-xs text-muted-foreground mb-3">
              Showing {filteredEmployees.length} of {total} employees
            </p>

            {filteredEmployees.length === 0 ? (
              <Card>
                <CardContent className="py-16 text-center">
                  <div className="mx-auto w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-4">
                    <svg className="w-6 h-6 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" /></svg>
                  </div>
                  <p className="font-medium text-foreground">
                    {searchQuery || statusFilter !== "all" ? "No matching employees" : "No employees yet"}
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground max-w-xs mx-auto">
                    {searchQuery || statusFilter !== "all"
                      ? "Try adjusting your search or filters."
                      : "Add your first employee to generate their digital profile and QR code."}
                  </p>
                  {!searchQuery && statusFilter === "all" && (
                    <Button asChild size="sm" className="mt-4">
                      <Link href="/admin/employees/new">Add Employee</Link>
                    </Button>
                  )}
                </CardContent>
              </Card>
            ) : (
              <Card>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>
                        <button onClick={() => handleSort("name")} className="flex items-center text-xs font-medium">
                          Employee <SortIcon field="name" />
                        </button>
                      </TableHead>
                      <TableHead className="hidden sm:table-cell">
                        <button onClick={() => handleSort("designation")} className="flex items-center text-xs font-medium">
                          Designation <SortIcon field="designation" />
                        </button>
                      </TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="hidden md:table-cell">Credentials</TableHead>
                      <TableHead className="text-right">
                        <button onClick={() => handleSort("scans")} className="flex items-center justify-end text-xs font-medium ml-auto">
                          Scans <SortIcon field="scans" />
                        </button>
                      </TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredEmployees.map((emp) => {
                      const hue = nameHue(emp.full_name);
                      const hasCreds = employeesWithCreds.has(emp.id);
                      return (
                        <TableRow key={emp.id}>
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <Avatar className="h-9 w-9 rounded-lg">
                                {emp.profile_image ? (
                                  <AvatarImage src={resolveImageUrl(emp.profile_image)!} alt={emp.full_name} className="object-cover" />
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
                                <p className="text-sm font-medium leading-tight">{emp.full_name}</p>
                                <p className="text-xs text-muted-foreground">{emp.email}</p>
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
                                  emp.is_active ? "bg-green-100 text-green-800 hover:bg-green-200 border-0" : ""
                                }`}
                              >
                                {emp.is_active ? "Active" : "Inactive"}
                              </Badge>
                            </button>
                          </TableCell>
                          <TableCell className="hidden md:table-cell">
                            {hasCreds ? (
                              <Badge variant="outline" className="text-xs">
                                <svg className="w-3 h-3 mr-1 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                Has login
                              </Badge>
                            ) : (
                              <button
                                onClick={() => openCreateCredential(emp.id)}
                                className="text-xs text-muted-foreground hover:text-foreground underline-offset-2 hover:underline"
                              >
                                + Add login
                              </button>
                            )}
                          </TableCell>
                          <TableCell className="text-right text-sm tabular-nums text-muted-foreground">
                            {emp.qr_code?.scan_count ?? 0}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-1">
                              <Button variant="ghost" size="sm" asChild>
                                <Link href={`/p/${emp.slug}`} target="_blank">View</Link>
                              </Button>
                              <Button variant="ghost" size="sm" asChild>
                                <Link href={`/admin/employees/${emp.id}`}>Edit</Link>
                              </Button>
                              {emp.qr_code && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() =>
                                    setQrPreview({
                                      url: emp.qr_code!.qr_url,
                                      name: emp.full_name,
                                      slug: emp.slug,
                                    })
                                  }
                                >
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
          </>
        )}

        {/* ═══════════ MEETINGS TAB ═══════════ */}
        {activeTab === "meetings" && (
          <>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-1">
                {(["all", "pending", "confirmed", "declined"] as MeetingFilter[]).map((f) => (
                  <button
                    key={f}
                    onClick={() => setMeetingFilter(f)}
                    className={`px-3 py-1.5 text-xs font-medium rounded-full transition-colors capitalize ${
                      meetingFilter === f
                        ? "bg-foreground text-background"
                        : "bg-muted text-muted-foreground hover:bg-muted/80"
                    }`}
                  >
                    {f}
                    {f === "pending" && pendingMeetings > 0 && (
                      <span className="ml-1 text-[10px]">({pendingMeetings})</span>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {filteredMeetings.length === 0 ? (
              <Card>
                <CardContent className="py-16 text-center">
                  <p className="font-medium text-foreground">No meeting requests</p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {meetingFilter !== "all" ? "No meetings with this status." : "No meetings have been requested yet."}
                  </p>
                </CardContent>
              </Card>
            ) : (
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
                    {filteredMeetings.map((m) => (
                      <TableRow key={m.id}>
                        <TableCell>
                          <div>
                            <p className="text-sm font-medium">{m.visitor_name}</p>
                            <p className="text-xs text-muted-foreground">{m.visitor_email}</p>
                            {m.message && (
                              <p className="text-xs text-muted-foreground mt-1 line-clamp-1">&quot;{m.message}&quot;</p>
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
                            variant={m.status === "confirmed" ? "default" : m.status === "declined" ? "destructive" : "secondary"}
                            className={
                              m.status === "confirmed" ? "bg-green-100 text-green-800 border-0"
                              : m.status === "pending" ? "bg-amber-100 text-amber-800 border-0"
                              : ""
                            }
                          >
                            {m.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          {m.status === "pending" && (
                            <div className="flex items-center justify-end gap-1">
                              <Button variant="ghost" size="sm" onClick={() => updateMeetingStatus(m.id, "confirmed")} className="text-green-600 hover:text-green-700 hover:bg-green-50">
                                Confirm
                              </Button>
                              <Button variant="ghost" size="sm" onClick={() => updateMeetingStatus(m.id, "declined")} className="text-muted-foreground hover:text-destructive">
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
            )}
          </>
        )}

        {/* ═══════════ CREDENTIALS TAB ═══════════ */}
        {activeTab === "credentials" && (
          <>
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-sm text-muted-foreground">
                  Manage login credentials and permissions for employees
                </p>
              </div>
              {employeesWithoutCreds.length > 0 && (
                <Button size="sm" onClick={() => openCreateCredential()}>
                  <svg className="w-4 h-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>
                  Create Credential
                </Button>
              )}
            </div>

            {credentials.length === 0 ? (
              <Card>
                <CardContent className="py-16 text-center">
                  <div className="mx-auto w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-4">
                    <svg className="w-6 h-6 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 5.25a3 3 0 013 3m3 0a6 6 0 01-7.029 5.912c-.563-.097-1.159.026-1.563.43L10.5 17.25H8.25v2.25H6v2.25H2.25v-2.818c0-.597.237-1.17.659-1.591l6.499-6.499c.404-.404.527-1 .43-1.563A6 6 0 1121.75 8.25z" /></svg>
                  </div>
                  <p className="font-medium text-foreground">No credentials yet</p>
                  <p className="mt-1 text-sm text-muted-foreground max-w-xs mx-auto">
                    Create login credentials for employees so they can access and manage their own profiles.
                  </p>
                  {employeesWithoutCreds.length > 0 && (
                    <Button size="sm" className="mt-4" onClick={() => openCreateCredential()}>
                      Create First Credential
                    </Button>
                  )}
                </CardContent>
              </Card>
            ) : (
              <Card>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Employee</TableHead>
                      <TableHead>Login Email</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead className="hidden md:table-cell">Permissions</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {credentials.map((cred) => {
                      const hue = nameHue(cred.employee.full_name);
                      return (
                        <TableRow key={cred.id}>
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <Avatar className="h-8 w-8 rounded-lg">
                                {cred.employee.profile_image ? (
                                  <AvatarImage src={resolveImageUrl(cred.employee.profile_image)!} alt={cred.employee.full_name} className="object-cover" />
                                ) : null}
                                <AvatarFallback
                                  className="rounded-lg text-xs font-semibold"
                                  style={{
                                    backgroundColor: `oklch(0.92 0.04 ${hue})`,
                                    color: `oklch(0.40 0.12 ${hue})`,
                                  }}
                                >
                                  {cred.employee.full_name.charAt(0)}
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <p className="text-sm font-medium">{cred.employee.full_name}</p>
                                <p className="text-xs text-muted-foreground">{cred.employee.designation}</p>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="text-sm">{cred.email}</TableCell>
                          <TableCell>
                            <Badge variant="secondary" className={`text-xs capitalize ${ROLE_COLORS[cred.role] || ""}`}>
                              {cred.role}
                            </Badge>
                          </TableCell>
                          <TableCell className="hidden md:table-cell">
                            <div className="flex flex-wrap gap-1">
                              {cred.permissions.map((p) => (
                                <span key={p} className="inline-block px-1.5 py-0.5 text-[10px] font-medium bg-muted text-muted-foreground rounded">
                                  {p}
                                </span>
                              ))}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant={cred.is_active ? "default" : "secondary"} className={`text-xs ${cred.is_active ? "bg-green-100 text-green-800 border-0" : ""}`}>
                              {cred.is_active ? "Active" : "Disabled"}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-1">
                              <Button variant="ghost" size="sm" onClick={() => openEditCredential(cred)}>
                                Edit
                              </Button>
                              <Button variant="ghost" size="sm" onClick={() => setCredDeleteTarget(cred.id)} className="text-muted-foreground hover:text-destructive">
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
          </>
        )}

        {/* ═══════════ ANALYTICS TAB ═══════════ */}
        {activeTab === "analytics" && (
          <>
            {analyticsLoading ? (
              <div className="space-y-4">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  {[1,2,3,4].map(i => <Card key={i}><CardContent className="py-5"><Skeleton className="h-7 w-14 mb-1.5" /><Skeleton className="h-3.5 w-20" /></CardContent></Card>)}
                </div>
                <Card><CardContent className="py-12"><Skeleton className="h-[120px] w-full" /></CardContent></Card>
              </div>
            ) : analytics ? (
              <div className="space-y-5">
                {/* Header row */}
                <div className="flex items-center justify-between">
                  <p className="text-sm text-muted-foreground">Profile views across all employees</p>
                  <Button variant="outline" size="sm" onClick={fetchAnalytics} disabled={analyticsLoading} className="h-8 text-xs">
                    <svg className={`w-3.5 h-3.5 mr-1.5 ${analyticsLoading ? "animate-spin" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182" /></svg>
                    Refresh
                  </Button>
                </div>

                {/* Stat row */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {[
                    { label: "Total Views", value: analytics.overview.totalViews, color: "" },
                    { label: "Today", value: analytics.overview.todayViews, color: "text-green-600" },
                    { label: "Last 7 Days", value: analytics.overview.weekViews, color: "" },
                    { label: "Unique Visitors", value: analytics.overview.uniqueVisitors, color: "text-blue-600" },
                  ].map((s) => (
                    <Card key={s.label}>
                      <CardContent className="pt-4 pb-3.5">
                        <p className={`text-2xl font-bold tabular-nums ${s.color}`}>{s.value.toLocaleString()}</p>
                        <p className="text-[11px] text-muted-foreground mt-0.5">{s.label}</p>
                      </CardContent>
                    </Card>
                  ))}
                </div>

                {/* Chart + Top sources side by side */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                  {/* Daily chart — 2/3 width */}
                  <Card className="lg:col-span-2">
                    <CardHeader className="pb-1 pt-4 px-5">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Views — Last 30 Days</CardTitle>
                        <span className="text-xs text-muted-foreground tabular-nums">{analytics.overview.monthViews} total</span>
                      </div>
                    </CardHeader>
                    <CardContent className="px-5 pb-4">
                      <div className="flex items-end gap-[3px] h-[130px] mt-2">
                        {(() => {
                          const max = Math.max(...analytics.daily.map(d => d.count), 1);
                          return analytics.daily.map((d, i) => {
                            const isToday = i === analytics.daily.length - 1;
                            return (
                              <div
                                key={d.date}
                                className={`flex-1 rounded-t transition-all duration-150 group relative cursor-default ${isToday ? "bg-foreground" : "bg-foreground/20 hover:bg-foreground/40"}`}
                                style={{ height: `${Math.max((d.count / max) * 100, 3)}%` }}
                              >
                                <div className="absolute -top-9 left-1/2 -translate-x-1/2 bg-foreground text-background text-[10px] px-2 py-1 rounded-md opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none shadow-lg z-10">
                                  <span className="font-semibold">{d.count}</span>
                                  <span className="text-background/60 ml-1">{new Date(d.date).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}</span>
                                </div>
                              </div>
                            );
                          });
                        })()}
                      </div>
                      <div className="flex justify-between mt-2 text-[10px] text-muted-foreground/60">
                        <span>{new Date(analytics.daily[0]?.date).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}</span>
                        <span>Today</span>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Traffic sources — 1/3 width */}
                  <Card>
                    <CardHeader className="pb-1 pt-4 px-5">
                      <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Traffic Sources</CardTitle>
                    </CardHeader>
                    <CardContent className="px-5 pb-4">
                      {analytics.sources.length === 0 ? (
                        <p className="text-sm text-muted-foreground py-4">No data yet</p>
                      ) : (() => {
                        const total = analytics.sources.reduce((s, x) => s + x.count, 0);
                        const SOURCE_COLORS: Record<string, string> = {
                          qr: "bg-purple-500", linkedin: "bg-blue-600", whatsapp: "bg-green-500",
                          direct: "bg-gray-400", shared: "bg-amber-500", email: "bg-red-400",
                          google: "bg-blue-400", facebook: "bg-blue-700", twitter: "bg-sky-500",
                          instagram: "bg-pink-500", telegram: "bg-cyan-500", referral: "bg-orange-400",
                        };
                        return (
                          <div className="space-y-3 mt-2">
                            {/* Stacked bar */}
                            <div className="flex h-2.5 rounded-full overflow-hidden bg-muted">
                              {analytics.sources.map((s) => (
                                <div
                                  key={s.source}
                                  className={`${SOURCE_COLORS[s.source] || "bg-gray-300"} transition-all`}
                                  style={{ width: `${(s.count / total) * 100}%` }}
                                  title={`${s.source}: ${s.count}`}
                                />
                              ))}
                            </div>
                            {/* Legend */}
                            <div className="space-y-2">
                              {analytics.sources.map((s) => {
                                const pct = total > 0 ? Math.round((s.count / total) * 100) : 0;
                                return (
                                  <div key={s.source} className="flex items-center justify-between text-sm">
                                    <div className="flex items-center gap-2">
                                      <div className={`w-2 h-2 rounded-full shrink-0 ${SOURCE_COLORS[s.source] || "bg-gray-300"}`} />
                                      <span className="capitalize text-[13px]">{s.source}</span>
                                    </div>
                                    <span className="text-[13px] tabular-nums text-muted-foreground">{s.count} <span className="text-[11px]">({pct}%)</span></span>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        );
                      })()}
                    </CardContent>
                  </Card>
                </div>

                {/* Bottom row: Top Profiles + Device/Browser */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {/* Top Profiles */}
                  <Card>
                    <CardHeader className="pb-1 pt-4 px-5">
                      <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Top Profiles</CardTitle>
                    </CardHeader>
                    <CardContent className="px-5 pb-4">
                      {analytics.byEmployee.length === 0 ? (
                        <p className="text-sm text-muted-foreground py-4">No data yet</p>
                      ) : (
                        <div className="space-y-3 mt-1">
                          {analytics.byEmployee.slice(0, 6).map((item, i) => {
                            const max = analytics.byEmployee[0]?.views || 1;
                            return (
                              <div key={item.employee.slug} className="flex items-center gap-3">
                                <span className="text-[11px] font-medium text-muted-foreground/50 w-4 tabular-nums">{i + 1}</span>
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center justify-between mb-1">
                                    <p className="text-[13px] font-medium truncate">{item.employee.full_name}</p>
                                    <span className="text-[13px] font-semibold tabular-nums shrink-0 ml-2">{item.views}</span>
                                  </div>
                                  <div className="h-1 bg-muted rounded-full overflow-hidden">
                                    <div className="h-full bg-foreground/70 rounded-full transition-all" style={{ width: `${(item.views / max) * 100}%` }} />
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  {/* Devices + OS combined */}
                  <Card>
                    <CardHeader className="pb-1 pt-4 px-5">
                      <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Devices</CardTitle>
                    </CardHeader>
                    <CardContent className="px-5 pb-4">
                      {analytics.devices.length === 0 ? (
                        <p className="text-sm text-muted-foreground py-4">No data yet</p>
                      ) : (() => {
                        const total = analytics.devices.reduce((s, x) => s + x.count, 0);
                        const DEVICE_ICONS: Record<string, string> = { mobile: "📱", tablet: "📟", desktop: "💻" };
                        return (
                          <div className="space-y-3 mt-1">
                            {analytics.devices.map((d) => {
                              const pct = total > 0 ? Math.round((d.count / total) * 100) : 0;
                              return (
                                <div key={d.device}>
                                  <div className="flex items-center justify-between mb-1">
                                    <span className="text-[13px] capitalize">{DEVICE_ICONS[d.device] || ""} {d.device}</span>
                                    <span className="text-[13px] tabular-nums text-muted-foreground">{pct}%</span>
                                  </div>
                                  <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                                    <div className="h-full bg-foreground/60 rounded-full transition-all" style={{ width: `${pct}%` }} />
                                  </div>
                                </div>
                              );
                            })}
                            {/* OS sub-list */}
                            <div className="border-t pt-3 mt-3 space-y-1.5">
                              <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider mb-2">Operating Systems</p>
                              {analytics.os.slice(0, 4).map((o) => (
                                <div key={o.os} className="flex items-center justify-between text-[13px]">
                                  <span>{o.os}</span>
                                  <span className="tabular-nums text-muted-foreground">{o.count}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        );
                      })()}
                    </CardContent>
                  </Card>

                  {/* Browsers */}
                  <Card>
                    <CardHeader className="pb-1 pt-4 px-5">
                      <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Browsers</CardTitle>
                    </CardHeader>
                    <CardContent className="px-5 pb-4">
                      {analytics.browsers.length === 0 ? (
                        <p className="text-sm text-muted-foreground py-4">No data yet</p>
                      ) : (() => {
                        const total = analytics.browsers.reduce((s, x) => s + x.count, 0);
                        return (
                          <div className="space-y-3 mt-1">
                            {analytics.browsers.slice(0, 5).map((b) => {
                              const pct = total > 0 ? Math.round((b.count / total) * 100) : 0;
                              return (
                                <div key={b.browser}>
                                  <div className="flex items-center justify-between mb-1">
                                    <span className="text-[13px]">{b.browser}</span>
                                    <span className="text-[13px] tabular-nums text-muted-foreground">{pct}%</span>
                                  </div>
                                  <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                                    <div className="h-full bg-foreground/60 rounded-full transition-all" style={{ width: `${pct}%` }} />
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        );
                      })()}
                    </CardContent>
                  </Card>
                </div>

                {/* Recent activity */}
                {analytics.recent.length > 0 && (
                  <Card>
                    <CardHeader className="pb-1 pt-4 px-5">
                      <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Recent Activity</CardTitle>
                    </CardHeader>
                    <div className="px-5 pb-4">
                      <div className="divide-y">
                        {analytics.recent.slice(0, 15).map((v) => (
                          <div key={v.id} className="flex items-center gap-3 py-2.5 first:pt-1">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <p className="text-[13px] font-medium truncate">{v.employee.full_name}</p>
                                <Badge variant="outline" className="text-[9px] capitalize shrink-0 h-4 px-1.5">{v.source}</Badge>
                              </div>
                              <p className="text-[11px] text-muted-foreground mt-0.5">
                                {v.device_type} · {v.browser} · {v.os}
                                {v.country && ` · ${v.city ? v.city + ", " : ""}${v.country}`}
                              </p>
                            </div>
                            <span className="text-[11px] text-muted-foreground shrink-0 tabular-nums">
                              {new Date(v.created_at).toLocaleString("en-IN", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </Card>
                )}
              </div>
            ) : (
              <Card>
                <CardContent className="py-16 text-center">
                  <p className="font-medium">No analytics data yet</p>
                  <p className="text-sm text-muted-foreground mt-1">Analytics will appear once visitors start viewing employee profiles.</p>
                </CardContent>
              </Card>
            )}
          </>
        )}
      </main>

      {/* QR Preview Modal */}
      {qrPreview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setQrPreview(null)} />
          <div className="relative bg-background rounded-xl shadow-2xl p-6 max-w-sm w-full mx-4">
            <button onClick={() => setQrPreview(null)} className="absolute top-3 right-3 text-muted-foreground hover:text-foreground">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
            <h3 className="text-lg font-semibold mb-1">{qrPreview.name}</h3>
            <p className="text-sm text-muted-foreground mb-4">
              <code className="text-xs bg-muted px-1.5 py-0.5 rounded">/p/{qrPreview.slug}</code>
            </p>
            <div className="flex justify-center mb-4">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={qrPreview.url} alt={`QR code for ${qrPreview.name}`} className="w-[200px] h-[200px] border rounded-lg" />
            </div>
            <div className="flex gap-2">
              <Button asChild className="flex-1">
                <a href={qrPreview.url} download={`${qrPreview.slug}-qr.png`}>Download</a>
              </Button>
              <Button variant="outline" asChild>
                <Link href={`/p/${qrPreview.slug}`} target="_blank">View Profile</Link>
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Credential Create/Edit Modal */}
      {credModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setCredModalOpen(false)} />
          <div className="relative bg-background rounded-xl shadow-2xl p-6 max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto">
            <button onClick={() => setCredModalOpen(false)} className="absolute top-3 right-3 text-muted-foreground hover:text-foreground">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
            <h3 className="text-lg font-semibold mb-4">
              {credEditId ? "Edit Credential" : "Create Credential"}
            </h3>
            <div className="space-y-4">
              {/* Employee selector (only on create) */}
              {!credEditId && (
                <div>
                  <label className="text-sm font-medium mb-1.5 block">Employee</label>
                  <select
                    value={credForm.employee_id}
                    onChange={(e) => {
                      const emp = employees.find((em) => em.id === e.target.value);
                      setCredForm({ ...credForm, employee_id: e.target.value, email: emp?.email || credForm.email });
                    }}
                    className="w-full border rounded-md px-3 py-2 text-sm bg-background"
                  >
                    <option value="">Select employee...</option>
                    {employeesWithoutCreds.map((emp) => (
                      <option key={emp.id} value={emp.id}>{emp.full_name} — {emp.designation}</option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className="text-sm font-medium mb-1.5 block">Login Email</label>
                <Input
                  type="email"
                  value={credForm.email}
                  onChange={(e) => setCredForm({ ...credForm, email: e.target.value })}
                  placeholder="employee@company.com"
                />
              </div>

              <div>
                <label className="text-sm font-medium mb-1.5 block">
                  Password {credEditId && <span className="text-muted-foreground font-normal">(leave blank to keep current)</span>}
                </label>
                <Input
                  type="password"
                  value={credForm.password}
                  onChange={(e) => setCredForm({ ...credForm, password: e.target.value })}
                  placeholder={credEditId ? "••••••••" : "Min 8 characters"}
                />
              </div>

              <div>
                <label className="text-sm font-medium mb-1.5 block">Role</label>
                <div className="flex gap-2">
                  {["viewer", "editor", "admin"].map((role) => (
                    <button
                      key={role}
                      onClick={() => setCredForm({ ...credForm, role })}
                      className={`flex-1 px-3 py-2 text-sm font-medium rounded-lg border transition-colors capitalize ${
                        credForm.role === role
                          ? "bg-foreground text-background border-foreground"
                          : "bg-background text-foreground border-border hover:bg-muted"
                      }`}
                    >
                      {role}
                    </button>
                  ))}
                </div>
                <p className="text-[11px] text-muted-foreground mt-1.5">
                  {credForm.role === "admin" && "Full access to all features and settings"}
                  {credForm.role === "editor" && "Can edit profiles and manage meetings"}
                  {credForm.role === "viewer" && "Can view and edit own profile only"}
                </p>
              </div>

              <div>
                <label className="text-sm font-medium mb-1.5 block">Permissions</label>
                <div className="space-y-2">
                  {PERMISSIONS_OPTIONS.map((perm) => (
                    <label key={perm.value} className="flex items-center gap-2 text-sm cursor-pointer">
                      <input
                        type="checkbox"
                        checked={credForm.permissions.includes(perm.value)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setCredForm({ ...credForm, permissions: [...credForm.permissions, perm.value] });
                          } else {
                            setCredForm({ ...credForm, permissions: credForm.permissions.filter((p) => p !== perm.value) });
                          }
                        }}
                        className="rounded border-border"
                      />
                      {perm.label}
                    </label>
                  ))}
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <Button onClick={saveCredential} disabled={credSaving} className="flex-1">
                  {credSaving ? "Saving..." : credEditId ? "Update" : "Create"}
                </Button>
                <Button variant="outline" onClick={() => setCredModalOpen(false)}>
                  Cancel
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Employee Confirmation */}
      <ConfirmDialog
        open={!!deleteTarget}
        title="Delete Employee"
        description="This will permanently delete this employee's profile, QR code, and all associated data. This action cannot be undone."
        confirmLabel="Delete"
        onConfirm={() => deleteTarget && deleteEmployee(deleteTarget)}
        onCancel={() => setDeleteTarget(null)}
      />

      {/* Delete Credential Confirmation */}
      <ConfirmDialog
        open={!!credDeleteTarget}
        title="Delete Credential"
        description="This will remove the login credentials for this employee. They will no longer be able to access the system."
        confirmLabel="Delete"
        onConfirm={() => credDeleteTarget && deleteCredential(credDeleteTarget)}
        onCancel={() => setCredDeleteTarget(null)}
      />
    </div>
  );
}

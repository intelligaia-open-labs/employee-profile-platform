"use client";

import { useEffect, useState, use } from "react";
import { useAuth } from "@/lib/useAuth";
import { clientApiFetch } from "@/lib/api";
import { resolveImageUrl } from "@/lib/image";
import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";

interface EmployeeAnalytics {
  employee: {
    id: string;
    full_name: string;
    slug: string;
    designation: string;
    profile_image: string | null;
    created_at: string;
  };
  overview: {
    totalViews: number;
    todayViews: number;
    weekViews: number;
    monthViews: number;
    uniqueVisitors: number;
  };
  devices: { device: string; count: number }[];
  browsers: { browser: string; count: number }[];
  sources: { source: string; count: number }[];
  countries: { country: string; count: number }[];
  daily: { date: string; count: number }[];
  recent: {
    id: string;
    device_type: string | null;
    browser: string | null;
    os: string | null;
    country: string | null;
    city: string | null;
    source: string;
    created_at: string;
  }[];
}

export default function EmployeeAnalyticsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const { loading: authLoading } = useAuth();
  const [data, setData] = useState<EmployeeAnalytics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    clientApiFetch<{ data: EmployeeAnalytics }>(`/analytics/employee/${id}`)
      .then((res) => setData(res.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [id]);

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-muted/40">
        <header className="border-b bg-background">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 h-14 flex items-center">
            <Skeleton className="h-5 w-48" />
          </div>
        </header>
        <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-6">
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <Card key={i}>
                <CardHeader className="pb-2"><Skeleton className="h-4 w-16" /></CardHeader>
                <CardContent><Skeleton className="h-8 w-12" /></CardContent>
              </Card>
            ))}
          </div>
          <Card><CardContent className="py-8"><Skeleton className="h-40 w-full" /></CardContent></Card>
        </main>
      </div>
    );
  }

  if (!data?.employee) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Employee not found</p>
      </div>
    );
  }

  const { employee, overview, devices, browsers, sources, countries, daily, recent } = data;
  const maxDaily = Math.max(...daily.map((d) => d.count), 1);

  return (
    <div className="min-h-screen bg-muted/40">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur">
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
            <span className="text-sm font-semibold">Employee Analytics</span>
          </div>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/profile/logo-dark.svg" alt="Logo" className="h-5 w-auto opacity-50" />
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-6">
        {/* Employee Header */}
        <div className="flex items-center gap-4">
          {employee.profile_image ? (
            <Image
              src={resolveImageUrl(employee.profile_image)!}
              alt={employee.full_name}
              width={56}
              height={56}
              className="w-14 h-14 rounded-xl object-cover"
            />
          ) : (
            <div className="w-14 h-14 rounded-xl bg-muted flex items-center justify-center text-lg font-bold">
              {employee.full_name.charAt(0)}
            </div>
          )}
          <div>
            <h1 className="text-xl font-bold">{employee.full_name}</h1>
            <p className="text-sm text-muted-foreground">{employee.designation}</p>
          </div>
          <div className="ml-auto">
            <Button variant="outline" size="sm" asChild>
              <Link href={`/p/${employee.slug}`} target="_blank">View Profile</Link>
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
          {[
            { label: "Total Views", value: overview.totalViews },
            { label: "Today", value: overview.todayViews },
            { label: "This Week", value: overview.weekViews },
            { label: "This Month", value: overview.monthViews },
            { label: "Unique Visitors", value: overview.uniqueVisitors },
          ].map((stat) => (
            <Card key={stat.label}>
              <CardHeader className="pb-2">
                <CardTitle className="text-xs font-medium text-muted-foreground">
                  {stat.label}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold tabular-nums">{stat.value}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Daily Trend */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Views — Last 30 Days</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-end gap-[2px] h-[120px]">
              {daily.map((d) => (
                <div
                  key={d.date}
                  className="flex-1 bg-primary/80 rounded-t-sm min-h-[2px] hover:bg-primary transition-colors group relative"
                  style={{ height: `${Math.max((d.count / maxDaily) * 100, 2)}%` }}
                  title={`${d.date}: ${d.count} views`}
                />
              ))}
            </div>
            <div className="flex justify-between mt-2 text-[10px] text-muted-foreground">
              <span>{daily[0]?.date}</span>
              <span>{daily[daily.length - 1]?.date}</span>
            </div>
          </CardContent>
        </Card>

        {/* Breakdown Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Sources */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Traffic Sources</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {sources.length === 0 && <p className="text-sm text-muted-foreground">No data yet</p>}
              {sources.slice(0, 6).map((s) => (
                <div key={s.source} className="flex items-center justify-between text-sm">
                  <span className="capitalize">{s.source}</span>
                  <Badge variant="secondary" className="tabular-nums">{s.count}</Badge>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Devices */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Devices</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {devices.length === 0 && <p className="text-sm text-muted-foreground">No data yet</p>}
              {devices.map((d) => (
                <div key={d.device} className="flex items-center justify-between text-sm">
                  <span className="capitalize">{d.device}</span>
                  <Badge variant="secondary" className="tabular-nums">{d.count}</Badge>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Browsers */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Browsers</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {browsers.length === 0 && <p className="text-sm text-muted-foreground">No data yet</p>}
              {browsers.slice(0, 6).map((b) => (
                <div key={b.browser} className="flex items-center justify-between text-sm">
                  <span>{b.browser}</span>
                  <Badge variant="secondary" className="tabular-nums">{b.count}</Badge>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Countries */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Countries</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {countries.length === 0 && <p className="text-sm text-muted-foreground">No data yet</p>}
              {countries.slice(0, 6).map((c) => (
                <div key={c.country} className="flex items-center justify-between text-sm">
                  <span>{c.country}</span>
                  <Badge variant="secondary" className="tabular-nums">{c.count}</Badge>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Recent Visitors */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Recent Visitors</CardTitle>
          </CardHeader>
          <CardContent>
            {recent.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4 text-center">No visitors yet</p>
            ) : (
              <div className="space-y-3">
                {recent.map((v) => (
                  <div key={v.id} className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-xs text-muted-foreground shrink-0">
                        {v.device_type === "mobile" ? "📱" : v.device_type === "tablet" ? "📋" : "💻"}
                      </div>
                      <div>
                        <p className="font-medium text-xs">
                          {v.browser} · {v.os}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {[v.city, v.country].filter(Boolean).join(", ") || "Unknown location"}
                          {" · "}
                          <span className="capitalize">{v.source}</span>
                        </p>
                      </div>
                    </div>
                    <span className="text-xs text-muted-foreground shrink-0">
                      {new Date(v.created_at).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}

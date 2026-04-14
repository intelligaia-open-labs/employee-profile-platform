import { prisma } from "@business-profile/db";

export async function getOverviewStats() {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
  const monthAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);

  const [totalViews, todayViews, weekViews, monthViews, uniqueIPs] = await Promise.all([
    prisma.profileView.count(),
    prisma.profileView.count({ where: { created_at: { gte: today } } }),
    prisma.profileView.count({ where: { created_at: { gte: weekAgo } } }),
    prisma.profileView.count({ where: { created_at: { gte: monthAgo } } }),
    prisma.profileView.groupBy({ by: ["visitor_ip"], where: { visitor_ip: { not: null } } }).then((r) => r.length),
  ]);

  return { totalViews, todayViews, weekViews, monthViews, uniqueVisitors: uniqueIPs };
}

export async function getViewsByEmployee() {
  const results = await prisma.profileView.groupBy({
    by: ["employee_id"],
    _count: { id: true },
    orderBy: { _count: { id: "desc" } },
  });

  const employeeIds = results.map((r) => r.employee_id);
  const employees = await prisma.employee.findMany({
    where: { id: { in: employeeIds } },
    select: { id: true, full_name: true, slug: true, designation: true, profile_image: true },
  });

  const empMap = new Map(employees.map((e) => [e.id, e]));

  return results.map((r) => ({
    employee: empMap.get(r.employee_id) || { id: r.employee_id, full_name: "Unknown", slug: "", designation: "", profile_image: null },
    views: r._count.id,
  }));
}

export async function getDeviceBreakdown() {
  const results = await prisma.profileView.groupBy({
    by: ["device_type"],
    _count: { id: true },
    orderBy: { _count: { id: "desc" } },
  });
  return results.map((r) => ({ device: r.device_type || "Unknown", count: r._count.id }));
}

export async function getBrowserBreakdown() {
  const results = await prisma.profileView.groupBy({
    by: ["browser"],
    _count: { id: true },
    orderBy: { _count: { id: "desc" } },
  });
  return results.map((r) => ({ browser: r.browser || "Unknown", count: r._count.id }));
}

export async function getOsBreakdown() {
  const results = await prisma.profileView.groupBy({
    by: ["os"],
    _count: { id: true },
    orderBy: { _count: { id: "desc" } },
  });
  return results.map((r) => ({ os: r.os || "Unknown", count: r._count.id }));
}

export async function getSourceBreakdown() {
  const results = await prisma.profileView.groupBy({
    by: ["source"],
    _count: { id: true },
    orderBy: { _count: { id: "desc" } },
  });
  return results.map((r) => ({ source: r.source || "direct", count: r._count.id }));
}

export async function getCountryBreakdown() {
  const results = await prisma.profileView.groupBy({
    by: ["country"],
    _count: { id: true },
    orderBy: { _count: { id: "desc" } },
    where: { country: { not: null } },
  });
  return results.map((r) => ({ country: r.country || "Unknown", count: r._count.id }));
}

export async function getDailyViews(days: number = 30) {
  const since = new Date();
  since.setDate(since.getDate() - days);

  const views = await prisma.profileView.findMany({
    where: { created_at: { gte: since } },
    select: { created_at: true },
    orderBy: { created_at: "asc" },
  });

  // Group by date
  const map = new Map<string, number>();
  for (let d = 0; d <= days; d++) {
    const date = new Date(since.getTime() + d * 24 * 60 * 60 * 1000);
    const key = date.toISOString().split("T")[0];
    map.set(key, 0);
  }
  for (const v of views) {
    const key = v.created_at.toISOString().split("T")[0];
    map.set(key, (map.get(key) || 0) + 1);
  }

  return Array.from(map.entries()).map(([date, count]) => ({ date, count }));
}

export async function getRecentViews(limit: number = 20) {
  return prisma.profileView.findMany({
    take: limit,
    orderBy: { created_at: "desc" },
    select: {
      id: true,
      device_type: true,
      browser: true,
      os: true,
      country: true,
      city: true,
      source: true,
      referrer: true,
      created_at: true,
      employee: { select: { full_name: true, slug: true } },
    },
  });
}

export async function getEmployeeAnalytics(employeeId: string) {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
  const monthAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
  const since = new Date();
  since.setDate(since.getDate() - 30);

  const employee = await prisma.employee.findUnique({
    where: { id: employeeId },
    select: { id: true, full_name: true, slug: true, designation: true, profile_image: true, created_at: true },
  });

  const [totalViews, todayViews, weekViews, monthViews] = await Promise.all([
    prisma.profileView.count({ where: { employee_id: employeeId } }),
    prisma.profileView.count({ where: { employee_id: employeeId, created_at: { gte: today } } }),
    prisma.profileView.count({ where: { employee_id: employeeId, created_at: { gte: weekAgo } } }),
    prisma.profileView.count({ where: { employee_id: employeeId, created_at: { gte: monthAgo } } }),
  ]);

  const uniqueIPs = await prisma.profileView
    .groupBy({ by: ["visitor_ip"], where: { employee_id: employeeId, visitor_ip: { not: null } } })
    .then((r) => r.length);

  const devices = await prisma.profileView.groupBy({
    by: ["device_type"],
    _count: { _all: true },
    where: { employee_id: employeeId },
  });

  const browsers = await prisma.profileView.groupBy({
    by: ["browser"],
    _count: { _all: true },
    where: { employee_id: employeeId },
  });

  const sources = await prisma.profileView.groupBy({
    by: ["source"],
    _count: { _all: true },
    where: { employee_id: employeeId },
  });

  const countries = await prisma.profileView.groupBy({
    by: ["country"],
    _count: { _all: true },
    where: { employee_id: employeeId, country: { not: null } },
  });

  const recent = await prisma.profileView.findMany({
    take: 20,
    where: { employee_id: employeeId },
    orderBy: { created_at: "desc" },
    select: { id: true, device_type: true, browser: true, os: true, country: true, city: true, source: true, referrer: true, created_at: true },
  });

  // Daily trend
  const viewsRaw = await prisma.profileView.findMany({
    where: { employee_id: employeeId, created_at: { gte: since } },
    select: { created_at: true },
    orderBy: { created_at: "asc" },
  });
  const dailyMap = new Map<string, number>();
  for (let d = 0; d <= 30; d++) {
    const date = new Date(since.getTime() + d * 24 * 60 * 60 * 1000);
    dailyMap.set(date.toISOString().split("T")[0], 0);
  }
  for (const v of viewsRaw) {
    const key = v.created_at.toISOString().split("T")[0];
    dailyMap.set(key, (dailyMap.get(key) || 0) + 1);
  }

  return {
    employee,
    overview: { totalViews, todayViews, weekViews, monthViews, uniqueVisitors: uniqueIPs },
    devices: devices.map((r) => ({ device: r.device_type || "Unknown", count: r._count._all })),
    browsers: browsers.map((r) => ({ browser: r.browser || "Unknown", count: r._count._all })),
    sources: sources.map((r) => ({ source: r.source || "direct", count: r._count._all })),
    countries: countries.map((r) => ({ country: r.country || "Unknown", count: r._count._all })),
    daily: Array.from(dailyMap.entries()).map(([date, count]) => ({ date, count })),
    recent,
  };
}

export async function getFullAnalytics() {
  const [overview, byEmployee, devices, browsers, os, sources, countries, daily, recent] = await Promise.all([
    getOverviewStats(),
    getViewsByEmployee(),
    getDeviceBreakdown(),
    getBrowserBreakdown(),
    getOsBreakdown(),
    getSourceBreakdown(),
    getCountryBreakdown(),
    getDailyViews(30),
    getRecentViews(30),
  ]);

  return { overview, byEmployee, devices, browsers, os, sources, countries, daily, recent };
}

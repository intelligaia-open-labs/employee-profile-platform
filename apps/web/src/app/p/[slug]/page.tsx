import { notFound } from "next/navigation";
import { apiFetch } from "@/lib/api";
import type { ApiResponse, EmployeePublic } from "@business-profile/shared";
import { ProfileCard } from "@/components/ProfileCard";
import type { Metadata } from "next";

interface Props {
  params: Promise<{ slug: string }>;
}

async function getEmployee(slug: string): Promise<EmployeePublic | null> {
  try {
    const res = await apiFetch<ApiResponse<EmployeePublic>>(
      `/public/profile/${slug}`,
      { next: { revalidate: 60 } },
    );
    return res.data ?? null;
  } catch {
    return null;
  }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const employee = await getEmployee(slug);
  if (!employee) return { title: "Profile Not Found" };

  return {
    title: `${employee.full_name} - ${employee.designation}`,
    description: employee.bio || `${employee.full_name}'s digital business profile`,
  };
}

export default async function ProfilePage({ params }: Props) {
  const { slug } = await params;
  const employee = await getEmployee(slug);

  if (!employee) {
    notFound();
  }

  return (
    <main className="min-h-screen bg-[#f0f0f0] flex items-start justify-center py-4 px-4">
      <ProfileCard employee={employee} />
    </main>
  );
}

import { notFound } from "next/navigation";
import { apiFetch } from "@/lib/api";
import { resolveImageUrl } from "@/lib/image";
import type { ApiResponse, EmployeePublic } from "@business-profile/shared";
import { ProfileCard } from "@/components/ProfileCard";
import { ProfileReveal } from "@/components/ProfileReveal";
import { ProfileTracker } from "@/components/ProfileTracker";
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

  const profileImage = resolveImageUrl(employee.profile_image);
  const faviconUrl = profileImage || `/api/favicon?letter=${encodeURIComponent(employee.full_name.charAt(0))}`;

  return {
    title: `${employee.full_name} - ${employee.designation}`,
    description:
      employee.bio || `${employee.full_name}'s digital business profile`,
    icons: {
      icon: faviconUrl,
      apple: faviconUrl,
    },
  };
}

export default async function ProfilePage({ params }: Props) {
  const { slug } = await params;
  const employee = await getEmployee(slug);

  if (!employee) {
    notFound();
  }

  return (
    <>
      <ProfileTracker slug={slug} />
      <ProfileReveal>
        <main className="relative min-h-screen bg-white">
          <ProfileCard employee={employee} />
        </main>
      </ProfileReveal>
    </>
  );
}

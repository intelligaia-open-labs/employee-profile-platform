import { notFound } from "next/navigation";
import { apiFetch } from "@/lib/api";
import type { ApiResponse, EmployeePublic } from "@business-profile/shared";
import { ProfileCard } from "@/components/ProfileCard";
import { ProfileReveal } from "@/components/ProfileReveal";
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
    description:
      employee.bio || `${employee.full_name}'s digital business profile`,
  };
}

export default async function ProfilePage({ params }: Props) {
  const { slug } = await params;
  const employee = await getEmployee(slug);

  if (!employee) {
    notFound();
  }

  return (
    <ProfileReveal>
      <main className="relative min-h-screen">
        {/* Fixed background — mobile */}
        <div
          className="fixed inset-0 z-0 md:hidden"
          style={{
            backgroundImage: "url(/profile/bg-mobile.png)",
            backgroundSize: "cover",
            backgroundPosition: "center top",
          }}
        />
        {/* Fixed background — desktop */}
        <div
          className="fixed inset-0 z-0 hidden md:block"
          style={{
            backgroundImage: "url(/profile/bg-desktop.png)",
            backgroundSize: "cover",
            backgroundPosition: "center center",
          }}
        />

        {/* Centered card — same layout for mobile and desktop */}
        <div className="relative z-10 flex justify-center">
          <div className="w-full max-w-[560px]">
            <ProfileCard employee={employee} />
          </div>
        </div>
      </main>
    </ProfileReveal>
  );
}

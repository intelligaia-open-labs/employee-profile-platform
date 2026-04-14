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
        {/* Fixed background — works on mobile unlike background-attachment: fixed */}
        <div
          className="fixed inset-0 z-0"
          style={{
            backgroundImage: "url(/profile/bg-mobile.png)",
            backgroundSize: "cover",
            backgroundPosition: "center top",
            backgroundRepeat: "no-repeat",
          }}
        />
        <div className="relative z-10 flex items-start justify-center px-0 md:px-4 py-0 md:py-8 lg:py-12">
          {/* Desktop side info */}
          <div className="hidden lg:flex flex-col justify-center items-end pr-12 pt-32 flex-shrink-0 w-[280px]">
            <h2 className="text-white/90 text-3xl font-bold leading-tight tracking-tight">
              {employee.full_name}
            </h2>
            <p className="mt-2 text-white/50 text-sm font-medium text-right">
              {employee.designation}
            </p>
            <div className="mt-6 w-12 h-px bg-white/20" />
            <p className="mt-4 text-white/30 text-xs font-medium tracking-[0.2em] uppercase text-right">
              Digital Profile
            </p>
          </div>

          {/* Card */}
          <div className="w-full max-w-md lg:flex-shrink-0">
            <ProfileCard employee={employee} />
          </div>

          {/* Desktop right spacer */}
          <div className="hidden lg:block w-[280px] flex-shrink-0" />
        </div>
      </main>
    </ProfileReveal>
  );
}

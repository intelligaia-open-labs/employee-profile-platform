import Link from "next/link";

export default function HomePage() {
  return (
    <main
      className="min-h-screen flex items-center justify-center px-6"
      style={{
        background:
          "radial-gradient(ellipse at 50% 40%, var(--profile-glow), var(--profile-bg))",
      }}
    >
      <div className="animate-reveal">
        <h1 className="text-[clamp(2.75rem,10vw,5.5rem)] font-bold leading-[1.02] tracking-tight text-surface-raised">
          Business
          <br />
          Profile
        </h1>
        <p className="mt-5 font-body text-lg leading-relaxed" style={{ color: "oklch(0.60 0.02 260)" }}>
          The digital business card platform
          <br />
          for modern teams.
        </p>
        <Link
          href="/admin/login"
          className="inline-flex items-center gap-2 mt-8 text-sm font-medium group transition-colors"
          style={{ color: "oklch(0.55 0.02 260)" }}
          onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.color = "oklch(0.80 0.02 260)")}
          onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.color = "oklch(0.55 0.02 260)")}
        >
          Sign in
          <svg
            className="w-4 h-4 group-hover:translate-x-1 transition-transform duration-200"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
          </svg>
        </Link>
      </div>
    </main>
  );
}

import Link from "next/link";

export default function HomePage() {
  return (
    <main
      className="min-h-screen flex items-center justify-center px-6 relative overflow-hidden"
      style={{
        background:
          "linear-gradient(135deg, #3d5a6e 0%, #5a7d8f 40%, #8aa5b5 100%)",
      }}
    >
      <div className="relative z-10 animate-reveal">
        <h1 className="text-[clamp(2.75rem,10vw,5.5rem)] font-bold leading-[1.02] tracking-tight text-white">
          Business
          <br />
          Profile
        </h1>
        <p
          className="mt-5 text-lg leading-relaxed"
          style={{ color: "rgba(255,255,255,0.65)" }}
        >
          The digital business card platform
          <br />
          for modern teams.
        </p>
        <Link
          href="/admin/login"
          className="inline-flex items-center gap-2 mt-8 text-sm font-medium text-white/50 hover:text-white transition-colors group"
        >
          Sign in
          <svg
            className="w-4 h-4 group-hover:translate-x-1 transition-transform duration-200"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M17 8l4 4m0 0l-4 4m4-4H3"
            />
          </svg>
        </Link>
      </div>
    </main>
  );
}

import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function HomePage() {
  return (
    <main className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Fixed building background */}
      <div
        className="fixed inset-0 z-0"
        style={{
          backgroundImage: "url(/profile/bg.png)",
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      />
      {/* Dark overlay */}
      <div className="fixed inset-0 z-0 bg-black/50" />

      <div className="relative z-10 flex flex-col items-center text-center px-6 max-w-xl">
        {/* Logo */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/profile/logo.svg" alt="Logo" className="h-10 w-auto mb-12 opacity-80" />

        <h1 className="text-[clamp(2.5rem,8vw,4.5rem)] font-bold leading-[1.05] tracking-tight text-white">
          Digital Business
          <br />
          Profiles
        </h1>

        <p className="mt-5 text-white/60 text-base sm:text-lg leading-relaxed max-w-md">
          Create and share professional digital profiles for your team.
          QR codes, vCards, and instant contact sharing.
        </p>

        <div className="flex gap-3 mt-10">
          <Button asChild size="lg" className="rounded-full px-8 bg-white text-black hover:bg-white/90 font-semibold">
            <Link href="/admin/login">Sign in</Link>
          </Button>
          <Button asChild variant="outline" size="lg" className="rounded-full px-8 border-white/30 text-white hover:bg-white/10 font-medium">
            <Link href="/admin/login">Get Started</Link>
          </Button>
        </div>

        <p className="mt-16 text-white/25 text-[10px] tracking-[0.3em] uppercase font-medium">
          Powered by Intelligaia
        </p>
      </div>
    </main>
  );
}

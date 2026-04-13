"use client";

import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import { clientApiFetch } from "@/lib/api";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      await clientApiFetch("/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      router.push("/admin");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center px-6">
      <div className="w-full max-w-sm">
        {/* Brand */}
        <h2 className="text-[clamp(1.75rem,5vw,2.5rem)] font-bold leading-[1.08] tracking-tight text-ink">
          Business
          <br />
          Profile
        </h2>

        {/* Form */}
        <div className="mt-10">
          <h1 className="text-lg font-semibold text-ink">Sign in</h1>
          <p className="mt-0.5 text-sm text-ink-tertiary">Admin access</p>

          {error && (
            <div className="mt-5 py-3 px-4 bg-danger-subtle text-danger text-sm rounded-lg">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="mt-6 space-y-5">
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-ink-secondary mb-1.5"
              >
                Email
              </label>
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-surface-raised border rounded-lg text-ink placeholder:text-ink-tertiary focus:outline-none focus:ring-2 focus:ring-accent focus:border-accent transition-colors"
              />
            </div>
            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-ink-secondary mb-1.5"
              >
                Password
              </label>
              <input
                id="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-surface-raised border rounded-lg text-ink placeholder:text-ink-tertiary focus:outline-none focus:ring-2 focus:ring-accent focus:border-accent transition-colors"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full py-2.5 bg-accent text-surface-raised font-semibold rounded-lg disabled:opacity-50"
            >
              {loading ? "Signing in..." : "Sign in"}
            </button>
          </form>
        </div>
      </div>
    </main>
  );
}

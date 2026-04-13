"use client";

import { useAuth } from "@/lib/useAuth";
import { EmployeeForm } from "@/components/EmployeeForm";
import Link from "next/link";

export default function NewEmployeePage() {
  const { loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-5 h-5 border-2 border-ink-tertiary border-t-accent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface">
      <header className="border-b">
        <div className="max-w-6xl mx-auto px-6 h-14 flex items-center gap-4">
          <Link
            href="/admin"
            className="text-sm text-ink-tertiary hover:text-ink transition-colors"
          >
            &larr; Dashboard
          </Link>
          <h1 className="text-sm font-semibold text-ink">New Employee</h1>
        </div>
      </header>
      <main className="py-10 px-6">
        <EmployeeForm />
      </main>
    </div>
  );
}

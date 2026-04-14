"use client";

import { useAuth } from "@/lib/useAuth";
import { EmployeeForm } from "@/components/EmployeeForm";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

export default function NewEmployeePage() {
  const { loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="w-5 h-5 border-2 border-muted-foreground border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted/40">
      <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" asChild>
              <Link href="/admin">
                <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                </svg>
                Back
              </Link>
            </Button>
            <Separator orientation="vertical" className="h-5" />
            <span className="text-sm font-semibold">New Employee</span>
          </div>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/profile/logo.svg" alt="Logo" className="h-5 w-auto opacity-50 dark:invert" />
        </div>
      </header>
      <main className="py-8 px-4 sm:px-6">
        <EmployeeForm />
      </main>
    </div>
  );
}

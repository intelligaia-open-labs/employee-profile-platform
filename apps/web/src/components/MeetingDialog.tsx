"use client";

import { useState, FormEvent } from "react";
import { toast } from "sonner";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

interface Props {
  slug: string;
  employeeName: string;
  open: boolean;
  onClose: () => void;
}

export function MeetingDialog({ slug, employeeName, open, onClose }: Props) {
  const [form, setForm] = useState({
    visitor_name: "",
    visitor_email: "",
    visitor_phone: "",
    message: "",
    preferred_date: "",
  });
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

  function handleChange(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch(`${API_URL}/public/meeting-request/${slug}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || "Failed to submit");
      }

      setSubmitted(true);
      toast.success("Meeting request sent!");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Something went wrong";
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  }

  function handleClose() {
    setSubmitted(false);
    setForm({ visitor_name: "", visitor_email: "", visitor_phone: "", message: "", preferred_date: "" });
    setError("");
    onClose();
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={handleClose}
      />

      {/* Dialog */}
      <div className="relative w-full max-w-md bg-white rounded-t-[24px] sm:rounded-[18px] p-6 max-h-[90vh] overflow-y-auto animate-slide-up">
        {submitted ? (
          /* Success State */
          <div className="text-center py-8">
            <div className="w-16 h-16 mx-auto rounded-full bg-green-100 flex items-center justify-center mb-4">
              <svg className="w-8 h-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-[#121212]">
              Request Sent
            </h2>
            <p className="mt-2 text-sm text-[#727272] max-w-xs mx-auto">
              Your meeting request has been sent to {employeeName}. You&apos;ll hear back soon.
            </p>
            <button
              onClick={handleClose}
              className="mt-6 w-full bg-[#121212] text-white text-sm font-medium py-3 px-4 rounded-full hover:bg-[#2a2a2a] transition-colors"
            >
              Done
            </button>
          </div>
        ) : (
          /* Form */
          <>
            <div className="text-center mb-6">
              <h2 className="text-xl font-semibold text-[#121212]">
                Schedule a Meeting
              </h2>
              <p className="mt-1 text-sm text-[#727272]">
                with {employeeName}
              </p>
            </div>

            {error && (
              <div className="mb-4 py-2.5 px-3 bg-red-50 text-red-600 text-sm rounded-lg">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-[#727272] mb-1.5">
                  Your Name *
                </label>
                <input
                  required
                  value={form.visitor_name}
                  onChange={(e) => handleChange("visitor_name", e.target.value)}
                  className="w-full px-3.5 py-2.5 border border-[#e5e5e5] rounded-xl text-sm text-[#121212] placeholder:text-[#b0b0b0] focus:outline-none focus:ring-2 focus:ring-[#121212]/10 focus:border-[#121212] transition-colors"
                  placeholder="John Doe"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-[#727272] mb-1.5">
                  Email *
                </label>
                <input
                  type="email"
                  required
                  value={form.visitor_email}
                  onChange={(e) => handleChange("visitor_email", e.target.value)}
                  className="w-full px-3.5 py-2.5 border border-[#e5e5e5] rounded-xl text-sm text-[#121212] placeholder:text-[#b0b0b0] focus:outline-none focus:ring-2 focus:ring-[#121212]/10 focus:border-[#121212] transition-colors"
                  placeholder="john@company.com"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-[#727272] mb-1.5">
                  Phone
                </label>
                <input
                  value={form.visitor_phone}
                  onChange={(e) => handleChange("visitor_phone", e.target.value)}
                  className="w-full px-3.5 py-2.5 border border-[#e5e5e5] rounded-xl text-sm text-[#121212] placeholder:text-[#b0b0b0] focus:outline-none focus:ring-2 focus:ring-[#121212]/10 focus:border-[#121212] transition-colors"
                  placeholder="+1 234 567 8900"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-[#727272] mb-1.5">
                  Preferred Date
                </label>
                <input
                  type="date"
                  value={form.preferred_date}
                  onChange={(e) => handleChange("preferred_date", e.target.value)}
                  className="w-full px-3.5 py-2.5 border border-[#e5e5e5] rounded-xl text-sm text-[#121212] placeholder:text-[#b0b0b0] focus:outline-none focus:ring-2 focus:ring-[#121212]/10 focus:border-[#121212] transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-[#727272] mb-1.5">
                  Message
                </label>
                <textarea
                  rows={3}
                  value={form.message}
                  onChange={(e) => handleChange("message", e.target.value)}
                  className="w-full px-3.5 py-2.5 border border-[#e5e5e5] rounded-xl text-sm text-[#121212] placeholder:text-[#b0b0b0] focus:outline-none focus:ring-2 focus:ring-[#121212]/10 focus:border-[#121212] transition-colors resize-none"
                  placeholder="I'd like to discuss..."
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 bg-[#121212] text-white text-sm font-medium py-3 px-4 rounded-full hover:bg-[#2a2a2a] disabled:opacity-50 transition-colors"
                >
                  {loading ? "Sending..." : "Send Request"}
                </button>
                <button
                  type="button"
                  onClick={handleClose}
                  className="px-6 py-3 text-sm font-medium text-[#727272] hover:text-[#121212] transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          </>
        )}
      </div>

      <style>{`
        @keyframes slide-up {
          from { opacity: 0; transform: translateY(100px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-slide-up {
          animation: slide-up 0.35s cubic-bezier(0.16, 1, 0.3, 1) both;
        }
      `}</style>
    </div>
  );
}

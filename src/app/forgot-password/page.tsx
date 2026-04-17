"use client";

import { useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const supabase = createClient();
      const redirectTo = `${window.location.origin}/set-password`;
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(
        email,
        { redirectTo },
      );
      if (resetError) throw resetError;
      setSubmitted(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to send reset email");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-navy flex items-center justify-center px-4">
      <div className="w-full max-w-[400px]">
        <div className="flex justify-center mb-10">
          <img src="/abplogo.png" alt="ABP Capital" className="h-[32px]" />
        </div>

        <div className="bg-white rounded-2xl shadow-lg p-8">
          <h1 className="text-[18px] font-medium text-text-primary text-center mb-1">
            Reset Password
          </h1>
          <p className="text-[13px] text-text-secondary text-center mb-6">
            Enter your email and we&apos;ll send a reset link
          </p>

          {submitted ? (
            <div className="space-y-4">
              <div className="text-[13px] text-text-primary bg-surface px-3 py-3 rounded-lg">
                If an account exists for that email, a reset link will arrive shortly. Check your inbox and spam folder.
              </div>
              <Link
                href="/login"
                className="block text-center text-[13px] text-trust-blue hover:text-pro-blue transition-colors"
              >
                Back to sign in
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-[11px] font-medium text-text-secondary uppercase tracking-[0.05em] mb-1.5">
                  Email
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoFocus
                  className="w-full h-10 px-3 rounded-lg border border-border-strong bg-white text-[14px] text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-trust-blue/30 focus:border-trust-blue transition-colors"
                  placeholder="you@abpcapital.com"
                />
              </div>

              {error && (
                <div className="text-[13px] text-red-600 bg-red-50 px-3 py-2 rounded-lg">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading || !email}
                className="w-full h-10 bg-trust-blue hover:bg-pro-blue text-white text-[14px] font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              >
                {loading ? "Sending\u2026" : "Send Reset Link"}
              </button>

              <Link
                href="/login"
                className="block text-center text-[13px] text-trust-blue hover:text-pro-blue transition-colors"
              >
                Back to sign in
              </Link>
            </form>
          )}
        </div>

        <p className="text-[11px] text-white/40 text-center mt-6">
          ABP Capital, LLC. &mdash; Confidential
        </p>
      </div>
    </div>
  );
}

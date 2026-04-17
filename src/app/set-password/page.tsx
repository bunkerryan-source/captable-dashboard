"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { markPasswordChanged } from "@/lib/dal";

export default function SetPasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);

  // Require a session — the forgot-password reset flow sets one via the
  // URL hash, and the first-login flow sets one during sign-in. If neither
  // happened, bounce to /login.
  useEffect(() => {
    async function check() {
      const supabase = createClient();
      const { data } = await supabase.auth.getUser();
      if (!data.user) {
        router.replace("/login");
        return;
      }
      setCheckingSession(false);
    }
    check();
  }, [router]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (password.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }
    if (password !== confirm) {
      setError("Passwords don't match");
      return;
    }

    setLoading(true);
    try {
      const supabase = createClient();
      const { error: updateError } = await supabase.auth.updateUser({
        password,
      });
      if (updateError) throw updateError;
      await markPasswordChanged();
      window.location.href = "/";
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to set password");
    } finally {
      setLoading(false);
    }
  }

  if (checkingSession) {
    return (
      <div className="min-h-screen bg-navy flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-white/20 border-t-white/60 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-navy flex items-center justify-center px-4">
      <div className="w-full max-w-[400px]">
        <div className="flex justify-center mb-10">
          <img src="/abplogo.png" alt="ABP Capital" className="h-[32px]" />
        </div>

        <div className="bg-white rounded-2xl shadow-lg p-8">
          <h1 className="text-[18px] font-medium text-text-primary text-center mb-1">
            Set Your Password
          </h1>
          <p className="text-[13px] text-text-secondary text-center mb-6">
            Choose a new password to complete sign-in
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-[11px] font-medium text-text-secondary uppercase tracking-[0.05em] mb-1.5">
                New Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoFocus
                minLength={8}
                className="w-full h-10 px-3 rounded-lg border border-border-strong bg-white text-[14px] text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-trust-blue/30 focus:border-trust-blue transition-colors"
                placeholder="At least 8 characters"
              />
            </div>

            <div>
              <label className="block text-[11px] font-medium text-text-secondary uppercase tracking-[0.05em] mb-1.5">
                Confirm Password
              </label>
              <input
                type="password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                required
                minLength={8}
                className="w-full h-10 px-3 rounded-lg border border-border-strong bg-white text-[14px] text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-trust-blue/30 focus:border-trust-blue transition-colors"
                placeholder="Re-enter password"
              />
            </div>

            {error && (
              <div className="text-[13px] text-red-600 bg-red-50 px-3 py-2 rounded-lg">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading || !password || !confirm}
              className="w-full h-10 bg-trust-blue hover:bg-pro-blue text-white text-[14px] font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              {loading ? "Saving\u2026" : "Save Password"}
            </button>
          </form>
        </div>

        <p className="text-[11px] text-white/40 text-center mt-6">
          ABP Capital, LLC. &mdash; Confidential
        </p>
      </div>
    </div>
  );
}

"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [isSetup, setIsSetup] = useState(false);
  const [checkingUsers, setCheckingUsers] = useState(true);

  // Check if this is first-time setup (no users exist)
  useEffect(() => {
    async function check() {
      try {
        const supabase = createClient();
        const { data } = await supabase.rpc("has_users" as never) as { data: boolean | null };
        setIsSetup(data === false);
      } catch {
        // If the RPC fails (stale cookies, network issue), fall through to login
      } finally {
        setCheckingUsers(false);
      }
    }
    check();
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const supabase = createClient();

      if (isSetup) {
        // First user sign-up
        const { error: signUpError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { display_name: displayName || undefined },
          },
        });
        if (signUpError) throw signUpError;
      } else {
        // Normal sign-in
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (signInError) throw signInError;
      }

      router.push("/");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Authentication failed");
    } finally {
      setLoading(false);
    }
  }

  if (checkingUsers) {
    return (
      <div className="min-h-screen bg-navy flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-white/20 border-t-white/60 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-navy flex items-center justify-center px-4">
      <div className="w-full max-w-[400px]">
        {/* Logo */}
        <div className="flex justify-center mb-10">
          <img
            src="/abplogo.png"
            alt="ABP Capital"
            className="h-[32px]"
          />
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-lg p-8">
          <h1 className="text-[18px] font-medium text-text-primary text-center mb-1">
            {isSetup ? "Create Admin Account" : "Cap Table Dashboard"}
          </h1>
          <p className="text-[13px] text-text-secondary text-center mb-6">
            {isSetup
              ? "Set up the first admin account to get started"
              : "Sign in to access your equity data"}
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            {isSetup && (
              <div>
                <label className="block text-[11px] font-medium text-text-secondary uppercase tracking-[0.05em] mb-1.5">
                  Full Name
                </label>
                <input
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className="w-full h-10 px-3 rounded-lg border border-border-strong bg-white text-[14px] text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-trust-blue/30 focus:border-trust-blue transition-colors"
                  placeholder="Ryan Bunker"
                />
              </div>
            )}

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

            <div>
              <label className="block text-[11px] font-medium text-text-secondary uppercase tracking-[0.05em] mb-1.5">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                className="w-full h-10 px-3 rounded-lg border border-border-strong bg-white text-[14px] text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-trust-blue/30 focus:border-trust-blue transition-colors"
                placeholder={isSetup ? "Choose a password (min 6 characters)" : "Enter your password"}
              />
            </div>

            {error && (
              <div className="text-[13px] text-red-600 bg-red-50 px-3 py-2 rounded-lg">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading || !email || !password}
              className="w-full h-10 bg-trust-blue hover:bg-pro-blue text-white text-[14px] font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              {loading
                ? isSetup
                  ? "Creating account\u2026"
                  : "Signing in\u2026"
                : isSetup
                  ? "Create Account"
                  : "Sign In"}
            </button>

            {!isSetup && (
              <a
                href="/forgot-password"
                className="block text-center text-[13px] text-trust-blue hover:text-pro-blue transition-colors"
              >
                Forgot password?
              </a>
            )}
          </form>
        </div>

        <p className="text-[11px] text-white/40 text-center mt-6">
          ABP Capital, LLC. &mdash; Confidential
        </p>
      </div>
    </div>
  );
}

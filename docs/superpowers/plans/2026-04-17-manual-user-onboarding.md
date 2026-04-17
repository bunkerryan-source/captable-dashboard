# Manual User Onboarding Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the broken in-app invite flow with manual admin-created accounts (via Supabase Dashboard), a `must_change_password` flag, and a `/set-password` page that handles both first-login and forgot-password flows.

**Architecture:** User provisioning moves out of the app. A DB trigger auto-creates `user_profiles` rows with `must_change_password = true`. `AuthContext` exposes the flag; the dashboard layout redirects to `/set-password` when it's true. A small SECURITY DEFINER RPC flips the flag after a successful password change. All invite-specific code (modal, edge function, callback route, DAL function) is deleted.

**Tech Stack:** Next.js 16 App Router, TypeScript, Supabase Auth (`@supabase/ssr`, `@supabase/supabase-js`), Tailwind v4.

**Verification:** This codebase has no test framework installed — every step that produces code ends in a manual smoke test via the dev server (`npm run dev`) and inspection of Supabase tables. Test infrastructure is out of scope.

**Spec:** [`docs/superpowers/specs/2026-04-17-manual-user-onboarding-design.md`](../specs/2026-04-17-manual-user-onboarding-design.md)

---

## File Map

**New files:**
- `src/app/set-password/page.tsx` — set/change password form (used for first-login + forgot-password recovery)
- `src/app/forgot-password/page.tsx` — "enter your email" form that triggers the reset email

**Modified files:**
- `src/context/AuthContext.tsx` — add `mustChangePassword: boolean` to the state
- `src/app/(dashboard)/layout.tsx` — redirect to `/set-password` when flag is true
- `src/app/login/page.tsx` — add "Forgot password?" link
- `src/components/layout/AppHeader.tsx` — remove Invite User button and modal wiring
- `src/lib/dal/auth.ts` — delete `inviteUser`/`InviteResult`; add `markPasswordChanged`; extend `getUserProfile`
- `src/lib/dal/index.ts` — remove `inviteUser` from barrel export
- `src/lib/supabase/types.ts` — add `must_change_password` to `user_profiles` Row/Insert/Update; add `mark_password_changed` RPC signature

**Deleted files:**
- `src/components/modals/InviteUserModal.tsx`
- `src/app/auth/callback/route.ts`

**Supabase dashboard changes (manual):**
- Delete auth users: Ashley Franco, Taylor Baumann
- Run migration SQL (new column + trigger + RPC)
- Delete `invite-user` edge function
- Set min password length to 8 in Auth settings
- Add `/set-password` to Redirect URLs allowlist

---

## Task 1: Supabase Cleanup + Migration + Auth Config (Manual — Ryan Runs in Dashboard)

**Files:** None (Supabase web UI + SQL editor)

This is one bundled task because it's all done in the Supabase Dashboard UI and the app code changes in later tasks depend on these backend changes being in place.

- [ ] **Step 1: Delete stranded user Ashley Franco**

1. Open https://supabase.com/dashboard/project/jvfjnwztbsybhnggrgdc/auth/users
2. Find `ashley.franco@c3bank.com` (or similar — search by first name)
3. Click the row → "Delete user" → confirm
4. Open https://supabase.com/dashboard/project/jvfjnwztbsybhnggrgdc/editor → select `user_profiles` table
5. If a corresponding row still exists (FK cascade may or may not handle it), delete it manually

- [ ] **Step 2: Delete stranded user Taylor Baumann**

Same as Step 1 but for `taylor.baumann@...`. Remove the auth.users row and any leftover user_profiles row.

- [ ] **Step 3: Run migration SQL**

Open Supabase SQL Editor: https://supabase.com/dashboard/project/jvfjnwztbsybhnggrgdc/sql/new

Paste and run this entire block:

```sql
-- 1. Add must_change_password flag to user_profiles
ALTER TABLE user_profiles
  ADD COLUMN must_change_password boolean NOT NULL DEFAULT false;

-- 2. Trigger function: auto-create user_profiles row on auth.users insert
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.user_profiles (id, email, role, display_name, must_change_password)
  VALUES (NEW.id, NEW.email, 'editor', NULL, true);
  RETURN NEW;
END;
$$;

-- 3. Trigger on auth.users insert
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 4. SECURITY DEFINER RPC: flip must_change_password to false for the calling user
CREATE OR REPLACE FUNCTION public.mark_password_changed()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.user_profiles
    SET must_change_password = false
    WHERE id = auth.uid();
END;
$$;

GRANT EXECUTE ON FUNCTION public.mark_password_changed() TO authenticated;
```

Expected: "Success. No rows returned." for each statement.

- [ ] **Step 4: Verify migration by creating a test user**

1. Dashboard → Authentication → Users → "Add user" → "Create new user"
2. Email: `test-onboarding@abpcapital.com`, Password: `TempPass2026!`, auto-confirm ON
3. Dashboard → Table Editor → `user_profiles`
4. Confirm a row exists for the test user with `role = 'editor'`, `must_change_password = true`
5. **Leave this test user in place** — Tasks 5 and 10 use it for smoke testing. Delete it at the end of the plan.

- [ ] **Step 5: Delete the invite-user edge function**

1. Dashboard → Edge Functions
2. Select `invite-user` → Delete → confirm

- [ ] **Step 6: Set minimum password length to 8**

1. Dashboard → Authentication → Sign In / Sign Up → Email section
2. Set "Minimum password length" to `8`
3. Save

- [ ] **Step 7: Add `/set-password` to Redirect URLs**

1. Dashboard → Authentication → URL Configuration
2. Add `https://cap-table-dashboard.vercel.app/set-password` to "Redirect URLs"
3. Add `http://localhost:3000/set-password` to "Redirect URLs" (for local dev)
4. Save

- [ ] **Step 8: Commit (no code changes yet, skip commit)**

Nothing to commit for this task. Move on to Task 2.

---

## Task 2: Update Supabase TypeScript Types

**Files:**
- Modify: `src/lib/supabase/types.ts`

The Database type must be updated to match the new column and RPC so TypeScript compiles after Task 3+.

- [ ] **Step 1: Add `must_change_password` to `user_profiles` Row/Insert/Update**

In [src/lib/supabase/types.ts](src/lib/supabase/types.ts), find the `user_profiles` section (starts at line 246). Update the three blocks:

```typescript
user_profiles: {
  Row: {
    created_at: string
    display_name: string | null
    email: string
    id: string
    must_change_password: boolean
    role: string
  }
  Insert: {
    created_at?: string
    display_name?: string | null
    email: string
    id: string
    must_change_password?: boolean
    role?: string
  }
  Update: {
    created_at?: string
    display_name?: string | null
    email?: string
    id?: string
    must_change_password?: boolean
    role?: string
  }
  Relationships: []
}
```

- [ ] **Step 2: Add `mark_password_changed` to the `Functions` block**

In the same file, find the `Functions:` block (around line 274, starts with `has_users`). Add the new RPC:

```typescript
Functions: {
  has_users: { Args: never; Returns: boolean }
  mark_password_changed: { Args: never; Returns: undefined }
  upsert_holding_delta: {
    // ... existing definition unchanged
  }
}
```

Preserve the existing `upsert_holding_delta` entry and the rest of the Functions block exactly as it was — only add the `mark_password_changed` line.

- [ ] **Step 3: Verify TypeScript still compiles**

Run: `npm run build`
Expected: Build succeeds with no TypeScript errors.

- [ ] **Step 4: Commit**

```bash
git add src/lib/supabase/types.ts
git commit -m "types: add must_change_password column and mark_password_changed RPC"
```

---

## Task 3: Expose `mustChangePassword` in AuthContext

**Files:**
- Modify: `src/context/AuthContext.tsx`

- [ ] **Step 1: Add `mustChangePassword` to `AuthState`**

Edit [src/context/AuthContext.tsx](src/context/AuthContext.tsx). Replace the `AuthState` interface and the default context value:

```typescript
interface AuthState {
  user: User | null;
  role: UserRole | null;
  displayName: string | null;
  mustChangePassword: boolean;
  loading: boolean;
}

const AuthContext = createContext<AuthState>({
  user: null,
  role: null,
  displayName: null,
  mustChangePassword: false,
  loading: true,
});
```

- [ ] **Step 2: Update `resolveAuthState` to read the flag**

Replace the existing `resolveAuthState` function:

```typescript
async function resolveAuthState(
  supabase: ReturnType<typeof createClient>,
): Promise<AuthState> {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user) {
      const { data } = await supabase
        .from("user_profiles")
        .select("role, display_name, must_change_password")
        .eq("id", user.id)
        .single();
      return {
        user,
        role: (data?.role as UserRole) ?? "editor",
        displayName: data?.display_name ?? user.email ?? null,
        mustChangePassword: data?.must_change_password ?? false,
        loading: false,
      };
    }
  } catch {
    // Treat any error as unauthenticated
  }
  return {
    user: null,
    role: null,
    displayName: null,
    mustChangePassword: false,
    loading: false,
  };
}
```

- [ ] **Step 3: Update `onAuthStateChange` handler**

In the `useEffect` block, replace the existing `setState` call inside the subscription. The new handler reads `must_change_password` and passes the value through:

```typescript
const {
  data: { subscription },
} = supabase.auth.onAuthStateChange(async (_event, session) => {
  if (session?.user) {
    const { data } = await supabase
      .from("user_profiles")
      .select("role, display_name, must_change_password")
      .eq("id", session.user.id)
      .single();
    setState({
      user: session.user,
      role: (data?.role as UserRole) ?? "editor",
      displayName: data?.display_name ?? session.user.email ?? null,
      mustChangePassword: data?.must_change_password ?? false,
      loading: false,
    });
  } else {
    setState({
      user: null,
      role: null,
      displayName: null,
      mustChangePassword: false,
      loading: false,
    });
  }
});
```

- [ ] **Step 4: Verify TypeScript compiles**

Run: `npm run build`
Expected: Build succeeds.

- [ ] **Step 5: Commit**

```bash
git add src/context/AuthContext.tsx
git commit -m "auth: expose mustChangePassword flag in AuthContext"
```

---

## Task 4: Add `markPasswordChanged` DAL helper + Update `getUserProfile`

**Files:**
- Modify: `src/lib/dal/auth.ts`

- [ ] **Step 1: Update `getUserProfile` to return `mustChangePassword`**

Edit [src/lib/dal/auth.ts](src/lib/dal/auth.ts). Replace the `getUserProfile` function:

```typescript
export async function getUserProfile(userId: string) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("user_profiles")
    .select("*")
    .eq("id", userId)
    .single();

  if (error) throw error;
  return {
    id: data.id,
    email: data.email,
    role: data.role as UserRole,
    displayName: data.display_name,
    mustChangePassword: data.must_change_password ?? false,
    createdAt: data.created_at,
  };
}
```

- [ ] **Step 2: Add `markPasswordChanged` helper**

Append to the end of [src/lib/dal/auth.ts](src/lib/dal/auth.ts):

```typescript
export async function markPasswordChanged(): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase.rpc("mark_password_changed");
  if (error) throw error;
}
```

- [ ] **Step 3: Add `markPasswordChanged` to the barrel (keep `inviteUser` for now)**

Edit [src/lib/dal/index.ts](src/lib/dal/index.ts). Replace the auth re-exports block. Note: `inviteUser` stays in the export list for now — it's still imported by `InviteUserModal` and `AppHeader`, which aren't deleted until Task 9. Removing it here would break the build:

```typescript
export {
  signIn,
  signOut,
  getCurrentUser,
  getUserProfile,
  markPasswordChanged,
  inviteUser,
} from "./auth";
```

- [ ] **Step 4: Verify TypeScript compiles**

Run: `npm run build`
Expected: Build succeeds.

- [ ] **Step 5: Commit**

```bash
git add src/lib/dal/auth.ts src/lib/dal/index.ts
git commit -m "dal: add markPasswordChanged RPC helper, expose mustChangePassword from getUserProfile"
```

---

## Task 5: Create `/set-password` Page

**Files:**
- Create: `src/app/set-password/page.tsx`

- [ ] **Step 1: Create the page file**

Create [src/app/set-password/page.tsx](src/app/set-password/page.tsx) with this content:

```typescript
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
      router.push("/");
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
```

- [ ] **Step 2: Verify build**

Run: `npm run build`
Expected: Build succeeds.

- [ ] **Step 3: Manual smoke test**

1. Run: `npm run dev`
2. Open http://localhost:3000/set-password without being logged in → should redirect to /login
3. Log in as the test user from Task 1 Step 4 (`test-onboarding@abpcapital.com`, temp password `TempPass2026!`)
4. After login lands on `/` (NOT yet redirected — Task 8 adds that), navigate manually to http://localhost:3000/set-password
5. Try to submit with a 5-char password → "Password must be at least 8 characters"
6. Try mismatched passwords → "Passwords don't match"
7. Try valid matching password (e.g. `NewPassword123`) → should redirect to `/`
8. Dashboard → Supabase Table Editor → user_profiles → confirm `must_change_password` is now `false` for the test user
9. Log out (use incognito or clear cookies), then log in as test user with the NEW password → should work

- [ ] **Step 4: Reset the test user for later tasks**

In Supabase SQL Editor, flip the flag back for the test user so it's still usable in later smoke tests:

```sql
UPDATE user_profiles SET must_change_password = true WHERE email = 'test-onboarding@abpcapital.com';
```

Also reset the test user's password back to `TempPass2026!` in Dashboard → Authentication → Users → edit user.

- [ ] **Step 5: Commit**

```bash
git add src/app/set-password/page.tsx
git commit -m "feat: add /set-password page for first-login and forgot-password flows"
```

---

## Task 6: Create `/forgot-password` Page

**Files:**
- Create: `src/app/forgot-password/page.tsx`

- [ ] **Step 1: Create the page file**

Create [src/app/forgot-password/page.tsx](src/app/forgot-password/page.tsx) with this content:

```typescript
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
```

- [ ] **Step 2: Verify build**

Run: `npm run build`
Expected: Build succeeds.

- [ ] **Step 3: Manual smoke test**

1. Run: `npm run dev`
2. Open http://localhost:3000/forgot-password
3. Enter your own email (the admin — so you actually receive the test)
4. Click "Send Reset Link" → should show the "If an account exists..." confirmation
5. Check your email for a Supabase password-reset message
6. Click the link → should land on http://localhost:3000/set-password with an active session
7. Enter a new password (8+ chars, matching) → should redirect to `/`
8. **Important:** reset your own password back to what it was in Supabase Dashboard so you don't lock yourself out

- [ ] **Step 4: Commit**

```bash
git add src/app/forgot-password/page.tsx
git commit -m "feat: add /forgot-password page using resetPasswordForEmail"
```

---

## Task 7: Add "Forgot Password?" Link on Login Page

**Files:**
- Modify: `src/app/login/page.tsx`

- [ ] **Step 1: Add the link below the Sign In button**

Edit [src/app/login/page.tsx](src/app/login/page.tsx). Find the submit button (around line 151-163) inside the form. Immediately after the closing `</button>` and before the closing `</form>`, add a "Forgot password?" link that only appears in login mode (not setup):

```typescript
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
```

- [ ] **Step 2: Verify build and smoke test**

1. Run: `npm run build` → expected: success
2. Run: `npm run dev`
3. Open http://localhost:3000/login (as a logged-out user)
4. Confirm "Forgot password?" link appears below the Sign In button
5. Click it → should navigate to `/forgot-password`

- [ ] **Step 3: Commit**

```bash
git add src/app/login/page.tsx
git commit -m "feat: add forgot password link on login page"
```

---

## Task 8: Redirect to `/set-password` When `mustChangePassword` Is True

**Files:**
- Modify: `src/app/(dashboard)/layout.tsx`

- [ ] **Step 1: Add the redirect**

Replace the entire contents of [src/app/(dashboard)/layout.tsx](src/app/(dashboard)/layout.tsx):

```typescript
"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { DashboardProvider } from "@/context/DashboardContext";
import { useAuth } from "@/context/AuthContext";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { loading: authLoading, user, mustChangePassword } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!authLoading && user && mustChangePassword) {
      router.replace("/set-password");
    }
  }, [authLoading, user, mustChangePassword, router]);

  if (authLoading || (user && mustChangePassword)) {
    return (
      <div className="flex flex-col flex-1 min-h-screen bg-surface items-center justify-center">
        <div className="w-8 h-8 border-2 border-trust-blue/30 border-t-trust-blue rounded-full animate-spin" />
      </div>
    );
  }

  return <DashboardProvider>{children}</DashboardProvider>;
}
```

The `user && mustChangePassword` check in the loading condition prevents a flash of dashboard content before the redirect effect fires.

- [ ] **Step 2: Verify build**

Run: `npm run build`
Expected: Build succeeds.

- [ ] **Step 3: End-to-end smoke test**

This is the critical test for the full flow.

1. Ensure the test user `test-onboarding@abpcapital.com` has:
   - `must_change_password = true` in user_profiles (re-run the UPDATE SQL from Task 5 Step 4 if needed)
   - Password `TempPass2026!` (reset in Supabase Dashboard if changed)
2. Run: `npm run dev`
3. Open http://localhost:3000 in an incognito window
4. Should land on `/login`
5. Sign in as `test-onboarding@abpcapital.com` / `TempPass2026!`
6. **Expected:** immediately redirected to `/set-password` (not `/`)
7. Set a new password → should land on `/`
8. Dashboard loads normally (cap table visible)
9. Log out, log back in with the new password → should go straight to `/` (no set-password redirect)

If all 9 steps pass, the full onboarding flow is working.

- [ ] **Step 4: Commit**

```bash
git add src/app/(dashboard)/layout.tsx
git commit -m "feat: redirect to /set-password when must_change_password flag is true"
```

---

## Task 9: Remove the Old Invite Infrastructure

**Files:**
- Modify: `src/components/layout/AppHeader.tsx`
- Modify: `src/lib/dal/auth.ts`
- Modify: `src/lib/dal/index.ts`
- Delete: `src/components/modals/InviteUserModal.tsx`
- Delete: `src/app/auth/callback/route.ts`

- [ ] **Step 1: Remove invite UI from AppHeader**

Edit [src/components/layout/AppHeader.tsx](src/components/layout/AppHeader.tsx).

1. Remove the import at the top:
   ```typescript
   import { InviteUserModal } from "@/components/modals/InviteUserModal";
   ```
2. Remove the state variable (around line 15):
   ```typescript
   const [inviteOpen, setInviteOpen] = useState(false);
   ```
3. Remove the "Invite user" button (the `role === "admin"` conditional block, around lines 124-134):
   ```typescript
   {role === "admin" && (
     <button
       onClick={() => {
         setMenuOpen(false);
         setInviteOpen(true);
       }}
       ...
     >
       Invite user
     </button>
   )}
   ```
4. Remove the `<InviteUserModal ... />` line at the bottom (around line 148).
5. Remove the outer React fragment (`<>` / `</>`) since `<header>` is now the only top-level element. The return becomes:
   ```typescript
   return (
     <header className="h-14 bg-navy flex items-center px-4 md:px-5 gap-3 md:gap-4 shrink-0">
       {/* ... existing content ... */}
     </header>
   );
   ```

- [ ] **Step 2: Delete `InviteUserModal.tsx`**

```bash
rm src/components/modals/InviteUserModal.tsx
```

- [ ] **Step 3: Remove `inviteUser` from DAL**

Edit [src/lib/dal/auth.ts](src/lib/dal/auth.ts). Delete:
- The `InviteResult` interface (around lines 50-53)
- The entire `inviteUser` function (around lines 55-93)

The file should now export only: `signIn`, `signOut`, `getCurrentUser`, `getUserProfile`, `markPasswordChanged`.

- [ ] **Step 4: Remove `inviteUser` from barrel export**

Edit [src/lib/dal/index.ts](src/lib/dal/index.ts). Replace the auth exports block with the final version:

```typescript
export {
  signIn,
  signOut,
  getCurrentUser,
  getUserProfile,
  markPasswordChanged,
} from "./auth";
```

- [ ] **Step 5: Delete `/auth/callback` route**

```bash
rm src/app/auth/callback/route.ts
```

If the `src/app/auth/callback/` or `src/app/auth/` directory is now empty, remove it:

```bash
rmdir src/app/auth/callback 2>/dev/null
rmdir src/app/auth 2>/dev/null
```

- [ ] **Step 6: Verify build**

Run: `npm run build`
Expected: Build succeeds. If any errors reference `inviteUser`, `InviteUserModal`, or `InviteResult`, grep for the leftover reference and remove it:

```bash
grep -rn "inviteUser\|InviteUserModal\|InviteResult\|auth/callback" src/
```

Expected: no matches (other than unrelated auth-related code, if any).

- [ ] **Step 7: Smoke test — admin still works**

1. Run: `npm run dev`
2. Log in as yourself (admin)
3. Open the user menu (avatar in top-right)
4. Confirm: no "Invite user" button appears
5. Sign Out still works
6. Dashboard loads normally

- [ ] **Step 8: Commit**

```bash
git add src/components/layout/AppHeader.tsx src/lib/dal/auth.ts src/lib/dal/index.ts
git add -u  # picks up the deletions
git commit -m "refactor: remove InviteUserModal, inviteUser DAL, auth/callback route"
```

---

## Task 10: Final End-to-End Verification + Cleanup

**Files:** None (verification only)

- [ ] **Step 1: Delete the test user from Supabase**

1. Dashboard → Authentication → Users → find `test-onboarding@abpcapital.com`
2. Delete the user
3. Verify the `user_profiles` row is gone (manually delete if FK didn't cascade)

- [ ] **Step 2: Full onboarding flow with a fresh user**

1. Dashboard → Authentication → Users → Add user:
   - Email: `final-test@abpcapital.com`
   - Password: `FinalTest2026!`
   - Auto Confirm User: ON
2. Verify in Table Editor that a `user_profiles` row exists with `role = 'editor'`, `must_change_password = true`
3. Open http://localhost:3000 in an incognito window
4. Sign in with the new credentials
5. **Expected:** redirected to `/set-password`
6. Enter new password `MyRealPassword123` (twice) → expected: redirected to `/`
7. Verify `must_change_password` is now `false` in Table Editor
8. Sign out
9. Sign back in with `MyRealPassword123` → goes straight to dashboard

- [ ] **Step 3: Forgot-password flow end-to-end**

1. Sign out
2. Click "Forgot password?" on login page
3. Enter `final-test@abpcapital.com` → submit
4. **Note:** the reset email goes to the actual email address — if `final-test@abpcapital.com` isn't real, you won't receive it. For a real e2e test, use an email you control.
5. If email arrives: click the link → lands on `/set-password` → enter new password → redirects to `/`

- [ ] **Step 4: Clean up final test user**

Delete `final-test@abpcapital.com` from Supabase Dashboard.

- [ ] **Step 5: Deploy to Vercel (push to main)**

```bash
git push origin main
```

Wait for Vercel auto-deploy. Once live at https://cap-table-dashboard.vercel.app, repeat Task 10 Step 2 against production (with a throwaway test user) to confirm the prod URL flow works end-to-end, including the redirect URL allowlist entries added in Task 1 Step 7.

- [ ] **Step 6: Update CLAUDE.md**

Mark the invite-user bug as resolved in [CLAUDE.md](CLAUDE.md) "Known Issues" section. Add a "Completed Features (Phase 6)" section describing the new onboarding flow. Move the "build set-password flow" item out of "Next Steps."

- [ ] **Step 7: Final commit**

```bash
git add CLAUDE.md
git commit -m "docs: mark invite-user bug resolved, document Phase 6 onboarding flow"
git push origin main
```

---

## Done Criteria

- [ ] Invite button no longer visible in user menu
- [ ] New users created via Supabase Dashboard get a `user_profiles` row automatically with `must_change_password = true`
- [ ] Signing in with a temp password redirects to `/set-password`
- [ ] Setting a new password flips the flag and returns the user to `/`
- [ ] Subsequent logins skip `/set-password`
- [ ] Forgot-password link on login page triggers reset email
- [ ] Reset email link lands on `/set-password` with an active session
- [ ] Admin (Ryan) is unaffected — his existing `must_change_password` defaults to `false`
- [ ] `npm run build` passes
- [ ] Deployed to Vercel and verified in production

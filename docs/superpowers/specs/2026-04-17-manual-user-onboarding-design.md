# Manual User Onboarding — Design Spec

**Date:** 2026-04-17
**Status:** Approved
**Replaces:** The in-app invite flow (InviteUserModal + `invite-user` edge function + `generateLink({ type: "invite" })`), which has never reliably let invited colleagues sign in a second time — `generateLink` creates accounts with no password, and there's no UI to set one.

## Goal

Let Ryan onboard 5-7 colleagues to the Cap Table Dashboard reliably, without any in-app invite tooling and without depending on Supabase's invite/SMTP plumbing.

## Approach

Onboarding moves out of the app entirely:

1. Ryan creates users directly in Supabase Dashboard (Authentication → Users → Add user) with a temp password.
2. A database trigger auto-creates the matching `user_profiles` row with `role = 'editor'` and `must_change_password = true`.
3. Ryan sends the colleague the login URL + email + temp password via whatever channel he prefers.
4. On first login, the app detects `must_change_password = true` and redirects to a new `/set-password` page, where the colleague chooses their own password. The flag flips to `false` on success.
5. A new "Forgot password?" link on the login page calls `resetPasswordForEmail`, which also lands the user on `/set-password` (same form, reused).

The invite button, `InviteUserModal`, `inviteUser()` DAL function, `invite-user` edge function, and `/auth/callback` route are all deleted.

## Database Changes

One migration, run in Supabase SQL Editor:

```sql
-- 1. Add the flag to user_profiles
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
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 4. SECURITY DEFINER RPC: flip must_change_password to false for the
-- calling user. Used by the client after successful updateUser(). We use
-- an RPC instead of an RLS UPDATE policy because a broad update policy
-- would let users escalate their own role from 'editor' to 'admin'.
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

Notes:
- Default on `must_change_password` is `false` so Ryan's existing admin row is unaffected.
- The trigger overrides that default to `true` on every new insert, so newly-added users always land in "must change" mode.
- No new RLS policy is added for `user_profiles` updates. The `mark_password_changed` RPC is the only path by which a user's own profile row changes, and it only touches the `must_change_password` column. Role promotions remain admin-only (via Supabase Table Editor).
- If admin rows need to be promoted, Ryan edits the row in Supabase Table Editor (one-off, rare).

## Application Changes

### New: `/set-password` page (`src/app/set-password/page.tsx`)

Client component. Simple form:

- **New Password** (min 8 chars, required)
- **Confirm Password** (must match, required)
- Submit button with loading state
- Inline error text on validation failure

Submit handler:

1. Client-side validation: both fields required, must match, min 8.
2. Call `supabase.auth.updateUser({ password })`.
3. On success, update the user's `user_profiles` row: `must_change_password = false`.
4. Redirect to `/`.
5. On failure, show error inline (same visual pattern as login page).

Used in two flows: first-login after admin creates the user, and after a forgot-password reset email. In both cases the user arrives signed-in, so `updateUser` works without a separate re-auth step.

### New: `/forgot-password` page (`src/app/forgot-password/page.tsx`)

Client component. Simple form:

- **Email** (required)
- Submit → calls `supabase.auth.resetPasswordForEmail(email, { redirectTo: `${window.location.origin}/set-password` })`.
- On success, shows "If an account exists for that email, you'll receive a reset link shortly." (Don't leak whether the email is registered.)
- On failure, show inline error.

### Modified: login page (`src/app/login/page.tsx`)

- Add a **"Forgot password?"** link below the Sign In button. Links to `/forgot-password`.
- No other UX changes.

### Modified: `AuthContext` (`src/context/AuthContext.tsx`)

Extend the context state to include `mustChangePassword: boolean` (read from `user_profiles.must_change_password` alongside `role` and `displayName`).

### Modified: `(dashboard)/layout.tsx`

After auth loads and before rendering `DashboardProvider`, check `mustChangePassword`. If `true`, redirect to `/set-password` client-side (via `useRouter().replace`). This keeps middleware simple — the redirect happens once, at the top of the authenticated app tree.

### Modified: `AppHeader` (`src/components/layout/AppHeader.tsx`)

- Remove the "Invite user" button.
- Remove the import of `InviteUserModal` and any invite-related state.

### Deleted files / code

- `src/components/modals/InviteUserModal.tsx`
- `inviteUser()` function and `InviteResult` type in `src/lib/dal/auth.ts`
- Invite button + its modal wiring in `AppHeader.tsx`
- `src/app/auth/callback/route.ts` — no longer needed. Forgot-password links use `redirectTo = /set-password` directly and Supabase's detected session works without a custom callback.

### Data Access Layer updates (`src/lib/dal/auth.ts`)

- Delete `inviteUser()` and `InviteResult`.
- `getUserProfile()` already returns the full row; update the return type to include `mustChangePassword: boolean`.
- Add a small helper `markPasswordChanged()` that calls the `mark_password_changed` Supabase RPC — called from `/set-password` submit handler after `updateUser` succeeds. No `userId` parameter needed; the RPC uses `auth.uid()` server-side.

## Supabase Dashboard Actions (Manual)

These are one-time, run by Ryan:

1. Delete existing stranded users:
   - **Ashley Franco** — remove from Authentication → Users
   - **Taylor Baumann** — remove from Authentication → Users
   - Corresponding `user_profiles` rows should cascade-delete via FK; if not, delete manually from Table Editor.
2. Run the migration SQL in Supabase SQL Editor.
3. Delete the `invite-user` edge function.
4. Set **Authentication → Providers → Email → Minimum password length** to `8`.
5. Verify **Authentication → URL Configuration** includes `https://abpcaptabledashboard.vercel.app/set-password` in Redirect URLs (so forgot-password reset links work).

## User Flows

### Flow 1: First-time onboarding

1. Ryan: Supabase Dashboard → Add user (`jane@c3bank.com`, temp password `TempPass2026!`)
2. Trigger fires → `user_profiles` row created with `must_change_password = true`
3. Ryan texts Jane: "abpcaptabledashboard.vercel.app — email jane@c3bank.com — temp password TempPass2026! — you'll set your own password on first login"
4. Jane opens the URL, enters credentials, clicks Sign In
5. `AuthContext` loads her profile; `(dashboard)/layout.tsx` sees `mustChangePassword = true` → redirects to `/set-password`
6. Jane enters new password twice, clicks Submit
7. `updateUser({ password })` succeeds; `markPasswordChanged` flips flag; redirect to `/`
8. Jane is in. All future logins skip `/set-password`.

### Flow 2: Forgot password

1. Jane forgets her password, opens login page, clicks "Forgot password?"
2. `/forgot-password` — enters email, submits
3. Supabase sends reset email via default SMTP
4. Jane clicks the link → lands on `/set-password` with an active session
5. Same set-password form as first-login. New password → redirect to `/`.

### Flow 3: Reset email doesn't arrive

1. Jane tells Ryan she didn't get the email.
2. Ryan opens Supabase Dashboard → Authentication → Users → Jane → edit user → set new temp password
3. Ryan manually flips `must_change_password = true` in the `user_profiles` table (via Table Editor).
4. Back to Flow 1 step 3.

## Testing Plan

Manual verification after implementation:

- [ ] Create a test user in Supabase Dashboard. Confirm `user_profiles` row is created with `role = 'editor'`, `must_change_password = true`.
- [ ] Log in as test user with temp password. Confirm redirect to `/set-password`.
- [ ] Submit mismatched passwords — confirm inline error.
- [ ] Submit password shorter than 8 chars — confirm inline error.
- [ ] Submit valid password — confirm redirect to `/` and that `must_change_password` is now `false` in Supabase Table Editor.
- [ ] Log out and log back in with new password — confirm no `/set-password` redirect.
- [ ] Click "Forgot password?" — confirm email sends and link lands on `/set-password`.
- [ ] Delete test user from Supabase Dashboard — confirm `user_profiles` row is also removed (cascade or manual).
- [ ] Admin user (Ryan) — confirm no `/set-password` redirect on his existing account.

## Out of Scope

- "Change password" option in the user menu for already-onboarded users. Users who want to rotate their password sign out and use forgot-password. Revisit only if someone asks.
- Email verification on account creation. Temp password IS the verification — only Ryan can hand it out.
- Self-serve sign-up. Every account is admin-created.
- Multi-factor auth. Revisit if the data sensitivity warrants it later.

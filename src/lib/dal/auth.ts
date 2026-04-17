import { createClient } from "@/lib/supabase/client";
import type { UserRole } from "@/data/types";

export async function signIn(email: string, password: string) {
  const supabase = createClient();
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  if (error) throw error;
  return data;
}

export async function signOut() {
  const supabase = createClient();
  // scope: 'local' clears only this browser's session cookies — no network
  // call. The global default tries to revoke the refresh token server-side,
  // which can hang or fail when the session is already stale and leaves the
  // user unable to sign out.
  const { error } = await supabase.auth.signOut({ scope: "local" });
  if (error) throw error;
}

export async function getCurrentUser() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}

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

export interface InviteResult {
  inviteUrl: string;
  isExisting: boolean;
}

export async function inviteUser(
  email: string,
  role: UserRole,
  displayName?: string
): Promise<InviteResult> {
  const supabase = createClient();

  // Pass the current site URL so the generated link redirects to this
  // deployment (works in local dev, preview, and prod without config).
  const siteUrl =
    typeof window !== "undefined" ? window.location.origin : undefined;

  const { data, error } = await supabase.functions.invoke("invite-user", {
    body: { email, role, displayName, siteUrl },
  });

  if (error) {
    // FunctionsHttpError stores the parsed response body in .context
    const ctx = (error as { context?: unknown }).context;
    const detail =
      typeof ctx === "object" && ctx !== null && "error" in ctx
        ? (ctx as { error: string }).error
        : null;
    throw new Error(detail || error.message || "Failed to invite user");
  }

  if (data?.error) {
    throw new Error(data.error);
  }

  if (!data?.inviteUrl) {
    throw new Error("Invite link not returned by server");
  }

  return {
    inviteUrl: data.inviteUrl as string,
    isExisting: !!data.isExisting,
  };
}

export async function markPasswordChanged(): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase.rpc("mark_password_changed");
  if (error) throw error;
}

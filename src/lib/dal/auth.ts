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
    createdAt: data.created_at,
  };
}

export async function inviteUser(
  email: string,
  role: UserRole,
  displayName?: string
) {
  const supabase = createClient();

  const { data, error } = await supabase.functions.invoke("invite-user", {
    body: { email, role, displayName },
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
}

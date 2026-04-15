"use client";

import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { createClient } from "@/lib/supabase/client";
import type { User } from "@supabase/supabase-js";
import type { UserRole } from "@/data/types";

interface AuthState {
  user: User | null;
  role: UserRole | null;
  displayName: string | null;
  loading: boolean;
}

const AuthContext = createContext<AuthState>({
  user: null,
  role: null,
  displayName: null,
  loading: true,
});

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
        .select("role, display_name")
        .eq("id", user.id)
        .single();
      return {
        user,
        role: (data?.role as UserRole) ?? "editor",
        displayName: data?.display_name ?? user.email ?? null,
        loading: false,
      };
    }
  } catch {
    // Treat any error as unauthenticated
  }
  return { user: null, role: null, displayName: null, loading: false };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({
    user: null,
    role: null,
    displayName: null,
    loading: true,
  });
  const initRef = useRef(false);

  // Start auth check eagerly on first client-side render. React 19 + Next.js 16
  // sometimes fails to flush passive effects (useEffect) after hydrating
  // statically-prerendered pages, so we can't rely on useEffect alone for the
  // initial getUser() call. The promise-based approach runs regardless of
  // React's effect scheduling.
  if (typeof window !== "undefined" && !initRef.current) {
    initRef.current = true;
    const supabase = createClient();
    resolveAuthState(supabase).then(setState);
  }

  // Subscribe to auth state changes (login, logout, token refresh).
  // This runs in useEffect so the subscription is properly cleaned up.
  useEffect(() => {
    const supabase = createClient();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session?.user) {
        const { data } = await supabase
          .from("user_profiles")
          .select("role, display_name")
          .eq("id", session.user.id)
          .single();
        setState({
          user: session.user,
          role: (data?.role as UserRole) ?? "editor",
          displayName: data?.display_name ?? session.user.email ?? null,
          loading: false,
        });
      } else {
        setState({ user: null, role: null, displayName: null, loading: false });
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  return <AuthContext.Provider value={state}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}

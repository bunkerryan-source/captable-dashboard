"use client";

import {
  createContext,
  useContext,
  useEffect,
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

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({
    user: null,
    role: null,
    displayName: null,
    loading: true,
  });

  useEffect(() => {
    const supabase = createClient();

    // Get initial session
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (user) {
        const { data } = await supabase
          .from("user_profiles")
          .select("role, display_name")
          .eq("id", user.id)
          .single();
        setState({
          user,
          role: (data?.role as UserRole) ?? "editor",
          displayName: data?.display_name ?? user.email ?? null,
          loading: false,
        });
      } else {
        setState({ user: null, role: null, displayName: null, loading: false });
      }
    });

    // Listen for auth state changes (login, logout, token refresh)
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

import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "./types";

export function createClient() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      auth: {
        // Bypass the Web Locks API. Supabase GoTrue uses navigator.locks to
        // coordinate token refresh across tabs, but orphaned locks (from
        // interrupted navigations or tab crashes) hang getUser() indefinitely.
        // For a small-user app this coordination is unnecessary.
        lock: async (_name, _acquireTimeout, fn) => await fn(),
      },
    }
  );
}

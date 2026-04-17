import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

/**
 * Deletes all Supabase auth cookies on the given response. Called when
 * the session is broken (bad refresh token, malformed cookie, etc.) so
 * the browser stops sending stuck cookies on every subsequent request.
 */
function clearSupabaseCookies(
  request: NextRequest,
  response: NextResponse
): void {
  for (const cookie of request.cookies.getAll()) {
    if (cookie.name.startsWith("sb-")) {
      response.cookies.set(cookie.name, "", {
        maxAge: 0,
        path: "/",
      });
    }
  }
}

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  try {
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll();
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value }) =>
              request.cookies.set(name, value)
            );
            supabaseResponse = NextResponse.next({ request });
            cookiesToSet.forEach(({ name, value, options }) =>
              supabaseResponse.cookies.set(name, value, options)
            );
          },
        },
      }
    );

    // Refresh the session — this is critical for keeping the auth token alive.
    // Wrapped in try/catch: if getUser() throws (corrupt cookies, network
    // error), treat the user as unauthenticated AND clear the bad cookies so
    // the browser doesn't keep resending them on every request.
    let user = null;
    let authFailed = false;
    try {
      const { data, error } = await supabase.auth.getUser();
      user = data.user;
      // getUser returns an error (rather than throwing) for things like
      // "Invalid Refresh Token". Treat this as a broken session too.
      if (error) authFailed = true;
    } catch {
      authFailed = true;
    }

    // Redirect unauthenticated users to /login. Exceptions:
    // - /login itself
    // - /forgot-password: user needs to reach it before signing in
    // - /set-password: the password-reset link from email lands here
    //   with a recovery-token session that middleware doesn't see yet;
    //   bouncing it to /login would break the reset flow
    if (
      !user &&
      !request.nextUrl.pathname.startsWith("/login") &&
      !request.nextUrl.pathname.startsWith("/forgot-password") &&
      !request.nextUrl.pathname.startsWith("/set-password")
    ) {
      const url = request.nextUrl.clone();
      url.pathname = "/login";
      const redirectResponse = NextResponse.redirect(url);
      // Carry over cookie updates from the session refresh — without this,
      // stale/expired auth cookies survive the redirect and the browser
      // gets stuck sending them on every subsequent request.
      supabaseResponse.cookies.getAll().forEach((cookie) => {
        redirectResponse.cookies.set(cookie.name, cookie.value, cookie);
      });
      // If auth actually failed (corrupt/expired token), proactively clear
      // the sb-* cookies so the browser stops sending them. This prevents
      // the "clear site data to load the site" failure mode.
      if (authFailed) {
        clearSupabaseCookies(request, redirectResponse);
      }
      return redirectResponse;
    }

    // Redirect authenticated users away from /login
    if (user && request.nextUrl.pathname.startsWith("/login")) {
      const url = request.nextUrl.clone();
      url.pathname = "/";
      const redirectResponse = NextResponse.redirect(url);
      supabaseResponse.cookies.getAll().forEach((cookie) => {
        redirectResponse.cookies.set(cookie.name, cookie.value, cookie);
      });
      return redirectResponse;
    }

    // On /login, /forgot-password, or /set-password with a failed
    // session, strip bad cookies so these pages aren't fighting broken
    // state.
    if (authFailed) {
      clearSupabaseCookies(request, supabaseResponse);
    }

    return supabaseResponse;
  } catch {
    // If anything in the middleware throws (corrupt cookies, Supabase client
    // creation failure, etc.), redirect to login and nuke the auth cookies.
    if (
      request.nextUrl.pathname.startsWith("/login") ||
      request.nextUrl.pathname.startsWith("/forgot-password") ||
      request.nextUrl.pathname.startsWith("/set-password")
    ) {
      clearSupabaseCookies(request, supabaseResponse);
      return supabaseResponse;
    }
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    const redirectResponse = NextResponse.redirect(url);
    clearSupabaseCookies(request, redirectResponse);
    return redirectResponse;
  }
}

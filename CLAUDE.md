# ABP Cap Table Dashboard

## What This Is

Web-based cap table dashboard for ABP Capital. Tracks equity ownership across ~20-30 legal entities with a complete audit trail of transactions (gifts, sales, redemptions, transfers, issuances, corrections). Replaces spreadsheet-based tracking.

**Current phase:** Phase 7 complete — holdings are now rebuilt from the transaction log on every edit or delete (server-side RPC), so the cap table always matches what's in the change log. Prior phases still in place: manual user onboarding, historical snapshots, CSV export, file attachments (add on edit too), rich change log, holder detail sidebar, cap table sorted by position, and auth-resilient middleware that clears broken cookies automatically.

## Deployment

| Service | URL / ID |
|---|---|
| Live site | https://abpcaptabledashboard.vercel.app (old `cap-table-dashboard.vercel.app` redirects) |
| GitHub repo | https://github.com/bunkerryan-source/captable-dashboard |
| Vercel project | `cap-table-dashboard` (team: `team_cvOrlfMiLR7nAdZryqer1lEn`) |
| Supabase project | `jvfjnwztbsybhnggrgdc` (us-west-1) |

Pushes to `main` *should* trigger auto-deploy on Vercel. As of 2026-04-17 the GitHub App ↔ Vercel integration stopped firing — pushes land on GitHub but no deployment is created. Manual deploy via Vercel CLI (`npx vercel --prod --yes` from project root, uses local auth at `%APPDATA%/com.vercel.cli/Data/auth.json`) still works and is the fallback. To restore auto-deploy: Vercel project → Settings → Git → Disconnect then Reconnect to same repo (re-registers the GitHub App's event subscription). GitHub App is installed and set to "All repos"; this isn't a permissions problem, the App's event subscription for this project is stale.

## Tech Stack

| Layer | Choice |
|---|---|
| Framework | Next.js 16 (App Router) |
| Language | TypeScript (strict) |
| Styling | Tailwind CSS v4 (`@theme inline` in globals.css) |
| Font | Outfit via `next/font/google` |
| State | React Context + `useReducer` |
| URL State | `useSearchParams()` for entity selection (`?entity=<id>`) |
| Database | Supabase (Postgres + RLS) |
| Auth | Supabase Auth (email/password) |
| Hosting | Vercel |

## Commands

```bash
npm run dev      # Start dev server (default port 3000)
npm run build    # Production build — also runs TypeScript check
npm run lint     # ESLint
```

## Project Structure

```
src/
├── app/
│   ├── layout.tsx               # Root: Outfit font, AuthProvider
│   ├── globals.css              # Tailwind v4 @theme design tokens
│   ├── login/page.tsx           # Login page (also handles first-user setup)
│   ├── forgot-password/page.tsx # Send password reset email via Supabase
│   ├── set-password/page.tsx    # First-login forced password change + reset-email landing
│   └── (dashboard)/
│       ├── layout.tsx           # Gates DashboardProvider; redirects to /set-password if flag is set
│       └── page.tsx             # Main dashboard page (loading/error/empty/data states)
├── components/
│   ├── layout/                  # AppHeader (user menu), EntitySelector,
│   │                            # FooterBar, MobileEntityBar
│   ├── dashboard/               # MetadataRow, CapTable
│   ├── changelog/               # ChangeLogPanel, ChangeLogEntry, ChangeLogFilters,
│   │                            # TransactionBadge (entries show rich transaction summaries)
│   ├── holder-detail/           # HolderDetailPanel (sliding sidebar for holder transactions)
│   ├── modals/                  # ModalShell, RecordTransactionModal, AddHolderModal,
│   │   │                        # EntitySetupModal, EntitySettingsModal
│   │   └── transaction-fields/  # GiftFields, SaleFields, RedemptionFields, etc.
│   └── ui/                      # Button, Input, Select, Textarea, Toggle, Badge,
│                                # PillSelector, FileUploadZone, Backdrop
├── context/
│   ├── AuthContext.tsx           # Auth state: user, role, displayName, mustChangePassword, loading
│   └── DashboardContext.tsx      # App data state, reducer, fetches from Supabase on mount
├── hooks/
│   ├── useSelectedEntity.ts     # URL param → entity + holdings + transactions
│   ├── useModal.ts              # Modal open/close
│   └── useChangeLog.ts          # Filtered transaction log
├── data/
│   ├── types.ts                 # All TS interfaces
│   └── mock-*.ts                # Legacy mock data (can be deleted)
├── lib/
│   ├── supabase/
│   │   ├── client.ts            # Browser client via createBrowserClient()
│   │   ├── server.ts            # Server client for middleware
│   │   ├── middleware.ts         # Session refresh + auth redirects
│   │   └── types.ts             # Auto-generated Database types from Supabase
│   ├── dal/                     # Data Access Layer
│   │   ├── index.ts             # Barrel export
│   │   ├── mappers.ts           # snake_case ↔ camelCase converters
│   │   ├── entities.ts          # fetchEntitiesWithClasses, addEntity, updateEntity
│   │   ├── holders.ts           # fetchHolders, addHolder
│   │   ├── holdings.ts          # fetchHoldings, upsertHoldings, upsertHoldingsDelta
│   │   ├── transactions.ts      # fetchTransactionsWithAttachments, recordTransaction
│   │   └── auth.ts              # signIn, signOut, getCurrentUser, getUserProfile
│   ├── formatters.ts            # Number/percent/currency/date formatting
│   ├── formatTransactionSummary.ts # Human-readable summaries + holder transaction filter
│   ├── computeTotals.ts         # Column summation for totals row
│   └── constants.ts             # Transaction type configs, entity type labels
└── middleware.ts                 # Next.js middleware: session refresh, auth redirects
```

## Database Schema (Supabase)

7 tables with RLS enabled. All data tables allow SELECT/INSERT/UPDATE for `authenticated` role. Uses `numeric` for financial amounts (no floating-point rounding).

- `entities` — legal entities with equity model, formation details
- `equity_classes` — classes per entity (FK → entities, CASCADE)
- `holders` — people/entities that hold equity
- `holdings` — join table: holder × equity_class with amount/committed_capital
- `transactions` — audit trail with type, date, metadata (jsonb)
- `transaction_attachments` — files linked to transactions
- `user_profiles` — links auth.users to app roles (admin/editor) and `must_change_password` flag

**RPC functions:**
- `upsert_holding_delta(p_entity_id, p_holder_id, p_equity_class_id, p_amount_delta, p_committed_capital?, p_holder_role?)` — Atomic upsert that adds `p_amount_delta` to existing holding amount (or inserts if new). Uses `COALESCE` to preserve existing `committed_capital` and `holder_role` when not provided. Used only by the create-transaction path.
- `rebuild_entity_holdings(p_entity_id)` — Atomically recomputes all holdings for an entity by deleting its holdings and replaying every transaction for that entity (chronological). Called on edit and delete so the cap table is always derived from the transaction log. Idempotent: running it against the current DB produces identical holdings.
- `has_users()` — Returns boolean, used during first-user setup flow.

**Triggers:**
- `on_auth_user_created` on `auth.users` INSERT → `handle_new_user()` auto-creates the `user_profiles` row with `role = 'editor'` and `must_change_password = true` whenever an admin adds a user in Supabase Dashboard.
- `on_auth_user_password_change` on `auth.users` UPDATE → `handle_password_change()` flips `must_change_password = false` on the matching `user_profiles` row whenever `encrypted_password` changes. This is the mechanism that clears the flag — clients do not write to the flag directly.

## Auth Architecture

- **Roles:** `admin` (full access, can edit/delete transactions), `editor` (full data access, no admin-only operations).
- **Onboarding (manual, no in-app invite):** Admin creates users directly in Supabase Dashboard → Authentication → Users with a temp password. The `on_auth_user_created` trigger immediately populates `user_profiles` with `role = 'editor'` and `must_change_password = true`. Admin delivers the URL + email + temp password to the user over whatever channel. On first sign-in, the dashboard layout detects the flag and redirects to `/set-password`.
- **Set-password flow:** `/set-password` bypasses `supabase.auth.updateUser` (which hangs on its post-success session refresh under `@supabase/ssr`) and PUTs directly to the Supabase Auth REST API at `/auth/v1/user` with the current session's access token. The `on_auth_user_password_change` trigger flips `must_change_password = false` server-side when `auth.users.encrypted_password` actually changes — clients never touch the flag. On success, the page does `window.location.href = "/"` (full reload, not `router.push`) so `AuthContext` reinitializes with the fresh `user_profiles` row instead of cached React state.
- **Forgot-password flow:** `/forgot-password` calls `supabase.auth.resetPasswordForEmail` with `redirectTo = <origin>/set-password`. The email-delivered link lands the user on `/set-password` with a recovery session; the same trigger flips the flag if the user chooses a new password.
- **Middleware allowlist:** `/login`, `/forgot-password`, and `/set-password` are accessible without a session. Everything else redirects unauthenticated users to `/login`. Authenticated users visiting `/login` get bounced to `/`.
- **Dashboard gate:** `(dashboard)/layout.tsx` waits for `useAuth().loading === false` before mounting `DashboardProvider`. If `mustChangePassword === true`, it redirects to `/set-password` before any data fetches. This keeps RLS-behind-stale-session empty-query bugs away.
- **Sign out:** `signOut({ scope: 'local' })` clears local cookies only (no server roundtrip, so it works when the session is stale). `AppHeader.handleSignOut` follows with `window.location.href = '/login'` to force a full reload and reset all client state. **Note: this still isn't reliably working — see Known Issues.**
- **Auth resilience:** `AuthContext` starts `getUser()` during render (with a `useRef` one-shot guard), not in `useEffect`, because React 19 + Next.js 16 sometimes fails to flush passive effects after hydrating statically-prerendered pages. `onAuthStateChange` stays in `useEffect` for proper cleanup. The browser client bypasses the Web Locks API (`lock: fn => fn()`) to prevent orphaned locks from hanging `getUser()`.
- **Cookie hygiene in middleware:** When `getUser()` fails, middleware proactively deletes all `sb-*` cookies on the response — fixes the "must clear site data to load the site" failure mode where the browser keeps resending broken tokens.
- **Admin transaction management:** Admins can edit and delete transactions from the change log. Edit opens the RecordTransactionModal pre-populated with existing data. Delete shows an inline confirmation.
- **Add Holder from transaction form:** When "+ Add new holder..." is selected in any holder dropdown within the Record Transaction modal, an inline mini-form appears (name + type). On submit, the new holder is created and auto-selected in the dropdown.

**Orphaned Supabase objects (safe to leave, can be dropped):** The old `mark_password_changed()` RPC was replaced by the trigger-based approach and is no longer called. `drop function if exists public.mark_password_changed();` to clean up. Supabase Edge Function `invite-user` was deleted already.

## Design System

**Design direction:** "Institutional Precision" — clean, ordered, deliberate.

**Colors** (CSS custom properties in globals.css):
- `navy` (#004a59) — header, dark surfaces
- `trust-blue` (#007cba) — interactive accent
- `pro-blue` (#006ba1) — hover states
- `surface` (#f7f8f9) — page background
- `surface-alt` (#f0f1f2) — alternating rows

**Typography:** Outfit font, weights 300-700. Entity names use font-light (300). Table cells use tabular-nums.

**Z-index layers:** Table sticky (10) → Panel backdrop (30) → Panel (40) → Modal backdrop (50) → Modal (60).

## Architecture Decisions

**Entity selection via URL:** `?entity=<id>` makes views shareable.

**Auth → Data sequencing:** DashboardProvider is gated behind auth loading. Without this, data fetches fire before the session is hydrated, and RLS returns empty results.

**Cap table sort order:** GP / managing member always pinned to top. All other holders sorted by total position across all classes, descending (sum of `holding.amount` across classes). Alphabetical tiebreak for stable ordering. Implemented in `useSelectedEntity.ts`.

**Pinned first column:** Sticky left-0 with explicit background colors and scroll-triggered box-shadow.

**Holdings are derived from the transaction log, not authoritative themselves.** The `holdings` table is a materialized cache. Two code paths write to it:
1. **Create** (`RecordTransactionModal` → `recordTransaction` DAL): uses `upsert_holding_delta` to atomically apply the new transaction's deltas. Works because there's no prior state to reconcile.
2. **Edit / Delete** (`RecordTransactionModal` / `ChangeLogEntry` → `rebuild_entity_holdings` RPC): the server deletes all holdings for the entity and replays every transaction. This is the only way to guarantee the cap table matches the change log after an edit, because the prior "reverse old deltas + apply new deltas" client-side approach was brittle across closure/dispatch/RPC-undefined edge cases.

The `HoldingDelta` type (used only on the create path) carries `amountDelta` instead of absolute `amount`.

**Mutual exclusion panels:** The holder detail sidebar and change log panel cannot be open simultaneously. `SELECT_HOLDER` closes the change log; `TOGGLE_CHANGELOG` deselects any selected holder. Both use the same sliding panel pattern (420px wide, right-0, z-40).

## Known Issues / TODO

- **🐞 OPEN BUG — Sign out link does nothing.** Clicking "Sign out" in the user menu has no visible effect — user stays on the dashboard, session not cleared. **First fix attempt (commit `638d594`) did not resolve it** — changed `signOut()` to `{ scope: 'local' }` and the handler now does `window.location.href = '/login'` after the await. **Suspect areas to investigate next time:**
  - The menu has an outside-click-to-close handler (`menuRef` in `AppHeader.tsx`). The sign-out `<button>` is inside that menu, but the mousedown-based dismissal may be swallowing the click event before the button's onClick fires. Try changing outside-click detection to mouseup OR check `e.target` before closing.
  - `signOut({ scope: 'local' })` may not clear cookies synchronously — the await resolves but the browser cookie store update is async. If `window.location.href` fires before cookies flush, middleware sees valid cookies and bounces back to `/`. **Verify:** check Network tab on sign-out click — should see navigation to `/login` that doesn't redirect back to `/`.
  - Alternative fix to try: explicitly delete `sb-*` cookies client-side with `document.cookie = 'sb-X=; Max-Age=0; path=/'` before navigating, mirroring middleware's `clearSupabaseCookies`.
  - **Ryan's current workaround:** Clear site data manually or close the tab.
- **⚠️ Vercel auto-deploy broken.** As of 2026-04-17, pushes to `main` no longer trigger a Vercel build. All 13 commits pushed that day landed on GitHub but produced zero deployments. GitHub App is installed with "All repos" access; the App's event subscription for this project is stale. Fix path: Vercel project → Settings → Git → Disconnect, then Reconnect to same repo. Manual deploy via `npx vercel --prod --yes` from project root works as a fallback (uses local CLI auth at `%APPDATA%/com.vercel.cli/Data/auth.json`).
- **Supabase Auth configuration:**
  - Site URL must be `https://abpcaptabledashboard.vercel.app` and Redirect URLs must include `.../set-password` (Authentication → URL Configuration).
  - Email confirmation is disabled. If re-enabled, new users will be blocked from logging in until they confirm email.
  - Default SMTP is used for forgot-password emails only. Subject to Supabase's ~2-4/hour rate limit, but at ~5-7 total users this is a non-issue.
- **Multi-class % of Total** — The "% of Total" column currently uses the first non-percentage equity class for its calculation. Entities with multiple non-percentage classes (e.g., Class A Shares + Class B Shares) need per-class percentage columns instead of a single aggregate column.
- **Diluted vs. undiluted ownership** — Some entities have options or profits interests. The cap table will need two percentage columns: one for regular ownership (excluding options/profits interests) and one for fully diluted ownership (including options/profits interests). Requires a way to flag equity classes as dilutive instruments vs. base equity, then compute both percentages.

## Completed Features (Phase 3)

- **Historical snapshots** — "View cap table as of this date" button in change log replays transactions to reconstruct historical holdings. Amber banner with "Return to current" button when viewing historical state. Implemented in `src/lib/computeHistoricalHoldings.ts`.
- **CSV export** — "Export current" exports the live cap table. "Export as of date..." opens a date picker and exports historical cap table as CSV. Implemented in `src/lib/exportCsv.ts`.
- **File upload** — FileUploadZone wired to Supabase Storage (`transaction-attachments` bucket, private, RLS-protected). Files uploaded after transaction creation, displayed as clickable links in the change log with signed download URLs. DAL in `src/lib/dal/attachments.ts`.

## Completed Features (Phase 4)

- **Atomic holdings bug fix** — Replaced client-side cumulative amount computation with `upsert_holding_delta` Supabase RPC. Holdings are now updated atomically server-side using delta amounts, preventing stale-state bugs during rapid sequential transactions. `RecordTransactionModal.buildHoldingsDeltas()` returns `HoldingDelta[]` instead of cumulative `Holding[]`. DAL: `upsertHoldingsDelta()` in `src/lib/dal/holdings.ts`.
- **Rich change log entries** — Each change log entry now displays a transaction summary line (e.g., "New issuance of 116,980 Common Stock to Paul Becker") above the notes text. Implemented in `src/lib/formatTransactionSummary.ts`. Resolves holder and equity class IDs from transaction metadata to human-readable names.
- **Holder detail sidebar** — Click any holder row in the cap table to open a sliding sidebar (`src/components/holder-detail/HolderDetailPanel.tsx`) showing current holdings with ownership percentages and a chronological transaction timeline. Uses `getTransactionsForHolder()` to filter by holder ID across metadata fields. Mutually exclusive with the change log panel.

## Completed Features (Phase 5)

- **Middleware cookie hygiene (fixes "must clear site data" bug)** — When auth fails in middleware, all `sb-*` cookies are proactively deleted on the redirect response. Prevents the browser from infinitely resending broken refresh tokens and getting stuck in a redirect loop. See `clearSupabaseCookies()` in `src/lib/supabase/middleware.ts`.
- **Cap table sort by position** — Holders now ordered by total amount across all equity classes, descending. GP / managing member still pinned to top. Alpha tiebreak.
- **Attachments on transaction edit** — The edit modal accepts file uploads too. Appends new attachments to the existing list rather than replacing. Useful when you log a transaction and want to add supporting docs later.

## Completed Features (Phase 7) — 2026-04-17

- **Edit / delete now rebuild holdings from the transaction log.** New Postgres RPC `rebuild_entity_holdings(p_entity_id)` atomically deletes the entity's holdings and replays every transaction. Called on transaction edit ([src/components/modals/RecordTransactionModal.tsx](src/components/modals/RecordTransactionModal.tsx)) and delete ([src/components/changelog/ChangeLogEntry.tsx](src/components/changelog/ChangeLogEntry.tsx)). DAL helper: `rebuildEntityHoldings()` in [src/lib/dal/holdings.ts](src/lib/dal/holdings.ts). Resolves the edit-doesn't-update-cap-table bug and the previously-unreported related bug where delete also left holdings stale. Verified idempotent against live data: running the rebuild on every entity produces identical holdings to what was in the DB.
- **Workaround retired:** the "redeem → delete → reissue" dance is no longer needed — editing a transaction is now the correct flow for fixing a share count typo.

## Completed Features (Phase 6) — 2026-04-17

- **Manual user onboarding** replaces the old copy-link invite flow entirely. Admin adds users in Supabase Dashboard with a temp password; the `handle_new_user()` trigger auto-creates the `user_profiles` row with `must_change_password = true`. Plan: [docs/superpowers/plans/2026-04-17-manual-user-onboarding.md](docs/superpowers/plans/2026-04-17-manual-user-onboarding.md). Spec: [docs/superpowers/specs/2026-04-17-manual-user-onboarding-design.md](docs/superpowers/specs/2026-04-17-manual-user-onboarding-design.md).
- **New `/set-password` page** catches both first-login (forced password change) and forgot-password reset landings. Bypasses `supabase.auth.updateUser` — which hangs indefinitely on its internal post-success session refresh under `@supabase/ssr` — and PUTs directly to the Supabase Auth REST API at `/auth/v1/user` with the current session's bearer token.
- **`on_auth_user_password_change` Postgres trigger** atomically flips `must_change_password = false` whenever `auth.users.encrypted_password` changes. Eliminates the client-side RPC race that was causing the submit handler to hang.
- **New `/forgot-password` page** calls `resetPasswordForEmail` with `redirectTo = <origin>/set-password`. Returns a neutral "if an account exists..." message to avoid leaking whether an email is registered.
- **Middleware allowlist expanded** to let unauthenticated users reach `/forgot-password` and `/set-password` directly (previously bounced to `/login`).
- **Deleted:** `InviteUserModal`, `inviteUser()` DAL + `InviteResult` type, `markPasswordChanged()` DAL helper, `/auth/callback` route, invite button in AppHeader, `invite-user` Supabase edge function.

## Next Steps

1. **🐞 Fix the sign-out bug** (see Known Issues). Clicking Sign out does nothing; users can't leave without clearing site data.
2. **Restore Vercel auto-deploy** — Disconnect/reconnect Git integration in Vercel project settings.
3. **Multi-class percentage columns** — For entities with multiple non-percentage equity classes, show a separate "% of Total" sub-column next to each class instead of one aggregate column.
4. **Diluted / undiluted percentage columns** — Add support for tagging equity classes as dilutive (options, profits interests) and showing both regular and fully diluted ownership percentages.

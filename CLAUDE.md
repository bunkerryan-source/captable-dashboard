# ABP Cap Table Dashboard

## What This Is

Web-based cap table dashboard for ABP Capital. Tracks equity ownership across ~20-30 legal entities with a complete audit trail of transactions (gifts, sales, redemptions, transfers, issuances, corrections). Replaces spreadsheet-based tracking.

**Current phase:** Phase 5 complete — live on Vercel with Supabase backend, multi-user auth with copy-link invites, historical snapshots, CSV export, file attachments (add on edit too), atomic holdings updates, rich change log, holder detail sidebar, cap table sorted by position, and auth-resilient middleware that clears broken cookies automatically.

## Deployment

| Service | URL / ID |
|---|---|
| Live site | https://cap-table-dashboard.vercel.app |
| GitHub repo | https://github.com/bunkerryan-source/captable-dashboard |
| Vercel project | `cap-table-dashboard` (team: `team_cvOrlfMiLR7nAdZryqer1lEn`) |
| Supabase project | `jvfjnwztbsybhnggrgdc` (us-west-1) |

Pushes to `main` trigger auto-deploy on Vercel.

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
│   ├── auth/callback/route.ts   # Supabase auth callback (invite email links)
│   └── (dashboard)/
│       ├── layout.tsx           # Gates DashboardProvider behind auth readiness
│       └── page.tsx             # Main dashboard page (loading/error/empty/data states)
├── components/
│   ├── layout/                  # AppHeader (user menu, invite), EntitySelector,
│   │                            # FooterBar, MobileEntityBar
│   ├── dashboard/               # MetadataRow, CapTable
│   ├── changelog/               # ChangeLogPanel, ChangeLogEntry, ChangeLogFilters,
│   │                            # TransactionBadge (entries show rich transaction summaries)
│   ├── holder-detail/           # HolderDetailPanel (sliding sidebar for holder transactions)
│   ├── modals/                  # ModalShell, RecordTransactionModal, AddHolderModal,
│   │   │                        # EntitySetupModal, EntitySettingsModal, InviteUserModal
│   │   └── transaction-fields/  # GiftFields, SaleFields, RedemptionFields, etc.
│   └── ui/                      # Button, Input, Select, Textarea, Toggle, Badge,
│                                # PillSelector, FileUploadZone, Backdrop
├── context/
│   ├── AuthContext.tsx           # Auth state: user, role, displayName, loading
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
│   │   └── auth.ts              # signIn, signOut, getCurrentUser, getUserProfile, inviteUser
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
- `user_profiles` — links auth.users to app roles (admin/editor)

**RPC functions:**
- `upsert_holding_delta(p_entity_id, p_holder_id, p_equity_class_id, p_amount_delta, p_committed_capital?, p_holder_role?)` — Atomic upsert that adds `p_amount_delta` to existing holding amount (or inserts if new). Uses `COALESCE` to preserve existing `committed_capital` and `holder_role` when not provided.
- `has_users()` — Returns boolean, used during first-user setup flow.

## Auth Architecture

- **Roles:** `admin` (full access + invite users), `editor` (full data access)
- **Flow:** Email/password login. Admin creates invite links via Edge Function (`invite-user`) and sends them through their own email client — the app never relies on Supabase's rate-limited default SMTP.
- **Edge Function:** `invite-user` (v6, `verify_jwt: false`) — decodes JWT from Authorization header, checks admin role via user_profiles, then calls `auth.admin.generateLink()` to produce a signup link (new user) or magic link (existing user). Returns `{ inviteUrl, isExisting }` so the UI can display a copy-to-clipboard link. Auto-creates a `user_profiles` row for new users with the requested role.
- **Client-side invite:** `inviteUser()` in DAL returns `{ inviteUrl, isExisting }`. Passes `window.location.origin` as `siteUrl` so generated links redirect to the correct environment (dev / preview / prod).
- **Invite UI:** `InviteUserModal` has two states: form (email/role/displayName) and link-display (the URL with a Copy button + 24-hour/single-use notice). No "email sent" confirmation state — the admin delivers the link themselves.
- **Sign out:** `signOut()` calls Supabase with `scope: 'local'` to clear only local cookies (no server roundtrip, so it works even when the session is stale). `AppHeader.handleSignOut` follows up with `window.location.href = '/login'` to force a full reload and reset all client state.
- **Auth resilience:** `AuthContext` starts the `getUser()` call during the render phase (not in `useEffect`) because React 19 + Next.js 16 sometimes fails to flush passive effects after hydrating statically-prerendered pages. A `useRef` guard ensures it runs only once. The `onAuthStateChange` listener is kept in `useEffect` for proper cleanup. The browser client also bypasses the Web Locks API (`navigator.locks`) to prevent orphaned locks from hanging `getUser()`.
- **Cookie hygiene in middleware:** When `getUser()` fails or returns an error (corrupt/expired refresh token), middleware proactively deletes all `sb-*` cookies on the redirect response. This prevents the "must clear site data to load the site" failure mode where the browser keeps sending broken auth cookies on every request, and middleware keeps redirecting without ever telling the browser to forget them.
- **Auth gating:** `(dashboard)/layout.tsx` is a client component that waits for `useAuth().loading` to be false before mounting `DashboardProvider`, preventing data fetches before the auth session is hydrated.
- **Admin transaction management:** Admins can edit and delete transactions from the change log. Edit opens the RecordTransactionModal pre-populated with existing data. Delete shows an inline confirmation.
- **Add Holder from transaction form:** When "+ Add new holder..." is selected in any holder dropdown within the Record Transaction modal, an inline mini-form appears (name + type). On submit, the new holder is created and auto-selected in the dropdown.

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

**Atomic holdings updates:** Holdings are updated via `upsert_holding_delta` Supabase RPC that atomically increments amounts server-side. `RecordTransactionModal` sends delta amounts (not cumulative), eliminating stale-state bugs from rapid sequential transactions. The `HoldingDelta` type carries `amountDelta` instead of absolute `amount`.

**Mutual exclusion panels:** The holder detail sidebar and change log panel cannot be open simultaneously. `SELECT_HOLDER` closes the change log; `TOGGLE_CHANGELOG` deselects any selected holder. Both use the same sliding panel pattern (420px wide, right-0, z-40).

## Known Issues / TODO

- **🐞 OPEN BUG — Sign out link does nothing.** Clicking "Sign out" in the user menu has no visible effect — user stays on the dashboard, session not cleared. **First fix attempt (Phase 5, commit `638d594`) did not resolve it** — changed `signOut()` to `{ scope: 'local' }` and the handler now does `window.location.href = '/login'` after the await. **Suspect areas to investigate next time:**
  - The menu has an outside-click-to-close handler (`menuRef` in `AppHeader.tsx`). The sign-out `<button>` is inside that menu, but the mousedown-based dismissal may be swallowing the click event before the button's onClick fires. Try changing outside-click detection to mouseup OR check `e.target` before closing. Alternative: move Sign Out outside the menu or test with `onMouseDown` instead of `onClick`.
  - `signOut({ scope: 'local' })` may not actually clear cookies synchronously — the await resolves but the browser cookie store update is asynchronous. If `window.location.href` fires before cookies are flushed, middleware sees valid cookies, identifies the user, and the `user && /login` branch redirects back to `/`. User bounces straight back to the dashboard so it *looks* like nothing happened. **Verify:** check Network tab on sign-out click — should see navigation to `/login` that doesn't redirect back to `/`.
  - Multiple `createClient()` instances: AppHeader's `signOut()` uses a fresh client; AuthContext has its own. Cookies are shared so this should still work, but worth verifying the actual Supabase JS behavior here with `scope: 'local'`.
  - Alternative fix to try first: explicitly delete `sb-*` cookies client-side before navigating, instead of relying on `signOut()`. Mirror the middleware's `clearSupabaseCookies` logic with `document.cookie = 'sb-X=; Max-Age=0; path=/'`.
  - **Ryan's current workaround:** Clear site data manually, or close the tab entirely.
- **🐞 OPEN BUG — Edit transaction doesn't update cap table holdings.** When an admin edits a transaction from the change log (e.g. fixing a share count), the transaction record itself updates correctly but the cap table still reflects the original numbers. **First fix attempt (Phase 5, commit `638d594`) did not resolve it** — the intended logic reverses the original transaction's deltas and applies new deltas via `upsert_holding_delta`, but users still see stale cap table data after edit. **Suspect areas to investigate next time:**
  - The `computeDeltas()` call reads `original.metadata` from the in-memory `transactions` array. If the original metadata stored as JSONB contains non-string values or different key casing than expected, the deltas could be empty/wrong.
  - The `INIT_DATA` dispatch in the edit path uses `entities` and `holders` from current context state (not a fresh fetch), which is correct, but `dalFetchHoldings()` is awaited right before — if the RPC commit hasn't propagated to read replicas yet, we'd fetch stale data. (Unlikely on Supabase single-region but worth ruling out.)
  - Edit-path branch may be executing the `dispatch({ type: "UPDATE_TRANSACTION" })` path instead of the `INIT_DATA` path if `oldDeltas.length === 0 && newDeltas.length === 0`. Check whether a transaction being edited has metadata that produces empty deltas (e.g. missing `holder` key).
  - Verify the edge function is actually receiving and processing the reversal deltas — add console.log or check network tab on an edit.
  - **Ryan's current workaround:** Redeem the holder's entire position via a new transaction, delete the original (wrong) transaction from the log, then create a new transaction for the correct amount.
- **Edge Function `verify_jwt` is `false`** — this is the recommended pattern per Supabase docs. The gateway's `verify_jwt` is a legacy mechanism being phased out in favor of functions handling their own auth. The `invite-user` function already validates the JWT and checks admin role internally. No change needed.
- **Supabase Site URL** — verify in Supabase Dashboard (Authentication > URL Configuration) that Site URL is `https://cap-table-dashboard.vercel.app` and Redirect URLs includes `https://cap-table-dashboard.vercel.app/auth/callback`.
- **Supabase email confirmation** — disabled manually in Supabase dashboard. If re-enabled, users will be blocked from logging in until they confirm email.
- **Supabase SMTP not configured** — Intentional. The invite flow uses copy-link (admin delivers manually) specifically to avoid the Supabase default SMTP rate limit (~2-4 emails/hour per project). If custom SMTP is ever configured later, the `invite-user` edge function could be reverted to `inviteUserByEmail()` — but the current copy-link flow is arguably better UX (admin stays in control of messaging).
- **Multi-class % of Total** — The "% of Total" column currently uses the first non-percentage equity class for its calculation. Entities with multiple non-percentage classes (e.g., Class A Shares + Class B Shares) need per-class percentage columns instead of a single aggregate column.
- **Diluted vs. undiluted ownership** — Some entities have options or profits interests. The cap table will need two percentage columns: one for regular ownership (excluding options/profits interests) and one for fully diluted ownership (including options/profits interests). Requires a way to flag equity classes as dilutive instruments (options, profits interests) vs. base equity, then compute both percentages.

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
- **Reliable sign out** — Changed to `signOut({ scope: 'local' })` so it works even when the session is already stale (no server roundtrip that could hang). Follow-up uses `window.location.href` for a full reload to reset all client state.
- **Copy-link invite flow** — Replaced Supabase's default-SMTP invite emails (which silently drop after hitting the ~2-4/hour rate limit) with an in-app copy-link flow. Admin clicks Invite, modal shows a one-time signup link with a Copy button, admin sends it via their own email. Edge function v6 uses `auth.admin.generateLink()`. Handles both new users (invite link) and existing users (magic link) transparently. Links carry the current origin as `redirectTo` so they work across dev/preview/prod.
- **Cap table sort by position** — Holders now ordered by total amount across all equity classes, descending. GP / managing member still pinned to top. Alpha tiebreak.
- **Attachments on transaction edit** — The edit modal now accepts file uploads too. Appends new attachments to the existing list rather than replacing. Useful when you log a transaction and want to add supporting docs later.
- **Transaction edit → holdings update (ATTEMPTED, NOT WORKING)** — `RecordTransactionModal.handleSubmit` was refactored to, on edit, compute the original transaction's deltas, reverse them, apply new deltas via `upsert_holding_delta`, then refetch holdings. **This is not actually working in production** — see Known Issues / TODO for debugging notes.

## Next Steps

1. **🐞 Fix the sign-out bug** (see Known Issues). Clicking Sign out does nothing; users can't leave without clearing site data.
2. **🐞 Fix the transaction-edit → cap-table-update bug** (see Known Issues). Data-integrity adjacent — edit UI updates the transaction row but the cap table still shows pre-edit numbers.
3. **Multi-class percentage columns** — For entities with multiple non-percentage equity classes, show a separate "% of Total" sub-column next to each class instead of one aggregate column.
4. **Diluted / undiluted percentage columns** — Add support for tagging equity classes as dilutive (options, profits interests) and showing both regular and fully diluted ownership percentages.

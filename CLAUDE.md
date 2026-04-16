# ABP Cap Table Dashboard

## What This Is

Web-based cap table dashboard for ABP Capital. Tracks equity ownership across ~20-30 legal entities with a complete audit trail of transactions (gifts, sales, redemptions, transfers, issuances, corrections). Replaces spreadsheet-based tracking.

**Current phase:** Phase 2 complete — live on Vercel with Supabase backend and multi-user auth.

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
│   │                            # TransactionBadge
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
│   │   ├── holdings.ts          # fetchHoldings, upsertHoldings
│   │   ├── transactions.ts      # fetchTransactionsWithAttachments, recordTransaction
│   │   └── auth.ts              # signIn, signOut, getCurrentUser, getUserProfile, inviteUser
│   ├── formatters.ts            # Number/percent/currency/date formatting
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

## Auth Architecture

- **Roles:** `admin` (full access + invite users), `editor` (full data access)
- **Flow:** Email/password login. Admin invites users via Edge Function (`invite-user`).
- **Edge Function:** `invite-user` (v5, `verify_jwt: false`) — decodes JWT from Authorization header, checks admin role via user_profiles, calls `auth.admin.inviteUserByEmail()`, auto-creates user_profiles entry. Returns friendly 409 if user already invited.
- **Client-side:** `inviteUser()` in DAL uses `supabase.functions.invoke()` (not raw fetch). Extracts actual error messages from `FunctionsHttpError.context` so the UI shows meaningful errors.
- **Auth resilience:** `AuthContext` starts the `getUser()` call during the render phase (not in `useEffect`) because React 19 + Next.js 16 sometimes fails to flush passive effects after hydrating statically-prerendered pages. A `useRef` guard ensures it runs only once. The `onAuthStateChange` listener is kept in `useEffect` for proper cleanup. The browser client also bypasses the Web Locks API (`navigator.locks`) to prevent orphaned locks from hanging `getUser()`. Middleware copies cookie updates to redirect responses so expired sessions are properly cleared on the browser.
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

**GP/managing member sorting:** Always pinned to top of cap table, rest alphabetical.

**Pinned first column:** Sticky left-0 with explicit background colors and scroll-triggered box-shadow.

## Known Issues / TODO

- **Edge Function `verify_jwt` is `false`** — this is the recommended pattern per Supabase docs. The gateway's `verify_jwt` is a legacy mechanism being phased out in favor of functions handling their own auth. The `invite-user` function already validates the JWT and checks admin role internally. No change needed.
- **Supabase Site URL** — verify in Supabase Dashboard (Authentication > URL Configuration) that Site URL is `https://cap-table-dashboard.vercel.app` and Redirect URLs includes `https://cap-table-dashboard.vercel.app/auth/callback`.
- **Supabase email confirmation** — disabled manually in Supabase dashboard. If re-enabled, users will be blocked from logging in until they confirm email.
- **Multi-class % of Total** — The "% of Total" column currently uses the first non-percentage equity class for its calculation. Entities with multiple non-percentage classes (e.g., Class A Shares + Class B Shares) need per-class percentage columns instead of a single aggregate column.
- **Diluted vs. undiluted ownership** — Some entities have options or profits interests. The cap table will need two percentage columns: one for regular ownership (excluding options/profits interests) and one for fully diluted ownership (including options/profits interests). Requires a way to flag equity classes as dilutive instruments (options, profits interests) vs. base equity, then compute both percentages.

## Next Steps

1. **Multi-class percentage columns** — For entities with multiple non-percentage equity classes, show a separate "% of Total" sub-column next to each class instead of one aggregate column.
2. **Diluted / undiluted percentage columns** — Add support for tagging equity classes as dilutive (options, profits interests) and showing both regular and fully diluted ownership percentages.
3. **Export functionality** — Wire up "Export current" and "Export as of date" buttons.
4. **Historical snapshots** — "View cap table as of this date" in the change log.
5. **File upload** — Wire FileUploadZone to Supabase Storage for transaction attachments.

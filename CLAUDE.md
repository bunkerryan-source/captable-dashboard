# ABP Cap Table Dashboard

## What This Is

Web-based cap table dashboard for ABP Capital. Tracks equity ownership across ~20-30 legal entities with a complete audit trail of transactions (gifts, sales, redemptions, transfers, issuances, corrections). Replaces spreadsheet-based tracking.

**Current phase:** Frontend UI shell with mock data. No backend integration yet.

## Tech Stack

| Layer | Choice |
|---|---|
| Framework | Next.js 16 (App Router) |
| Language | TypeScript (strict) |
| Styling | Tailwind CSS v4 (`@theme inline` in globals.css) |
| Font | Outfit via `next/font/google` |
| State | React Context + `useReducer` |
| URL State | `useSearchParams()` for entity selection (`?entity=<id>`) |

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
│   ├── layout.tsx           # Root: Outfit font, DashboardProvider
│   ├── page.tsx             # Main dashboard page
│   └── globals.css          # Tailwind v4 @theme design tokens
├── components/
│   ├── layout/              # AppHeader, EntitySelector, FooterBar, MobileEntityBar
│   ├── dashboard/           # MetadataRow, CapTable
│   ├── changelog/           # ChangeLogPanel, ChangeLogEntry, ChangeLogFilters, TransactionBadge
│   ├── modals/              # ModalShell, RecordTransactionModal, AddHolderModal,
│   │   │                    # EntitySetupModal, EntitySettingsModal
│   │   └── transaction-fields/  # GiftFields, SaleFields, RedemptionFields, etc.
│   └── ui/                  # Button, Input, Select, Textarea, Toggle, Badge,
│                            # PillSelector, FileUploadZone, Backdrop
├── context/
│   └── DashboardContext.tsx  # State shape, reducer, provider, mock data init
├── hooks/
│   ├── useSelectedEntity.ts # URL param → entity + holdings + transactions
│   ├── useModal.ts          # Modal open/close
│   └── useChangeLog.ts      # Filtered transaction log
├── data/
│   ├── types.ts             # All TS interfaces (Entity, Holder, Holding, Transaction, etc.)
│   ├── mock-entities.ts     # 4 entities with equity classes
│   ├── mock-holders.ts      # 20 holders
│   ├── mock-holdings.ts     # Holdings per entity
│   └── mock-transactions.ts # 15 transactions with attachments
└── lib/
    ├── formatters.ts        # Number/percent/currency/date formatting
    ├── computeTotals.ts     # Column summation for totals row
    └── constants.ts         # Transaction type configs, entity type labels
```

## Design System

**Design direction:** "Institutional Precision" — clean, ordered, deliberate. Like a well-appointed law firm conference room.

**Colors** (defined as CSS custom properties in globals.css):
- `navy` (#004a59) — header, dark surfaces
- `trust-blue` (#007cba) — interactive accent (buttons, links, active states)
- `pro-blue` (#006ba1) — hover states
- `surface` (#f7f8f9) — page background
- `surface-alt` (#f0f1f2) — alternating rows
- `border` / `border-strong` — structural dividers

**Typography:** Outfit font, weights 300-700. Entity names use font-light (300). Table cells use tabular-nums. Headers are 11px uppercase with wide tracking.

**Z-index layers:** Table sticky (10) → Panel backdrop (30) → Panel (40) → Modal backdrop (50) → Modal (60).

## Architecture Decisions

**Entity selection via URL:** `?entity=<id>` makes views shareable. `useSelectedEntity()` reads the param and returns the full entity bundle (entity, holders with holdings, transactions, lastUpdated).

**Mock data swap strategy:** Mock data files initialize the context reducer. When Supabase is wired in, swap the initialization to async API calls. Components consume what Context provides — they never change.

**GP/managing member sorting:** Always pinned to top of cap table, rest alphabetical. Logic lives in `useSelectedEntity`.

**Pinned first column:** Sticky left-0 with explicit background colors (not transparent). Gains a box-shadow when the table is scrolled horizontally (detected via scroll event listener).

## Next Steps

1. **Supabase integration** — Replace mock data with real database. The context reducer's action types (ADD_ENTITY, ADD_HOLDER, RECORD_TRANSACTION, UPDATE_ENTITY) map directly to DB operations.
2. **Authentication** — Supabase Auth with RLS policies.
3. **Export functionality** — Wire up "Export current" and "Export as of date" buttons.
4. **Historical snapshots** — "View cap table as of this date" in the change log.
5. **File upload** — Wire FileUploadZone to Supabase Storage for transaction attachments.

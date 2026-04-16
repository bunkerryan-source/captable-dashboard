# Holdings Bug Fix, Rich Change Log, Holder Sidebar — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix the stale-state holdings bug via atomic SQL deltas, add transaction detail summaries to the change log, and add a holder detail sidebar triggered by clicking cap table rows.

**Architecture:** Three independent features that share one utility (`formatTransactionSummary`). The holdings bug fix replaces client-side cumulative amount computation with a Supabase RPC that atomically increments holdings. The change log enrichment parses transaction metadata to build human-readable summaries. The holder sidebar follows the existing `ChangeLogPanel` sliding panel pattern with mutual exclusion.

**Tech Stack:** Next.js 16 (App Router), TypeScript, Supabase (Postgres RPC), Tailwind CSS v4, React Context + useReducer

**Spec:** `docs/superpowers/specs/2026-04-16-holdings-bug-changelog-sidebar-design.md`

**Verification:** This project has no test runner. Use `npm run build` (TypeScript + Next.js build) and `npm run lint` (ESLint) for code correctness. Use the dev server (`npm run dev`) and browser preview for visual verification.

**Supabase project ID:** `jvfjnwztbsybhnggrgdc`

---

## Task 1: Supabase RPC Migration + Data Fix

**Purpose:** Create the `upsert_holding_delta` Postgres function and fix the two corrupted holdings rows.

**Files:**
- None (Supabase migrations applied via MCP tools)

- [ ] **Step 1: Create the `upsert_holding_delta` RPC function**

Apply via Supabase `apply_migration` MCP tool with project_id `jvfjnwztbsybhnggrgdc`:

```sql
CREATE OR REPLACE FUNCTION upsert_holding_delta(
  p_entity_id uuid,
  p_holder_id uuid,
  p_equity_class_id uuid,
  p_amount_delta numeric,
  p_committed_capital numeric DEFAULT NULL,
  p_holder_role text DEFAULT NULL
) RETURNS SETOF holdings AS $$
  INSERT INTO holdings (entity_id, holder_id, equity_class_id, amount, committed_capital, holder_role)
  VALUES (p_entity_id, p_holder_id, p_equity_class_id, p_amount_delta, p_committed_capital, p_holder_role)
  ON CONFLICT (entity_id, holder_id, equity_class_id)
  DO UPDATE SET
    amount = COALESCE(holdings.amount, 0) + p_amount_delta,
    committed_capital = COALESCE(EXCLUDED.committed_capital, holdings.committed_capital),
    holder_role = COALESCE(EXCLUDED.holder_role, holdings.holder_role)
  RETURNING *;
$$ LANGUAGE sql;
```

Migration name: `create_upsert_holding_delta_rpc`

- [ ] **Step 2: Fix corrupted holdings data**

Apply via Supabase `apply_migration` MCP tool:

```sql
UPDATE holdings SET amount = 307079
WHERE holder_id = 'a29441cd-4264-432d-98e3-19c9ee0d2bad'
  AND equity_class_id = '159f8cac-467b-4e5c-8634-4573d734a315';

UPDATE holdings SET amount = 131605
WHERE holder_id = 'ad9f84cf-3784-4926-956a-34bb29719ac3'
  AND equity_class_id = '159f8cac-467b-4e5c-8634-4573d734a315';
```

Migration name: `fix_corrupted_holdings_data`

- [ ] **Step 3: Verify the fix**

Run via Supabase `execute_sql` MCP tool:

```sql
SELECT ho.name, h.amount
FROM holdings h
JOIN holders ho ON h.holder_id = ho.id
ORDER BY ho.name;
```

Expected: Evert C. Alsenz = 307079, Paul Becker = 131605.

- [ ] **Step 4: Commit**

```bash
git add -A && git commit -m "chore: add upsert_holding_delta RPC and fix corrupted holdings data"
```

---

## Task 2: HoldingDelta Type + DAL Functions

**Purpose:** Add the `HoldingDelta` type and the new `upsertHoldingsDelta()` DAL function. Update `recordTransaction()` to use it.

**Files:**
- Modify: `src/data/types.ts:103` (append after `TransactionWithAttachments`)
- Modify: `src/lib/dal/holdings.ts:1-28` (add new function after existing)
- Modify: `src/lib/dal/transactions.ts:1-56` (change `recordTransaction` signature and body)
- Modify: `src/lib/dal/index.ts:3` (add export)

- [ ] **Step 1: Add HoldingDelta type to `src/data/types.ts`**

Append after the `TransactionWithAttachments` interface (after line 103):

```typescript
export interface HoldingDelta {
  entityId: string;
  holderId: string;
  equityClassId: string;
  amountDelta: number;
  committedCapital?: number | null;
  holderRole?: string | null;
}
```

- [ ] **Step 2: Add `upsertHoldingsDelta()` to `src/lib/dal/holdings.ts`**

Append after the existing `upsertHoldings` function (after line 28):

```typescript
export async function upsertHoldingsDelta(
  deltas: import("@/data/types").HoldingDelta[]
): Promise<Holding[]> {
  if (deltas.length === 0) return [];

  const supabase = createClient();
  const results: Holding[] = [];

  for (const d of deltas) {
    const { data, error } = await supabase.rpc("upsert_holding_delta", {
      p_entity_id: d.entityId,
      p_holder_id: d.holderId,
      p_equity_class_id: d.equityClassId,
      p_amount_delta: d.amountDelta,
      p_committed_capital: d.committedCapital ?? null,
      p_holder_role: d.holderRole ?? null,
    });
    if (error) throw error;
    if (data) {
      const rows = Array.isArray(data) ? data : [data];
      results.push(...rows.map(mapHolding));
    }
  }

  return results;
}
```

- [ ] **Step 3: Update `recordTransaction()` in `src/lib/dal/transactions.ts`**

Replace the import and function signature. Change the full file to:

```typescript
import { createClient } from "@/lib/supabase/client";
import { mapTransaction, mapAttachment, toDbTransaction } from "./mappers";
import type {
  Transaction,
  TransactionWithAttachments,
  Holding,
  HoldingDelta,
} from "@/data/types";
import { upsertHoldingsDelta } from "./holdings";
import type { Json, TablesUpdate } from "@/lib/supabase/types";
```

Then change the `recordTransaction` function signature (lines 28-31) from:

```typescript
export async function recordTransaction(
  tx: Omit<Transaction, "id" | "createdAt">,
  holdingsUpdates: Omit<Holding, "id">[]
): Promise<{
```

to:

```typescript
export async function recordTransaction(
  tx: Omit<Transaction, "id" | "createdAt">,
  holdingsDeltas: HoldingDelta[]
): Promise<{
```

And change line 47 from:

```typescript
  const updatedHoldings = await upsertHoldings(holdingsUpdates);
```

to:

```typescript
  const updatedHoldings = await upsertHoldingsDelta(holdingsDeltas);
```

Remove the `upsertHoldings` import (line 8) since it's no longer used here. The old import `import { upsertHoldings } from "./holdings";` becomes `import { upsertHoldingsDelta } from "./holdings";`.

- [ ] **Step 4: Update barrel export in `src/lib/dal/index.ts`**

Change line 3 from:

```typescript
export { fetchHoldings, upsertHoldings } from "./holdings";
```

to:

```typescript
export { fetchHoldings, upsertHoldings, upsertHoldingsDelta } from "./holdings";
```

- [ ] **Step 5: Verify types compile**

Run: `npm run build`

Expected: Build succeeds (the `RecordTransactionModal` still calls `buildHoldingsUpdates()` which returns `Omit<Holding, "id">[]` but `recordTransaction` now expects `HoldingDelta[]` — this will cause a type error. That's expected and will be fixed in Task 3).

Actually — this will fail because the caller hasn't been updated yet. That's fine; we fix it in the next task. But to keep the build green between commits, we should do Task 3 before committing Task 2, or combine them.

**Revised approach:** Do NOT commit yet. Continue to Task 3 and commit together.

---

## Task 3: Refactor RecordTransactionModal to Use Deltas

**Purpose:** Change `buildHoldingsUpdates()` to `buildHoldingsDeltas()` that returns delta amounts instead of cumulative amounts. This eliminates the stale-state bug.

**Files:**
- Modify: `src/components/modals/RecordTransactionModal.tsx:22-28,153-251,269-279`

- [ ] **Step 1: Update imports in `RecordTransactionModal.tsx`**

Change line 28 from:

```typescript
import type { Holder, Holding } from "@/data/types";
```

to:

```typescript
import type { Holder, HoldingDelta } from "@/data/types";
```

- [ ] **Step 2: Replace `buildHoldingsUpdates()` with `buildHoldingsDeltas()`**

Replace the entire `buildHoldingsUpdates` function (lines 153-251) with:

```typescript
  function buildHoldingsDeltas(): HoldingDelta[] {
    if (!entity) return [];
    const amount = parseNumericInput(fieldValues.amount);

    switch (txType) {
      case "issuance": {
        if (!fieldValues.holder || !fieldValues.equityClass || amount === null)
          return [];

        return [
          {
            entityId: entity.id,
            holderId: fieldValues.holder,
            equityClassId: fieldValues.equityClass,
            amountDelta: amount,
            committedCapital: parseNumericInput(fieldValues.capitalContribution) ?? undefined,
            holderRole: undefined,
          },
        ];
      }

      case "gift":
      case "sale":
      case "estate_transfer": {
        if (
          !fieldValues.fromHolder ||
          !fieldValues.toHolder ||
          !fieldValues.equityClass ||
          amount === null
        )
          return [];

        return [
          {
            entityId: entity.id,
            holderId: fieldValues.fromHolder,
            equityClassId: fieldValues.equityClass,
            amountDelta: -amount,
          },
          {
            entityId: entity.id,
            holderId: fieldValues.toHolder,
            equityClassId: fieldValues.equityClass,
            amountDelta: amount,
          },
        ];
      }

      case "redemption": {
        if (!fieldValues.holder || !fieldValues.equityClass || amount === null)
          return [];

        return [
          {
            entityId: entity.id,
            holderId: fieldValues.holder,
            equityClassId: fieldValues.equityClass,
            amountDelta: -amount,
          },
        ];
      }

      default:
        return [];
    }
  }
```

- [ ] **Step 3: Update `handleSubmit` to call `buildHoldingsDeltas()`**

In the `handleSubmit` function, change the call on line 279 from:

```typescript
          buildHoldingsUpdates()
```

to:

```typescript
          buildHoldingsDeltas()
```

- [ ] **Step 4: Remove unused `holdings` from destructuring**

On line 44, the `holdings` variable from `useDashboard()` is no longer needed by `buildHoldingsDeltas()`. Remove it:

Change:

```typescript
  const { holders, holdings, transactions, editingTransactionId } = useDashboard();
```

to:

```typescript
  const { holders, transactions, editingTransactionId } = useDashboard();
```

- [ ] **Step 5: Build and verify**

Run: `npm run build`

Expected: Build succeeds with no type errors.

- [ ] **Step 6: Commit the complete bug fix (Tasks 2 + 3)**

```bash
git add src/data/types.ts src/lib/dal/holdings.ts src/lib/dal/transactions.ts src/lib/dal/index.ts src/components/modals/RecordTransactionModal.tsx
git commit -m "fix: use atomic SQL deltas for holdings updates

Replaces client-side cumulative amount computation with a Supabase RPC
that atomically increments holdings. Eliminates stale-state bug where
rapid sequential issuances produced incorrect totals."
```

---

## Task 4: Create `formatTransactionSummary` Utility

**Purpose:** New utility that parses transaction metadata and returns a human-readable summary string like "New issuance of 50 Common Stock to Evert C. Alsenz".

**Files:**
- Create: `src/lib/formatTransactionSummary.ts`

- [ ] **Step 1: Create `src/lib/formatTransactionSummary.ts`**

```typescript
import type { Transaction, Holder, EquityClass } from "@/data/types";
import { formatByUnitType } from "./formatters";

/**
 * Build a human-readable summary from transaction metadata.
 * Returns null if metadata is missing or incomplete.
 */
export function formatTransactionSummary(
  transaction: Transaction,
  holders: Holder[],
  equityClasses: EquityClass[]
): string | null {
  const meta = transaction.metadata;
  if (!meta) return null;

  const holderName = (id: unknown) =>
    holders.find((h) => h.id === id)?.name ?? null;

  const className = (id: unknown) => {
    const ec = equityClasses.find((c) => c.id === id);
    return ec ? ec.name : null;
  };

  const formattedAmount = (rawAmount: unknown, classId: unknown) => {
    const num = typeof rawAmount === "string" ? parseFloat(rawAmount.replace(/[$,%\s]/g, "")) : Number(rawAmount);
    if (isNaN(num)) return null;
    const ec = equityClasses.find((c) => c.id === classId);
    return ec ? formatByUnitType(num, ec.unitType) : num.toLocaleString("en-US");
  };

  switch (transaction.transactionType) {
    case "issuance": {
      const name = holderName(meta.holder);
      const cls = className(meta.equityClass);
      const amt = formattedAmount(meta.amount, meta.equityClass);
      if (!name || !cls || !amt) return null;
      return `New issuance of ${amt} ${cls} to ${name}`;
    }

    case "gift": {
      const from = holderName(meta.fromHolder);
      const to = holderName(meta.toHolder);
      const cls = className(meta.equityClass);
      const amt = formattedAmount(meta.amount, meta.equityClass);
      if (!from || !to || !cls || !amt) return null;
      return `Gift of ${amt} ${cls} from ${from} to ${to}`;
    }

    case "sale": {
      const from = holderName(meta.fromHolder);
      const to = holderName(meta.toHolder);
      const cls = className(meta.equityClass);
      const amt = formattedAmount(meta.amount, meta.equityClass);
      if (!from || !to || !cls || !amt) return null;
      return `Sale of ${amt} ${cls} from ${from} to ${to}`;
    }

    case "redemption": {
      const name = holderName(meta.holder);
      const cls = className(meta.equityClass);
      const amt = formattedAmount(meta.amount, meta.equityClass);
      if (!name || !cls || !amt) return null;
      return `Redemption of ${amt} ${cls} from ${name}`;
    }

    case "estate_transfer": {
      const from = holderName(meta.fromHolder);
      const to = holderName(meta.toHolder);
      const cls = className(meta.equityClass);
      const amt = formattedAmount(meta.amount, meta.equityClass);
      if (!from || !to || !cls || !amt) return null;
      return `Estate transfer of ${amt} ${cls} from ${from} to ${to}`;
    }

    case "correction":
      return "Correction";

    case "holder_update":
      return "Holder update";

    case "class_change":
      return "Class change";

    default:
      return null;
  }
}

/**
 * Filter transactions to those involving a specific holder.
 * Checks metadata fields: holder, fromHolder, toHolder.
 */
export function getTransactionsForHolder(
  transactions: Transaction[],
  holderId: string
): Transaction[] {
  return transactions.filter((tx) => {
    const meta = tx.metadata;
    if (!meta) return false;
    return (
      meta.holder === holderId ||
      meta.fromHolder === holderId ||
      meta.toHolder === holderId
    );
  });
}
```

- [ ] **Step 2: Build check**

Run: `npm run build`

Expected: Build succeeds (file is created but not yet imported anywhere — dead code is fine for now).

- [ ] **Step 3: Commit**

```bash
git add src/lib/formatTransactionSummary.ts
git commit -m "feat: add formatTransactionSummary utility and holder transaction filter"
```

---

## Task 5: Rich Change Log Entries

**Purpose:** Show transaction summary lines (e.g., "New issuance of 50 Common Stock to Evert C. Alsenz") above the notes in each change log entry.

**Files:**
- Modify: `src/components/changelog/ChangeLogEntry.tsx:1-176`
- Modify: `src/components/changelog/ChangeLogPanel.tsx:1-81`

- [ ] **Step 1: Update `ChangeLogEntry.tsx` to accept and display summary**

Add new props and import. Replace the full file content:

```typescript
"use client";

import { useState } from "react";
import { TransactionBadge } from "./TransactionBadge";
import { formatDate } from "@/lib/formatters";
import { formatTransactionSummary } from "@/lib/formatTransactionSummary";
import { Button } from "@/components/ui/Button";
import { useDashboardDispatch } from "@/context/DashboardContext";
import { useAuth } from "@/context/AuthContext";
import {
  deleteTransaction as dalDeleteTransaction,
  getAttachmentUrl,
} from "@/lib/dal";
import type { TransactionWithAttachments, Holder, EquityClass } from "@/data/types";

interface ChangeLogEntryProps {
  transaction: TransactionWithAttachments;
  holders: Holder[];
  equityClasses: EquityClass[];
}

export function ChangeLogEntry({ transaction, holders, equityClasses }: ChangeLogEntryProps) {
  const dispatch = useDashboardDispatch();
  const { role } = useAuth();
  const isAdmin = role === "admin";

  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const summary = formatTransactionSummary(transaction, holders, equityClasses);

  function handleEdit() {
    dispatch({
      type: "SET_EDITING_TRANSACTION",
      transactionId: transaction.id,
    });
    dispatch({ type: "OPEN_MODAL", modal: "recordTransaction" });
  }

  async function handleDelete() {
    setDeleting(true);
    setError(null);
    try {
      await dalDeleteTransaction(transaction.id);
      dispatch({ type: "DELETE_TRANSACTION", transactionId: transaction.id });
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to delete transaction"
      );
      setDeleting(false);
      setConfirmingDelete(false);
    }
  }

  return (
    <div className="py-3.5 border-b border-border last:border-b-0 group/entry">
      {/* Date + Badge + Actions row */}
      <div className="flex items-center gap-2 mb-1.5">
        <span className="text-[11px] font-medium text-text-tertiary">
          {formatDate(transaction.effectiveDate)}
        </span>
        <TransactionBadge type={transaction.transactionType} />

        {/* Admin edit/delete actions */}
        {isAdmin && !confirmingDelete && (
          <div className="ml-auto flex gap-1 opacity-0 group-hover/entry:opacity-100 transition-opacity">
            <button
              onClick={handleEdit}
              className="text-text-tertiary hover:text-trust-blue transition-colors p-1 rounded cursor-pointer"
              title="Edit transaction"
            >
              <svg
                width="13"
                height="13"
                viewBox="0 0 16 16"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
              >
                <path d="M11.5 1.5l3 3L5 14H2v-3L11.5 1.5z" />
              </svg>
            </button>
            <button
              onClick={() => setConfirmingDelete(true)}
              className="text-text-tertiary hover:text-red-600 transition-colors p-1 rounded cursor-pointer"
              title="Delete transaction"
            >
              <svg
                width="13"
                height="13"
                viewBox="0 0 16 16"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
              >
                <path d="M2 4h12M5.33 4V2.67a1.33 1.33 0 011.34-1.34h2.66a1.33 1.33 0 011.34 1.34V4M12.67 4v9.33a1.33 1.33 0 01-1.34 1.34H4.67a1.33 1.33 0 01-1.34-1.34V4" />
              </svg>
            </button>
          </div>
        )}
      </div>

      {/* Delete confirmation */}
      {confirmingDelete && (
        <div className="bg-red-50 border border-red-200 rounded-lg px-3 py-2.5 mb-2">
          <p className="text-[12px] text-red-800 mb-2">
            Delete this transaction record? This cannot be undone.
          </p>
          <div className="flex gap-2">
            <Button
              variant="secondary"
              onClick={() => setConfirmingDelete(false)}
              disabled={deleting}
            >
              Cancel
            </Button>
            <button
              onClick={handleDelete}
              disabled={deleting}
              className="text-[12px] font-medium text-white bg-red-600 hover:bg-red-700 disabled:opacity-50 px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
            >
              {deleting ? "Deleting\u2026" : "Delete"}
            </button>
          </div>
          {error && (
            <p className="text-[11px] text-red-600 mt-1.5">{error}</p>
          )}
        </div>
      )}

      {/* Transaction summary */}
      {summary && (
        <p className="text-[13px] font-medium text-text-primary leading-relaxed">
          {summary}
        </p>
      )}

      {/* Description / notes */}
      <p className={`text-[13px] leading-relaxed ${summary ? "text-text-secondary mt-0.5" : "text-text-primary"}`}>
        {transaction.description}
      </p>

      {/* Entered by */}
      <div className="text-[11px] text-text-tertiary mt-1.5">
        Entered by {transaction.createdBy}
      </div>

      {/* Attachments */}
      {transaction.attachments.length > 0 && (
        <div className="mt-2 space-y-1">
          {transaction.attachments.map((att) => (
            <button
              key={att.id}
              onClick={async () => {
                const url = await getAttachmentUrl(att.filePath);
                window.open(url, "_blank");
              }}
              className="flex items-center gap-1.5 text-[11px] text-text-secondary hover:text-trust-blue transition-colors cursor-pointer"
            >
              <svg
                width="11"
                height="11"
                viewBox="0 0 16 16"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
              >
                <path d="M8.59 1.66l-5.66 5.66a4 4 0 105.66 5.66l5.66-5.66a2.67 2.67 0 10-3.77-3.77L4.82 9.21a1.33 1.33 0 101.89 1.89l5.18-5.19" />
              </svg>
              <span className="truncate">{att.fileName}</span>
            </button>
          ))}
        </div>
      )}

      {/* Snapshot tag */}
      <button
        onClick={() =>
          dispatch({ type: "SET_AS_OF_DATE", date: transaction.effectiveDate })
        }
        className="mt-2.5 text-[11px] text-trust-blue/80 hover:text-trust-blue px-2.5 py-1 rounded-md border border-trust-blue/15 hover:border-trust-blue/30 hover:bg-trust-blue/5 transition-all cursor-pointer"
      >
        View cap table as of this date
      </button>
    </div>
  );
}
```

- [ ] **Step 2: Update `ChangeLogPanel.tsx` to pass holders and equity classes**

Add imports and pass new props. Replace the full file content:

```typescript
"use client";

import { useDashboard, useDashboardDispatch } from "@/context/DashboardContext";
import { useSelectedEntity } from "@/hooks/useSelectedEntity";
import { useChangeLog } from "@/hooks/useChangeLog";
import { ChangeLogEntry } from "./ChangeLogEntry";
import { ChangeLogFilters } from "./ChangeLogFilters";
import { Backdrop } from "@/components/ui/Backdrop";
import type { TransactionWithAttachments } from "@/data/types";

interface ChangeLogPanelProps {
  transactions: TransactionWithAttachments[];
}

export function ChangeLogPanel({ transactions }: ChangeLogPanelProps) {
  const { changeLogOpen, holders } = useDashboard();
  const { entity } = useSelectedEntity();
  const dispatch = useDashboardDispatch();
  const {
    filtered,
    typeFilter,
    setTypeFilter,
    dateFrom,
    setDateFrom,
    dateTo,
    setDateTo,
  } = useChangeLog({ transactions });

  const equityClasses = entity?.equityClasses ?? [];
  const close = () => dispatch({ type: "TOGGLE_CHANGELOG" });

  return (
    <>
      <Backdrop open={changeLogOpen} onClick={close} />
      <div
        className={`
          fixed top-0 right-0 h-screen w-[420px] max-w-[90vw]
          bg-white border-l border-border z-40
          flex flex-col overflow-hidden
          transition-transform duration-250 ease-out
          ${changeLogOpen ? "translate-x-0" : "translate-x-full"}
        `}
      >
        {/* Header */}
        <div className="px-5 py-4 border-b border-border flex items-center justify-between shrink-0">
          <h3 className="text-[15px] font-medium text-text-primary tracking-[-0.01em]">Change log</h3>
          <button
            onClick={close}
            className="text-text-tertiary hover:text-text-primary transition-colors cursor-pointer p-1.5 -mr-1.5 rounded-md hover:bg-surface-alt"
          >
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M4 4l8 8M12 4l-8 8" />
            </svg>
          </button>
        </div>

        {/* Filters */}
        <div className="px-5 py-3 border-b border-border shrink-0">
          <ChangeLogFilters
            typeFilter={typeFilter}
            onTypeChange={setTypeFilter}
            dateFrom={dateFrom}
            onDateFromChange={setDateFrom}
            dateTo={dateTo}
            onDateToChange={setDateTo}
          />
        </div>

        {/* Entries */}
        <div className="flex-1 overflow-y-auto px-5">
          {filtered.length === 0 ? (
            <div className="py-10 text-center text-sm text-text-tertiary">
              No transactions match the current filters.
            </div>
          ) : (
            filtered.map((tx) => (
              <ChangeLogEntry
                key={tx.id}
                transaction={tx}
                holders={holders}
                equityClasses={equityClasses}
              />
            ))
          )}
        </div>
      </div>
    </>
  );
}
```

- [ ] **Step 3: Build check**

Run: `npm run build`

Expected: Build succeeds.

- [ ] **Step 4: Commit**

```bash
git add src/lib/formatTransactionSummary.ts src/components/changelog/ChangeLogEntry.tsx src/components/changelog/ChangeLogPanel.tsx
git commit -m "feat: add transaction summary lines to change log entries

Each entry now shows a summary like 'New issuance of 50 Common Stock
to Evert C. Alsenz' above the notes text. Resolves holder and class
names from transaction metadata."
```

---

## Task 6: DashboardContext State Changes for Holder Sidebar

**Purpose:** Add `selectedHolderId` state and `SELECT_HOLDER`/`DESELECT_HOLDER` actions with mutual exclusion against the change log.

**Files:**
- Modify: `src/context/DashboardContext.tsx:26-42,46-70,74-168,172-183`

- [ ] **Step 1: Update DashboardState interface**

Add `selectedHolderId` to the state interface. Change lines 26-42 — add the new field after `editingTransactionId`:

After:
```typescript
  editingTransactionId: string | null;
```

Add:
```typescript
  selectedHolderId: string | null;
```

- [ ] **Step 2: Add new action types**

Add to the `DashboardAction` union (after line 70, before the closing semicolon):

```typescript
  | { type: "SELECT_HOLDER"; holderId: string }
  | { type: "DESELECT_HOLDER" }
```

- [ ] **Step 3: Update the reducer**

Add two new cases in the reducer's switch statement (before the `default` case at line 165):

```typescript
    case "SELECT_HOLDER":
      return {
        ...state,
        selectedHolderId: action.holderId,
        changeLogOpen: false,
      };

    case "DESELECT_HOLDER":
      return { ...state, selectedHolderId: null };
```

Also modify the existing `TOGGLE_CHANGELOG` case (line 96-97) to deselect holder when opening the change log:

Change from:
```typescript
    case "TOGGLE_CHANGELOG":
      return { ...state, changeLogOpen: !state.changeLogOpen };
```

To:
```typescript
    case "TOGGLE_CHANGELOG":
      return {
        ...state,
        changeLogOpen: !state.changeLogOpen,
        selectedHolderId: state.changeLogOpen ? state.selectedHolderId : null,
      };
```

- [ ] **Step 4: Update initial state**

Add `selectedHolderId: null` to the `initialState` object (after `editingTransactionId: null`):

```typescript
  selectedHolderId: null,
```

- [ ] **Step 5: Build check**

Run: `npm run build`

Expected: Build succeeds.

- [ ] **Step 6: Commit**

```bash
git add src/context/DashboardContext.tsx
git commit -m "feat: add selectedHolderId state with mutual exclusion against change log"
```

---

## Task 7: Create HolderDetailPanel Component

**Purpose:** New sliding sidebar panel that shows a holder's current holdings and transaction history.

**Files:**
- Create: `src/components/holder-detail/HolderDetailPanel.tsx`

- [ ] **Step 1: Create `src/components/holder-detail/HolderDetailPanel.tsx`**

```typescript
"use client";

import { TransactionBadge } from "@/components/changelog/TransactionBadge";
import { Backdrop } from "@/components/ui/Backdrop";
import { formatDate, formatByUnitType, formatPercent } from "@/lib/formatters";
import {
  formatTransactionSummary,
  getTransactionsForHolder,
} from "@/lib/formatTransactionSummary";
import { computeTotals } from "@/lib/computeTotals";
import { useDashboard, useDashboardDispatch } from "@/context/DashboardContext";
import { useSelectedEntity } from "@/hooks/useSelectedEntity";
import { HOLDER_TYPE_OPTIONS } from "@/lib/constants";

export function HolderDetailPanel() {
  const { selectedHolderId, holders } = useDashboard();
  const { entity, holdersWithHoldings, transactions } = useSelectedEntity();
  const dispatch = useDashboardDispatch();

  const isOpen = selectedHolderId !== null;
  const holder = holders.find((h) => h.id === selectedHolderId) ?? null;
  const hwh = holdersWithHoldings.find(
    (h) => h.holder.id === selectedHolderId
  ) ?? null;

  const equityClasses = entity?.equityClasses.filter((c) => c.isActive) ?? [];
  const totals = computeTotals(holdersWithHoldings, equityClasses);

  // Transactions involving this holder, oldest first
  const holderTransactions = selectedHolderId
    ? getTransactionsForHolder(transactions, selectedHolderId).sort(
        (a, b) =>
          new Date(a.effectiveDate).getTime() -
          new Date(b.effectiveDate).getTime()
      )
    : [];

  const close = () => dispatch({ type: "DESELECT_HOLDER" });

  const holderTypeLabel =
    HOLDER_TYPE_OPTIONS.find((o) => o.value === holder?.holderType)?.label ??
    holder?.holderType ??
    "";

  return (
    <>
      <Backdrop open={isOpen} onClick={close} />
      <div
        className={`
          fixed top-0 right-0 h-screen w-[420px] max-w-[90vw]
          bg-white border-l border-border z-40
          flex flex-col overflow-hidden
          transition-transform duration-250 ease-out
          ${isOpen ? "translate-x-0" : "translate-x-full"}
        `}
      >
        {/* Header */}
        <div className="px-5 py-4 border-b border-border shrink-0">
          <div className="flex items-start justify-between">
            <div>
              <h3 className="text-[15px] font-medium text-text-primary tracking-[-0.01em]">
                {holder?.name}
              </h3>
              {holderTypeLabel && (
                <span className="text-[11px] text-text-tertiary mt-0.5 block">
                  {holderTypeLabel}
                </span>
              )}
            </div>
            <button
              onClick={close}
              className="text-text-tertiary hover:text-text-primary transition-colors cursor-pointer p-1.5 -mr-1.5 rounded-md hover:bg-surface-alt"
            >
              <svg
                width="14"
                height="14"
                viewBox="0 0 16 16"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M4 4l8 8M12 4l-8 8" />
              </svg>
            </button>
          </div>
        </div>

        {/* Holdings summary */}
        {hwh && (
          <div className="px-5 py-3 border-b border-border shrink-0">
            <div className="text-[11px] font-medium text-text-tertiary uppercase tracking-[0.05em] mb-2">
              Current Holdings
            </div>
            <div className="space-y-1">
              {equityClasses.map((ec) => {
                const holding = hwh.holdings.find(
                  (h) => h.equityClassId === ec.id
                );
                const val = holding?.amount ?? null;
                if (val === null || val === 0) return null;
                return (
                  <div
                    key={ec.id}
                    className="flex items-center justify-between text-[13px]"
                  >
                    <span className="text-text-secondary">{ec.name}</span>
                    <span className="text-text-primary font-medium tabular-nums">
                      {formatByUnitType(val, ec.unitType)}
                    </span>
                  </div>
                );
              })}
              {/* Ownership percentage */}
              {equityClasses
                .filter((ec) => ec.unitType !== "percentage")
                .map((ec) => {
                  const holding = hwh.holdings.find(
                    (h) => h.equityClassId === ec.id
                  );
                  const val = holding?.amount ?? 0;
                  const total = totals.get(ec.id) ?? 0;
                  if (val === 0 || total === 0) return null;
                  return (
                    <div
                      key={`pct-${ec.id}`}
                      className="flex items-center justify-between text-[13px]"
                    >
                      <span className="text-text-secondary">% of Total</span>
                      <span className="text-text-primary font-medium tabular-nums">
                        {formatPercent((val / total) * 100)}
                      </span>
                    </div>
                  );
                })}
            </div>
          </div>
        )}

        {/* Transaction timeline */}
        <div className="flex-1 overflow-y-auto px-5">
          <div className="text-[11px] font-medium text-text-tertiary uppercase tracking-[0.05em] mt-3 mb-2">
            Transaction History
          </div>
          {holderTransactions.length === 0 ? (
            <div className="py-6 text-center text-[13px] text-text-tertiary">
              No transactions recorded.
            </div>
          ) : (
            holderTransactions.map((tx) => {
              const summary = formatTransactionSummary(
                tx,
                holders,
                equityClasses
              );
              return (
                <div
                  key={tx.id}
                  className="py-3 border-b border-border last:border-b-0"
                >
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[11px] font-medium text-text-tertiary">
                      {formatDate(tx.effectiveDate)}
                    </span>
                    <TransactionBadge type={tx.transactionType} />
                  </div>
                  {summary && (
                    <p className="text-[13px] font-medium text-text-primary leading-relaxed">
                      {summary}
                    </p>
                  )}
                  <p
                    className={`text-[13px] leading-relaxed ${summary ? "text-text-secondary mt-0.5" : "text-text-primary"}`}
                  >
                    {tx.description}
                  </p>
                </div>
              );
            })
          )}
        </div>
      </div>
    </>
  );
}
```

- [ ] **Step 2: Build check**

Run: `npm run build`

Expected: Build succeeds (component created but not yet rendered in page).

- [ ] **Step 3: Commit**

```bash
git add src/components/holder-detail/HolderDetailPanel.tsx
git commit -m "feat: create HolderDetailPanel sliding sidebar component"
```

---

## Task 8: CapTable Click Handler + Page Integration

**Purpose:** Make holder rows clickable and wire the `HolderDetailPanel` into the dashboard page.

**Files:**
- Modify: `src/components/dashboard/CapTable.tsx:8-11,70-81,97-113,144-147`
- Modify: `src/app/(dashboard)/page.tsx:1-184`

- [ ] **Step 1: Add `onSelectHolder` prop to `CapTable`**

In `src/components/dashboard/CapTable.tsx`, update the `CapTableProps` interface (line 8-11):

Change from:
```typescript
interface CapTableProps {
  entity: EntityWithClasses;
  holdersWithHoldings: HolderWithHoldings[];
}
```

To:
```typescript
interface CapTableProps {
  entity: EntityWithClasses;
  holdersWithHoldings: HolderWithHoldings[];
  onSelectHolder?: (holderId: string) => void;
}
```

Update the `CapTable` function signature (line 13) to destructure it:

Change from:
```typescript
export function CapTable({ entity, holdersWithHoldings }: CapTableProps) {
```

To:
```typescript
export function CapTable({ entity, holdersWithHoldings, onSelectHolder }: CapTableProps) {
```

- [ ] **Step 2: Pass `onSelectHolder` through to `HolderRow`**

Update the `HolderRow` rendering loop (lines 70-81) to pass the callback:

Change from:
```typescript
              <HolderRow
                key={hwh.holder.id}
                hwh={hwh}
                classes={classes}
                totals={totals}
                classesNeedingPercent={classesNeedingPercent}
                showCommittedCapital={entity.showCommittedCapital}
                isEven={idx % 2 === 1}
                scrolled={scrolled}
              />
```

To:
```typescript
              <HolderRow
                key={hwh.holder.id}
                hwh={hwh}
                classes={classes}
                totals={totals}
                classesNeedingPercent={classesNeedingPercent}
                showCommittedCapital={entity.showCommittedCapital}
                isEven={idx % 2 === 1}
                scrolled={scrolled}
                onSelect={onSelectHolder}
              />
```

- [ ] **Step 3: Update `HolderRow` to accept and use `onSelect`**

Add `onSelect` to the HolderRow props type (around line 97-113). Add it to the destructured parameters:

Add to the props type:
```typescript
  onSelect?: (holderId: string) => void;
```

Add to the destructured props:
```typescript
  onSelect,
```

Then update the `<tr>` element (around line 144-147) to be clickable:

Change from:
```typescript
    <tr
      className={`${rowBg} hover:bg-trust-blue/[0.04] transition-colors duration-150 group relative`}
    >
```

To:
```typescript
    <tr
      onClick={() => onSelect?.(hwh.holder.id)}
      className={`${rowBg} hover:bg-trust-blue/[0.04] transition-colors duration-150 group relative cursor-pointer`}
    >
```

- [ ] **Step 4: Wire up in dashboard page**

In `src/app/(dashboard)/page.tsx`, add the import and render the panel.

Add to the imports (after line 9):
```typescript
import { HolderDetailPanel } from "@/components/holder-detail/HolderDetailPanel";
```

Add `useDashboardDispatch` usage — it's already imported on line 15. In the `DashboardContent` function, the `dispatch` is already available on line 28.

Update the `CapTable` usage (line 158) to pass the onSelectHolder callback:

Change from:
```typescript
          <CapTable entity={entity} holdersWithHoldings={holdersWithHoldings} />
```

To:
```typescript
          <CapTable
            entity={entity}
            holdersWithHoldings={holdersWithHoldings}
            onSelectHolder={(holderId) =>
              dispatch({ type: "SELECT_HOLDER", holderId })
            }
          />
```

Add `<HolderDetailPanel />` right after the `<ChangeLogPanel>` (after line 166):

```typescript
      <HolderDetailPanel />
```

- [ ] **Step 5: Build check**

Run: `npm run build`

Expected: Build succeeds with no errors.

- [ ] **Step 6: Commit**

```bash
git add src/components/dashboard/CapTable.tsx src/app/\(dashboard\)/page.tsx
git commit -m "feat: add clickable holder rows and wire holder detail sidebar into dashboard"
```

---

## Task 9: Final Verification

**Purpose:** Run full build and lint, start dev server, visually verify all three features.

- [ ] **Step 1: Run lint**

Run: `npm run lint`

Expected: No errors.

- [ ] **Step 2: Run full build**

Run: `npm run build`

Expected: Build succeeds.

- [ ] **Step 3: Visual verification checklist**

Start dev server (`npm run dev`) and verify in the browser:

1. **Holdings bug fix:** Check that Evert C. Alsenz shows 307,079 and Paul Becker shows 131,605 in the cap table.
2. **Rich change log:** Open the change log. Each entry should show a summary line like "New issuance of 116,980 Common Stock to Paul Becker" above the notes text.
3. **Holder sidebar:** Click on a holder row in the cap table. A sliding sidebar should appear from the right showing the holder's name, current holdings, and transaction history. The change log should close if it was open.
4. **Mutual exclusion:** With the holder sidebar open, click the change log button. The holder sidebar should close and the change log should open.

- [ ] **Step 4: Fix any issues found during visual verification**

Address any visual or functional issues discovered.

- [ ] **Step 5: Final commit if any fixes were needed**

```bash
git add -A && git commit -m "fix: address visual verification issues"
```

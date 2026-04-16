# Cap Table Dashboard: Holdings Bug Fix, Rich Change Log, Holder Sidebar

**Date:** 2026-04-16
**Status:** Draft

---

## 1. Atomic Holdings Update (Bug Fix)

### Problem

The `buildHoldingsUpdates()` function in `RecordTransactionModal.tsx` computes cumulative share amounts client-side by reading from React state (`holdings` via `useDashboard()`), adding the new delta, and sending the total via Supabase `.upsert()`. When multiple issuance transactions are recorded in quick succession, the React state can be stale — the previous transaction's state update hasn't propagated to the closure by the time the next submission's `buildHoldingsUpdates()` reads it.

**Evidence from production data:**

| Holder | Expected (from transactions) | Actual (holdings table) | Error |
|--------|------------------------------|------------------------|-------|
| Evert C. Alsenz | 307,079 | 294,794 | -12,285 |
| Paul Becker | 131,605 | 126,340 | -5,265 |
| Michael Persall | 236,216 | 236,216 | 0 (correct) |

Both incorrect holders received exactly 64% of their expected increment. Michael's was correct because his was the first additional issuance in the session.

### Solution: Atomic SQL with Delta Amounts

**New migration — `upsert_holding_delta` RPC:**

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

Key behaviors:
- New holding: inserts with delta as the initial amount
- Existing holding: atomically adds delta to current amount (server-side, no client state dependency)
- `committed_capital`: only overwrites if a non-null value is provided; preserves existing otherwise
- `holder_role`: same COALESCE logic

**New DAL function — `upsertHoldingsDelta()` in `src/lib/dal/holdings.ts`:**

```typescript
export async function upsertHoldingsDelta(
  deltas: {
    entityId: string;
    holderId: string;
    equityClassId: string;
    amountDelta: number;
    committedCapital?: number | null;
    holderRole?: string | null;
  }[]
): Promise<Holding[]> {
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
    if (data) results.push(...(Array.isArray(data) ? data : [data]).map(mapHolding));
  }
  return results;
}
```

Keep the existing `upsertHoldings()` for entity setup flows where absolute amounts are correct.

**Delta type definition:**

```typescript
interface HoldingDelta {
  entityId: string;
  holderId: string;
  equityClassId: string;
  amountDelta: number;
  committedCapital?: number | null;  // null = preserve existing
  holderRole?: string | null;        // null = preserve existing
}
```

**Changes to `RecordTransactionModal.tsx`:**

`buildHoldingsUpdates()` becomes `buildHoldingsDeltas()` and returns `HoldingDelta[]` instead of cumulative amounts:

- **Issuance:** `{ amountDelta: +amount, committedCapital: value or undefined }` (no more reading existingHolding)
- **Gift/Sale/Estate Transfer:** `{ amountDelta: -amount }` for sender, `{ amountDelta: +amount }` for receiver
- **Redemption:** `{ amountDelta: -amount }`
- **Correction:** Still returns empty (no holdings change)

For `committedCapital`: pass the form value if the user entered one, pass `undefined` if left blank (which preserves the existing value via the RPC's COALESCE logic). This prevents subsequent issuances from accidentally wiping out a previously set committed capital.

**Changes to `src/lib/dal/transactions.ts`:**

`recordTransaction()` calls `upsertHoldingsDelta()` instead of `upsertHoldings()`. Its parameter type changes from `Omit<Holding, "id">[]` to `HoldingDelta[]`. The RPC returns the full updated row (cumulative amount), so the response type remains `Holding[]`.

**Reducer (`RECORD_TRANSACTION` action):**

No change needed — the server returns the correct cumulative amount in the holdings response, and the reducer merges by ID as before.

**Data fix migration:**

```sql
UPDATE holdings SET amount = 307079
WHERE holder_id = 'a29441cd-4264-432d-98e3-19c9ee0d2bad'
  AND equity_class_id = '159f8cac-467b-4e5c-8634-4573d734a315';

UPDATE holdings SET amount = 131605
WHERE holder_id = 'ad9f84cf-3784-4926-956a-34bb29719ac3'
  AND equity_class_id = '159f8cac-467b-4e5c-8634-4573d734a315';
```

---

## 2. Rich Change Log Entries

### Problem

Each change log entry currently shows only the description (notes) text. Users want to see what the transaction actually did — who was involved, how many shares, which class — without opening the transaction for editing.

### Solution: Transaction Summary Line

**New utility — `src/lib/formatTransactionSummary.ts`:**

```typescript
export function formatTransactionSummary(
  transaction: Transaction,
  holders: Holder[],
  equityClasses: EquityClass[]
): string | null
```

Parses `transaction.metadata` and resolves IDs to names:

| Transaction Type | Summary Format |
|-----------------|----------------|
| issuance | "New issuance of {amount} {className} to {holderName}" |
| gift | "Gift of {amount} {className} from {fromName} to {toName}" |
| sale | "Sale of {amount} {className} from {fromName} to {toName}" |
| redemption | "Redemption of {amount} {className} from {holderName}" |
| estate_transfer | "Estate transfer of {amount} {className} from {fromName} to {toName}" |
| correction | "Correction" (no metadata to parse) |
| holder_update | "Holder update" |
| class_change | "Class change" |

Amounts are formatted using `formatByUnitType()` from existing formatters (respects shares vs. percentage vs. currency unit types).

Returns `null` if metadata is missing or incomplete (graceful fallback for legacy transactions).

**Changes to `ChangeLogEntry.tsx`:**

- Accept `holders` and `equityClasses` as additional props (passed down from `ChangeLogPanel`)
- Call `formatTransactionSummary()` to get the summary line
- Render summary above the description:
  - Summary: `text-[13px] font-medium text-text-primary` (medium weight)
  - Description (notes): `text-[13px] text-text-secondary leading-relaxed` (demoted to secondary)
- If summary is null, fall back to current behavior (description only)

**Changes to `ChangeLogPanel.tsx`:**

- Pass `holders` and `equityClasses` (from DashboardContext) to each `ChangeLogEntry`

---

## 3. Holder Detail Sidebar

### Problem

Users want to click on a holder row in the cap table and see a timeline of that holder's transactions — initial issuance, subsequent issuances, sales, transfers, etc.

### Solution: Sliding Holder Detail Panel

**State changes — `DashboardContext.tsx`:**

New state field: `selectedHolderId: string | null` (default: null)

New actions:
- `SELECT_HOLDER`: sets `selectedHolderId`, sets `changeLogOpen` to false (mutual exclusion)
- `DESELECT_HOLDER`: sets `selectedHolderId` to null

Modify `TOGGLE_CHANGELOG`: if opening the change log, deselect any selected holder.

**New component — `src/components/holder-detail/HolderDetailPanel.tsx`:**

Same sliding panel structure as `ChangeLogPanel`:
- Fixed position, right-0, 420px wide, max-w-[90vw], z-40
- Backdrop behind it (z-30)
- Slide transition via translate-x

**Panel content:**

1. **Header:** Holder name, holder type badge, close button
2. **Holdings summary:** Simple list of current holdings:
   - "{className}: {formattedAmount}" for each equity class where they hold a position
   - "% of Total: {percent}" if applicable
3. **Divider**
4. **Transaction timeline:** Chronological list (oldest first) of transactions involving this holder
   - Each entry uses `formatTransactionSummary()` for the summary line
   - Shows effective date and transaction type badge (same as change log)
   - Shows description/notes below the summary
   - No edit/delete buttons (those stay in the change log)

**Filtering transactions for a holder:**

A transaction involves a holder if any of these metadata fields match the holder's ID:
- `metadata.holder` (issuance, redemption)
- `metadata.fromHolder` (gift, sale, estate_transfer)
- `metadata.toHolder` (gift, sale, estate_transfer)

Utility function: `getTransactionsForHolder(transactions, holderId): Transaction[]`

**Changes to `CapTable.tsx`:**

- `HolderRow` accepts an `onSelect` callback prop
- Add `onClick` handler to the `<tr>` element
- Add `cursor-pointer` to the row styling
- Dispatch `SELECT_HOLDER` with the holder's ID

**Changes to dashboard `page.tsx`:**

- Import and render `HolderDetailPanel` alongside `ChangeLogPanel`
- Pass selected holder data (holder info, holdings, filtered transactions)

---

## Files Changed

| File | Change |
|------|--------|
| `src/lib/dal/holdings.ts` | Add `upsertHoldingsDelta()` function |
| `src/lib/dal/transactions.ts` | Use `upsertHoldingsDelta()` in `recordTransaction()` |
| `src/lib/dal/index.ts` | Export new function |
| `src/components/modals/RecordTransactionModal.tsx` | `buildHoldingsDeltas()` returns deltas, not cumulative amounts |
| `src/lib/formatTransactionSummary.ts` | New file — summary formatter |
| `src/components/changelog/ChangeLogEntry.tsx` | Add summary line above description |
| `src/components/changelog/ChangeLogPanel.tsx` | Pass holders and equity classes to entries |
| `src/context/DashboardContext.tsx` | Add `selectedHolderId`, `SELECT_HOLDER`, `DESELECT_HOLDER` actions |
| `src/components/dashboard/CapTable.tsx` | Add click handler to HolderRow |
| `src/components/holder-detail/HolderDetailPanel.tsx` | New file — holder detail sidebar |
| `src/app/(dashboard)/page.tsx` | Render HolderDetailPanel |
| Supabase migration | `upsert_holding_delta` RPC function |
| Supabase data fix | Correct Evert and Paul holdings |

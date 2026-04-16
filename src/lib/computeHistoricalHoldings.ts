import type { TransactionWithAttachments, Holding } from "@/data/types";

/**
 * Reconstructs holdings state for an entity as of a specific date
 * by replaying transactions in chronological order.
 *
 * Starts from zero and applies each transaction's effect up to and
 * including the target date. Returns an array of computed holdings.
 */
export function computeHoldingsAsOfDate(
  transactions: TransactionWithAttachments[],
  entityId: string,
  asOfDate: string
): Holding[] {
  // Filter to this entity's transactions on or before the target date, sorted ascending
  const relevantTxs = transactions
    .filter(
      (t) =>
        t.entityId === entityId && t.effectiveDate <= asOfDate
    )
    .sort(
      (a, b) =>
        new Date(a.effectiveDate).getTime() -
        new Date(b.effectiveDate).getTime()
    );

  // Map keyed by "holderId|equityClassId" -> accumulated holding
  const holdingsMap = new Map<
    string,
    {
      entityId: string;
      holderId: string;
      equityClassId: string;
      amount: number;
      committedCapital: number | null;
      holderRole: string | null;
    }
  >();

  function getKey(holderId: string, equityClassId: string) {
    return `${holderId}|${equityClassId}`;
  }

  function getOrCreate(holderId: string, equityClassId: string) {
    const key = getKey(holderId, equityClassId);
    if (!holdingsMap.has(key)) {
      holdingsMap.set(key, {
        entityId,
        holderId,
        equityClassId,
        amount: 0,
        committedCapital: null,
        holderRole: null,
      });
    }
    return holdingsMap.get(key)!;
  }

  for (const tx of relevantTxs) {
    const meta = tx.metadata;
    const amount = parseFloat(String(meta.amount ?? "0")) || 0;

    switch (tx.transactionType) {
      case "issuance": {
        const holderId = meta.holder as string;
        const classId = meta.equityClass as string;
        if (!holderId || !classId) break;
        const h = getOrCreate(holderId, classId);
        h.amount += amount;
        if (meta.capitalContribution) {
          const cc = parseFloat(String(meta.capitalContribution)) || 0;
          h.committedCapital = (h.committedCapital ?? 0) + cc;
        }
        break;
      }

      case "gift":
      case "sale":
      case "estate_transfer": {
        const fromId = meta.fromHolder as string;
        const toId = meta.toHolder as string;
        const classId = meta.equityClass as string;
        if (!fromId || !toId || !classId) break;
        const from = getOrCreate(fromId, classId);
        const to = getOrCreate(toId, classId);
        from.amount -= amount;
        to.amount += amount;
        break;
      }

      case "redemption": {
        const holderId = meta.holder as string;
        const classId = meta.equityClass as string;
        if (!holderId || !classId) break;
        const h = getOrCreate(holderId, classId);
        h.amount -= amount;
        break;
      }

      // correction and class_change may need special handling in the future
      default:
        break;
    }
  }

  return Array.from(holdingsMap.values()).map((h) => ({
    ...h,
    id: `historical-${h.holderId}-${h.equityClassId}`,
  })) as Holding[];
}

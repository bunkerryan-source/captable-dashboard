import type { EquityClass, Holding, HolderWithHoldings } from "@/data/types";

export function computeTotals(
  holders: HolderWithHoldings[],
  equityClasses: EquityClass[]
): Map<string, number> {
  const totals = new Map<string, number>();

  for (const ec of equityClasses) {
    totals.set(ec.id, 0);
  }

  for (const h of holders) {
    for (const holding of h.holdings) {
      if (holding.amount !== null) {
        const current = totals.get(holding.equityClassId) ?? 0;
        totals.set(holding.equityClassId, current + holding.amount);
      }
    }
  }

  return totals;
}

export function computeCommittedCapitalTotal(
  holders: HolderWithHoldings[]
): number {
  let total = 0;
  for (const h of holders) {
    for (const holding of h.holdings) {
      if (holding.committedCapital !== null) {
        total += holding.committedCapital;
      }
    }
  }
  return total;
}

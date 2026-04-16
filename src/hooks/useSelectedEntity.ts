"use client";

import { useSearchParams } from "next/navigation";
import { useMemo } from "react";
import { useDashboard } from "@/context/DashboardContext";
import { computeHoldingsAsOfDate } from "@/lib/computeHistoricalHoldings";
import type {
  EntityWithClasses,
  HolderWithHoldings,
  TransactionWithAttachments,
} from "@/data/types";

interface SelectedEntityData {
  entity: EntityWithClasses | null;
  holdersWithHoldings: HolderWithHoldings[];
  transactions: TransactionWithAttachments[];
  lastUpdated: string | null;
}

export function useSelectedEntity(): SelectedEntityData {
  const searchParams = useSearchParams();
  const { entities, holders, holdings, transactions, asOfDate } = useDashboard();

  const entityId = searchParams.get("entity") ?? entities[0]?.id ?? null;

  return useMemo(() => {
    const entity = entities.find((e) => e.id === entityId) ?? null;

    if (!entity) {
      return {
        entity: null,
        holdersWithHoldings: [],
        transactions: [],
        lastUpdated: null,
      };
    }

    // Get holdings: historical (replayed) or current
    const entityHoldings = asOfDate
      ? computeHoldingsAsOfDate(transactions, entity.id, asOfDate)
      : holdings.filter((h) => h.entityId === entity.id);

    // Group holdings by holder
    const holderIds = [...new Set(entityHoldings.map((h) => h.holderId))];

    const holdersWithHoldings: HolderWithHoldings[] = holderIds
      .map((holderId) => {
        const holder = holders.find((h) => h.id === holderId);
        if (!holder) return null;

        const holderHoldings = entityHoldings.filter(
          (h) => h.holderId === holderId
        );
        const role = holderHoldings[0]?.holderRole ?? null;

        return { holder, holdings: holderHoldings, role };
      })
      .filter((h): h is HolderWithHoldings => h !== null)
      // Remove holders whose position has gone to zero
      .filter((h) => h.holdings.some((hld) => (hld.amount ?? 0) > 0))
      .sort((a, b) => {
        // Pin GP/managing member to top
        const aIsGP =
          a.role?.toLowerCase().includes("general partner") ||
          a.role?.toLowerCase().includes("managing member");
        const bIsGP =
          b.role?.toLowerCase().includes("general partner") ||
          b.role?.toLowerCase().includes("managing member");
        if (aIsGP && !bIsGP) return -1;
        if (!aIsGP && bIsGP) return 1;

        // Sort by total position across all classes, descending.
        // Uses raw amount — for entities with percentage-type classes the
        // value is the percentage itself, which still orders correctly.
        const sum = (h: HolderWithHoldings) =>
          h.holdings.reduce((acc, hld) => acc + (hld.amount ?? 0), 0);
        const diff = sum(b) - sum(a);
        if (diff !== 0) return diff;
        // Tiebreak alphabetically for stable ordering
        return a.holder.name.localeCompare(b.holder.name);
      });

    // Get transactions for this entity, sorted by effective date desc
    const entityTransactions = transactions
      .filter((t) => t.entityId === entity.id)
      .sort(
        (a, b) =>
          new Date(b.effectiveDate).getTime() -
          new Date(a.effectiveDate).getTime()
      );

    const lastUpdated = entityTransactions[0]?.effectiveDate ?? null;

    return {
      entity,
      holdersWithHoldings,
      transactions: entityTransactions,
      lastUpdated,
    };
  }, [entityId, entities, holders, holdings, transactions, asOfDate]);
}

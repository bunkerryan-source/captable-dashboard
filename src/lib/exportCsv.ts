import type { EntityWithClasses, HolderWithHoldings } from "@/data/types";
import { computeTotals, computeCommittedCapitalTotal } from "./computeTotals";

function escapeCsv(value: string): string {
  if (value.includes(",") || value.includes('"') || value.includes("\n")) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

function formatNumber(value: number | null): string {
  if (value === null || value === undefined) return "";
  return String(value);
}

/**
 * Generates a CSV string from cap table data and triggers a download.
 */
export function exportCapTableCsv(
  entity: EntityWithClasses,
  holdersWithHoldings: HolderWithHoldings[],
  options?: { asOfDate?: string }
) {
  const classes = entity.equityClasses.filter((c) => c.isActive);
  const totals = computeTotals(holdersWithHoldings, classes);
  const classesNeedingPercent = classes.filter(
    (c) => c.unitType !== "percentage"
  );
  const showCommittedCapital = entity.showCommittedCapital;

  // Build header row
  const headers = ["Equity Holder"];
  for (const ec of classes) {
    headers.push(ec.name);
  }
  if (classesNeedingPercent.length > 0) {
    headers.push("% of Total");
  }
  if (showCommittedCapital) {
    headers.push("Committed Capital");
  }

  // Build data rows
  const rows: string[][] = [];
  for (const hwh of holdersWithHoldings) {
    const row: string[] = [hwh.holder.name];

    for (const ec of classes) {
      const holding = hwh.holdings.find((h) => h.equityClassId === ec.id);
      row.push(formatNumber(holding?.amount ?? null));
    }

    if (classesNeedingPercent.length > 0) {
      let pct: number | null = null;
      for (const ec of classesNeedingPercent) {
        const holding = hwh.holdings.find((h) => h.equityClassId === ec.id);
        const val = holding?.amount ?? null;
        const total = totals.get(ec.id) ?? 0;
        if (val !== null && total > 0) {
          pct = (val / total) * 100;
          break;
        }
      }
      row.push(pct !== null ? pct.toFixed(2) + "%" : "");
    }

    if (showCommittedCapital) {
      const cc = hwh.holdings.reduce<number | null>((max, h) => {
        if (h.committedCapital !== null) {
          return max !== null
            ? Math.max(max, h.committedCapital)
            : h.committedCapital;
        }
        return max;
      }, null);
      row.push(formatNumber(cc));
    }

    rows.push(row);
  }

  // Build totals row
  const totalsRow: string[] = ["Total"];
  for (const ec of classes) {
    totalsRow.push(formatNumber(totals.get(ec.id) ?? 0));
  }
  if (classesNeedingPercent.length > 0) {
    totalsRow.push("100.00%");
  }
  if (showCommittedCapital) {
    totalsRow.push(
      formatNumber(computeCommittedCapitalTotal(holdersWithHoldings))
    );
  }
  rows.push(totalsRow);

  // Assemble CSV
  const csvContent = [
    headers.map(escapeCsv).join(","),
    ...rows.map((r) => r.map(escapeCsv).join(",")),
  ].join("\n");

  // Trigger download
  const dateSuffix = options?.asOfDate ?? "current";
  const filename = `${entity.name.replace(/[^a-zA-Z0-9]+/g, "-")}-cap-table-${dateSuffix}.csv`;

  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

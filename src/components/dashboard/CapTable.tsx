"use client";

import { useRef, useEffect, useState } from "react";
import type { EntityWithClasses, EquityClass, HolderWithHoldings } from "@/data/types";
import { formatByUnitType, formatCurrency } from "@/lib/formatters";
import { computeTotals, computeCommittedCapitalTotal } from "@/lib/computeTotals";

interface CapTableProps {
  entity: EntityWithClasses;
  holdersWithHoldings: HolderWithHoldings[];
}

export function CapTable({ entity, holdersWithHoldings }: CapTableProps) {
  const classes = entity.equityClasses.filter((c) => c.isActive);
  const totals = computeTotals(holdersWithHoldings, classes);
  const committedCapitalTotal = entity.showCommittedCapital
    ? computeCommittedCapitalTotal(holdersWithHoldings)
    : 0;
  const scrollRef = useRef<HTMLDivElement>(null);
  const [scrolled, setScrolled] = useState(false);

  // Detect horizontal scroll to show pinned column shadow
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    function onScroll() {
      setScrolled((el?.scrollLeft ?? 0) > 2);
    }
    el.addEventListener("scroll", onScroll, { passive: true });
    return () => el.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div className="border border-border rounded-xl overflow-hidden bg-white shadow-sm">
      <div ref={scrollRef} className="overflow-x-auto cap-table-scroll">
        <table className="w-full border-collapse text-[13px] min-w-[580px]">
          <thead>
            <tr className="bg-surface">
              <th className={`sticky left-0 z-10 bg-surface text-left px-5 py-3 text-[11px] font-medium text-text-secondary uppercase tracking-[0.05em] border-b border-border whitespace-nowrap transition-shadow duration-150 ${scrolled ? "pinned-shadow" : ""}`}>
                Equity Holder
              </th>
              {classes.map((ec) => (
                <th
                  key={ec.id}
                  className="text-right px-5 py-3 text-[11px] font-medium text-text-secondary uppercase tracking-[0.05em] border-b border-border whitespace-nowrap"
                >
                  {ec.name}
                </th>
              ))}
              {entity.showCommittedCapital && (
                <th className="text-right px-5 py-3 text-[11px] font-medium text-text-secondary uppercase tracking-[0.05em] border-b border-border whitespace-nowrap">
                  Committed Capital
                </th>
              )}
            </tr>
          </thead>
          <tbody>
            {holdersWithHoldings.map((hwh, idx) => (
              <HolderRow
                key={hwh.holder.id}
                hwh={hwh}
                classes={classes}
                showCommittedCapital={entity.showCommittedCapital}
                isEven={idx % 2 === 1}
                scrolled={scrolled}
              />
            ))}
            <TotalsRow
              classes={classes}
              totals={totals}
              showCommittedCapital={entity.showCommittedCapital}
              committedCapitalTotal={committedCapitalTotal}
              scrolled={scrolled}
            />
          </tbody>
        </table>
      </div>
    </div>
  );
}

function HolderRow({
  hwh,
  classes,
  showCommittedCapital,
  isEven,
  scrolled,
}: {
  hwh: HolderWithHoldings;
  classes: EquityClass[];
  showCommittedCapital: boolean;
  isEven: boolean;
  scrolled: boolean;
}) {
  const rowBg = isEven ? "bg-surface-alt/50" : "bg-white";

  // Find the max committed capital across this holder's holdings
  const committedCapital = hwh.holdings.reduce<number | null>((max, h) => {
    if (h.committedCapital !== null) {
      return max !== null ? Math.max(max, h.committedCapital) : h.committedCapital;
    }
    return max;
  }, null);

  return (
    <tr className={`${rowBg} hover:bg-trust-blue/[0.04] transition-colors duration-150 group relative`}>
      <td className={`sticky left-0 z-10 ${rowBg} group-hover:bg-trust-blue/[0.04] px-5 py-3 border-b border-border transition-all duration-150 ${scrolled ? "pinned-shadow" : ""}`}>
        {/* Left accent bar on hover */}
        <div className="absolute left-0 top-0 bottom-0 w-[3px] bg-trust-blue rounded-r-full opacity-0 group-hover:opacity-100 transition-opacity duration-150" />
        <div className="font-medium text-text-primary text-[13px]">{hwh.holder.name}</div>
        {hwh.role && (
          <div className="text-[11px] text-text-tertiary mt-0.5">{hwh.role}</div>
        )}
      </td>
      {classes.map((ec) => {
        const holding = hwh.holdings.find((h) => h.equityClassId === ec.id);
        const val = holding?.amount ?? null;
        return (
          <td
            key={ec.id}
            className={`text-right px-5 py-3 border-b border-border tabular-nums ${val === null ? "text-text-tertiary" : "text-text-primary"}`}
          >
            {formatByUnitType(val, ec.unitType)}
          </td>
        );
      })}
      {showCommittedCapital && (
        <td className={`text-right px-5 py-3 border-b border-border tabular-nums ${committedCapital === null ? "text-text-tertiary" : "text-text-primary"}`}>
          {formatCurrency(committedCapital)}
        </td>
      )}
    </tr>
  );
}

function TotalsRow({
  classes,
  totals,
  showCommittedCapital,
  committedCapitalTotal,
  scrolled,
}: {
  classes: EquityClass[];
  totals: Map<string, number>;
  showCommittedCapital: boolean;
  committedCapitalTotal: number;
  scrolled: boolean;
}) {
  return (
    <tr className="bg-surface border-t-2 border-trust-blue/30">
      <td className={`sticky left-0 z-10 bg-surface px-5 py-3 font-semibold text-text-primary text-[13px] transition-shadow duration-150 ${scrolled ? "pinned-shadow" : ""}`}>
        Total
      </td>
      {classes.map((ec) => (
        <td key={ec.id} className="text-right px-5 py-3 font-semibold text-text-primary tabular-nums text-[13px]">
          {formatByUnitType(totals.get(ec.id) ?? 0, ec.unitType)}
        </td>
      ))}
      {showCommittedCapital && (
        <td className="text-right px-5 py-3 font-semibold text-text-primary tabular-nums text-[13px]">
          {formatCurrency(committedCapitalTotal)}
        </td>
      )}
    </tr>
  );
}

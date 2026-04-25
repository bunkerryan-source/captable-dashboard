"use client";

import { useRef, useEffect, useState } from "react";
import type { EntityWithClasses, EquityClass, HolderWithHoldings } from "@/data/types";
import { formatByUnitType, formatCurrency, formatPercent } from "@/lib/formatters";
import { computeTotals, computeCommittedCapitalTotal } from "@/lib/computeTotals";

interface CapTableProps {
  entity: EntityWithClasses;
  holdersWithHoldings: HolderWithHoldings[];
  onSelectHolder?: (holderId: string) => void;
}

export function CapTable({ entity, holdersWithHoldings, onSelectHolder }: CapTableProps) {
  const classes = entity.equityClasses.filter((c) => c.isActive);
  const totals = computeTotals(holdersWithHoldings, classes);
  const committedCapitalTotal = entity.showCommittedCapital
    ? computeCommittedCapitalTotal(holdersWithHoldings)
    : 0;

  // Which classes need a "% of Total" column (everything except percentage unitType)
  const classesNeedingPercent = new Set(
    classes.filter((c) => c.unitType !== "percentage").map((c) => c.id)
  );

  return (
    <>
      {/* Mobile: card layout (below sm) */}
      <div className="sm:hidden">
        <MobileCardList
          holdersWithHoldings={holdersWithHoldings}
          classes={classes}
          totals={totals}
          classesNeedingPercent={classesNeedingPercent}
          showCommittedCapital={entity.showCommittedCapital}
          committedCapitalTotal={committedCapitalTotal}
          onSelectHolder={onSelectHolder}
        />
      </div>

      {/* Tablet/desktop: table layout (sm and up) */}
      <div className="hidden sm:block">
        <DesktopTable
          classes={classes}
          totals={totals}
          holdersWithHoldings={holdersWithHoldings}
          classesNeedingPercent={classesNeedingPercent}
          showCommittedCapital={entity.showCommittedCapital}
          committedCapitalTotal={committedCapitalTotal}
          onSelectHolder={onSelectHolder}
        />
      </div>
    </>
  );
}

function DesktopTable({
  classes,
  totals,
  holdersWithHoldings,
  classesNeedingPercent,
  showCommittedCapital,
  committedCapitalTotal,
  onSelectHolder,
}: {
  classes: EquityClass[];
  totals: Map<string, number>;
  holdersWithHoldings: HolderWithHoldings[];
  classesNeedingPercent: Set<string>;
  showCommittedCapital: boolean;
  committedCapitalTotal: number;
  onSelectHolder?: (holderId: string) => void;
}) {
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
              <th
                className={`sticky left-0 z-10 bg-surface text-left px-5 py-3 text-[11px] font-medium text-text-secondary uppercase tracking-[0.05em] border-b border-border whitespace-nowrap transition-shadow duration-150 ${scrolled ? "pinned-shadow" : ""}`}
              >
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
              {classesNeedingPercent.size > 0 && (
                <th className="text-right px-5 py-3 text-[11px] font-medium text-text-secondary uppercase tracking-[0.05em] border-b border-border whitespace-nowrap">
                  % of Total
                </th>
              )}
              {showCommittedCapital && (
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
                totals={totals}
                classesNeedingPercent={classesNeedingPercent}
                showCommittedCapital={showCommittedCapital}
                isEven={idx % 2 === 1}
                scrolled={scrolled}
                onSelect={onSelectHolder}
              />
            ))}
            <TotalsRow
              classes={classes}
              totals={totals}
              classesNeedingPercent={classesNeedingPercent}
              showCommittedCapital={showCommittedCapital}
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
  totals,
  classesNeedingPercent,
  showCommittedCapital,
  isEven,
  scrolled,
  onSelect,
}: {
  hwh: HolderWithHoldings;
  classes: EquityClass[];
  totals: Map<string, number>;
  classesNeedingPercent: Set<string>;
  showCommittedCapital: boolean;
  isEven: boolean;
  scrolled: boolean;
  onSelect?: (holderId: string) => void;
}) {
  const rowBg = isEven ? "bg-surface-alt/50" : "bg-white";
  const committedCapital = getCommittedCapital(hwh);
  const holderPctValue = computeHolderPercent(hwh, classes, classesNeedingPercent, totals);

  return (
    <tr
      onClick={() => onSelect?.(hwh.holder.id)}
      className={`${rowBg} hover:bg-trust-blue/[0.04] transition-colors duration-150 group relative cursor-pointer`}
    >
      <td
        className={`sticky left-0 z-10 ${rowBg} group-hover:bg-trust-blue/[0.04] px-5 py-3 border-b border-border transition-all duration-150 ${scrolled ? "pinned-shadow" : ""}`}
      >
        {/* Left accent bar on hover */}
        <div className="absolute left-0 top-0 bottom-0 w-[3px] bg-trust-blue rounded-r-full opacity-0 group-hover:opacity-100 transition-opacity duration-150" />
        <div className="font-medium text-text-primary text-[13px]">
          {hwh.holder.name}
        </div>
        {hwh.role && (
          <div className="text-[11px] text-text-tertiary mt-0.5">
            {hwh.role}
          </div>
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
      {classesNeedingPercent.size > 0 && (
        <td
          className={`text-right px-5 py-3 border-b border-border tabular-nums ${holderPctValue === null ? "text-text-tertiary" : "text-text-primary"}`}
        >
          {holderPctValue !== null ? formatPercent(holderPctValue) : "—"}
        </td>
      )}
      {showCommittedCapital && (
        <td
          className={`text-right px-5 py-3 border-b border-border tabular-nums ${committedCapital === null ? "text-text-tertiary" : "text-text-primary"}`}
        >
          {formatCurrency(committedCapital)}
        </td>
      )}
    </tr>
  );
}

function TotalsRow({
  classes,
  totals,
  classesNeedingPercent,
  showCommittedCapital,
  committedCapitalTotal,
  scrolled,
}: {
  classes: EquityClass[];
  totals: Map<string, number>;
  classesNeedingPercent: Set<string>;
  showCommittedCapital: boolean;
  committedCapitalTotal: number;
  scrolled: boolean;
}) {
  return (
    <tr className="bg-surface border-t-2 border-trust-blue/30">
      <td
        className={`sticky left-0 z-10 bg-surface px-5 py-3 font-semibold text-text-primary text-[13px] transition-shadow duration-150 ${scrolled ? "pinned-shadow" : ""}`}
      >
        Total
      </td>
      {classes.map((ec) => (
        <td
          key={ec.id}
          className="text-right px-5 py-3 font-semibold text-text-primary tabular-nums text-[13px]"
        >
          {formatByUnitType(totals.get(ec.id) ?? 0, ec.unitType)}
        </td>
      ))}
      {classesNeedingPercent.size > 0 && (
        <td className="text-right px-5 py-3 font-semibold text-text-primary tabular-nums text-[13px]">
          {formatPercent(100)}
        </td>
      )}
      {showCommittedCapital && (
        <td className="text-right px-5 py-3 font-semibold text-text-primary tabular-nums text-[13px]">
          {formatCurrency(committedCapitalTotal)}
        </td>
      )}
    </tr>
  );
}

function MobileCardList({
  holdersWithHoldings,
  classes,
  totals,
  classesNeedingPercent,
  showCommittedCapital,
  committedCapitalTotal,
  onSelectHolder,
}: {
  holdersWithHoldings: HolderWithHoldings[];
  classes: EquityClass[];
  totals: Map<string, number>;
  classesNeedingPercent: Set<string>;
  showCommittedCapital: boolean;
  committedCapitalTotal: number;
  onSelectHolder?: (holderId: string) => void;
}) {
  return (
    <div className="border border-border rounded-xl overflow-hidden bg-white shadow-sm">
      <div className="px-4 py-2.5 bg-surface border-b border-border">
        <span className="text-[11px] font-medium text-text-secondary uppercase tracking-[0.05em]">
          Equity Holders
        </span>
      </div>
      <ul className="divide-y divide-border">
        {holdersWithHoldings.map((hwh) => (
          <MobileHolderCard
            key={hwh.holder.id}
            hwh={hwh}
            classes={classes}
            totals={totals}
            classesNeedingPercent={classesNeedingPercent}
            showCommittedCapital={showCommittedCapital}
            onSelect={onSelectHolder}
          />
        ))}
      </ul>
      <MobileTotalsCard
        classes={classes}
        totals={totals}
        classesNeedingPercent={classesNeedingPercent}
        showCommittedCapital={showCommittedCapital}
        committedCapitalTotal={committedCapitalTotal}
      />
    </div>
  );
}

function MobileHolderCard({
  hwh,
  classes,
  totals,
  classesNeedingPercent,
  showCommittedCapital,
  onSelect,
}: {
  hwh: HolderWithHoldings;
  classes: EquityClass[];
  totals: Map<string, number>;
  classesNeedingPercent: Set<string>;
  showCommittedCapital: boolean;
  onSelect?: (holderId: string) => void;
}) {
  const committedCapital = getCommittedCapital(hwh);
  const holderPctValue = computeHolderPercent(hwh, classes, classesNeedingPercent, totals);

  return (
    <li
      onClick={() => onSelect?.(hwh.holder.id)}
      className="px-4 py-3 active:bg-trust-blue/[0.06] transition-colors cursor-pointer"
    >
      <div className="flex items-baseline justify-between gap-3 mb-1.5">
        <div className="min-w-0 flex-1">
          <div className="font-medium text-text-primary text-[14px] truncate">
            {hwh.holder.name}
          </div>
          {hwh.role && (
            <div className="text-[11px] text-text-tertiary mt-0.5">
              {hwh.role}
            </div>
          )}
        </div>
        {holderPctValue !== null && (
          <div className="text-trust-blue font-semibold text-[14px] tabular-nums shrink-0">
            {formatPercent(holderPctValue)}
          </div>
        )}
      </div>
      <dl className="grid grid-cols-2 gap-x-3 gap-y-1.5 mt-2">
        {classes.map((ec) => {
          const holding = hwh.holdings.find((h) => h.equityClassId === ec.id);
          const val = holding?.amount ?? null;
          return (
            <div key={ec.id} className="flex items-baseline justify-between gap-2 min-w-0">
              <dt className="text-[11px] text-text-secondary uppercase tracking-[0.04em] truncate">
                {ec.name}
              </dt>
              <dd
                className={`text-[13px] tabular-nums shrink-0 ${val === null ? "text-text-tertiary" : "text-text-primary"}`}
              >
                {formatByUnitType(val, ec.unitType)}
              </dd>
            </div>
          );
        })}
        {showCommittedCapital && (
          <div className="flex items-baseline justify-between gap-2 col-span-2 min-w-0 pt-1.5 border-t border-border/60">
            <dt className="text-[11px] text-text-secondary uppercase tracking-[0.04em]">
              Committed Capital
            </dt>
            <dd
              className={`text-[13px] tabular-nums shrink-0 ${committedCapital === null ? "text-text-tertiary" : "text-text-primary"}`}
            >
              {formatCurrency(committedCapital)}
            </dd>
          </div>
        )}
      </dl>
    </li>
  );
}

function MobileTotalsCard({
  classes,
  totals,
  classesNeedingPercent,
  showCommittedCapital,
  committedCapitalTotal,
}: {
  classes: EquityClass[];
  totals: Map<string, number>;
  classesNeedingPercent: Set<string>;
  showCommittedCapital: boolean;
  committedCapitalTotal: number;
}) {
  return (
    <div className="bg-surface px-4 py-3 border-t-2 border-trust-blue/30">
      <div className="flex items-baseline justify-between gap-3 mb-1.5">
        <div className="font-semibold text-text-primary text-[14px]">Total</div>
        {classesNeedingPercent.size > 0 && (
          <div className="text-trust-blue font-semibold text-[14px] tabular-nums">
            {formatPercent(100)}
          </div>
        )}
      </div>
      <dl className="grid grid-cols-2 gap-x-3 gap-y-1.5 mt-2">
        {classes.map((ec) => (
          <div key={ec.id} className="flex items-baseline justify-between gap-2 min-w-0">
            <dt className="text-[11px] text-text-secondary uppercase tracking-[0.04em] truncate">
              {ec.name}
            </dt>
            <dd className="text-[13px] font-semibold text-text-primary tabular-nums shrink-0">
              {formatByUnitType(totals.get(ec.id) ?? 0, ec.unitType)}
            </dd>
          </div>
        ))}
        {showCommittedCapital && (
          <div className="flex items-baseline justify-between gap-2 col-span-2 min-w-0 pt-1.5 border-t border-border/60">
            <dt className="text-[11px] text-text-secondary uppercase tracking-[0.04em]">
              Committed Capital
            </dt>
            <dd className="text-[13px] font-semibold text-text-primary tabular-nums shrink-0">
              {formatCurrency(committedCapitalTotal)}
            </dd>
          </div>
        )}
      </dl>
    </div>
  );
}

function getCommittedCapital(hwh: HolderWithHoldings): number | null {
  return hwh.holdings.reduce<number | null>((max, h) => {
    if (h.committedCapital !== null) {
      return max !== null ? Math.max(max, h.committedCapital) : h.committedCapital;
    }
    return max;
  }, null);
}

function computeHolderPercent(
  hwh: HolderWithHoldings,
  classes: EquityClass[],
  classesNeedingPercent: Set<string>,
  totals: Map<string, number>
): number | null {
  if (classesNeedingPercent.size === 0) return null;
  for (const ec of classes) {
    if (!classesNeedingPercent.has(ec.id)) continue;
    const holding = hwh.holdings.find((h) => h.equityClassId === ec.id);
    const val = holding?.amount ?? null;
    const total = totals.get(ec.id) ?? 0;
    if (val !== null && total > 0) {
      return (val / total) * 100;
    }
  }
  return null;
}

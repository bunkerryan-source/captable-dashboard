"use client";

import { useRef } from "react";
import { Button } from "@/components/ui/Button";
import { useDashboard, useDashboardDispatch } from "@/context/DashboardContext";
import { useSelectedEntity } from "@/hooks/useSelectedEntity";
import { exportCapTableCsv } from "@/lib/exportCsv";
import { computeHoldingsAsOfDate } from "@/lib/computeHistoricalHoldings";

interface FooterBarProps {
  transactionCount: number;
}

export function FooterBar({ transactionCount }: FooterBarProps) {
  const dispatch = useDashboardDispatch();
  const { entity, holdersWithHoldings } = useSelectedEntity();
  const { holders, transactions, asOfDate } = useDashboard();
  const dateInputRef = useRef<HTMLInputElement>(null);

  function handleExportCurrent() {
    if (!entity) return;
    exportCapTableCsv(entity, holdersWithHoldings, {
      asOfDate: asOfDate ?? undefined,
    });
  }

  function handleExportAsOfDate(dateStr: string) {
    if (!entity || !dateStr) return;

    // Compute historical holdings for the chosen date
    const historicalHoldings = computeHoldingsAsOfDate(
      transactions,
      entity.id,
      dateStr
    );

    // Group into HolderWithHoldings structure
    const holderIds = [
      ...new Set(historicalHoldings.map((h) => h.holderId)),
    ];
    const historicalHwh = holderIds
      .map((holderId) => {
        const holder = holders.find((h) => h.id === holderId);
        if (!holder) return null;
        const hldgs = historicalHoldings.filter(
          (h) => h.holderId === holderId
        );
        return {
          holder,
          holdings: hldgs,
          role: hldgs[0]?.holderRole ?? null,
        };
      })
      .filter(
        (h): h is NonNullable<typeof h> => h !== null
      )
      .filter((h) => h.holdings.some((hld) => (hld.amount ?? 0) > 0));

    exportCapTableCsv(entity, historicalHwh, { asOfDate: dateStr });
  }

  return (
    <div className="flex items-center justify-between flex-wrap gap-3 pt-1">
      {/* Change Log Link */}
      <button
        onClick={() => dispatch({ type: "TOGGLE_CHANGELOG" })}
        className="flex items-center gap-1.5 text-[13px] text-trust-blue hover:text-pro-blue cursor-pointer transition-colors group"
      >
        <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path d="M2 4h12M2 8h12M2 12h8" />
        </svg>
        <span className="group-hover:underline underline-offset-2">Change log</span>
        <span className="inline-flex items-center justify-center bg-trust-blue text-white text-[10px] font-semibold w-[18px] h-[18px] rounded-full ml-0.5">
          {transactionCount}
        </span>
      </button>

      {/* Export Buttons */}
      <div className="flex items-center gap-2">
        <Button variant="secondary" size="sm" onClick={handleExportCurrent}>
          Export current
        </Button>
        <div className="relative hidden sm:inline-flex">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => dateInputRef.current?.showPicker()}
          >
            Export as of date...
          </Button>
          <input
            ref={dateInputRef}
            type="date"
            className="absolute inset-0 opacity-0 w-full h-full cursor-pointer"
            onChange={(e) => {
              if (e.target.value) {
                handleExportAsOfDate(e.target.value);
                e.target.value = "";
              }
            }}
            tabIndex={-1}
          />
        </div>
      </div>
    </div>
  );
}

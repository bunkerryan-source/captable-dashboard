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

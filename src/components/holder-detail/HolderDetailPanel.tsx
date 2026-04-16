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
  const hwh =
    holdersWithHoldings.find((h) => h.holder.id === selectedHolderId) ?? null;

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

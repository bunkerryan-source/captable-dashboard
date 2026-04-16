"use client";

import { Suspense } from "react";
import { AppHeader } from "@/components/layout/AppHeader";
import { MobileEntityBar } from "@/components/layout/MobileEntityBar";
import { FooterBar } from "@/components/layout/FooterBar";
import { MetadataRow } from "@/components/dashboard/MetadataRow";
import { CapTable } from "@/components/dashboard/CapTable";
import { ChangeLogPanel } from "@/components/changelog/ChangeLogPanel";
import { HolderDetailPanel } from "@/components/holder-detail/HolderDetailPanel";
import { RecordTransactionModal } from "@/components/modals/RecordTransactionModal";
import { AddHolderModal } from "@/components/modals/AddHolderModal";
import { EntitySetupModal } from "@/components/modals/EntitySetupModal";
import { EntitySettingsModal } from "@/components/modals/EntitySettingsModal";
import { useSelectedEntity } from "@/hooks/useSelectedEntity";
import { useDashboard, useDashboardDispatch } from "@/context/DashboardContext";
import { formatDate } from "@/lib/formatters";
import {
  fetchEntitiesWithClasses,
  fetchHolders,
  fetchHoldings,
  fetchTransactionsWithAttachments,
} from "@/lib/dal";

function DashboardContent() {
  const { entity, holdersWithHoldings, transactions, lastUpdated } =
    useSelectedEntity();
  const { loading, error, asOfDate } = useDashboard();
  const dispatch = useDashboardDispatch();

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-trust-blue/30 border-t-trust-blue rounded-full animate-spin mx-auto mb-3" />
          <p className="text-text-tertiary text-sm">Loading dashboard&hellip;</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex-1 flex items-center justify-center px-4">
        <div className="text-center max-w-md">
          <div className="w-10 h-10 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-3">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="#dc2626" strokeWidth="1.5">
              <circle cx="10" cy="10" r="8" />
              <path d="M10 6.5v4M10 13.5v.01" />
            </svg>
          </div>
          <p className="text-red-600 text-sm font-medium mb-1">Failed to load data</p>
          <p className="text-text-tertiary text-[13px] mb-4">{error}</p>
          <button
            onClick={async () => {
              dispatch({ type: "SET_LOADING", loading: true });
              try {
                const [entities, holders, holdings, transactions] = await Promise.all([
                  fetchEntitiesWithClasses(),
                  fetchHolders(),
                  fetchHoldings(),
                  fetchTransactionsWithAttachments(),
                ]);
                dispatch({ type: "INIT_DATA", entities, holders, holdings, transactions });
              } catch (err) {
                dispatch({
                  type: "SET_ERROR",
                  error: err instanceof Error ? err.message : "Failed to load data",
                });
              }
            }}
            className="text-[13px] font-medium text-trust-blue hover:text-pro-blue transition-colors cursor-pointer"
          >
            Try again
          </button>
        </div>
      </div>
    );
  }

  if (!entity) {
    return (
      <>
        <div className="flex-1 flex items-center justify-center px-4">
          <div className="text-center max-w-sm animate-fade-in-up">
            <div className="w-12 h-12 rounded-xl bg-trust-blue/10 flex items-center justify-center mx-auto mb-4">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#007cba" strokeWidth="1.5">
                <rect x="3" y="5" width="18" height="14" rx="2" />
                <path d="M3 10h18M8 5v14" />
              </svg>
            </div>
            <p className="text-text-primary text-[16px] font-medium mb-1.5">
              Welcome to Cap Table Dashboard
            </p>
            <p className="text-text-secondary text-[13px] mb-5 leading-relaxed">
              Create your first entity to start tracking equity ownership, holders, and transactions.
            </p>
            <button
              onClick={() => dispatch({ type: "OPEN_MODAL", modal: "entitySetup" })}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-trust-blue hover:bg-pro-blue text-white text-[13px] font-medium rounded-lg transition-colors cursor-pointer"
            >
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M7 3v8M3 7h8" />
              </svg>
              Create Entity
            </button>
          </div>
        </div>
        <EntitySetupModal />
      </>
    );
  }

  return (
    <>
      {/* Mobile entity selector — visible below sm */}
      <MobileEntityBar />

      {/* Key on entity.id so animations replay on entity switch */}
      <main
        key={entity.id}
        className="flex-1 max-w-[1200px] w-full mx-auto px-4 sm:px-6 py-5 space-y-4"
      >
        {/* Historical snapshot banner */}
        {asOfDate && (
          <div className="animate-fade-in-up delay-0 flex items-center gap-3 bg-amber-50 border border-amber-200 rounded-lg px-4 py-2.5">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="#b45309" strokeWidth="1.5">
              <circle cx="8" cy="8" r="6.5" />
              <path d="M8 4.5V8l2.5 1.5" />
            </svg>
            <span className="text-[13px] text-amber-800">
              Viewing cap table as of <strong>{formatDate(asOfDate)}</strong>
            </span>
            <button
              onClick={() => dispatch({ type: "SET_AS_OF_DATE", date: null })}
              className="ml-auto text-[12px] font-medium text-amber-700 hover:text-amber-900 underline underline-offset-2 cursor-pointer transition-colors"
            >
              Return to current
            </button>
          </div>
        )}

        {/* Entity name heading */}
        <div className="animate-fade-in-up delay-0">
          <h1 className="text-[20px] font-light tracking-[-0.01em] text-text-primary leading-tight">
            {entity.name}
          </h1>
        </div>

        <div className="animate-fade-in-up delay-75">
          <MetadataRow
            entity={entity}
            holderCount={holdersWithHoldings.length}
            lastUpdated={lastUpdated}
          />
        </div>

        <div className="animate-fade-in-up delay-150">
          <CapTable
            entity={entity}
            holdersWithHoldings={holdersWithHoldings}
            onSelectHolder={(holderId) =>
              dispatch({ type: "SELECT_HOLDER", holderId })
            }
          />
        </div>

        <div className="animate-fade-in-up delay-225">
          <FooterBar transactionCount={transactions.length} />
        </div>
      </main>

      <ChangeLogPanel transactions={transactions} />
      <HolderDetailPanel />
      <RecordTransactionModal />
      <AddHolderModal />
      <EntitySetupModal />
      <EntitySettingsModal />
    </>
  );
}

export default function Dashboard() {
  return (
    <div className="flex flex-col flex-1 min-h-screen bg-surface">
      <Suspense fallback={null}>
        <AppHeader />
        <DashboardContent />
      </Suspense>
    </div>
  );
}

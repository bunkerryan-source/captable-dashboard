"use client";

import { Suspense } from "react";
import { AppHeader } from "@/components/layout/AppHeader";
import { MobileEntityBar } from "@/components/layout/MobileEntityBar";
import { FooterBar } from "@/components/layout/FooterBar";
import { MetadataRow } from "@/components/dashboard/MetadataRow";
import { CapTable } from "@/components/dashboard/CapTable";
import { ChangeLogPanel } from "@/components/changelog/ChangeLogPanel";
import { RecordTransactionModal } from "@/components/modals/RecordTransactionModal";
import { AddHolderModal } from "@/components/modals/AddHolderModal";
import { EntitySetupModal } from "@/components/modals/EntitySetupModal";
import { EntitySettingsModal } from "@/components/modals/EntitySettingsModal";
import { useSelectedEntity } from "@/hooks/useSelectedEntity";

function DashboardContent() {
  const { entity, holdersWithHoldings, transactions, lastUpdated } =
    useSelectedEntity();

  if (!entity) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <p className="text-text-tertiary text-sm">No entity selected.</p>
      </div>
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
          <CapTable entity={entity} holdersWithHoldings={holdersWithHoldings} />
        </div>

        <div className="animate-fade-in-up delay-225">
          <FooterBar transactionCount={transactions.length} />
        </div>
      </main>

      <ChangeLogPanel transactions={transactions} />
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

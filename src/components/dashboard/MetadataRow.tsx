import { ENTITY_TYPE_LABELS, EQUITY_MODEL_LABELS } from "@/lib/constants";
import { formatDate } from "@/lib/formatters";
import type { EntityWithClasses } from "@/data/types";

interface MetadataRowProps {
  entity: EntityWithClasses;
  holderCount: number;
  lastUpdated: string | null;
}

function MetadataPill({ label, value }: { label: string; value: string }) {
  return (
    <span className="flex items-center gap-1.5">
      <span className="text-text-secondary">{label}</span>
      <strong className="text-text-primary font-medium">{value}</strong>
    </span>
  );
}

function Dot() {
  return <span className="w-1 h-1 rounded-full bg-border-strong shrink-0" />;
}

export function MetadataRow({ entity, holderCount, lastUpdated }: MetadataRowProps) {
  return (
    <div className="flex items-center gap-3 flex-wrap text-[13px]">
      <MetadataPill
        label="Entity type"
        value={ENTITY_TYPE_LABELS[entity.entityType] ?? entity.entityType}
      />
      <Dot />
      <MetadataPill
        label="Equity model"
        value={EQUITY_MODEL_LABELS[entity.equityModel] ?? entity.equityModel}
      />
      <Dot />
      <MetadataPill
        label="Last updated"
        value={lastUpdated ? formatDate(lastUpdated) : "\u2014"}
      />
      <Dot />
      <MetadataPill
        label="Holders"
        value={String(holderCount)}
      />
    </div>
  );
}

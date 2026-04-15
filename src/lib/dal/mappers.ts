import type { Tables, TablesInsert, Json } from "@/lib/supabase/types";
import type {
  Entity,
  EntityType,
  EquityModel,
  EquityClass,
  UnitType,
  Holder,
  HolderType,
  Holding,
  Transaction,
  TransactionType,
  TransactionAttachment,
} from "@/data/types";

// ── Entity ──

type DbEntity = Tables<"entities">;
type DbEntityInsert = TablesInsert<"entities">;

export function mapEntity(row: DbEntity): Entity {
  return {
    id: row.id,
    name: row.name,
    entityType: row.entity_type as EntityType,
    equityModel: row.equity_model as EquityModel,
    stateOfFormation: row.state_of_formation,
    dateOfFormation: row.date_of_formation,
    showCommittedCapital: row.show_committed_capital,
    notes: row.notes,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function toDbEntity(entity: Omit<Entity, "id" | "createdAt" | "updatedAt">): DbEntityInsert {
  return {
    name: entity.name,
    entity_type: entity.entityType,
    equity_model: entity.equityModel,
    state_of_formation: entity.stateOfFormation,
    date_of_formation: entity.dateOfFormation,
    show_committed_capital: entity.showCommittedCapital,
    notes: entity.notes,
  };
}

export function toDbEntityUpdate(entity: Partial<Entity>): TablesInsert<"entities"> {
  const update: Record<string, unknown> = {};
  if (entity.name !== undefined) update.name = entity.name;
  if (entity.entityType !== undefined) update.entity_type = entity.entityType;
  if (entity.equityModel !== undefined) update.equity_model = entity.equityModel;
  if (entity.stateOfFormation !== undefined) update.state_of_formation = entity.stateOfFormation;
  if (entity.dateOfFormation !== undefined) update.date_of_formation = entity.dateOfFormation;
  if (entity.showCommittedCapital !== undefined) update.show_committed_capital = entity.showCommittedCapital;
  if (entity.notes !== undefined) update.notes = entity.notes;
  return update as TablesInsert<"entities">;
}

// ── Equity Class ──

type DbEquityClass = Tables<"equity_classes">;
type DbEquityClassInsert = TablesInsert<"equity_classes">;

export function mapEquityClass(row: DbEquityClass): EquityClass {
  return {
    id: row.id,
    entityId: row.entity_id,
    name: row.name,
    displayOrder: row.display_order,
    unitType: row.unit_type as UnitType,
    isActive: row.is_active,
  };
}

export function toDbEquityClass(
  ec: Omit<EquityClass, "id"> & { entityId: string }
): DbEquityClassInsert {
  return {
    entity_id: ec.entityId,
    name: ec.name,
    display_order: ec.displayOrder,
    unit_type: ec.unitType,
    is_active: ec.isActive,
  };
}

// ── Holder ──

type DbHolder = Tables<"holders">;
type DbHolderInsert = TablesInsert<"holders">;

export function mapHolder(row: DbHolder): Holder {
  return {
    id: row.id,
    name: row.name,
    holderType: row.holder_type as HolderType,
    taxIdLastFour: row.tax_id_last_four,
    contactEmail: row.contact_email,
    notes: row.notes,
  };
}

export function toDbHolder(holder: Omit<Holder, "id">): DbHolderInsert {
  return {
    name: holder.name,
    holder_type: holder.holderType,
    tax_id_last_four: holder.taxIdLastFour,
    contact_email: holder.contactEmail,
    notes: holder.notes,
  };
}

// ── Holding ──

type DbHolding = Tables<"holdings">;
type DbHoldingInsert = TablesInsert<"holdings">;

export function mapHolding(row: DbHolding): Holding {
  return {
    id: row.id,
    entityId: row.entity_id,
    holderId: row.holder_id,
    equityClassId: row.equity_class_id,
    amount: row.amount,
    committedCapital: row.committed_capital,
    holderRole: row.holder_role,
  };
}

export function toDbHolding(holding: Omit<Holding, "id">): DbHoldingInsert {
  return {
    entity_id: holding.entityId,
    holder_id: holding.holderId,
    equity_class_id: holding.equityClassId,
    amount: holding.amount,
    committed_capital: holding.committedCapital,
    holder_role: holding.holderRole,
  };
}

// ── Transaction ──

type DbTransaction = Tables<"transactions">;
type DbTransactionInsert = TablesInsert<"transactions">;

export function mapTransaction(row: DbTransaction): Transaction {
  return {
    id: row.id,
    entityId: row.entity_id,
    transactionType: row.transaction_type as TransactionType,
    effectiveDate: row.effective_date,
    description: row.description,
    metadata: row.metadata as Record<string, unknown>,
    createdAt: row.created_at,
    createdBy: row.created_by,
  };
}

export function toDbTransaction(
  tx: Omit<Transaction, "id" | "createdAt">
): DbTransactionInsert {
  return {
    entity_id: tx.entityId,
    transaction_type: tx.transactionType,
    effective_date: tx.effectiveDate,
    description: tx.description,
    metadata: tx.metadata as unknown as Json,
    created_by: tx.createdBy,
  };
}

// ── Transaction Attachment ──

type DbAttachment = Tables<"transaction_attachments">;
type DbAttachmentInsert = TablesInsert<"transaction_attachments">;

export function mapAttachment(row: DbAttachment): TransactionAttachment {
  return {
    id: row.id,
    transactionId: row.transaction_id,
    fileName: row.file_name,
    filePath: row.file_path,
    fileSize: row.file_size,
    mimeType: row.mime_type,
  };
}

export function toDbAttachment(
  att: Omit<TransactionAttachment, "id">
): DbAttachmentInsert {
  return {
    transaction_id: att.transactionId,
    file_name: att.fileName,
    file_path: att.filePath,
    file_size: att.fileSize,
    mime_type: att.mimeType,
  };
}

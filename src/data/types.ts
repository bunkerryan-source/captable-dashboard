// Core data types matching the cap-table-dashboard spec

export type EntityType = "llc" | "lp" | "corporation" | "trust" | "other";
export type EquityModel = "percentage" | "shares";
export type UnitType = "percentage" | "shares" | "units" | "dollars";
export type HolderType =
  | "individual"
  | "trust"
  | "llc"
  | "lp"
  | "corporation"
  | "estate"
  | "esop"
  | "other";

export type TransactionType =
  | "gift"
  | "sale"
  | "redemption"
  | "issuance"
  | "estate_transfer"
  | "correction"
  | "class_change"
  | "holder_update";

export type UserRole = "admin" | "editor";

export interface Entity {
  id: string;
  name: string;
  entityType: EntityType;
  equityModel: EquityModel;
  stateOfFormation: string | null;
  dateOfFormation: string | null;
  showCommittedCapital: boolean;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface EquityClass {
  id: string;
  entityId: string;
  name: string;
  displayOrder: number;
  unitType: UnitType;
  isActive: boolean;
}

export interface Holder {
  id: string;
  name: string;
  holderType: HolderType;
  taxIdLastFour: string | null;
  contactEmail: string | null;
  notes: string | null;
}

export interface Holding {
  id: string;
  entityId: string;
  holderId: string;
  equityClassId: string;
  amount: number | null;
  committedCapital: number | null;
  holderRole: string | null;
}

export interface Transaction {
  id: string;
  entityId: string;
  transactionType: TransactionType;
  effectiveDate: string;
  description: string;
  metadata: Record<string, unknown>;
  createdAt: string;
  createdBy: string;
}

export interface TransactionAttachment {
  id: string;
  transactionId: string;
  fileName: string;
  filePath: string;
  fileSize: number;
  mimeType: string;
}

// Derived types for UI consumption

export interface EntityWithClasses extends Entity {
  equityClasses: EquityClass[];
}

export interface HolderWithHoldings {
  holder: Holder;
  holdings: Holding[];
  role: string | null;
}

export interface TransactionWithAttachments extends Transaction {
  attachments: TransactionAttachment[];
}

export interface HoldingDelta {
  entityId: string;
  holderId: string;
  equityClassId: string;
  amountDelta: number;
  committedCapital?: number | null;
  holderRole?: string | null;
}

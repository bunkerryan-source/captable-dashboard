import type { TransactionType } from "@/data/types";

export interface TransactionTypeConfig {
  label: string;
  bgColor: string;
  textColor: string;
}

export const TRANSACTION_TYPE_CONFIG: Record<
  TransactionType,
  TransactionTypeConfig
> = {
  gift: {
    label: "Gift",
    bgColor: "bg-badge-gift-bg",
    textColor: "text-badge-gift-text",
  },
  sale: {
    label: "Sale",
    bgColor: "bg-badge-sale-bg",
    textColor: "text-badge-sale-text",
  },
  redemption: {
    label: "Redemption",
    bgColor: "bg-badge-redemption-bg",
    textColor: "text-badge-redemption-text",
  },
  issuance: {
    label: "New Issuance",
    bgColor: "bg-badge-issuance-bg",
    textColor: "text-badge-issuance-text",
  },
  estate_transfer: {
    label: "Estate Transfer",
    bgColor: "bg-badge-estate-bg",
    textColor: "text-badge-estate-text",
  },
  correction: {
    label: "Correction",
    bgColor: "bg-badge-correction-bg",
    textColor: "text-badge-correction-text",
  },
  class_change: {
    label: "Class Change",
    bgColor: "bg-badge-correction-bg",
    textColor: "text-badge-correction-text",
  },
  holder_update: {
    label: "Holder Update",
    bgColor: "bg-badge-correction-bg",
    textColor: "text-badge-correction-text",
  },
};

export const ENTITY_TYPE_LABELS: Record<string, string> = {
  llc: "Limited liability company",
  lp: "Limited partnership",
  corporation: "C Corporation",
  trust: "Trust",
  other: "Other",
};

export const EQUITY_MODEL_LABELS: Record<string, string> = {
  percentage: "Percentage interests",
  shares: "Shares",
};

export const HOLDER_TYPE_OPTIONS = [
  { value: "individual", label: "Individual" },
  { value: "trust", label: "Trust" },
  { value: "llc", label: "LLC" },
  { value: "lp", label: "LP" },
  { value: "corporation", label: "Corporation" },
  { value: "estate", label: "Estate" },
  { value: "esop", label: "ESOP" },
  { value: "other", label: "Other" },
] as const;

export const ENTITY_TYPE_OPTIONS = [
  { value: "llc", label: "LLC" },
  { value: "lp", label: "Limited Partnership" },
  { value: "corporation", label: "Corporation" },
  { value: "trust", label: "Trust" },
  { value: "other", label: "Other" },
] as const;

export const UNIT_TYPE_OPTIONS = [
  { value: "percentage", label: "Percentage" },
  { value: "shares", label: "Shares" },
  { value: "units", label: "Units" },
  { value: "dollars", label: "Dollars" },
] as const;

export const LEGAL_BASIS_OPTIONS = [
  { value: "probate_order", label: "Probate order" },
  { value: "trust_succession", label: "Trust succession" },
  { value: "beneficiary_designation", label: "Beneficiary designation" },
  { value: "court_order", label: "Court order" },
  { value: "other", label: "Other" },
] as const;

export const REALLOCATION_OPTIONS = [
  { value: "pro_rata", label: "Pro rata to remaining holders" },
  { value: "retire", label: "Retire interest (reduce total)" },
  { value: "custom", label: "Custom allocation" },
] as const;

export const DILUTION_OPTIONS = [
  { value: "pro_rata", label: "Dilute all existing holders pro rata" },
  { value: "specific", label: "Dilute specific holders only" },
  { value: "from_authorized", label: "No dilution (from authorized but unissued)" },
] as const;

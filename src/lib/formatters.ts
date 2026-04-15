import type { UnitType } from "@/data/types";

export function formatPercent(value: number | null): string {
  if (value === null || value === undefined) return "\u2014";
  return `${value.toFixed(2)}%`;
}

export function formatShares(value: number | null): string {
  if (value === null || value === undefined) return "\u2014";
  return Math.round(value).toLocaleString("en-US");
}

export function formatCurrency(value: number | null): string {
  if (value === null || value === undefined) return "\u2014";
  return `$${Math.round(value).toLocaleString("en-US")}`;
}

export function formatByUnitType(
  value: number | null,
  unitType: UnitType
): string {
  if (value === null || value === undefined) return "\u2014";
  switch (unitType) {
    case "percentage":
      return formatPercent(value);
    case "shares":
    case "units":
      return formatShares(value);
    case "dollars":
      return formatCurrency(value);
    default:
      return String(value);
  }
}

export function formatDate(dateStr: string): string {
  const date = new Date(dateStr + "T00:00:00");
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function formatDateLong(dateStr: string): string {
  const date = new Date(dateStr + "T00:00:00");
  return date.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

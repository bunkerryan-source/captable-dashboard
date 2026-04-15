"use client";

import type { TransactionType } from "@/data/types";
import { TRANSACTION_TYPE_CONFIG } from "@/lib/constants";

interface ChangeLogFiltersProps {
  typeFilter: TransactionType | "all";
  onTypeChange: (type: TransactionType | "all") => void;
  dateFrom: string;
  onDateFromChange: (date: string) => void;
  dateTo: string;
  onDateToChange: (date: string) => void;
}

export function ChangeLogFilters({
  typeFilter,
  onTypeChange,
  dateFrom,
  onDateFromChange,
  dateTo,
  onDateToChange,
}: ChangeLogFiltersProps) {
  const typeOptions: { value: TransactionType | "all"; label: string }[] = [
    { value: "all", label: "All types" },
    ...Object.entries(TRANSACTION_TYPE_CONFIG)
      .filter(([key]) => key !== "class_change" && key !== "holder_update")
      .map(([value, config]) => ({
        value: value as TransactionType,
        label: config.label,
      })),
  ];

  return (
    <div className="flex items-center gap-2 flex-wrap">
      <select
        value={typeFilter}
        onChange={(e) => onTypeChange(e.target.value as TransactionType | "all")}
        className="text-xs px-2 py-1.5 border border-border rounded-lg bg-white text-text-primary focus:outline-none focus:ring-1 focus:ring-trust-blue/20 cursor-pointer"
      >
        {typeOptions.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      <input
        type="date"
        value={dateFrom}
        onChange={(e) => onDateFromChange(e.target.value)}
        placeholder="From"
        className="text-xs px-2 py-1.5 border border-border rounded-lg bg-white text-text-primary focus:outline-none focus:ring-1 focus:ring-trust-blue/20 w-[120px]"
      />
      <span className="text-xs text-text-tertiary">to</span>
      <input
        type="date"
        value={dateTo}
        onChange={(e) => onDateToChange(e.target.value)}
        placeholder="To"
        className="text-xs px-2 py-1.5 border border-border rounded-lg bg-white text-text-primary focus:outline-none focus:ring-1 focus:ring-trust-blue/20 w-[120px]"
      />
    </div>
  );
}

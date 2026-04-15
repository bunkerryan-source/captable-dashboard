"use client";

import { useMemo, useState } from "react";
import type { TransactionType, TransactionWithAttachments } from "@/data/types";

interface UseChangeLogOptions {
  transactions: TransactionWithAttachments[];
}

export function useChangeLog({ transactions }: UseChangeLogOptions) {
  const [typeFilter, setTypeFilter] = useState<TransactionType | "all">("all");
  const [dateFrom, setDateFrom] = useState<string>("");
  const [dateTo, setDateTo] = useState<string>("");

  const filtered = useMemo(() => {
    return transactions.filter((t) => {
      if (typeFilter !== "all" && t.transactionType !== typeFilter) return false;
      if (dateFrom && t.effectiveDate < dateFrom) return false;
      if (dateTo && t.effectiveDate > dateTo) return false;
      return true;
    });
  }, [transactions, typeFilter, dateFrom, dateTo]);

  return {
    filtered,
    typeFilter,
    setTypeFilter,
    dateFrom,
    setDateFrom,
    dateTo,
    setDateTo,
  };
}

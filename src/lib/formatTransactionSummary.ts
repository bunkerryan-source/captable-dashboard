import type { Transaction, Holder, EquityClass } from "@/data/types";
import { formatByUnitType } from "./formatters";

/**
 * Build a human-readable summary from transaction metadata.
 * Returns null if metadata is missing or incomplete.
 */
export function formatTransactionSummary(
  transaction: Transaction,
  holders: Holder[],
  equityClasses: EquityClass[]
): string | null {
  const meta = transaction.metadata;
  if (!meta) return null;

  const holderName = (id: unknown) =>
    holders.find((h) => h.id === id)?.name ?? null;

  const className = (id: unknown) => {
    const ec = equityClasses.find((c) => c.id === id);
    return ec ? ec.name : null;
  };

  const formattedAmount = (rawAmount: unknown, classId: unknown) => {
    const num =
      typeof rawAmount === "string"
        ? parseFloat(rawAmount.replace(/[$,%\s]/g, ""))
        : Number(rawAmount);
    if (isNaN(num)) return null;
    const ec = equityClasses.find((c) => c.id === classId);
    return ec
      ? formatByUnitType(num, ec.unitType)
      : num.toLocaleString("en-US");
  };

  switch (transaction.transactionType) {
    case "issuance": {
      const name = holderName(meta.holder);
      const cls = className(meta.equityClass);
      const amt = formattedAmount(meta.amount, meta.equityClass);
      if (!name || !cls || !amt) return null;
      return `New issuance of ${amt} ${cls} to ${name}`;
    }

    case "gift": {
      const from = holderName(meta.fromHolder);
      const to = holderName(meta.toHolder);
      const cls = className(meta.equityClass);
      const amt = formattedAmount(meta.amount, meta.equityClass);
      if (!from || !to || !cls || !amt) return null;
      return `Gift of ${amt} ${cls} from ${from} to ${to}`;
    }

    case "sale": {
      const from = holderName(meta.fromHolder);
      const to = holderName(meta.toHolder);
      const cls = className(meta.equityClass);
      const amt = formattedAmount(meta.amount, meta.equityClass);
      if (!from || !to || !cls || !amt) return null;
      return `Sale of ${amt} ${cls} from ${from} to ${to}`;
    }

    case "redemption": {
      const name = holderName(meta.holder);
      const cls = className(meta.equityClass);
      const amt = formattedAmount(meta.amount, meta.equityClass);
      if (!name || !cls || !amt) return null;
      return `Redemption of ${amt} ${cls} from ${name}`;
    }

    case "estate_transfer": {
      const from = holderName(meta.fromHolder);
      const to = holderName(meta.toHolder);
      const cls = className(meta.equityClass);
      const amt = formattedAmount(meta.amount, meta.equityClass);
      if (!from || !to || !cls || !amt) return null;
      return `Estate transfer of ${amt} ${cls} from ${from} to ${to}`;
    }

    case "correction":
      return "Correction";

    case "holder_update":
      return "Holder update";

    case "class_change":
      return "Class change";

    default:
      return null;
  }
}

/**
 * Filter transactions to those involving a specific holder.
 * Checks metadata fields: holder, fromHolder, toHolder.
 */
export function getTransactionsForHolder(
  transactions: Transaction[],
  holderId: string
): Transaction[] {
  return transactions.filter((tx) => {
    const meta = tx.metadata;
    if (!meta) return false;
    return (
      meta.holder === holderId ||
      meta.fromHolder === holderId ||
      meta.toHolder === holderId
    );
  });
}

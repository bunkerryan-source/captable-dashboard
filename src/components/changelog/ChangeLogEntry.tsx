import { TransactionBadge } from "./TransactionBadge";
import { formatDate } from "@/lib/formatters";
import type { TransactionWithAttachments } from "@/data/types";

interface ChangeLogEntryProps {
  transaction: TransactionWithAttachments;
}

export function ChangeLogEntry({ transaction }: ChangeLogEntryProps) {
  return (
    <div className="py-3.5 border-b border-border last:border-b-0">
      {/* Date + Badge row */}
      <div className="flex items-center gap-2 mb-1.5">
        <span className="text-[11px] font-medium text-text-tertiary">
          {formatDate(transaction.effectiveDate)}
        </span>
        <TransactionBadge type={transaction.transactionType} />
      </div>

      {/* Description */}
      <p className="text-[13px] text-text-primary leading-relaxed">
        {transaction.description}
      </p>

      {/* Entered by */}
      <div className="text-[11px] text-text-tertiary mt-1.5">
        Entered by {transaction.createdBy}
      </div>

      {/* Attachments */}
      {transaction.attachments.length > 0 && (
        <div className="mt-2 space-y-1">
          {transaction.attachments.map((att) => (
            <div
              key={att.id}
              className="flex items-center gap-1.5 text-[11px] text-text-secondary hover:text-trust-blue transition-colors cursor-pointer"
            >
              <svg width="11" height="11" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M8.59 1.66l-5.66 5.66a4 4 0 105.66 5.66l5.66-5.66a2.67 2.67 0 10-3.77-3.77L4.82 9.21a1.33 1.33 0 101.89 1.89l5.18-5.19" />
              </svg>
              <span className="truncate">{att.fileName}</span>
            </div>
          ))}
        </div>
      )}

      {/* Snapshot tag */}
      <button className="mt-2.5 text-[11px] text-trust-blue/80 hover:text-trust-blue px-2.5 py-1 rounded-md border border-trust-blue/15 hover:border-trust-blue/30 hover:bg-trust-blue/5 transition-all cursor-pointer">
        View cap table as of this date
      </button>
    </div>
  );
}

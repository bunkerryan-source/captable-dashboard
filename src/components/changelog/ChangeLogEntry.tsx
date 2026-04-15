"use client";

import { useState } from "react";
import { TransactionBadge } from "./TransactionBadge";
import { formatDate } from "@/lib/formatters";
import { Button } from "@/components/ui/Button";
import { useDashboardDispatch } from "@/context/DashboardContext";
import { useAuth } from "@/context/AuthContext";
import { deleteTransaction as dalDeleteTransaction } from "@/lib/dal";
import type { TransactionWithAttachments } from "@/data/types";

interface ChangeLogEntryProps {
  transaction: TransactionWithAttachments;
}

export function ChangeLogEntry({ transaction }: ChangeLogEntryProps) {
  const dispatch = useDashboardDispatch();
  const { role } = useAuth();
  const isAdmin = role === "admin";

  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function handleEdit() {
    dispatch({
      type: "SET_EDITING_TRANSACTION",
      transactionId: transaction.id,
    });
    dispatch({ type: "OPEN_MODAL", modal: "recordTransaction" });
  }

  async function handleDelete() {
    setDeleting(true);
    setError(null);
    try {
      await dalDeleteTransaction(transaction.id);
      dispatch({ type: "DELETE_TRANSACTION", transactionId: transaction.id });
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to delete transaction"
      );
      setDeleting(false);
      setConfirmingDelete(false);
    }
  }

  return (
    <div className="py-3.5 border-b border-border last:border-b-0 group/entry">
      {/* Date + Badge + Actions row */}
      <div className="flex items-center gap-2 mb-1.5">
        <span className="text-[11px] font-medium text-text-tertiary">
          {formatDate(transaction.effectiveDate)}
        </span>
        <TransactionBadge type={transaction.transactionType} />

        {/* Admin edit/delete actions */}
        {isAdmin && !confirmingDelete && (
          <div className="ml-auto flex gap-1 opacity-0 group-hover/entry:opacity-100 transition-opacity">
            <button
              onClick={handleEdit}
              className="text-text-tertiary hover:text-trust-blue transition-colors p-1 rounded cursor-pointer"
              title="Edit transaction"
            >
              <svg
                width="13"
                height="13"
                viewBox="0 0 16 16"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
              >
                <path d="M11.5 1.5l3 3L5 14H2v-3L11.5 1.5z" />
              </svg>
            </button>
            <button
              onClick={() => setConfirmingDelete(true)}
              className="text-text-tertiary hover:text-red-600 transition-colors p-1 rounded cursor-pointer"
              title="Delete transaction"
            >
              <svg
                width="13"
                height="13"
                viewBox="0 0 16 16"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
              >
                <path d="M2 4h12M5.33 4V2.67a1.33 1.33 0 011.34-1.34h2.66a1.33 1.33 0 011.34 1.34V4M12.67 4v9.33a1.33 1.33 0 01-1.34 1.34H4.67a1.33 1.33 0 01-1.34-1.34V4" />
              </svg>
            </button>
          </div>
        )}
      </div>

      {/* Delete confirmation */}
      {confirmingDelete && (
        <div className="bg-red-50 border border-red-200 rounded-lg px-3 py-2.5 mb-2">
          <p className="text-[12px] text-red-800 mb-2">
            Delete this transaction record? This cannot be undone.
          </p>
          <div className="flex gap-2">
            <Button
              variant="secondary"
              onClick={() => setConfirmingDelete(false)}
              disabled={deleting}
            >
              Cancel
            </Button>
            <button
              onClick={handleDelete}
              disabled={deleting}
              className="text-[12px] font-medium text-white bg-red-600 hover:bg-red-700 disabled:opacity-50 px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
            >
              {deleting ? "Deleting\u2026" : "Delete"}
            </button>
          </div>
          {error && (
            <p className="text-[11px] text-red-600 mt-1.5">{error}</p>
          )}
        </div>
      )}

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
              <svg
                width="11"
                height="11"
                viewBox="0 0 16 16"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
              >
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

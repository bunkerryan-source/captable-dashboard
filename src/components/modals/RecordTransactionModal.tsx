"use client";

import { useState } from "react";
import { ModalShell } from "./ModalShell";
import { PillSelector } from "@/components/ui/PillSelector";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { FileUploadZone } from "@/components/ui/FileUploadZone";
import { Button } from "@/components/ui/Button";
import { GiftFields } from "./transaction-fields/GiftFields";
import { SaleFields } from "./transaction-fields/SaleFields";
import { RedemptionFields } from "./transaction-fields/RedemptionFields";
import { IssuanceFields } from "./transaction-fields/IssuanceFields";
import { EstateTransferFields } from "./transaction-fields/EstateTransferFields";
import { CorrectionFields } from "./transaction-fields/CorrectionFields";
import { useModal } from "@/hooks/useModal";
import { useSelectedEntity } from "@/hooks/useSelectedEntity";
import { useDashboard, useDashboardDispatch } from "@/context/DashboardContext";
import { useAuth } from "@/context/AuthContext";
import { recordTransaction as dalRecordTransaction } from "@/lib/dal";

type TxType = "gift" | "sale" | "redemption" | "issuance" | "estate_transfer" | "correction";

const TX_TYPE_OPTIONS: { value: TxType; label: string }[] = [
  { value: "gift", label: "Gift" },
  { value: "sale", label: "Sale" },
  { value: "redemption", label: "Redemption" },
  { value: "issuance", label: "New Issuance" },
  { value: "estate_transfer", label: "Estate Transfer" },
  { value: "correction", label: "Correction" },
];

export function RecordTransactionModal() {
  const { isOpen, close } = useModal("recordTransaction");
  const { entity, holdersWithHoldings } = useSelectedEntity();
  const { holders } = useDashboard();
  const dispatch = useDashboardDispatch();
  const { displayName } = useAuth();

  const [txType, setTxType] = useState<TxType>("gift");
  const [effectiveDate, setEffectiveDate] = useState(new Date().toISOString().split("T")[0]);
  const [description, setDescription] = useState("");
  const [fieldValues, setFieldValues] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!entity) return null;

  // Build holder options from the entity's current holders
  const entityHolderIds = [...new Set(holdersWithHoldings.map((h) => h.holder.id))];
  const holderOptions = entityHolderIds
    .map((id) => {
      const holder = holders.find((h) => h.id === id);
      return holder ? { value: holder.id, label: holder.name } : null;
    })
    .filter((h): h is { value: string; label: string } => h !== null)
    .sort((a, b) => a.label.localeCompare(b.label));

  function handleFieldChange(field: string, value: string) {
    setFieldValues((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit() {
    if (!description.trim()) return;
    setSubmitting(true);
    setError(null);

    try {
      const result = await dalRecordTransaction(
        {
          entityId: entity!.id,
          transactionType: txType,
          effectiveDate,
          description: description.trim(),
          metadata: { ...fieldValues },
          createdBy: displayName ?? "Unknown",
        },
        []
      );

      dispatch({
        type: "RECORD_TRANSACTION",
        transaction: result.transaction,
        holdingsUpdates: result.holdings,
      });

      resetForm();
      close();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to record transaction");
    } finally {
      setSubmitting(false);
    }
  }

  function resetForm() {
    setTxType("gift");
    setEffectiveDate(new Date().toISOString().split("T")[0]);
    setDescription("");
    setFieldValues({});
    setError(null);
  }

  function handleClose() {
    resetForm();
    close();
  }

  return (
    <ModalShell
      open={isOpen}
      onClose={handleClose}
      title="Record transaction"
      footer={
        <>
          <Button variant="secondary" onClick={handleClose}>
            Cancel
          </Button>
          <Button variant="secondary" onClick={handleSubmit} disabled={submitting}>
            Save as Draft
          </Button>
          <Button
            variant="primary"
            onClick={handleSubmit}
            disabled={!description.trim() || submitting}
          >
            {submitting ? "Recording\u2026" : "Record Transaction"}
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        {/* Entity badge */}
        <div className="text-xs text-text-secondary bg-surface px-2.5 py-1 rounded-lg inline-block">
          {entity.name}
        </div>

        {/* Transaction type */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-medium text-text-secondary uppercase tracking-[0.03em]">
            Transaction Type
          </label>
          <PillSelector
            options={TX_TYPE_OPTIONS}
            value={txType}
            onChange={(v) => {
              setTxType(v);
              setFieldValues({});
            }}
          />
        </div>

        {/* Effective date */}
        <Input
          label="Effective Date"
          type="date"
          value={effectiveDate}
          onChange={(e) => setEffectiveDate(e.target.value)}
        />

        {/* Type-specific fields */}
        {txType === "gift" && (
          <GiftFields
            holders={holderOptions}
            equityClasses={entity.equityClasses}
            values={fieldValues}
            onChange={handleFieldChange}
          />
        )}
        {txType === "sale" && (
          <SaleFields
            holders={holderOptions}
            equityClasses={entity.equityClasses}
            values={fieldValues}
            onChange={handleFieldChange}
          />
        )}
        {txType === "redemption" && (
          <RedemptionFields
            holders={holderOptions}
            equityClasses={entity.equityClasses}
            values={fieldValues}
            onChange={handleFieldChange}
          />
        )}
        {txType === "issuance" && (
          <IssuanceFields
            holders={holderOptions}
            equityClasses={entity.equityClasses}
            values={fieldValues}
            onChange={handleFieldChange}
          />
        )}
        {txType === "estate_transfer" && (
          <EstateTransferFields
            holders={holderOptions}
            equityClasses={entity.equityClasses}
            values={fieldValues}
            onChange={handleFieldChange}
          />
        )}
        {txType === "correction" && (
          <CorrectionFields
            holders={holderOptions}
            equityClasses={entity.equityClasses}
            values={fieldValues}
            onChange={handleFieldChange}
          />
        )}

        {/* Divider */}
        <div className="border-t border-border pt-4 mt-5">
          <span className="text-[11px] font-medium text-text-tertiary uppercase tracking-[0.05em]">
            Notes & Attachments
          </span>
        </div>

        {/* Description */}
        <Textarea
          label="Description"
          placeholder="Describe what happened and why. This becomes the log entry."
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />

        {/* File upload */}
        <FileUploadZone />

        {error && (
          <div className="text-[13px] text-red-600 bg-red-50 px-3 py-2 rounded-lg">
            {error}
          </div>
        )}
      </div>
    </ModalShell>
  );
}

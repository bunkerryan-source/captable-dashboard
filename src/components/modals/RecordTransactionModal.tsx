"use client";

import { useState, useEffect } from "react";
import { ModalShell } from "./ModalShell";
import { PillSelector } from "@/components/ui/PillSelector";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
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
import {
  recordTransaction as dalRecordTransaction,
  updateTransaction as dalUpdateTransaction,
  addHolder as dalAddHolder,
  uploadAttachments as dalUploadAttachments,
} from "@/lib/dal";
import { HOLDER_TYPE_OPTIONS } from "@/lib/constants";
import type { Holder, Holding } from "@/data/types";

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
  const { entity } = useSelectedEntity();
  const { holders, holdings, transactions, editingTransactionId } = useDashboard();
  const dispatch = useDashboardDispatch();
  const { displayName } = useAuth();

  const [txType, setTxType] = useState<TxType>("gift");
  const [effectiveDate, setEffectiveDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [description, setDescription] = useState("");
  const [fieldValues, setFieldValues] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // File attachment state
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);

  // Inline "add holder" state
  const [addingHolderForField, setAddingHolderForField] = useState<string | null>(null);
  const [newHolderName, setNewHolderName] = useState("");
  const [newHolderType, setNewHolderType] = useState("individual");
  const [addingHolder, setAddingHolder] = useState(false);

  const isEditing = editingTransactionId !== null;

  // Pre-populate form when editing
  useEffect(() => {
    if (isOpen && editingTransactionId) {
      const tx = transactions.find((t) => t.id === editingTransactionId);
      if (tx) {
        setTxType(tx.transactionType as TxType);
        setEffectiveDate(tx.effectiveDate);
        setDescription(tx.description);
        setFieldValues({ ...(tx.metadata as Record<string, string>) });
      }
    }
  }, [isOpen, editingTransactionId, transactions]);

  // Active equity classes for auto-selection
  const activeClasses = entity?.equityClasses.filter((c) => c.isActive) ?? [];

  // Auto-select equity class when there's only one active class.
  // Must re-run when txType changes (PillSelector onChange clears fieldValues)
  // and when the modal opens.
  useEffect(() => {
    if (isOpen && activeClasses.length === 1 && !fieldValues.equityClass) {
      setFieldValues((prev) => ({ ...prev, equityClass: activeClasses[0].id }));
    }
  }, [isOpen, activeClasses.length, txType]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!entity) return null;

  // All holders available for selection (not just entity holders)
  const holderOptions = holders
    .map((h) => ({ value: h.id, label: h.name }))
    .sort((a, b) => a.label.localeCompare(b.label));

  function handleFieldChange(field: string, value: string) {
    if (value === "__new__") {
      setAddingHolderForField(field);
      setNewHolderName("");
      setNewHolderType("individual");
      return;
    }
    setFieldValues((prev) => ({ ...prev, [field]: value }));
  }

  async function handleAddHolder() {
    if (!newHolderName.trim() || !addingHolderForField) return;
    setAddingHolder(true);

    try {
      const holder = await dalAddHolder({
        name: newHolderName.trim(),
        holderType: newHolderType as Holder["holderType"],
        taxIdLastFour: null,
        contactEmail: null,
        notes: null,
      });
      dispatch({ type: "ADD_HOLDER", holder });
      // Auto-select the new holder in the field that triggered the flow
      setFieldValues((prev) => ({
        ...prev,
        [addingHolderForField!]: holder.id,
      }));
      setAddingHolderForField(null);
      setNewHolderName("");
      setNewHolderType("individual");
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to add holder"
      );
    } finally {
      setAddingHolder(false);
    }
  }

  function cancelAddHolder() {
    setAddingHolderForField(null);
    setNewHolderName("");
    setNewHolderType("individual");
  }

  function parseNumericInput(value: string | undefined): number | null {
    if (!value || !value.trim()) return null;
    const cleaned = value.replace(/[$,%\s]/g, "");
    const num = parseFloat(cleaned);
    return isNaN(num) ? null : num;
  }

  function buildHoldingsUpdates(): Omit<Holding, "id">[] {
    if (!entity) return [];
    const amount = parseNumericInput(fieldValues.amount);

    switch (txType) {
      case "issuance": {
        if (!fieldValues.holder || !fieldValues.equityClass || amount === null)
          return [];

        const existingHolding = holdings.find(
          (h) =>
            h.holderId === fieldValues.holder &&
            h.equityClassId === fieldValues.equityClass &&
            h.entityId === entity.id
        );

        return [
          {
            entityId: entity.id,
            holderId: fieldValues.holder,
            equityClassId: fieldValues.equityClass,
            amount: (existingHolding?.amount ?? 0) + amount,
            committedCapital: parseNumericInput(fieldValues.capitalContribution),
            holderRole: existingHolding?.holderRole ?? null,
          },
        ];
      }

      case "gift":
      case "sale":
      case "estate_transfer": {
        if (
          !fieldValues.fromHolder ||
          !fieldValues.toHolder ||
          !fieldValues.equityClass ||
          amount === null
        )
          return [];

        const fromHolding = holdings.find(
          (h) =>
            h.holderId === fieldValues.fromHolder &&
            h.equityClassId === fieldValues.equityClass &&
            h.entityId === entity.id
        );
        const toHolding = holdings.find(
          (h) =>
            h.holderId === fieldValues.toHolder &&
            h.equityClassId === fieldValues.equityClass &&
            h.entityId === entity.id
        );

        return [
          {
            entityId: entity.id,
            holderId: fieldValues.fromHolder,
            equityClassId: fieldValues.equityClass,
            amount: (fromHolding?.amount ?? 0) - amount,
            committedCapital: fromHolding?.committedCapital ?? null,
            holderRole: fromHolding?.holderRole ?? null,
          },
          {
            entityId: entity.id,
            holderId: fieldValues.toHolder,
            equityClassId: fieldValues.equityClass,
            amount: (toHolding?.amount ?? 0) + amount,
            committedCapital: toHolding?.committedCapital ?? null,
            holderRole: toHolding?.holderRole ?? null,
          },
        ];
      }

      case "redemption": {
        if (!fieldValues.holder || !fieldValues.equityClass || amount === null)
          return [];

        const currentHolding = holdings.find(
          (h) =>
            h.holderId === fieldValues.holder &&
            h.equityClassId === fieldValues.equityClass &&
            h.entityId === entity.id
        );

        return [
          {
            entityId: entity.id,
            holderId: fieldValues.holder,
            equityClassId: fieldValues.equityClass,
            amount: (currentHolding?.amount ?? 0) - amount,
            committedCapital: currentHolding?.committedCapital ?? null,
            holderRole: currentHolding?.holderRole ?? null,
          },
        ];
      }

      default:
        return [];
    }
  }

  async function handleSubmit() {
    if (!description.trim()) return;
    setSubmitting(true);
    setError(null);

    try {
      if (isEditing && editingTransactionId) {
        // Update existing transaction
        const updated = await dalUpdateTransaction(editingTransactionId, {
          transactionType: txType,
          effectiveDate,
          description: description.trim(),
          metadata: { ...fieldValues },
        });
        dispatch({ type: "UPDATE_TRANSACTION", transaction: updated });
      } else {
        // Create new transaction + update holdings
        const result = await dalRecordTransaction(
          {
            entityId: entity!.id,
            transactionType: txType,
            effectiveDate,
            description: description.trim(),
            metadata: { ...fieldValues },
            createdBy: displayName ?? "Unknown",
          },
          buildHoldingsUpdates()
        );

        // Upload attachments if any files selected
        if (selectedFiles.length > 0) {
          const attachments = await dalUploadAttachments(
            result.transaction.id,
            selectedFiles
          );
          result.transaction.attachments = attachments;
        }

        dispatch({
          type: "RECORD_TRANSACTION",
          transaction: result.transaction,
          holdingsUpdates: result.holdings,
        });
      }

      resetForm();
      close();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to save transaction"
      );
    } finally {
      setSubmitting(false);
    }
  }

  function resetForm() {
    setTxType("gift");
    setEffectiveDate(new Date().toISOString().split("T")[0]);
    setDescription("");
    setFieldValues({});
    setSelectedFiles([]);
    setError(null);
    setAddingHolderForField(null);
    setNewHolderName("");
    setNewHolderType("individual");
    if (isEditing) {
      dispatch({ type: "SET_EDITING_TRANSACTION", transactionId: null });
    }
  }

  function handleClose() {
    resetForm();
    close();
  }

  const fieldComponentProps = {
    holders: holderOptions,
    equityClasses: entity.equityClasses,
    values: fieldValues,
    onChange: handleFieldChange,
  };

  return (
    <ModalShell
      open={isOpen}
      onClose={handleClose}
      title={isEditing ? "Edit transaction" : "Record transaction"}
      footer={
        <>
          <Button variant="secondary" onClick={handleClose}>
            Cancel
          </Button>
          {!isEditing && (
            <Button
              variant="secondary"
              onClick={handleSubmit}
              disabled={submitting}
            >
              Save as Draft
            </Button>
          )}
          <Button
            variant="primary"
            onClick={handleSubmit}
            disabled={!description.trim() || submitting}
          >
            {submitting
              ? "Saving\u2026"
              : isEditing
                ? "Save Changes"
                : "Record Transaction"}
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
        {txType === "gift" && <GiftFields {...fieldComponentProps} />}
        {txType === "sale" && <SaleFields {...fieldComponentProps} />}
        {txType === "redemption" && <RedemptionFields {...fieldComponentProps} />}
        {txType === "issuance" && <IssuanceFields {...fieldComponentProps} />}
        {txType === "estate_transfer" && (
          <EstateTransferFields {...fieldComponentProps} />
        )}
        {txType === "correction" && <CorrectionFields {...fieldComponentProps} />}

        {/* Inline add-holder form */}
        {addingHolderForField && (
          <div className="border border-trust-blue/30 bg-trust-blue/[0.03] rounded-lg p-3 space-y-3">
            <div className="text-[11px] font-medium text-trust-blue uppercase tracking-[0.05em]">
              Add New Holder
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Input
                label="Holder Name"
                placeholder="e.g., Bunker Family Trust"
                value={newHolderName}
                onChange={(e) => setNewHolderName(e.target.value)}
              />
              <Select
                label="Holder Type"
                options={HOLDER_TYPE_OPTIONS.map((o) => ({
                  value: o.value,
                  label: o.label,
                }))}
                value={newHolderType}
                onChange={(e) => setNewHolderType(e.target.value)}
              />
            </div>
            <div className="flex gap-2 justify-end">
              <Button
                variant="secondary"
                onClick={cancelAddHolder}
                disabled={addingHolder}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                onClick={handleAddHolder}
                disabled={!newHolderName.trim() || addingHolder}
              >
                {addingHolder ? "Adding\u2026" : "Add Holder"}
              </Button>
            </div>
          </div>
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
        <FileUploadZone
          onFilesSelected={(fileList) => {
            setSelectedFiles((prev) => [...prev, ...Array.from(fileList)]);
          }}
        />

        {/* Selected files list */}
        {selectedFiles.length > 0 && (
          <div className="space-y-1.5">
            {selectedFiles.map((file, idx) => (
              <div
                key={`${file.name}-${idx}`}
                className="flex items-center gap-2 text-[12px] text-text-secondary bg-surface px-2.5 py-1.5 rounded-lg"
              >
                <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M8.59 1.66l-5.66 5.66a4 4 0 105.66 5.66l5.66-5.66a2.67 2.67 0 10-3.77-3.77L4.82 9.21a1.33 1.33 0 101.89 1.89l5.18-5.19" />
                </svg>
                <span className="flex-1 truncate">{file.name}</span>
                <span className="text-text-tertiary">
                  {(file.size / 1024).toFixed(0)} KB
                </span>
                <button
                  type="button"
                  onClick={() =>
                    setSelectedFiles((prev) =>
                      prev.filter((_, i) => i !== idx)
                    )
                  }
                  className="text-text-tertiary hover:text-red-600 transition-colors cursor-pointer"
                >
                  <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <path d="M4 4l8 8M12 4l-8 8" />
                  </svg>
                </button>
              </div>
            ))}
          </div>
        )}

        {error && (
          <div className="text-[13px] text-red-600 bg-red-50 px-3 py-2 rounded-lg">
            {error}
          </div>
        )}
      </div>
    </ModalShell>
  );
}

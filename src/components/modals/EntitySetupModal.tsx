"use client";

import { useState } from "react";
import { ModalShell } from "./ModalShell";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Textarea } from "@/components/ui/Textarea";
import { Toggle } from "@/components/ui/Toggle";
import { Button } from "@/components/ui/Button";
import { useModal } from "@/hooks/useModal";
import { useDashboardDispatch } from "@/context/DashboardContext";
import { ENTITY_TYPE_OPTIONS, UNIT_TYPE_OPTIONS } from "@/lib/constants";
import { addEntity as dalAddEntity } from "@/lib/dal";
import type { EntityType, EquityModel, UnitType } from "@/data/types";

interface EquityClassRow {
  tempId: string;
  name: string;
  unitType: UnitType;
}

export function EntitySetupModal() {
  const { isOpen, close } = useModal("entitySetup");
  const dispatch = useDashboardDispatch();

  const [name, setName] = useState("");
  const [entityType, setEntityType] = useState<EntityType>("llc");
  const [equityModel, setEquityModel] = useState<EquityModel>("percentage");
  const [stateOfFormation, setStateOfFormation] = useState("");
  const [dateOfFormation, setDateOfFormation] = useState("");
  const [showCommittedCapital, setShowCommittedCapital] = useState(false);
  const [notes, setNotes] = useState("");
  const [equityClasses, setEquityClasses] = useState<EquityClassRow[]>([
    { tempId: `tmp-${Date.now()}`, name: "Membership Interest", unitType: "percentage" },
  ]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function addEquityClass() {
    setEquityClasses([
      ...equityClasses,
      { tempId: `tmp-${Date.now()}`, name: "", unitType: "percentage" },
    ]);
  }

  function updateEquityClass(idx: number, field: keyof EquityClassRow, value: string) {
    const updated = [...equityClasses];
    updated[idx] = { ...updated[idx], [field]: value };
    setEquityClasses(updated);
  }

  function removeEquityClass(idx: number) {
    if (equityClasses.length <= 1) return;
    setEquityClasses(equityClasses.filter((_, i) => i !== idx));
  }

  async function handleSubmit() {
    if (!name.trim() || equityClasses.some((ec) => !ec.name.trim())) return;
    setSubmitting(true);
    setError(null);

    try {
      const entity = await dalAddEntity({
        name: name.trim(),
        entityType,
        equityModel,
        stateOfFormation: stateOfFormation || null,
        dateOfFormation: dateOfFormation || null,
        showCommittedCapital,
        notes: notes || null,
        equityClasses: equityClasses.map((ec, idx) => ({
          id: ec.tempId,
          entityId: "",
          name: ec.name.trim(),
          displayOrder: idx + 1,
          unitType: ec.unitType,
          isActive: true,
        })),
      });
      dispatch({ type: "ADD_ENTITY", entity });
      resetForm();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create entity");
    } finally {
      setSubmitting(false);
    }
  }

  function resetForm() {
    setName("");
    setEntityType("llc");
    setEquityModel("percentage");
    setStateOfFormation("");
    setDateOfFormation("");
    setShowCommittedCapital(false);
    setNotes("");
    setEquityClasses([
      { tempId: `tmp-${Date.now()}`, name: "Membership Interest", unitType: "percentage" },
    ]);
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
      title="New entity"
      width="max-w-[580px]"
      footer={
        <>
          <Button variant="secondary" onClick={handleClose}>
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={handleSubmit}
            disabled={!name.trim() || equityClasses.some((ec) => !ec.name.trim()) || submitting}
          >
            {submitting ? "Creating\u2026" : "Create Entity"}
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <Input
          label="Entity Name"
          placeholder="e.g., ABP Real Estate Fund IV, LP"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />

        <div className="grid grid-cols-2 gap-3">
          <Select
            label="Entity Type"
            options={ENTITY_TYPE_OPTIONS.map((o) => ({ value: o.value, label: o.label }))}
            value={entityType}
            onChange={(e) => setEntityType(e.target.value as EntityType)}
          />
          <Select
            label="Equity Model"
            options={[
              { value: "percentage", label: "Percentage" },
              { value: "shares", label: "Shares" },
            ]}
            value={equityModel}
            onChange={(e) => setEquityModel(e.target.value as EquityModel)}
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Input
            label="State of Formation"
            placeholder="e.g., Delaware"
            value={stateOfFormation}
            onChange={(e) => setStateOfFormation(e.target.value)}
          />
          <Input
            label="Date of Formation"
            type="date"
            value={dateOfFormation}
            onChange={(e) => setDateOfFormation(e.target.value)}
          />
        </div>

        <Toggle
          label="Show committed capital column"
          checked={showCommittedCapital}
          onChange={setShowCommittedCapital}
        />

        <Textarea
          label="Notes"
          placeholder="Optional internal notes..."
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
        />

        {/* Equity Classes */}
        <div className="border-t border-border pt-4 mt-5">
          <span className="text-[11px] font-medium text-text-tertiary uppercase tracking-[0.05em]">
            Equity Classes
          </span>
        </div>

        <div className="space-y-2">
          {equityClasses.map((ec, idx) => (
            <div key={ec.tempId} className="flex items-end gap-2">
              <div className="flex-1">
                <Input
                  label={idx === 0 ? "Class Name" : undefined}
                  placeholder="e.g., Class A Interest"
                  value={ec.name}
                  onChange={(e) => updateEquityClass(idx, "name", e.target.value)}
                />
              </div>
              <div className="w-[140px]">
                <Select
                  label={idx === 0 ? "Unit Type" : undefined}
                  options={UNIT_TYPE_OPTIONS.map((o) => ({ value: o.value, label: o.label }))}
                  value={ec.unitType}
                  onChange={(e) => updateEquityClass(idx, "unitType", e.target.value)}
                />
              </div>
              <button
                onClick={() => removeEquityClass(idx)}
                disabled={equityClasses.length <= 1}
                className="p-2 text-text-tertiary hover:text-red-500 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer transition-colors mb-0.5"
              >
                <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M4 4l8 8M12 4l-8 8" />
                </svg>
              </button>
            </div>
          ))}
        </div>

        <button
          onClick={addEquityClass}
          className="text-[13px] text-trust-blue hover:text-pro-blue cursor-pointer transition-colors"
        >
          + Add equity class
        </button>

        {error && (
          <div className="text-[13px] text-red-600 bg-red-50 px-3 py-2 rounded-lg">
            {error}
          </div>
        )}
      </div>
    </ModalShell>
  );
}

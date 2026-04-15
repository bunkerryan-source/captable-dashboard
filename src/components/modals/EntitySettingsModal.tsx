"use client";

import { useState, useEffect } from "react";
import { ModalShell } from "./ModalShell";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Textarea } from "@/components/ui/Textarea";
import { Toggle } from "@/components/ui/Toggle";
import { Button } from "@/components/ui/Button";
import { useModal } from "@/hooks/useModal";
import { useSelectedEntity } from "@/hooks/useSelectedEntity";
import { useDashboardDispatch } from "@/context/DashboardContext";
import { ENTITY_TYPE_OPTIONS, UNIT_TYPE_OPTIONS } from "@/lib/constants";
import type { EntityType, EquityModel, UnitType } from "@/data/types";

interface EquityClassRow {
  id: string;
  name: string;
  unitType: UnitType;
}

export function EntitySettingsModal() {
  const { isOpen, close } = useModal("entitySettings");
  const { entity } = useSelectedEntity();
  const dispatch = useDashboardDispatch();

  const [name, setName] = useState("");
  const [entityType, setEntityType] = useState<EntityType>("llc");
  const [equityModel, setEquityModel] = useState<EquityModel>("percentage");
  const [stateOfFormation, setStateOfFormation] = useState("");
  const [dateOfFormation, setDateOfFormation] = useState("");
  const [showCommittedCapital, setShowCommittedCapital] = useState(false);
  const [notes, setNotes] = useState("");
  const [equityClasses, setEquityClasses] = useState<EquityClassRow[]>([]);

  // Populate form when entity changes or modal opens
  useEffect(() => {
    if (entity && isOpen) {
      setName(entity.name);
      setEntityType(entity.entityType);
      setEquityModel(entity.equityModel);
      setStateOfFormation(entity.stateOfFormation ?? "");
      setDateOfFormation(entity.dateOfFormation ?? "");
      setShowCommittedCapital(entity.showCommittedCapital);
      setNotes(entity.notes ?? "");
      setEquityClasses(
        entity.equityClasses.map((ec) => ({
          id: ec.id,
          name: ec.name,
          unitType: ec.unitType,
        }))
      );
    }
  }, [entity, isOpen]);

  if (!entity) return null;

  function addEquityClass() {
    setEquityClasses([
      ...equityClasses,
      { id: `ec-new-${Date.now()}`, name: "", unitType: "percentage" },
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

  function handleSubmit() {
    if (!name.trim() || equityClasses.some((ec) => !ec.name.trim())) return;

    dispatch({
      type: "UPDATE_ENTITY",
      entity: {
        ...entity!,
        name: name.trim(),
        entityType,
        equityModel,
        stateOfFormation: stateOfFormation || null,
        dateOfFormation: dateOfFormation || null,
        showCommittedCapital,
        notes: notes || null,
        updatedAt: new Date().toISOString(),
        equityClasses: equityClasses.map((ec, idx) => ({
          id: ec.id,
          entityId: entity!.id,
          name: ec.name.trim(),
          displayOrder: idx + 1,
          unitType: ec.unitType,
          isActive: true,
        })),
      },
    });
  }

  return (
    <ModalShell
      open={isOpen}
      onClose={close}
      title="Entity settings"
      width="max-w-[580px]"
      footer={
        <>
          <Button variant="secondary" onClick={close}>
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={handleSubmit}
            disabled={!name.trim() || equityClasses.some((ec) => !ec.name.trim())}
          >
            Save Changes
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <Input
          label="Entity Name"
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
            <div key={ec.id} className="flex items-end gap-2">
              <div className="flex-1">
                <Input
                  label={idx === 0 ? "Class Name" : undefined}
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
      </div>
    </ModalShell>
  );
}

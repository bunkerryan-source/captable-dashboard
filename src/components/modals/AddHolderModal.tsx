"use client";

import { useState } from "react";
import { ModalShell } from "./ModalShell";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Textarea } from "@/components/ui/Textarea";
import { Button } from "@/components/ui/Button";
import { useModal } from "@/hooks/useModal";
import { useDashboardDispatch } from "@/context/DashboardContext";
import { HOLDER_TYPE_OPTIONS } from "@/lib/constants";
import type { Holder } from "@/data/types";

export function AddHolderModal() {
  const { isOpen, close } = useModal("addHolder");
  const dispatch = useDashboardDispatch();

  const [name, setName] = useState("");
  const [holderType, setHolderType] = useState("individual");
  const [taxIdLastFour, setTaxIdLastFour] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [notes, setNotes] = useState("");

  function handleSubmit() {
    if (!name.trim()) return;

    const holder: Holder = {
      id: `h-${Date.now()}`,
      name: name.trim(),
      holderType: holderType as Holder["holderType"],
      taxIdLastFour: taxIdLastFour || null,
      contactEmail: contactEmail || null,
      notes: notes || null,
    };

    dispatch({ type: "ADD_HOLDER", holder });
    resetForm();
    close();
  }

  function resetForm() {
    setName("");
    setHolderType("individual");
    setTaxIdLastFour("");
    setContactEmail("");
    setNotes("");
  }

  function handleClose() {
    resetForm();
    close();
  }

  return (
    <ModalShell
      open={isOpen}
      onClose={handleClose}
      title="Add holder"
      footer={
        <>
          <Button variant="secondary" onClick={handleClose}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleSubmit} disabled={!name.trim()}>
            Add Holder
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <Input
          label="Holder Name"
          placeholder="e.g., Bunker Family Trust"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <Select
          label="Holder Type"
          options={HOLDER_TYPE_OPTIONS.map((o) => ({ value: o.value, label: o.label }))}
          value={holderType}
          onChange={(e) => setHolderType(e.target.value)}
        />
        <div className="grid grid-cols-2 gap-3">
          <Input
            label="Last 4 of Tax ID"
            placeholder="e.g., 4521"
            maxLength={4}
            value={taxIdLastFour}
            onChange={(e) => setTaxIdLastFour(e.target.value.replace(/\D/g, "").slice(0, 4))}
          />
          <Input
            label="Contact Email"
            type="email"
            placeholder="email@example.com"
            value={contactEmail}
            onChange={(e) => setContactEmail(e.target.value)}
          />
        </div>
        <Textarea
          label="Notes"
          placeholder="Optional internal notes..."
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
        />
      </div>
    </ModalShell>
  );
}

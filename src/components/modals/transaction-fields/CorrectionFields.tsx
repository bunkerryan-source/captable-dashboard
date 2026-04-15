"use client";

import { Select } from "@/components/ui/Select";
import { Input } from "@/components/ui/Input";
import type { EquityClass } from "@/data/types";

interface CorrectionFieldsProps {
  holders: { value: string; label: string }[];
  equityClasses: EquityClass[];
  values: Record<string, string>;
  onChange: (field: string, value: string) => void;
}

const WHAT_CHANGED_OPTIONS = [
  { value: "holder_name", label: "Holder name" },
  { value: "holder_role", label: "Holder role" },
  { value: "amount", label: "Amount" },
  { value: "other", label: "Other" },
];

export function CorrectionFields({ holders, equityClasses, values, onChange }: CorrectionFieldsProps) {
  const classOptions = equityClasses.map((ec) => ({ value: ec.id, label: ec.name }));
  const showEquityClass = values.whatChanged === "amount";

  return (
    <>
      <div className="grid grid-cols-2 gap-3">
        <Select
          label="What Changed"
          options={WHAT_CHANGED_OPTIONS}
          value={values.whatChanged ?? "holder_name"}
          onChange={(e) => onChange("whatChanged", e.target.value)}
        />
        <Select
          label="Holder Affected"
          placeholder="Select holder..."
          options={holders}
          value={values.holder ?? ""}
          onChange={(e) => onChange("holder", e.target.value)}
        />
      </div>
      {showEquityClass && (
        <Select
          label="Equity Class"
          placeholder={classOptions.length > 1 ? "Select class..." : undefined}
          options={classOptions}
          value={values.equityClass ?? ""}
          onChange={(e) => onChange("equityClass", e.target.value)}
        />
      )}
      <div className="grid grid-cols-2 gap-3">
        <Input
          label="Old Value"
          placeholder="Previous value"
          value={values.oldValue ?? ""}
          onChange={(e) => onChange("oldValue", e.target.value)}
        />
        <Input
          label="New Value"
          placeholder="Corrected value"
          value={values.newValue ?? ""}
          onChange={(e) => onChange("newValue", e.target.value)}
        />
      </div>
    </>
  );
}

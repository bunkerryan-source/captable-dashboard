"use client";

import { Select } from "@/components/ui/Select";
import { Input } from "@/components/ui/Input";
import { DILUTION_OPTIONS } from "@/lib/constants";
import type { EquityClass } from "@/data/types";

interface IssuanceFieldsProps {
  holders: { value: string; label: string }[];
  equityClasses: EquityClass[];
  values: Record<string, string>;
  onChange: (field: string, value: string) => void;
}

export function IssuanceFields({ holders, equityClasses, values, onChange }: IssuanceFieldsProps) {
  const classOptions = equityClasses.map((ec) => ({ value: ec.id, label: ec.name }));

  return (
    <>
      <div className="grid grid-cols-2 gap-3">
        <Select
          label="Holder"
          placeholder="Select holder..."
          options={[...holders, { value: "__new__", label: "+ Add new holder..." }]}
          value={values.holder ?? ""}
          onChange={(e) => onChange("holder", e.target.value)}
        />
        <Select
          label="Equity Class"
          options={classOptions}
          value={values.equityClass ?? ""}
          onChange={(e) => onChange("equityClass", e.target.value)}
        />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Input
          label="Amount Issued"
          placeholder="e.g., 8.00%"
          value={values.amount ?? ""}
          onChange={(e) => onChange("amount", e.target.value)}
        />
        <Input
          label="Capital Contribution ($)"
          placeholder="e.g., 2,000,000"
          value={values.capitalContribution ?? ""}
          onChange={(e) => onChange("capitalContribution", e.target.value)}
        />
      </div>
      <Select
        label="Dilution Method"
        options={DILUTION_OPTIONS.map((o) => ({ value: o.value, label: o.label }))}
        value={values.dilutionMethod ?? "pro_rata"}
        onChange={(e) => onChange("dilutionMethod", e.target.value)}
      />
    </>
  );
}

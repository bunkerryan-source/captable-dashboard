"use client";

import { Select } from "@/components/ui/Select";
import { Input } from "@/components/ui/Input";
import { LEGAL_BASIS_OPTIONS } from "@/lib/constants";
import type { EquityClass } from "@/data/types";

interface EstateTransferFieldsProps {
  holders: { value: string; label: string }[];
  equityClasses: EquityClass[];
  values: Record<string, string>;
  onChange: (field: string, value: string) => void;
}

export function EstateTransferFields({ holders, equityClasses, values, onChange }: EstateTransferFieldsProps) {
  const classOptions = equityClasses.map((ec) => ({ value: ec.id, label: ec.name }));

  return (
    <>
      <div className="grid grid-cols-2 gap-3">
        <Select
          label="From (Decedent / Estate)"
          placeholder="Select holder..."
          options={holders}
          value={values.fromHolder ?? ""}
          onChange={(e) => onChange("fromHolder", e.target.value)}
        />
        <Select
          label="To (Beneficiary / Successor)"
          placeholder="Select transferee..."
          options={[...holders, { value: "__new__", label: "+ Add new holder..." }]}
          value={values.toHolder ?? ""}
          onChange={(e) => onChange("toHolder", e.target.value)}
        />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Select
          label="Equity Class"
          placeholder={classOptions.length > 1 ? "Select class..." : undefined}
          options={classOptions}
          value={values.equityClass ?? ""}
          onChange={(e) => onChange("equityClass", e.target.value)}
        />
        <Input
          label="Amount Transferred"
          placeholder="e.g., 25.00%"
          value={values.amount ?? ""}
          onChange={(e) => onChange("amount", e.target.value)}
        />
      </div>
      <Select
        label="Legal Basis"
        options={LEGAL_BASIS_OPTIONS.map((o) => ({ value: o.value, label: o.label }))}
        value={values.legalBasis ?? "probate_order"}
        onChange={(e) => onChange("legalBasis", e.target.value)}
      />
    </>
  );
}

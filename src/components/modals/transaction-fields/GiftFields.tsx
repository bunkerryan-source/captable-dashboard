"use client";

import { Select } from "@/components/ui/Select";
import { Input } from "@/components/ui/Input";
import type { EquityClass, Holder } from "@/data/types";

interface GiftFieldsProps {
  holders: { value: string; label: string }[];
  equityClasses: EquityClass[];
  values: Record<string, string>;
  onChange: (field: string, value: string) => void;
}

export function GiftFields({ holders, equityClasses, values, onChange }: GiftFieldsProps) {
  const classOptions = equityClasses.map((ec) => ({ value: ec.id, label: ec.name }));

  return (
    <>
      <div className="grid grid-cols-2 gap-3">
        <Select
          label="From Holder"
          placeholder="Select transferor..."
          options={holders}
          value={values.fromHolder ?? ""}
          onChange={(e) => onChange("fromHolder", e.target.value)}
        />
        <Select
          label="To Holder"
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
          placeholder="e.g., 5.00%"
          value={values.amount ?? ""}
          onChange={(e) => onChange("amount", e.target.value)}
        />
      </div>
    </>
  );
}

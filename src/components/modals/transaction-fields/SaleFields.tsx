"use client";

import { Select } from "@/components/ui/Select";
import { Input } from "@/components/ui/Input";
import type { EquityClass } from "@/data/types";

interface SaleFieldsProps {
  holders: { value: string; label: string }[];
  equityClasses: EquityClass[];
  values: Record<string, string>;
  onChange: (field: string, value: string) => void;
}

export function SaleFields({ holders, equityClasses, values, onChange }: SaleFieldsProps) {
  const classOptions = equityClasses.map((ec) => ({ value: ec.id, label: ec.name }));

  return (
    <>
      <div className="grid grid-cols-2 gap-3">
        <Select
          label="From Holder (Seller)"
          placeholder="Select seller..."
          options={holders}
          value={values.fromHolder ?? ""}
          onChange={(e) => onChange("fromHolder", e.target.value)}
        />
        <Select
          label="To Holder (Buyer)"
          placeholder="Select buyer..."
          options={[...holders, { value: "__new__", label: "+ Add new holder..." }]}
          value={values.toHolder ?? ""}
          onChange={(e) => onChange("toHolder", e.target.value)}
        />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Select
          label="Equity Class"
          options={classOptions}
          value={values.equityClass ?? ""}
          onChange={(e) => onChange("equityClass", e.target.value)}
        />
        <Input
          label="Amount Transferred"
          placeholder="e.g., 4.50%"
          value={values.amount ?? ""}
          onChange={(e) => onChange("amount", e.target.value)}
        />
      </div>
      <Input
        label="Purchase Price ($)"
        placeholder="e.g., 1,125,000"
        hint="Arm's length consideration paid by buyer to seller"
        value={values.purchasePrice ?? ""}
        onChange={(e) => onChange("purchasePrice", e.target.value)}
      />
    </>
  );
}

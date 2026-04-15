"use client";

import { Select } from "@/components/ui/Select";
import { Input } from "@/components/ui/Input";
import { REALLOCATION_OPTIONS } from "@/lib/constants";
import type { EquityClass } from "@/data/types";

interface RedemptionFieldsProps {
  holders: { value: string; label: string }[];
  equityClasses: EquityClass[];
  values: Record<string, string>;
  onChange: (field: string, value: string) => void;
}

export function RedemptionFields({ holders, equityClasses, values, onChange }: RedemptionFieldsProps) {
  const classOptions = equityClasses.map((ec) => ({ value: ec.id, label: ec.name }));

  return (
    <>
      <div className="grid grid-cols-2 gap-3">
        <Select
          label="Holder Being Redeemed"
          placeholder="Select holder..."
          options={holders}
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
          label="Amount Redeemed"
          placeholder="e.g., 3.00%"
          value={values.amount ?? ""}
          onChange={(e) => onChange("amount", e.target.value)}
        />
        <Input
          label="Redemption Price ($)"
          placeholder="e.g., 780,000"
          value={values.redemptionPrice ?? ""}
          onChange={(e) => onChange("redemptionPrice", e.target.value)}
        />
      </div>
      <Select
        label="Reallocation Method"
        hint="How the redeemed interest is redistributed"
        options={REALLOCATION_OPTIONS.map((o) => ({ value: o.value, label: o.label }))}
        value={values.reallocationMethod ?? "pro_rata"}
        onChange={(e) => onChange("reallocationMethod", e.target.value)}
      />
    </>
  );
}

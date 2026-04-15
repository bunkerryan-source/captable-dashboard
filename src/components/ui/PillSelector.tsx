"use client";

interface PillOption<T extends string> {
  value: T;
  label: string;
}

interface PillSelectorProps<T extends string> {
  options: readonly PillOption<T>[];
  value: T;
  onChange: (value: T) => void;
}

export function PillSelector<T extends string>({
  options,
  value,
  onChange,
}: PillSelectorProps<T>) {
  return (
    <div className="flex gap-1.5 flex-wrap">
      {options.map((opt) => (
        <button
          key={opt.value}
          type="button"
          onClick={() => onChange(opt.value)}
          className={`
            px-3 py-1.5 text-xs font-medium rounded-lg
            border transition-colors duration-150 cursor-pointer
            ${
              value === opt.value
                ? "bg-trust-blue text-white border-trust-blue"
                : "bg-transparent text-text-primary border-border-strong hover:bg-surface-alt"
            }
          `}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}

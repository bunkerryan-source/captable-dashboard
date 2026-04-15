"use client";

interface ToggleProps {
  label?: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
}

export function Toggle({ label, checked, onChange, disabled }: ToggleProps) {
  return (
    <label className="inline-flex items-center gap-2.5 cursor-pointer select-none">
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className={`
          relative inline-flex h-5 w-9 shrink-0 rounded-full border-2 border-transparent
          transition-colors duration-200 cursor-pointer
          focus:outline-none focus:ring-2 focus:ring-trust-blue/20
          disabled:opacity-40 disabled:cursor-not-allowed
          ${checked ? "bg-trust-blue" : "bg-border-strong"}
        `}
      >
        <span
          className={`
            pointer-events-none inline-block h-4 w-4 rounded-full bg-white shadow-sm
            transition-transform duration-200
            ${checked ? "translate-x-4" : "translate-x-0"}
          `}
        />
      </button>
      {label && (
        <span className="text-sm text-text-primary">{label}</span>
      )}
    </label>
  );
}

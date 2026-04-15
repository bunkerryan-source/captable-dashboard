"use client";

import { type InputHTMLAttributes, forwardRef } from "react";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  hint?: string;
  error?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, hint, error, className = "", id, ...props }, ref) => {
    const inputId = id ?? label?.toLowerCase().replace(/\s+/g, "-");

    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label
            htmlFor={inputId}
            className="text-xs font-medium text-text-secondary uppercase tracking-[0.03em]"
          >
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={inputId}
          className={`
            w-full text-sm px-3 py-2
            border border-border-strong rounded-lg
            bg-white text-text-primary
            placeholder:text-text-tertiary
            focus:outline-none focus:ring-2 focus:ring-trust-blue/20 focus:border-trust-blue
            transition-colors duration-150
            ${error ? "border-red-400 focus:ring-red-200 focus:border-red-400" : ""}
            ${className}
          `}
          {...props}
        />
        {hint && !error && (
          <span className="text-[11px] text-text-tertiary">{hint}</span>
        )}
        {error && (
          <span className="text-[11px] text-red-500">{error}</span>
        )}
      </div>
    );
  }
);

Input.displayName = "Input";

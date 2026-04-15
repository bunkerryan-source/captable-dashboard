"use client";

import { type TextareaHTMLAttributes, forwardRef } from "react";

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  hint?: string;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, hint, className = "", id, ...props }, ref) => {
    const textareaId = id ?? label?.toLowerCase().replace(/\s+/g, "-");

    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label
            htmlFor={textareaId}
            className="text-xs font-medium text-text-secondary uppercase tracking-[0.03em]"
          >
            {label}
          </label>
        )}
        <textarea
          ref={ref}
          id={textareaId}
          className={`
            w-full text-sm px-3 py-2 min-h-[72px]
            border border-border-strong rounded-lg
            bg-white text-text-primary leading-relaxed
            placeholder:text-text-tertiary
            focus:outline-none focus:ring-2 focus:ring-trust-blue/20 focus:border-trust-blue
            transition-colors duration-150 resize-y
            ${className}
          `}
          {...props}
        />
        {hint && (
          <span className="text-[11px] text-text-tertiary">{hint}</span>
        )}
      </div>
    );
  }
);

Textarea.displayName = "Textarea";

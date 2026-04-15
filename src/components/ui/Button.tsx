"use client";

import { type ButtonHTMLAttributes, forwardRef } from "react";

type ButtonVariant = "primary" | "secondary" | "ghost" | "ghost-light" | "danger";
type ButtonSize = "sm" | "md";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  icon?: React.ReactNode;
}

const variantStyles: Record<ButtonVariant, string> = {
  primary:
    "bg-trust-blue text-white border-trust-blue hover:bg-pro-blue hover:border-pro-blue",
  secondary:
    "bg-transparent text-text-primary border-border-strong hover:bg-surface-alt",
  ghost:
    "bg-transparent text-text-secondary border-transparent hover:bg-surface-alt hover:text-text-primary",
  "ghost-light":
    "bg-transparent text-white/80 border-transparent hover:bg-white/10 hover:text-white",
  danger:
    "bg-transparent text-red-600 border-red-200 hover:bg-red-50",
};

const sizeStyles: Record<ButtonSize, string> = {
  sm: "px-3 py-1.5 text-xs",
  md: "px-4 py-2 text-[13px]",
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    { variant = "secondary", size = "md", icon, children, className = "", disabled, ...props },
    ref
  ) => {
    return (
      <button
        ref={ref}
        disabled={disabled}
        className={`
          inline-flex items-center justify-center gap-1.5
          border rounded-lg font-medium whitespace-nowrap
          transition-colors duration-150 cursor-pointer
          disabled:opacity-40 disabled:cursor-not-allowed
          ${variantStyles[variant]}
          ${sizeStyles[size]}
          ${className}
        `}
        {...props}
      >
        {icon && <span className="flex-shrink-0">{icon}</span>}
        {children}
      </button>
    );
  }
);

Button.displayName = "Button";

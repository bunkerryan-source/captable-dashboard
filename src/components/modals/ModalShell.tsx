"use client";

import { useEffect, useCallback, type ReactNode } from "react";

interface ModalShellProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  footer?: ReactNode;
  width?: string;
}

export function ModalShell({ open, onClose, title, children, footer, width = "max-w-[540px]" }: ModalShellProps) {
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    },
    [onClose]
  );

  useEffect(() => {
    if (open) {
      document.addEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "hidden";
    }
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [open, handleKeyDown]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-navy/40 backdrop-blur-[2px]"
        onClick={onClose}
      />

      {/* Modal */}
      <div
        className={`
          relative ${width} w-full mx-4 mt-[8vh]
          bg-white rounded-xl border border-border
          shadow-2xl overflow-hidden
          animate-modal-in
        `}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-border flex items-center justify-between">
          <h3 className="text-[15px] font-medium text-text-primary tracking-[-0.01em]">{title}</h3>
          <button
            onClick={onClose}
            className="text-text-tertiary hover:text-text-primary transition-colors cursor-pointer p-1.5 -mr-1.5 rounded-md hover:bg-surface-alt"
          >
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M4 4l8 8M12 4l-8 8" />
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-5 max-h-[65vh] overflow-y-auto">
          {children}
        </div>

        {/* Footer */}
        {footer && (
          <div className="px-6 py-4 border-t border-border bg-surface/50 flex justify-end gap-2">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}

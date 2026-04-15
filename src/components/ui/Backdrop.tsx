"use client";

interface BackdropProps {
  open: boolean;
  onClick: () => void;
  className?: string;
}

export function Backdrop({ open, onClick, className = "" }: BackdropProps) {
  return (
    <div
      onClick={onClick}
      className={`
        fixed inset-0 bg-navy/30 backdrop-blur-[1px] z-30
        transition-opacity duration-250
        ${open ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"}
        ${className}
      `}
    />
  );
}

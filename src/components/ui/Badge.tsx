interface BadgeProps {
  children: React.ReactNode;
  bgColor?: string;
  textColor?: string;
  className?: string;
}

export function Badge({
  children,
  bgColor = "bg-badge-correction-bg",
  textColor = "text-badge-correction-text",
  className = "",
}: BadgeProps) {
  return (
    <span
      className={`
        inline-flex items-center px-2 py-0.5
        text-[11px] font-medium rounded-md
        ${bgColor} ${textColor} ${className}
      `}
    >
      {children}
    </span>
  );
}

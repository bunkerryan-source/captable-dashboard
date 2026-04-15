"use client";

import { Button } from "@/components/ui/Button";
import { useDashboardDispatch } from "@/context/DashboardContext";

interface FooterBarProps {
  transactionCount: number;
}

export function FooterBar({ transactionCount }: FooterBarProps) {
  const dispatch = useDashboardDispatch();

  return (
    <div className="flex items-center justify-between flex-wrap gap-3 pt-1">
      {/* Change Log Link */}
      <button
        onClick={() => dispatch({ type: "TOGGLE_CHANGELOG" })}
        className="flex items-center gap-1.5 text-[13px] text-trust-blue hover:text-pro-blue cursor-pointer transition-colors group"
      >
        <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path d="M2 4h12M2 8h12M2 12h8" />
        </svg>
        <span className="group-hover:underline underline-offset-2">Change log</span>
        <span className="inline-flex items-center justify-center bg-trust-blue text-white text-[10px] font-semibold w-[18px] h-[18px] rounded-full ml-0.5">
          {transactionCount}
        </span>
      </button>

      {/* Export Buttons */}
      <div className="flex items-center gap-2">
        <Button variant="secondary" size="sm">
          Export current
        </Button>
        <Button variant="secondary" size="sm" className="hidden sm:inline-flex">
          Export as of date...
        </Button>
      </div>
    </div>
  );
}

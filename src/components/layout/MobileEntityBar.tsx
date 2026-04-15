"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useDashboard, useDashboardDispatch } from "@/context/DashboardContext";

export function MobileEntityBar() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { entities } = useDashboard();
  const dispatch = useDashboardDispatch();
  const selectedId = searchParams.get("entity") ?? entities[0]?.id;

  return (
    <div className="sm:hidden px-4 py-2.5 bg-white border-b border-border flex items-center gap-2">
      <select
        value={selectedId}
        onChange={(e) => router.push(`?entity=${e.target.value}`, { scroll: false })}
        className="flex-1 text-sm font-medium text-text-primary bg-surface border border-border rounded-lg px-3 py-2 appearance-none cursor-pointer"
      >
        {entities
          .slice()
          .sort((a, b) => a.name.localeCompare(b.name))
          .map((entity) => (
            <option key={entity.id} value={entity.id}>
              {entity.name}
            </option>
          ))}
      </select>
      <button
        onClick={() => dispatch({ type: "OPEN_MODAL", modal: "addHolder" })}
        className="p-2 text-text-secondary hover:text-text-primary transition-colors cursor-pointer"
        title="Add Holder"
      >
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
          <circle cx="8" cy="5" r="3" />
          <path d="M2 14c0-2.5 2.5-4.5 6-4.5s6 2 6 4.5" />
          <path d="M12 3v4M10 5h4" />
        </svg>
      </button>
    </div>
  );
}

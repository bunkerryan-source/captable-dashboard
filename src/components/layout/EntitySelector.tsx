"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useDashboard } from "@/context/DashboardContext";
import type { EntityWithClasses } from "@/data/types";

interface EntitySelectorProps {
  onNewEntity: () => void;
}

export function EntitySelector({ onNewEntity }: EntitySelectorProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { entities } = useDashboard();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const selectedId = searchParams.get("entity") ?? entities[0]?.id;
  const selected = entities.find((e) => e.id === selectedId) ?? entities[0];

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  function selectEntity(entity: EntityWithClasses) {
    router.push(`?entity=${entity.id}`, { scroll: false });
    setOpen(false);
  }

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="
          flex items-center gap-2 px-3.5 py-1.5
          text-white/90 text-[15px] font-light tracking-[-0.01em]
          bg-white/8 border border-white/15 rounded-lg
          hover:bg-white/12 hover:border-white/25
          transition-colors duration-150 cursor-pointer
          min-w-[260px] text-left
        "
      >
        <span className="flex-1 truncate">{selected?.name ?? "Select entity..."}</span>
        <svg
          width="12"
          height="12"
          viewBox="0 0 12 12"
          fill="none"
          className={`text-white/50 transition-transform duration-150 ${open ? "rotate-180" : ""}`}
        >
          <path d="M3 4.5L6 7.5L9 4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      {open && (
        <div className="absolute top-full left-0 mt-1.5 w-[320px] bg-white rounded-xl border border-border shadow-xl z-50 py-1.5 overflow-hidden animate-fade-in-up" style={{ animationDuration: '150ms' }}>
          {entities
            .slice()
            .sort((a, b) => a.name.localeCompare(b.name))
            .map((entity) => (
              <button
                key={entity.id}
                onClick={() => selectEntity(entity)}
                className={`
                  w-full text-left px-4 py-2.5 text-sm
                  hover:bg-surface transition-colors duration-100 cursor-pointer
                  ${entity.id === selectedId ? "bg-surface font-medium text-trust-blue" : "text-text-primary"}
                `}
              >
                <span className="block truncate">{entity.name}</span>
                <span className="block text-[11px] text-text-tertiary mt-0.5 capitalize">
                  {entity.entityType === "llc" ? "LLC" : entity.entityType}
                </span>
              </button>
            ))}
          <div className="border-t border-border mt-1 pt-1">
            <button
              onClick={() => {
                setOpen(false);
                onNewEntity();
              }}
              className="w-full text-left px-4 py-2.5 text-sm text-trust-blue hover:bg-surface transition-colors cursor-pointer"
            >
              + New Entity
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

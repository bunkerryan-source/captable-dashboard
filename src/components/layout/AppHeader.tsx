"use client";

import { EntitySelector } from "./EntitySelector";
import { Button } from "@/components/ui/Button";
import { useDashboardDispatch } from "@/context/DashboardContext";

export function AppHeader() {
  const dispatch = useDashboardDispatch();

  return (
    <header className="h-14 bg-navy flex items-center px-4 md:px-5 gap-3 md:gap-4 shrink-0">
      {/* Logo */}
      <img
        src="/abplogo.png"
        alt="ABP Capital"
        className="h-[26px] shrink-0"
      />

      {/* Divider */}
      <div className="w-px h-6 bg-white/15 hidden sm:block" />

      {/* Entity Selector */}
      <div className="hidden sm:block">
        <EntitySelector
          onNewEntity={() => dispatch({ type: "OPEN_MODAL", modal: "entitySetup" })}
        />
      </div>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Actions */}
      <div className="flex items-center gap-1.5 md:gap-2">
        <Button
          variant="primary"
          size="md"
          onClick={() => dispatch({ type: "OPEN_MODAL", modal: "recordTransaction" })}
        >
          <span className="hidden md:inline">+ Record Transaction</span>
          <span className="md:hidden">+ Record</span>
        </Button>
        <Button
          variant="ghost-light"
          size="md"
          className="hidden sm:inline-flex"
          onClick={() => dispatch({ type: "OPEN_MODAL", modal: "addHolder" })}
        >
          + Add Holder
        </Button>
        <button
          onClick={() => dispatch({ type: "OPEN_MODAL", modal: "entitySettings" })}
          className="p-2 rounded-lg text-white/60 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
          title="Entity Settings"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M6.86 2.572a1.2 1.2 0 012.28 0l.29.878a1.2 1.2 0 001.598.728l.838-.37a1.2 1.2 0 011.615 1.614l-.37.838a1.2 1.2 0 00.728 1.598l.878.291a1.2 1.2 0 010 2.28l-.878.29a1.2 1.2 0 00-.728 1.598l.37.838a1.2 1.2 0 01-1.614 1.615l-.838-.37a1.2 1.2 0 00-1.598.728l-.291.878a1.2 1.2 0 01-2.28 0l-.29-.878a1.2 1.2 0 00-1.598-.728l-.838.37A1.2 1.2 0 012.52 12.13l.37-.838a1.2 1.2 0 00-.728-1.598l-.878-.291a1.2 1.2 0 010-2.28l.878-.29a1.2 1.2 0 00.728-1.598l-.37-.838a1.2 1.2 0 011.614-1.615l.838.37a1.2 1.2 0 001.598-.728l.291-.878z" />
            <circle cx="8" cy="8" r="2" />
          </svg>
        </button>
      </div>
    </header>
  );
}

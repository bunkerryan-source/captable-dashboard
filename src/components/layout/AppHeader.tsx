"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { EntitySelector } from "./EntitySelector";
import { Button } from "@/components/ui/Button";
import { InviteUserModal } from "@/components/modals/InviteUserModal";
import { useDashboardDispatch } from "@/context/DashboardContext";
import { useAuth } from "@/context/AuthContext";
import { signOut } from "@/lib/dal";

export function AppHeader() {
  const dispatch = useDashboardDispatch();
  const { user, role, displayName } = useAuth();
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const [inviteOpen, setInviteOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close menu on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    }
    if (menuOpen) document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [menuOpen]);

  const initials = (displayName ?? user?.email ?? "?")
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  async function handleSignOut() {
    setMenuOpen(false);
    try {
      await signOut();
    } catch {
      // Always redirect even if signOut fails
    }
    router.push("/login");
  }

  return (
    <>
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

          {/* User menu */}
          <div className="relative" ref={menuRef}>
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="w-8 h-8 rounded-full bg-trust-blue/20 text-white text-[11px] font-semibold flex items-center justify-center hover:bg-trust-blue/30 transition-colors cursor-pointer"
              title={displayName ?? user?.email ?? "Account"}
            >
              {initials}
            </button>

            {menuOpen && (
              <div className="absolute right-0 top-full mt-1.5 w-56 bg-white rounded-xl shadow-xl border border-border py-1 z-50 animate-fade-in-up" style={{ animationDuration: "150ms" }}>
                <div className="px-3 py-2.5 border-b border-border">
                  <p className="text-[13px] font-medium text-text-primary truncate">
                    {displayName ?? "User"}
                  </p>
                  <p className="text-[11px] text-text-tertiary truncate">
                    {user?.email}
                  </p>
                  <span className="inline-block mt-1 text-[10px] font-medium uppercase tracking-[0.05em] text-text-secondary bg-surface px-1.5 py-0.5 rounded">
                    {role}
                  </span>
                </div>

                {role === "admin" && (
                  <button
                    onClick={() => {
                      setMenuOpen(false);
                      setInviteOpen(true);
                    }}
                    className="w-full text-left px-3 py-2 text-[13px] text-text-primary hover:bg-surface transition-colors cursor-pointer"
                  >
                    Invite user
                  </button>
                )}

                <button
                  onClick={handleSignOut}
                  className="w-full text-left px-3 py-2 text-[13px] text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                >
                  Sign out
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      <InviteUserModal open={inviteOpen} onClose={() => setInviteOpen(false)} />
    </>
  );
}

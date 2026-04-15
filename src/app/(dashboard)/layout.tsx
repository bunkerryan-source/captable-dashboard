"use client";

import { DashboardProvider } from "@/context/DashboardContext";
import { useAuth } from "@/context/AuthContext";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { loading: authLoading } = useAuth();

  if (authLoading) {
    return (
      <div className="flex flex-col flex-1 min-h-screen bg-surface items-center justify-center">
        <div className="w-8 h-8 border-2 border-trust-blue/30 border-t-trust-blue rounded-full animate-spin" />
      </div>
    );
  }

  return <DashboardProvider>{children}</DashboardProvider>;
}

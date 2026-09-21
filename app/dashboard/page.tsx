"use client";

import { DashboardView } from "@/components/DashboardView";
import { TopBar } from "@/components/TopBar";

export default function DashboardPage() {
  return (
    <div className="flex h-screen flex-col">
      <TopBar />
      <div className="min-h-0 flex-1 overflow-auto">
        <DashboardView />
      </div>
    </div>
  );
}

"use client";

import { AdminView } from "@/components/AdminView";
import { TopBar } from "@/components/TopBar";

export default function AdminPage() {
  return (
    <div className="flex h-screen flex-col">
      <TopBar />
      <div className="min-h-0 flex-1 overflow-auto">
        <AdminView />
      </div>
    </div>
  );
}

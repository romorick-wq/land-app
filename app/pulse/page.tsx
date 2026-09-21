"use client";

import { PulseView } from "@/components/PulseView";
import { TopBar } from "@/components/TopBar";

export default function PulsePage() {
  return (
    <div className="flex h-screen flex-col">
      <TopBar />
      <div className="min-h-0 flex-1 overflow-auto">
        <PulseView />
      </div>
    </div>
  );
}

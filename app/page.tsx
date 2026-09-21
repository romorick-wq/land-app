"use client";

import { BulkAddDialog } from "@/components/BulkAddDialog";
import { ContactDialog } from "@/components/ContactDialog";
import { GenerateDocs } from "@/components/GenerateDocs";
import { MapCanvas } from "@/components/MapCanvas";
import { OwnerDetail } from "@/components/OwnerDetail";
import { OwnerRail } from "@/components/OwnerRail";
import { TitleReport } from "@/components/TitleReport";
import { TopBar } from "@/components/TopBar";

export default function MapPage() {
  return (
    <div className="flex h-screen flex-col">
      <TopBar />
      <div className="relative flex min-h-0 flex-1">
        <MapCanvas />
        <OwnerRail />
        <OwnerDetail />
      </div>
      <BulkAddDialog />
      <TitleReport />
      <GenerateDocs />
      <ContactDialog />
    </div>
  );
}

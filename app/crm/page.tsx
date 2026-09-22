"use client";

import { ContactDialog } from "@/components/ContactDialog";
import { CrmView } from "@/components/CrmView";
import { GenerateDocs } from "@/components/GenerateDocs";
import { OwnerDetail } from "@/components/OwnerDetail";
import { TitleReport } from "@/components/TitleReport";
import { TopBar } from "@/components/TopBar";

export default function CrmPage() {
  return (
    <div className="flex h-screen flex-col">
      <TopBar />
      <div className="relative flex min-h-0 flex-1">
        <CrmView />
        <OwnerDetail />
      </div>
      <TitleReport />
      <GenerateDocs />
      <ContactDialog />
    </div>
  );
}

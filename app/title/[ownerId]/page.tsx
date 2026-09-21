"use client";

import { useParams } from "next/navigation";
import { useCampaign } from "@/components/CampaignProvider";
import { TitlePreview } from "@/components/TitlePreview";
import { parcelsForOwner } from "@/lib/filters";

export default function TitlePage() {
  const params = useParams<{ ownerId: string }>();
  const { owners, parcels } = useCampaign();
  const owner = owners.find((item) => item.id === params.ownerId);
  if (!owner) return <p className="p-8 text-sm">That owner is not in this campaign.</p>;

  return (
    <main className="mx-auto max-w-3xl px-6 py-8">
      <div className="no-print mb-4 flex gap-2">
        <button type="button" className="rounded bg-[#3ddc84] px-3 py-1.5 text-xs font-semibold text-black" onClick={() => window.print()}>
          Print / Save PDF
        </button>
        <a href="/" className="rounded border border-white/15 px-3 py-1.5 text-xs">
          Back to map
        </a>
      </div>
      <TitlePreview owner={owner} parcels={parcelsForOwner(parcels, owner.id)} />
    </main>
  );
}

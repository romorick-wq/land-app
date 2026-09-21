"use client";

import { useMemo, useState } from "react";
import { useCampaign } from "./CampaignProvider";
import { StatusPill } from "./StatusPill";
import { Modal } from "./ui";
import { formatAcres } from "@/lib/format";

export function BulkAddDialog() {
  const { pendingParcelIds } = useCampaign();
  if (!pendingParcelIds.length) return null;
  return <BulkAddForm key={pendingParcelIds.join("|")} />;
}

function BulkAddForm() {
  const { pendingParcelIds, parcels, owners, closeReview, addLeads } = useCampaign();
  const groups = useMemo(() => {
    const map = new Map<string, { ownerId: string; name: string; acres: number; count: number; isLead: boolean; status: (typeof owners)[number]["status"] }>();
    for (const parcelId of pendingParcelIds) {
      const parcel = parcels.find((item) => item.id === parcelId);
      if (!parcel) continue;
      const owner = owners.find((item) => item.id === parcel.ownerId);
      if (!owner) continue;
      const current = map.get(owner.id) ?? { ownerId: owner.id, name: owner.name, acres: 0, count: 0, isLead: owner.isLead, status: owner.status };
      current.acres += parcel.acres;
      current.count += 1;
      map.set(owner.id, current);
    }
    return Array.from(map.values()).sort((a, b) => a.name.localeCompare(b.name));
  }, [pendingParcelIds, parcels, owners]);

  const [checked, setChecked] = useState<string[]>(() => groups.map((group) => group.ownerId));
  const selectedAcres = groups.filter((group) => checked.includes(group.ownerId)).reduce((sum, group) => sum + group.acres, 0);

  if (!pendingParcelIds.length) return null;

  return (
    <Modal title="Bulk add parcels" onClose={closeReview} width={520}>
      <p className="mb-3 text-xs text-white/55">
        {pendingParcelIds.length} parcels · {formatAcres(groups.reduce((sum, group) => sum + group.acres, 0))} acres. Add the owners you want called.
      </p>
      <div className="mb-3 flex gap-2 text-xs">
        <button type="button" className="rounded bg-[#3ddc84] px-3 py-1.5 font-semibold text-black" onClick={() => addLeads(checked)}>
          Add selected as leads
        </button>
        <button type="button" className="rounded border border-white/15 px-3 py-1.5" onClick={() => setChecked(groups.map((group) => group.ownerId))}>
          All
        </button>
        <span className="ml-auto self-center text-white/45">{formatAcres(selectedAcres)} ac selected</span>
      </div>
      <ul className="max-h-80 divide-y divide-white/5 overflow-auto rounded-md border border-white/10">
        {groups.map((group) => (
          <li key={group.ownerId} className="flex items-center gap-3 px-3 py-2 text-sm">
            <input
              type="checkbox"
              checked={checked.includes(group.ownerId)}
              onChange={(event) =>
                setChecked((current) =>
                  event.target.checked ? [...current, group.ownerId] : current.filter((id) => id !== group.ownerId),
                )
              }
              aria-label={`Select ${group.name}`}
            />
            <span className="min-w-0 flex-1 truncate">{group.name}</span>
            {group.isLead && <StatusPill status={group.status} />}
            <span className="text-xs text-white/50">
              {group.count} · {formatAcres(group.acres)} ac
            </span>
          </li>
        ))}
      </ul>
    </Modal>
  );
}

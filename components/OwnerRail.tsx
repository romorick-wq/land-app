"use client";

import { useCampaign } from "./CampaignProvider";
import { StatusPill } from "./StatusPill";
import { acresForOwner, ownerMatches, parcelsForOwner } from "@/lib/filters";
import { formatAcres, relativeTime } from "@/lib/format";

export function OwnerRail() {
  const { owners, parcels, filters, selectedOwnerId, selectOwner } = useCampaign();
  const visible = owners
    .filter((owner) => ownerMatches(owner, parcels, filters))
    .sort((a, b) => a.name.localeCompare(b.name));

  return (
    <aside className="flex h-full w-[300px] shrink-0 flex-col border-l border-white/10 bg-[#12171e] max-lg:absolute max-lg:inset-y-0 max-lg:right-0 max-lg:z-20 max-lg:shadow-2xl">
      <div className="flex items-center justify-between border-b border-white/10 px-3 py-2 text-xs">
        <span className="font-semibold">{filters.leadsOnly ? "Leads" : "Owners"}</span>
        <span className="text-white/45">{visible.length}</span>
      </div>
      <div className="min-h-0 flex-1 overflow-auto">
        {visible.length === 0 && (
          <p className="px-3 py-6 text-xs leading-5 text-white/50">
            No owners match these filters. Draw a box on the map and add the parcels inside it as leads.
          </p>
        )}
        {visible.map((owner) => {
          const acres = acresForOwner(parcels, owner.id);
          const count = parcelsForOwner(parcels, owner.id).length;
          const selected = owner.id === selectedOwnerId;
          return (
            <button
              key={owner.id}
              type="button"
              onClick={() => selectOwner(owner.id)}
              className={`block w-full border-b border-white/5 px-3 py-2 text-left hover:bg-white/5 ${selected ? "bg-white/10" : ""}`}
            >
              <div className="flex items-start justify-between gap-2">
                <span className="text-sm leading-5">{owner.name}</span>
                <StatusPill status={owner.status} />
              </div>
              <div className="mt-1 flex justify-between text-[11px] text-white/45">
                <span>
                  {count} parcel{count === 1 ? "" : "s"} · {formatAcres(acres)} ac
                </span>
                <span>{relativeTime(owner.updatedAt)}</span>
              </div>
            </button>
          );
        })}
      </div>
    </aside>
  );
}

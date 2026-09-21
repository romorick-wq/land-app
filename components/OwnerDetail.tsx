"use client";

import { useState } from "react";
import { useCampaign } from "./CampaignProvider";
import { StatusPill } from "./StatusPill";
import { inputClass, labelClass } from "./ui";
import { acresForOwner, parcelsForOwner } from "@/lib/filters";
import { formatAcres } from "@/lib/format";
import { AGENTS, PRIORITIES, STATUSES } from "@/lib/statuses";
import type { Owner, Priority, StatusId } from "@/lib/types";

export function OwnerDetail() {
  const { owners, parcels, selectedOwnerId, selectOwner, updateOwner, openTitle, openDocs, openContact } = useCampaign();
  const [lookupOpen, setLookupOpen] = useState(false);
  const owner = owners.find((item) => item.id === selectedOwnerId);
  if (!owner) return null;
  const owned = parcelsForOwner(parcels, owner.id);
  const agents = Array.from(new Set([...AGENTS, owner.agent].filter(Boolean)));

  function patch(next: Partial<Owner>) {
    updateOwner(owner!.id, next);
  }

  return (
    <aside className="flex h-full w-[340px] shrink-0 flex-col border-l border-white/10 bg-[#10151c] max-lg:absolute max-lg:inset-y-0 max-lg:right-0 max-lg:z-30 max-lg:shadow-2xl">
      <div className="flex items-start justify-between gap-2 border-b border-white/10 px-3 py-3">
        <div>
          <h2 className="text-sm font-semibold">{owner.name}</h2>
          <p className="mt-1 text-[11px] text-white/45">
            {owned.length} parcel{owned.length === 1 ? "" : "s"} · {formatAcres(acresForOwner(parcels, owner.id))} ac
          </p>
        </div>
        <button type="button" className="text-white/50" onClick={() => selectOwner(null)} aria-label="Close owner">
          ×
        </button>
      </div>
      <div className="min-h-0 flex-1 space-y-3 overflow-auto px-3 py-3">
        <label className={labelClass}>
          Status
          <select
            className={inputClass}
            value={owner.status}
            onChange={(event) => patch({ status: event.target.value as StatusId })}
          >
            {STATUSES.map((status) => (
              <option key={status.id} value={status.id}>
                {status.label}
              </option>
            ))}
          </select>
        </label>
        <div className="grid grid-cols-2 gap-2">
          <label className={labelClass}>
            Priority
            <select className={inputClass} value={owner.priority} onChange={(event) => patch({ priority: event.target.value as Priority })}>
              {PRIORITIES.map((priority) => (
                <option key={priority.id} value={priority.id}>
                  {priority.label}
                </option>
              ))}
            </select>
          </label>
          <label className={labelClass}>
            Assigned to
            <select className={inputClass} value={owner.agent} onChange={(event) => patch({ agent: event.target.value })}>
              <option value="">Unassigned</option>
              {agents.map((agent) => (
                <option key={agent} value={agent}>
                  {agent}
                </option>
              ))}
            </select>
          </label>
        </div>
        <div>
          <div className="mb-1 flex items-center justify-between">
            <span className={labelClass}>Contact</span>
            <StatusPill status={owner.status} />
          </div>
          <label className={labelClass}>
            Phone
            <input className={inputClass} value={owner.phone} onChange={(event) => patch({ phone: event.target.value })} />
          </label>
          <label className={`${labelClass} mt-2`}>
            Email
            <input className={inputClass} value={owner.email} onChange={(event) => patch({ email: event.target.value })} />
          </label>
          <label className={`${labelClass} mt-2`}>
            Mailing address
            <textarea className={`${inputClass} h-16 py-2`} value={owner.address} onChange={(event) => patch({ address: event.target.value })} />
          </label>
          <button type="button" className="mt-2 text-xs text-[#7dffb8]" onClick={() => setLookupOpen((open) => !open)}>
            {lookupOpen ? "Hide directory matches" : "Lookup contact"}
          </button>
          {lookupOpen && (
            <div className="mt-2 space-y-2 rounded-md border border-white/10 bg-black/20 p-2 text-xs">
              <p className="text-white/45">Saved with this sample record. Nothing is sent to a skip-trace service.</p>
              {owner.lookup.phones.map((phone) => (
                <div key={phone} className="flex items-center justify-between gap-2">
                  <span>{phone}</span>
                  <button type="button" className="text-[#7dffb8]" onClick={() => patch({ phone })}>
                    Apply
                  </button>
                </div>
              ))}
              {owner.lookup.emails.map((email) => (
                <div key={email} className="flex items-center justify-between gap-2">
                  <span className="truncate">{email}</span>
                  <button type="button" className="text-[#7dffb8]" onClick={() => patch({ email })}>
                    Apply
                  </button>
                </div>
              ))}
              {owner.lookup.addresses.map((address) => (
                <div key={address} className="flex items-center justify-between gap-2">
                  <span>{address}</span>
                  <button type="button" className="shrink-0 text-[#7dffb8]" onClick={() => patch({ address })}>
                    Apply
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
        <div>
          <div className={labelClass}>Parcels</div>
          <ul className="space-y-1 text-xs text-white/70">
            {owned.map((parcel) => (
              <li key={parcel.id}>
                {parcel.apn} · {formatAcres(parcel.acres)} ac
              </li>
            ))}
          </ul>
        </div>
        <label className={labelClass}>
          Notes
          <textarea className={`${inputClass} h-24 py-2`} value={owner.notes} onChange={(event) => patch({ notes: event.target.value })} />
        </label>
        <div className="grid grid-cols-2 gap-2">
          <button type="button" className="h-9 rounded-md bg-[#3ddc84] text-xs font-semibold text-black" onClick={() => openDocs(owner.id)}>
            Generate documents
          </button>
          <button type="button" className="h-9 rounded-md border border-white/15 text-xs" onClick={() => openTitle(owner.id)}>
            Title report
          </button>
          <button type="button" className="col-span-2 h-9 rounded-md border border-white/15 text-xs" onClick={() => openContact(owner.id)}>
            Record initial contact
          </button>
        </div>
      </div>
    </aside>
  );
}

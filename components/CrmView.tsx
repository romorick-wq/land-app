"use client";

import { useState } from "react";
import { useCampaign } from "./CampaignProvider";
import { StatusPill } from "./StatusPill";
import { acresForOwner, ownerMatches, parcelsForOwner } from "@/lib/filters";
import { formatAcres } from "@/lib/format";
import { STATUSES, priorityLabel } from "@/lib/statuses";
import type { Filters, Owner, Parcel, Priority } from "@/lib/types";

const SECTIONS: { id: string; label: string; priority: Filters["priority"] }[] = [
  { id: "landowners", label: "Landowners", priority: "all" },
  { id: "test_well", label: "Test Well", priority: "test_well" },
  { id: "high", label: "Priority 1", priority: "high" },
  { id: "medium", label: "Priority 2", priority: "medium" },
];

const SORTS = [
  { id: "name", label: "Name" },
  { id: "priority", label: "Priority" },
  { id: "status", label: "Tract status" },
  { id: "address", label: "Address" },
  { id: "notes", label: "Contact notes" },
  { id: "phone", label: "Phone" },
  { id: "email", label: "Email" },
  { id: "agent", label: "Agent" },
  { id: "acres", label: "Acres" },
  { id: "parcels", label: "Parcels" },
  { id: "updated", label: "Updated" },
] as const;

type SortId = (typeof SORTS)[number]["id"];

const PRIORITY_RANK: Record<Priority, number> = {
  test_well: 0,
  high: 1,
  medium: 2,
  low: 3,
};

function contactPhone(owner: Owner) {
  return owner.phone.trim() || owner.lookup.phones[0] || "";
}

function contactAddress(owner: Owner) {
  return owner.address.trim() || owner.lookup.addresses[0] || "";
}

function contactNotes(owner: Owner) {
  return [owner.notes, owner.contactLogged?.notes].filter(Boolean).join(" ");
}

function ownerPriorities(owner: Owner, parcels: Parcel[]) {
  const tags = new Set(
    parcelsForOwner(parcels, owner.id).flatMap((parcel) =>
      (parcel.interests ?? []).filter((interest) => interest.ownerId === owner.id).map((interest) => interest.priority),
    ),
  );
  if (tags.size === 0) tags.add(owner.priority);
  return (Object.keys(PRIORITY_RANK) as Priority[])
    .filter((priority) => tags.has(priority))
    .sort((a, b) => PRIORITY_RANK[a] - PRIORITY_RANK[b]);
}

function compareText(left: string, right: string, direction: 1 | -1) {
  const a = left.trim();
  const b = right.trim();
  if (!a && !b) return 0;
  if (!a) return 1;
  if (!b) return -1;
  return a.localeCompare(b, undefined, { numeric: true, sensitivity: "base" }) * direction;
}

function compareOwners(a: Owner, b: Owner, parcels: Parcel[], sort: SortId, direction: 1 | -1) {
  if (sort === "priority") {
    const left = ownerPriorities(a, parcels)[0] ?? a.priority;
    const right = ownerPriorities(b, parcels)[0] ?? b.priority;
    const delta = (PRIORITY_RANK[left] - PRIORITY_RANK[right]) * direction;
    if (delta) return delta;
  } else if (sort === "status") {
    const delta = (STATUSES.findIndex((status) => status.id === a.status) - STATUSES.findIndex((status) => status.id === b.status)) * direction;
    if (delta) return delta;
  } else if (sort === "address") {
    const delta = compareText(contactAddress(a), contactAddress(b), direction);
    if (delta) return delta;
  } else if (sort === "notes") {
    const delta = compareText(contactNotes(a), contactNotes(b), direction);
    if (delta) return delta;
  } else if (sort === "phone") {
    const delta = compareText(contactPhone(a), contactPhone(b), direction);
    if (delta) return delta;
  } else if (sort === "email") {
    const delta = compareText(a.email, b.email, direction);
    if (delta) return delta;
  } else if (sort === "agent") {
    const delta = compareText(a.agent || "Unassigned", b.agent || "Unassigned", direction);
    if (delta) return delta;
  } else if (sort === "acres") {
    const delta = (acresForOwner(parcels, a.id) - acresForOwner(parcels, b.id)) * direction;
    if (delta) return delta;
  } else if (sort === "parcels") {
    const left = parcelsForOwner(parcels, a.id).filter((parcel) => !parcel.outline).length;
    const right = parcelsForOwner(parcels, b.id).filter((parcel) => !parcel.outline).length;
    const delta = (left - right) * direction;
    if (delta) return delta;
  } else if (sort === "updated") {
    const delta = (new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime()) * direction;
    if (delta) return delta;
  }
  return a.name.localeCompare(b.name, undefined, { sensitivity: "base" });
}

export function CrmView() {
  const { owners, parcels, filters, selectedOwnerId, selectOwner } = useCampaign();
  const [sectionId, setSectionId] = useState(SECTIONS[0].id);
  const [sort, setSort] = useState<SortId>("name");
  const [direction, setDirection] = useState<1 | -1>(1);
  const section = SECTIONS.find((item) => item.id === sectionId) ?? SECTIONS[0];
  const rosterFilters = { ...filters, priority: section.priority, leadsOnly: section.id === "landowners" ? false : filters.leadsOnly };
  const visible = owners
    .filter((owner) => ownerMatches(owner, parcels, rosterFilters, section.id === "landowners" ? { ignoreLeads: true } : undefined))
    .sort((a, b) => compareOwners(a, b, parcels, sort, direction));
  const acres = visible.reduce((sum, owner) => sum + acresForOwner(parcels, owner.id), 0);

  return (
    <section className="flex min-w-0 flex-1 flex-col bg-[#0e131a]">
      <div className="flex flex-wrap items-center gap-2 border-b border-white/10 px-4 py-3">
        <h1 className="mr-2 text-sm font-semibold">Landowners</h1>
        {SECTIONS.map((item) => {
          const pressed = item.id === section.id;
          const count = owners.filter((owner) =>
            ownerMatches(
              owner,
              parcels,
              { ...filters, priority: item.priority, leadsOnly: item.id === "landowners" ? false : filters.leadsOnly },
              item.id === "landowners" ? { ignoreLeads: true } : undefined,
            ),
          ).length;
          return (
            <button
              key={item.id}
              type="button"
              aria-pressed={pressed}
              onClick={() => setSectionId(item.id)}
              className={`h-8 rounded-md px-2 text-xs ${pressed ? "bg-[#3ddc84] font-semibold text-black" : "border border-white/10 text-white/80"}`}
            >
              {item.label}
              <span className={pressed ? "text-black/60" : "text-white/40"}> {count}</span>
            </button>
          );
        })}
        <label className="ml-auto flex items-center gap-2 text-[11px] text-white/50">
          Sort
          <select
            aria-label="Sort landowners"
            value={sort}
            onChange={(event) => setSort(event.target.value as SortId)}
            className="h-8 rounded-md border border-white/10 bg-[#0e131a] px-2 text-xs text-white"
          >
            {SORTS.map((option) => (
              <option key={option.id} value={option.id}>
                {option.label}
              </option>
            ))}
          </select>
          <button
            type="button"
            className="h-8 rounded-md border border-white/10 px-2 text-xs text-white/80"
            onClick={() => setDirection((current) => (current === 1 ? -1 : 1))}
            aria-label={direction === 1 ? "Sort ascending" : "Sort descending"}
          >
            {direction === 1 ? "Asc" : "Desc"}
          </button>
        </label>
        <span className="text-[11px] text-white/45">
          {visible.length} landowner{visible.length === 1 ? "" : "s"} · {formatAcres(acres)} ac
        </span>
      </div>
      <div className="min-h-0 flex-1 overflow-auto">
        {visible.length === 0 ? (
          <p className="px-4 py-8 text-xs leading-5 text-white/50">No landowners match these filters.</p>
        ) : (
          <ul className="min-w-[860px]">
            <li className="sticky top-0 grid grid-cols-[minmax(180px,1.3fr)_110px_120px_140px_minmax(160px,1.2fr)_minmax(160px,1.4fr)_90px_70px] gap-2 bg-[#12171e] px-4 py-2 text-[11px] uppercase tracking-wide text-white/45">
              <span>Landowner</span>
              <span>Priority</span>
              <span>Tract status</span>
              <span>Phone</span>
              <span>Address</span>
              <span>Contact notes</span>
              <span>Agent</span>
              <span>Acres</span>
            </li>
            {visible.map((owner) => {
              const owned = parcelsForOwner(parcels, owner.id).filter((parcel) => !parcel.outline);
              const phone = contactPhone(owner);
              const address = contactAddress(owner);
              const notes = contactNotes(owner);
              const priorities = ownerPriorities(owner, parcels).map((priority) => priorityLabel(priority)).join(" · ");
              const selected = owner.id === selectedOwnerId;
              return (
                <li key={owner.id} className="border-t border-white/5">
                  <button
                    type="button"
                    aria-pressed={selected}
                    onClick={() => selectOwner(owner.id)}
                    className={`grid w-full grid-cols-[minmax(180px,1.3fr)_110px_120px_140px_minmax(160px,1.2fr)_minmax(160px,1.4fr)_90px_70px] gap-2 px-4 py-2 text-left hover:bg-white/5 ${selected ? "bg-white/10" : ""}`}
                  >
                    <span className="truncate text-sm text-white">{owner.name}</span>
                    <span className="truncate text-xs text-white/60">{priorities}</span>
                    <span>
                      <StatusPill status={owner.status} />
                    </span>
                    <span className="truncate text-xs text-white/70">{phone || "—"}</span>
                    <span className="truncate text-xs text-white/70" title={address}>
                      {address || "—"}
                    </span>
                    <span className="truncate text-xs text-white/55" title={notes}>
                      {notes || "—"}
                    </span>
                    <span className="truncate text-xs text-white/70">{owner.agent || "Unassigned"}</span>
                    <span className="text-xs text-white/70">
                      {formatAcres(acresForOwner(parcels, owner.id))}
                      <span className="block text-[10px] text-white/35">
                        {owned.length} parcel{owned.length === 1 ? "" : "s"}
                      </span>
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </section>
  );
}

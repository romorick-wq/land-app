import type { Filters, Owner, Parcel } from "./types";

export const defaultFilters: Filters = {
  query: "",
  leadsOnly: true,
  status: "all",
  agent: "all",
  priority: "all",
};

export function parcelsForOwner(parcels: Parcel[], ownerId: string) {
  return parcels.filter((parcel) => parcel.ownerId === ownerId);
}

export function acresForOwner(parcels: Parcel[], ownerId: string) {
  return parcelsForOwner(parcels, ownerId).reduce((sum, parcel) => sum + parcel.acres, 0);
}

export function ownerMatches(owner: Owner, parcels: Parcel[], filters: Filters, options?: { ignoreLeads?: boolean }) {
  if (!options?.ignoreLeads && filters.leadsOnly && !owner.isLead) return false;
  if (filters.status !== "all" && owner.status !== filters.status) return false;
  if (filters.priority !== "all" && owner.priority !== filters.priority) return false;
  if (filters.agent !== "all") {
    const agent = owner.agent || "Unassigned";
    if (agent !== filters.agent) return false;
  }
  const query = filters.query.trim().toLowerCase();
  if (!query) return true;
  const apns = parcelsForOwner(parcels, owner.id).map((parcel) => parcel.apn).join(" ");
  const haystack = [owner.name, owner.phone, owner.email, owner.address, owner.agent, apns]
    .join(" ")
    .toLowerCase();
  return haystack.includes(query);
}

import type { Filters, Owner, Parcel } from "./types";

export const defaultFilters: Filters = {
  query: "",
  leadsOnly: true,
  status: "all",
  agent: "all",
  priority: "all",
};

export function parcelsForOwner(parcels: Parcel[], ownerId: string) {
  return parcels.filter(
    (parcel) => parcel.ownerId === ownerId || parcel.interests?.some((interest) => interest.ownerId === ownerId),
  );
}

function statedNet(interest: NonNullable<Parcel["interests"]>[number]) {
  return interest.netMineral || interest.netSurface || interest.netGeothermal || 0;
}

export function interestAcres(parcel: Parcel, ownerId: string) {
  const interest = parcel.interests?.find((item) => item.ownerId === ownerId);
  if (!interest) return parcel.ownerId === ownerId ? parcel.acres : 0;
  const net = statedNet(interest);
  if (net) return net;
  const anyoneStated = parcel.interests?.some((item) => statedNet(item) > 0);
  return anyoneStated ? 0 : parcel.acres;
}

export function acresForOwner(parcels: Parcel[], ownerId: string) {
  return parcelsForOwner(parcels, ownerId).reduce((sum, parcel) => sum + interestAcres(parcel, ownerId), 0);
}

export function ownerHasPriority(owner: Owner, parcels: Parcel[], priority: Filters["priority"]) {
  if (priority === "all") return true;
  const owned = parcelsForOwner(parcels, owner.id);
  const tags = owned.flatMap((parcel) => (parcel.interests ?? []).filter((interest) => interest.ownerId === owner.id));
  if (tags.length) return tags.some((interest) => interest.priority === priority);
  return owner.priority === priority;
}

export function ownerMatches(owner: Owner, parcels: Parcel[], filters: Filters, options?: { ignoreLeads?: boolean }) {
  if (!options?.ignoreLeads && filters.leadsOnly && !owner.isLead) return false;
  if (filters.status !== "all" && owner.status !== filters.status) return false;
  if (!ownerHasPriority(owner, parcels, filters.priority)) return false;
  if (filters.agent !== "all") {
    const agent = owner.agent || "Unassigned";
    if (agent !== filters.agent) return false;
  }
  const query = filters.query.trim().toLowerCase();
  if (!query) return true;
  const apns = parcelsForOwner(parcels, owner.id)
    .map((parcel) => `${parcel.apn} ${parcel.legal}`)
    .join(" ");
  const haystack = [owner.name, owner.phone, owner.email, owner.address, owner.agent, apns]
    .join(" ")
    .toLowerCase();
  return haystack.includes(query);
}

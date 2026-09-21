import raw from "@/data/campaign.json";
import { isPriority, isStatus } from "./statuses";
import type { CampaignData, Owner, Parcel } from "./types";

function asOwner(value: Owner): Owner {
  return {
    ...value,
    status: isStatus(value.status) ? value.status : "available",
    priority: isPriority(value.priority) ? value.priority : "low",
    agent: value.agent ?? "",
    notes: value.notes ?? "",
    specialProvisions: value.specialProvisions ?? "",
    lookup: value.lookup ?? { phones: [], emails: [], addresses: [] },
    titleChain: value.titleChain ?? [],
    encumbrances: value.encumbrances ?? [],
    documents: value.documents ?? [],
  };
}

export function cloneSeed(): CampaignData {
  const data = raw as CampaignData;
  return {
    owners: data.owners.map((owner) => asOwner(structuredClone(owner))),
    parcels: data.parcels.map((parcel) => structuredClone(parcel) as Parcel),
  };
}

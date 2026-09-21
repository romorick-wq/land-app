import { acresForOwner } from "./filters";
import { STATUSES } from "./statuses";
import type { Owner, Parcel, StatusId } from "./types";

export type StatusRollup = Record<StatusId, { owners: number; acres: number }>;

export type CampaignMetrics = {
  byStatus: StatusRollup;
  totalAcres: number;
  securedAcres: number;
  agreements: number;
  inProgressOwners: number;
  inProgressAcres: number;
  contacted: number;
  leadCount: number;
  coverage: number;
  recent: Owner[];
};

const IN_PROGRESS: StatusId[] = ["under_review", "offer_pending", "under_contract"];

export function campaignMetrics(owners: Owner[], parcels: Parcel[]): CampaignMetrics {
  const byStatus = Object.fromEntries(
    STATUSES.map((status) => [status.id, { owners: 0, acres: 0 }]),
  ) as StatusRollup;
  const leads = owners.filter((owner) => owner.isLead);

  for (const owner of leads) {
    byStatus[owner.status].owners += 1;
    byStatus[owner.status].acres += acresForOwner(parcels, owner.id);
  }

  const totalAcres = parcels.reduce((sum, parcel) => sum + parcel.acres, 0);
  const securedAcres = byStatus.acquired.acres;
  const recent = leads
    .filter((owner) => owner.agreementGeneratedAt)
    .sort((a, b) => (b.agreementGeneratedAt ?? "").localeCompare(a.agreementGeneratedAt ?? ""))
    .slice(0, 6);

  return {
    byStatus,
    totalAcres,
    securedAcres,
    agreements: leads.filter((owner) => owner.agreementGeneratedAt).length,
    inProgressOwners: IN_PROGRESS.reduce((sum, id) => sum + byStatus[id].owners, 0),
    inProgressAcres: IN_PROGRESS.reduce((sum, id) => sum + byStatus[id].acres, 0),
    contacted: leads.filter((owner) => owner.status !== "available" && owner.status !== "excluded").length,
    leadCount: leads.length,
    coverage: totalAcres > 0 ? (securedAcres / totalAcres) * 100 : 0,
    recent,
  };
}

export type WeekBar = {
  label: string;
  acres: Record<StatusId, number>;
  sites: number;
};

export function pipelineHistory(byStatus: StatusRollup): WeekBar[] {
  const fractions = [0.34, 0.42, 0.5, 0.58, 0.67, 0.78, 0.9, 1];
  const sitePattern = [1, 0, 1, 2, 0, 1, 2, 2];
  const end = new Date("2026-09-21T12:00:00Z");

  return fractions.map((fraction, index) => {
    const date = new Date(end);
    date.setUTCDate(date.getUTCDate() - (fractions.length - 1 - index) * 7);
    const acres = {} as Record<StatusId, number>;
    for (const status of STATUSES) {
      const live = byStatus[status.id].acres;
      if (index === fractions.length - 1) {
        acres[status.id] = live;
      } else {
        const wobble = 1 + (((index + status.label.length) % 5) - 2) * 0.04;
        acres[status.id] = Math.max(0, live * fraction * wobble);
      }
    }
    return {
      label: date.toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: "UTC" }),
      acres,
      sites: sitePattern[index],
    };
  });
}

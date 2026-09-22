import type { Priority, StatusId } from "./types";

export const STATUSES: { id: StatusId; label: string; color: string }[] = [
  { id: "available", label: "Available", color: "#3b82f6" },
  { id: "no_contact", label: "No Contact", color: "#94a3b8" },
  { id: "contacted", label: "Contacted", color: "#22d3ee" },
  { id: "offer_sent", label: "Offer Sent", color: "#f59e0b" },
  { id: "offer_made", label: "Offer Made", color: "#e879f9" },
  { id: "attorney_review", label: "Attorney Review", color: "#818cf8" },
  { id: "offer_accepted", label: "Offer Accepted", color: "#34d399" },
  { id: "denied", label: "Denied", color: "#fb7185" },
  { id: "under_review", label: "Under Review", color: "#eab308" },
  { id: "offer_pending", label: "Offer Pending", color: "#f97316" },
  { id: "under_contract", label: "Under Contract", color: "#a855f7" },
  { id: "acquired", label: "Acquired", color: "#22c55e" },
  { id: "not_available", label: "Not Available", color: "#ef4444" },
  { id: "excluded", label: "Excluded", color: "#64748b" },
];

export const PRIORITIES: { id: Priority; label: string }[] = [
  { id: "test_well", label: "Test Well" },
  { id: "high", label: "Priority 1" },
  { id: "medium", label: "Priority 2" },
];

export const PROJECT = {
  product: "LandData",
  name: "Stockyards",
  place: "White Pine County, Nevada",
};

export function statusMeta(id: StatusId) {
  return STATUSES.find((status) => status.id === id) ?? STATUSES[0];
}

export function isStatus(value: string): value is StatusId {
  return STATUSES.some((status) => status.id === value);
}

export function priorityLabel(id: Priority) {
  if (id === "high") return "Priority 1";
  if (id === "test_well") return "Test Well";
  if (id === "medium") return "Priority 2";
  return "Low";
}

export function isPriority(value: string): value is Priority {
  return value === "low" || value === "medium" || value === "high" || value === "test_well";
}

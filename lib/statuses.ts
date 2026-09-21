import type { Priority, StatusId } from "./types";

export const STATUSES: { id: StatusId; label: string; color: string }[] = [
  { id: "available", label: "Available", color: "#3b82f6" },
  { id: "under_review", label: "Under Review", color: "#eab308" },
  { id: "offer_pending", label: "Offer Pending", color: "#f97316" },
  { id: "under_contract", label: "Under Contract", color: "#a855f7" },
  { id: "acquired", label: "Acquired", color: "#22c55e" },
  { id: "not_available", label: "Not Available", color: "#ef4444" },
  { id: "excluded", label: "Excluded", color: "#64748b" },
];

export const PRIORITIES: { id: Priority; label: string }[] = [
  { id: "low", label: "Low" },
  { id: "medium", label: "Medium" },
  { id: "high", label: "High" },
];

export const AGENTS = ["Alex Rivera", "Jordan Hale", "Sam Okonkwo"];

export const PROJECT = {
  product: "Land Campaign",
  name: "White Pine Solar",
  place: "White Pine County, Nevada",
};

export function statusMeta(id: StatusId) {
  return STATUSES.find((status) => status.id === id) ?? STATUSES[0];
}

export function isStatus(value: string): value is StatusId {
  return STATUSES.some((status) => status.id === value);
}

export function isPriority(value: string): value is Priority {
  return value === "low" || value === "medium" || value === "high";
}

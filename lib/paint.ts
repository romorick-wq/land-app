import type { FeatureCollection } from "geojson";
import { ownerMatches } from "./filters";
import { statusMeta } from "./statuses";
import type { Filters, Owner, Parcel } from "./types";

export function toMapFeatures(
  parcels: Parcel[],
  owners: Owner[],
  filters: Filters,
  selectedOwnerId: string | null,
  highlightedIds: string[],
): FeatureCollection {
  const ownersById = new Map(owners.map((owner) => [owner.id, owner]));
  const highlighted = new Set(highlightedIds);

  return {
    type: "FeatureCollection",
    features: parcels.flatMap((parcel) => {
      const owner = ownersById.get(parcel.ownerId);
      const status = parcel.status ?? owner?.status ?? "available";
      const ownerOk = owner ? ownerMatches(owner, parcels, { ...filters, status: "all", priority: "all" }, { ignoreLeads: true }) : false;
      const priorityOk =
        filters.priority === "all" ||
        (parcel.interests ?? []).some((interest) => interest.priority === filters.priority) ||
        (!(parcel.interests ?? []).length && owner?.priority === filters.priority);
      const matches = ownerOk && priorityOk && (filters.status === "all" || status === filters.status);
      const selected = owner?.id === selectedOwnerId || parcel.interests?.some((interest) => interest.ownerId === selectedOwnerId);
      const pending = highlighted.has(parcel.id);
      let fill = "#14532d";
      let fillOpacity = matches ? 0.16 : 0.04;
      let line = "#4ade80";
      let lineWidth = 1.25;

      if (owner?.isLead || parcel.status) {
        const color = statusMeta(status).color;
        fill = color;
        line = color;
        fillOpacity = matches ? 0.5 : 0.08;
      }

      if (selected) {
        line = "#ffffff";
        lineWidth = 2.8;
      }
      if (pending) {
        line = "#f59e0b";
        lineWidth = 3;
        fillOpacity = Math.max(fillOpacity, 0.38);
      }

      const feature = {
        type: "Feature" as const,
        properties: {
          id: parcel.id,
          ownerId: parcel.ownerId,
          fill,
          fillOpacity,
          line,
          lineWidth,
          outline: parcel.outline ? 1 : 0,
          label: parcel.outline ? "" : (parcel.label ?? ""),
        },
        geometry: parcel.geometry,
      };
      if (!parcel.outline || !parcel.label || !parcel.labelAt) return [feature];
      return [
        feature,
        {
          type: "Feature" as const,
          properties: {
            id: `${parcel.id}-label`,
            ownerId: parcel.ownerId,
            fill: "#ffffff",
            fillOpacity: 0,
            line: "#ffffff",
            lineWidth: 0,
            outline: 0,
            label: parcel.label,
          },
          geometry: { type: "Point" as const, coordinates: parcel.labelAt },
        },
      ];
    }),
  };
}

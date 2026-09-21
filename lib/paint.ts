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
    features: parcels.map((parcel) => {
      const owner = ownersById.get(parcel.ownerId);
      const matches = owner ? ownerMatches(owner, parcels, filters, { ignoreLeads: true }) : false;
      const selected = owner?.id === selectedOwnerId;
      const pending = highlighted.has(parcel.id);
      let fill = "#14532d";
      let fillOpacity = matches ? 0.16 : 0.04;
      let line = "#4ade80";
      let lineWidth = 1.25;

      if (owner?.isLead) {
        const color = statusMeta(owner.status).color;
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

      return {
        type: "Feature" as const,
        properties: {
          id: parcel.id,
          ownerId: parcel.ownerId,
          fill,
          fillOpacity,
          line,
          lineWidth,
        },
        geometry: parcel.geometry,
      };
    }),
  };
}

import { isPriority, isStatus } from "./statuses";
import type { CampaignData, Owner, Parcel } from "./types";
import type { MultiPolygon, Polygon } from "geojson";

const MAX_FEATURES = 2000;

function finiteCoords(value: unknown, depth = 0): boolean {
  if (depth > 8) return false;
  if (typeof value === "number") return Number.isFinite(value);
  if (!Array.isArray(value)) return false;
  return value.every((entry) => finiteCoords(entry, depth + 1));
}

function text(value: unknown, fallback = "", max = 240) {
  if (typeof value !== "string" && typeof value !== "number") return fallback;
  return String(value).trim().slice(0, max);
}

function acresOf(value: unknown) {
  const parsed = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(parsed) || parsed < 0) return 0;
  return Math.round(parsed * 10) / 10;
}

export function campaignFromGeoJSON(input: unknown): CampaignData {
  if (!input || typeof input !== "object") {
    throw new Error("Choose a GeoJSON FeatureCollection.");
  }
  const collection = input as { type?: string; features?: unknown[] };
  if (collection.type !== "FeatureCollection" || !Array.isArray(collection.features)) {
    throw new Error("Choose a GeoJSON FeatureCollection.");
  }
  if (collection.features.length > MAX_FEATURES) {
    throw new Error("That file has more than 2,000 features.");
  }

  const parcels: Parcel[] = [];
  const groups = new Map<string, { name: string; parcels: Parcel[]; status?: string; priority?: string; agent?: string; phone?: string; email?: string; address?: string }>();

  collection.features.forEach((entry, index) => {
    if (!entry || typeof entry !== "object") return;
    const feature = entry as { geometry?: { type?: string; coordinates?: unknown }; properties?: Record<string, unknown> | null };
    const geometry = feature.geometry;
    if (!geometry || (geometry.type !== "Polygon" && geometry.type !== "MultiPolygon")) return;
    if (!finiteCoords(geometry.coordinates)) return;

    const properties = feature.properties ?? {};
    const name = text(properties.owner ?? properties.ownerName ?? properties.Owner ?? properties.OWNER, "Unknown owner");
    const key = name.toLowerCase();
    const parcel: Parcel = {
      id: `i${String(index + 1).padStart(4, "0")}`,
      ownerId: "",
      acres: acresOf(properties.acres ?? properties.Acres ?? properties.ACRES ?? properties.gis_acres),
      apn: text(properties.apn ?? properties.APN ?? properties.parcel_id ?? properties.id, `IMPORT-${index + 1}`, 80),
      legal: text(properties.legal ?? properties.legalDescription ?? properties.LEGAL, "", 500),
      geometry: geometry as Polygon | MultiPolygon,
    };
    if (!groups.has(key)) {
      groups.set(key, {
        name,
        parcels: [],
        status: text(properties.status),
        priority: text(properties.priority),
        agent: text(properties.agent),
        phone: text(properties.phone),
        email: text(properties.email),
        address: text(properties.address),
      });
    }
    groups.get(key)?.parcels.push(parcel);
  });

  const owners: Owner[] = [];
  let ownerIndex = 0;
  for (const group of groups.values()) {
    ownerIndex += 1;
    const id = `i-owner-${ownerIndex}`;
    const status = group.status && isStatus(group.status) ? group.status : "available";
    const priority = group.priority && isPriority(group.priority) ? group.priority : "medium";
    for (const parcel of group.parcels) {
      parcel.ownerId = id;
      if (!parcel.acres) parcel.acres = 0;
      parcels.push(parcel);
    }
    owners.push({
      id,
      name: group.name,
      phone: group.phone || "",
      email: group.email || "",
      address: group.address || "",
      status,
      priority,
      agent: group.agent || "",
      notes: "",
      isLead: true,
      updatedAt: new Date().toISOString(),
      specialProvisions: "",
      lookup: { phones: group.phone ? [group.phone] : [], emails: group.email ? [group.email] : [], addresses: group.address ? [group.address] : [] },
      titleChain: [],
      encumbrances: [],
      documents: [],
    });
  }

  if (!parcels.length) throw new Error("No polygon parcels were found in that file.");
  return { owners, parcels };
}

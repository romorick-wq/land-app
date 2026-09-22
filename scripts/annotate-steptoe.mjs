import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import * as turf from "@turf/turf";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

function inValley(parcel) {
  if (!/Township 21 North, Range 64 East/.test(parcel.legal || "")) return false;
  if (/Section 18,|Section 19,/.test(parcel.legal)) return true;
  return parcel.ownerId === "steptoe-farms-llc" && /Section 20,/.test(parcel.legal);
}

function thermalWellGeometry(parcels) {
  const pieces = parcels.filter((parcel) => parcel.id !== "surface-thermal-test-well" && inValley(parcel));
  let merged = null;
  for (const parcel of pieces) {
    const grown = turf.buffer(turf.feature(parcel.geometry), 0.045, { units: "kilometers" });
    merged = merged ? turf.union(turf.featureCollection([merged, grown])) : grown;
  }
  if (!merged) return null;
  let shape = turf.buffer(merged, -0.02, { units: "kilometers" });
  for (const parcel of parcels) {
    if (!/Section 17, Township 21 North, Range 64 East/.test(parcel.legal || "")) continue;
    const cut = turf.buffer(turf.feature(parcel.geometry), 0.015, { units: "kilometers" });
    const next = turf.difference(turf.featureCollection([shape, cut]));
    if (next) shape = next;
  }
  return turf.truncate(shape, { precision: 5 }).geometry;
}

export function annotateSteptoe(parcels, owners = []) {
  const next = parcels.filter((parcel) => parcel.id !== "surface-thermal-test-well");
  for (const parcel of next) {
    if (parcel.ownerId !== "steptoe-farms-llc") continue;
    if (/Section 19,/.test(parcel.legal)) parcel.label = "Steptoe Farms Tract 19";
    if (/Section 20,/.test(parcel.legal)) parcel.label = "Steptoe Farms Tract 20";
    if (parcel.label === "Steptoe Farms Tract 19" || parcel.label === "Steptoe Farms Tract 20") {
      parcel.interests = (parcel.interests ?? []).map((interest) =>
        interest.ownerId === "steptoe-farms-llc" ? { ...interest, priority: "test_well" } : interest,
      );
    }
  }
  for (const owner of owners) {
    if (owner.id === "steptoe-farms-llc") owner.priority = "test_well";
  }
  const geometry = thermalWellGeometry(next);
  const tract19 = next.find((parcel) => parcel.label === "Steptoe Farms Tract 19");
  if (geometry && tract19) {
    const [lng, lat] = turf.centroid(turf.feature(tract19.geometry)).geometry.coordinates;
    next.push({
      id: "surface-thermal-test-well",
      ownerId: tract19.ownerId,
      acres: 0,
      apn: "",
      legal: "Surface thermal test well, Steptoe Valley, Township 21 North, Range 64 East, MDM, White Pine County, Nevada",
      label: "Surface Thermal Test Well",
      labelAt: [Math.round(lng * 1e5) / 1e5, Math.round((lat + 0.004) * 1e5) / 1e5],
      outline: true,
      status: tract19.status,
      interests: [],
      geometry,
    });
  }
  return next;
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  const file = join(root, "data", "campaign.json");
  const campaign = JSON.parse(readFileSync(file, "utf8"));
  campaign.parcels = annotateSteptoe(campaign.parcels, campaign.owners);
  writeFileSync(file, JSON.stringify(campaign));
  const labeled = campaign.parcels.filter((parcel) => parcel.label).map((parcel) => parcel.label);
  console.log(labeled.join("\n"));
}

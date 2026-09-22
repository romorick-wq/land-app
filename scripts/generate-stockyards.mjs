import { execFileSync } from "node:child_process";
import { mkdirSync, readFileSync, writeFileSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import * as turf from "@turf/turf";
import { annotateSteptoe } from "./annotate-steptoe.mjs";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const workbook = process.argv[2] || "/Users/derty/Dropbox/__Landman work/NRG Land/STOCKYARDS/Stockyards Tracking Report Scott 9-11-26.xlsx";
const cacheDir = join(root, "data", ".plss-cache");
const secondUrl = "https://gis.blm.gov/nvarcgis/rest/services/BLM_Nevada_Public_Land_Survey_System/PLSS_Second_Division_Aliquot_Part/FeatureServer/0/query";
const sectionUrl = "https://gis.blm.gov/nvarcgis/rest/services/BLM_Nevada_Public_Land_Survey_System/PLSS_First_Division_Section/FeatureServer/0/query";
const countyUrl = "https://tigerweb.geo.census.gov/arcgis/rest/services/TIGERweb/State_County/MapServer/1/query";
const quarterCodes = ["NENE", "NWNE", "SENE", "SWNE", "NENW", "NWNW", "SENW", "SWNW", "NESE", "NWSE", "SESE", "SWSE", "NESW", "NWSW", "SESW", "SWSW"];
const halfTokens = new Set(["N2", "S2", "E2", "W2", "NE", "NW", "SE", "SW"]);

function plssId(township, range) {
  const townshipMatch = String(township).match(/(\d+)\s*([NS])/i);
  const rangeMatch = String(range).match(/(\d+)\s*([EW])/i);
  if (!townshipMatch || !rangeMatch) return null;
  const townshipNumber = townshipMatch[1].padStart(3, "0");
  const rangeNumber = rangeMatch[1].padStart(3, "0");
  return `NV21${townshipNumber}0${townshipMatch[2].toUpperCase()}${rangeNumber}0${rangeMatch[2].toUpperCase()}0`;
}

function sectionNumbers(value) {
  return String(value)
    .split("&")
    .map((part) => Number(part.replace(/[^\d]/g, "")))
    .filter((part) => Number.isFinite(part) && part > 0);
}

function cleanAliquot(value) {
  return String(value || "")
    .replace(/\bless\b[\s\S]*$/i, "")
    .replace(/irregular tract/gi, "")
    .trim();
}

function aliquotParts(value) {
  const cleaned = cleanAliquot(value).replace(/\s+/g, "").replace(/([NSEW])\/2/gi, "$12").toUpperCase();
  if (!cleaned) return [];
  return cleaned.split(/[,;]/).filter(Boolean).map(parsePart).filter(Boolean);
}

function parsePart(part) {
  if (/^\d+(-\d+)?$/.test(part)) {
    const [start, end] = part.split("-").map(Number);
    const lots = [];
    for (let lot = start; lot <= (end ?? start); lot += 1) lots.push(lot);
    return { lots };
  }
  const tokens = [];
  for (let index = 0; index < part.length; index += 2) {
    const token = part.slice(index, index + 2);
    if (!halfTokens.has(token)) return null;
    tokens.push(token);
  }
  return tokens.length ? { tokens } : null;
}

function keeps(code, token, level) {
  const key = level === 0 ? code.slice(2) : code.slice(0, 2);
  if (token === "N2") return key.startsWith("N");
  if (token === "S2") return key.startsWith("S");
  if (token === "E2") return key.endsWith("E");
  if (token === "W2") return key.endsWith("W");
  return key === token;
}

function clipHalf(feature, token) {
  if (!feature) return null;
  const [minX, minY, maxX, maxY] = turf.bbox(feature);
  const midX = (minX + maxX) / 2;
  const midY = (minY + maxY) / 2;
  const boxes = {
    E2: [midX, minY, maxX, maxY],
    W2: [minX, minY, midX, maxY],
    N2: [minX, midY, maxX, maxY],
    S2: [minX, minY, maxX, midY],
    NE: [midX, midY, maxX, maxY],
    NW: [minX, midY, midX, maxY],
    SE: [midX, minY, maxX, midY],
    SW: [minX, minY, midX, midY],
  };
  const box = boxes[token];
  if (!box) return null;
  try {
    return turf.intersect(turf.featureCollection([feature, turf.bboxPolygon(box)]));
  } catch {
    return null;
  }
}

function unionAll(features) {
  const clean = features.filter((feature) => feature?.geometry);
  if (!clean.length) return null;
  if (clean.length === 1) return clean[0];
  try {
    return turf.union(turf.featureCollection(clean));
  } catch {
    return turf.multiPolygon(
      clean.flatMap((feature) =>
        feature.geometry.type === "Polygon" ? [feature.geometry.coordinates] : feature.geometry.coordinates,
      ),
    );
  }
}

function protractCell(sectionFeature, code) {
  const quarter = clipHalf(sectionFeature, code.slice(2));
  return clipHalf(quarter, code.slice(0, 2));
}

function edgeStrip(sectionFeature, found) {
  const [minX, minY, maxX, maxY] = turf.bbox(sectionFeature);
  const centroids = found.map((feature) => turf.centroid(feature).geometry.coordinates);
  const averageX = centroids.reduce((sum, point) => sum + point[0], 0) / centroids.length;
  const averageY = centroids.reduce((sum, point) => sum + point[1], 0) / centroids.length;
  const xRatio = (averageX - minX) / (maxX - minX);
  const yRatio = (averageY - minY) / (maxY - minY);
  const edge = [
    ["W", xRatio],
    ["E", 1 - xRatio],
    ["S", yRatio],
    ["N", 1 - yRatio],
  ].sort((a, b) => a[1] - b[1])[0][0];
  const spanX = (maxX - minX) / 4;
  const spanY = (maxY - minY) / 4;
  const boxes = {
    W: [minX, minY, minX + spanX, maxY],
    E: [maxX - spanX, minY, maxX, maxY],
    S: [minX, minY, maxX, minY + spanY],
    N: [minX, maxY - spanY, maxX, maxY],
  };
  return turf.bboxPolygon(boxes[edge]);
}

function geometryForPart(part, section, quarters, lots, sectionFeature) {
  if (part.lots) {
    const found = [];
    let missing = 0;
    for (const lot of part.lots) {
      const feature = lots.get(`${section}:${lot}`);
      if (feature) found.push(feature);
      else missing += 1;
    }
    if (missing && found.length && sectionFeature && part.lots[0] === 1) {
      const strip = edgeStrip(sectionFeature, found);
      for (const [key, feature] of lots) {
        if (!key.startsWith(`${section}:`) || found.includes(feature)) continue;
        try {
          if (turf.booleanPointInPolygon(turf.centroid(feature), strip)) found.push(feature);
        } catch {
          // Skip a lot that does not sit cleanly in the section strip.
        }
      }
    }
    return unionAll(found);
  }
  let codes = quarterCodes.slice();
  const clips = [];
  part.tokens
    .slice()
    .reverse()
    .forEach((token, level) => {
      if (level < 2) {
        const next = codes.filter((code) => keeps(code, token, level));
        if (next.length) {
          codes = next;
          return;
        }
      }
      clips.push(token);
    });
  const pieces = [];
  const missing = [];
  for (const code of codes) {
    const quarter = quarters.get(`${section}:${code}`);
    if (quarter) pieces.push(quarter);
    else missing.push(code);
  }
  if (missing.length && sectionFeature) {
    const cells = missing
      .map((code) => protractCell(sectionFeature, code))
      .filter(Boolean);
    for (const [key, lot] of lots) {
      if (!key.startsWith(`${section}:`)) continue;
      const centroid = turf.centroid(lot);
      if (cells.some((cell) => turf.booleanPointInPolygon(centroid, cell))) pieces.push(lot);
    }
  }
  let feature = unionAll(pieces);
  if (!feature) feature = sectionFeature ?? null;
  for (const token of clips) {
    const next = clipHalf(feature, token);
    if (!next) break;
    feature = next;
  }
  return feature;
}

function tractGeometry(row, indexes) {
  const id = plssId(row.township, row.range);
  if (!id) return null;
  const parts = aliquotParts(row.aliquot);
  if (!parts.length) return null;
  const pieces = [];
  for (const section of sectionNumbers(row.section)) {
    const quarters = indexes.quarters.get(id);
    const lots = indexes.lots.get(id);
    const sectionFeature = indexes.sections.get(id)?.get(section) ?? null;
    if (!quarters || !lots) continue;
    for (const part of parts) {
      const feature = geometryForPart(part, section, quarters, lots, sectionFeature);
      if (feature) pieces.push(feature);
    }
  }
  return unionAll(pieces);
}

async function fetchLayer(url, where, fields, cacheName) {
  mkdirSync(cacheDir, { recursive: true });
  const cachePath = join(cacheDir, cacheName);
  if (existsSync(cachePath)) return JSON.parse(readFileSync(cachePath, "utf8"));
  const features = [];
  let offset = 0;
  for (;;) {
    const query = new URL(url);
    query.searchParams.set("where", where);
    query.searchParams.set("outFields", fields);
    query.searchParams.set("returnGeometry", "true");
    query.searchParams.set("outSR", "4326");
    query.searchParams.set("f", "geojson");
    query.searchParams.set("resultRecordCount", "1500");
    query.searchParams.set("resultOffset", String(offset));
    const response = await fetch(query);
    if (!response.ok) throw new Error(`BLM query failed (${response.status})`);
    const payload = await response.json();
    if (payload.error) throw new Error(payload.error.message || "BLM query failed");
    const page = payload.features || [];
    features.push(...page);
    if (!payload.exceededTransferLimit && page.length < 1500) break;
    offset += page.length;
    if (!page.length) break;
  }
  const collection = { type: "FeatureCollection", features };
  writeFileSync(cachePath, JSON.stringify(collection));
  return collection;
}

function indexDivisions(collection) {
  const quarters = new Map();
  const lots = new Map();
  for (const feature of collection.features) {
    const props = feature.properties || {};
    const township = props.PLSSID;
    const sectionMatch = String(props.FRSTDIVID || "").match(/SN(\d{2})/);
    if (!township || !sectionMatch) continue;
    const section = Number(sectionMatch[1]);
    if (props.SECDIVTYP === "L") {
      const bucket = lots.get(township) ?? new Map();
      bucket.set(`${section}:${Number(props.SECDIVNO)}`, feature);
      lots.set(township, bucket);
    } else if (props.SECDIVTYP === "A") {
      const bucket = quarters.get(township) ?? new Map();
      bucket.set(`${section}:${String(props.SECDIVLAB || "").toUpperCase()}`, feature);
      quarters.set(township, bucket);
    }
  }
  return { quarters, lots };
}

function indexSections(collection) {
  const sections = new Map();
  for (const feature of collection.features) {
    const props = feature.properties || {};
    const section = Number(props.FRSTDIVNO);
    if (!props.PLSSID || !section) continue;
    const bucket = sections.get(props.PLSSID) ?? new Map();
    bucket.set(section, feature);
    sections.set(props.PLSSID, bucket);
  }
  return sections;
}

function campaignStatus(row) {
  if (row.lease === "Leased by Competitor") return "not_available";
  if (row.acquisition === "Rejected") return "excluded";
  if (row.acquisition === "Leased" || row.lease === "Leased by COP") return "acquired";
  if (row.acquisition === "Committed") return "under_contract";
  if (row.acquisition === "Offer Out") return "offer_pending";
  if (row.acquisition === "Negotiating") return "under_review";
  return "available";
}

function netAcres(row) {
  return row.netMineral || row.netSurface || row.netGeothermal || 0;
}

function slug(value) {
  const base = value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 64);
  return base || "owner";
}

function legalDescription(row) {
  const township = String(row.township).replace(/(\d+)N/i, "$1 North").replace(/(\d+)S/i, "$1 South");
  const range = String(row.range).replace(/(\d+)E/i, "$1 East").replace(/(\d+)W/i, "$1 West");
  const rawAliquot = String(row.aliquot || "").trim();
  const aliquot = !rawAliquot
    ? "aliquot not stated"
    : /lot/i.test(row.survey) && /^\d/.test(rawAliquot)
      ? `Lot ${rawAliquot}`
      : rawAliquot;
  const sections = sectionNumbers(row.section).join(" and ");
  return `${aliquot} of Section ${sections}, Township ${township}, Range ${range}, MDM, White Pine County, Nevada`;
}

function roundGeometry(geometry) {
  const feature = turf.truncate(turf.feature(geometry), { precision: 6 });
  return feature.geometry;
}

const rows = JSON.parse(execFileSync("python3", [join(root, "scripts", "read-stockyards.py"), workbook], { encoding: "utf8" }));
const townshipIds = [...new Set(rows.map((row) => plssId(row.township, row.range)).filter(Boolean))];
const where = `PLSSID IN (${townshipIds.map((id) => `'${id}'`).join(",")})`;
console.log(`Rows ${rows.length}. Townships ${townshipIds.join(", ")}`);

const [divisions, sections, countyPayload] = await Promise.all([
  fetchLayer(secondUrl, where, "PLSSID,FRSTDIVID,SECDIVTYP,SECDIVLAB,SECDIVNO", "second-division.json"),
  fetchLayer(sectionUrl, where, "PLSSID,FRSTDIVNO,FRSTDIVID", "sections.json"),
  fetch(countyUrl + "?" + new URLSearchParams({
    where: "NAME='White Pine County' AND STATE='32'",
    outFields: "NAME",
    returnGeometry: "true",
    outSR: "4326",
    f: "geojson",
  })).then((response) => response.json()),
]);

const indexes = indexDivisions(divisions);
indexes.sections = indexSections(sections);
const county = countyPayload.features?.[0] ? turf.feature(countyPayload.features[0].geometry) : null;
console.log(`BLM aliquot parts ${divisions.features.length}, sections ${sections.features.length}`);

const tracts = new Map();
for (const row of rows) {
  const key = [row.township, row.range, row.section, cleanAliquot(row.aliquot).replace(/\s+/g, "").toUpperCase(), row.parcelId].join("|");
  const current = tracts.get(key) ?? { key, rows: [], geometry: null };
  current.rows.push(row);
  tracts.set(key, current);
}

const owners = new Map();
const parcels = [];
const unmapped = [];
let insideCounty = 0;

function rememberOwner(row, legal) {
  let id = slug(row.owner);
  const existing = owners.get(id);
  if (existing && existing.name !== row.owner) id = `${id}-2`;
  const record = owners.get(id) ?? {
      id,
      name: row.owner,
      phone: row.phone,
      email: "",
      address: row.address,
      status: "available",
      priority: "medium",
      agent: "Rick Romo",
      notes: "",
      isLead: true,
      updatedAt: "2026-09-11T12:00:00.000Z",
      specialProvisions: "",
      lookup: { phones: [], emails: [], addresses: [] },
      titleChain: [],
      encumbrances: [],
      documents: [],
      _net: 0,
      _comments: [],
      _title: [],
      _legals: [],
    };
    if (row.phone) record.phone = row.phone;
    if (row.address) record.address = row.address;
    if (row.priority === 1) record.priority = "high";
    const net = netAcres(row);
    if (net >= record._net) {
      record._net = net;
      record.status = campaignStatus(row);
    }
    if (row.comments && !record._comments.includes(row.comments)) record._comments.push(row.comments);
    const titleLine = [row.township, row.range, "Sec", row.section, cleanAliquot(row.aliquot), row.title].filter(Boolean).join(" ");
    if (!record._title.includes(titleLine)) record._title.push(titleLine);
    if (legal && !record._legals.includes(legal)) record._legals.push(legal);
    owners.set(id, record);
    return {
      ownerId: id,
      netSurface: row.netSurface,
      netMineral: row.netMineral,
      netGeothermal: row.netGeothermal,
      leaseStatus: row.lease || "Not Reviewed",
      titleStatus: row.title || "Not Reviewed",
      acquisitionStatus: row.acquisition || "Not Contacted",
      bonusPerAcre: row.bonus || null,
      totalDollars: row.total || null,
      comments: row.comments,
      reportUrl: row.reportUrl,
      priority: row.priority === 1 ? "high" : "medium",
    };
}

for (const tract of tracts.values()) {
  const sample = tract.rows[0];
  const legal = legalDescription(sample);
  const interests = tract.rows.map((row) => rememberOwner(row, legal));
  const geometry = tractGeometry(sample, indexes);
  if (!geometry) {
    unmapped.push(`${sample.township} ${sample.range} Sec ${sample.section} ${sample.aliquot || "(blank)"} ${sample.parcelId}`.trim());
    continue;
  }
  const simplified = turf.simplify(geometry, { tolerance: 0.00003, highQuality: false });
  const center = turf.centroid(simplified);
  if (county && turf.booleanPointInPolygon(center, county)) insideCounty += 1;
  const primaryIndex = tract.rows.reduce((best, row, index) => (netAcres(row) > netAcres(tract.rows[best]) ? index : best), 0);
  const measured = turf.area(simplified) / 4046.8564224;
  const gross = Math.max(...tract.rows.map((row) => row.gross), 0) || measured;
  if (gross > 0 && Math.abs(measured - gross) / gross > 0.4) {
    console.log(`Acre check ${sample.township} ${sample.range} Sec ${sample.section} ${sample.aliquot}: report ${gross.toFixed(1)} gis ${measured.toFixed(1)}`);
  }
  parcels.push({
    id: `sy-${parcels.length + 1}`,
    ownerId: interests[primaryIndex].ownerId,
    acres: Math.round(gross * 100) / 100,
    apn: sample.parcelId,
    legal: legalDescription(sample),
    status: campaignStatus(tract.rows[primaryIndex]),
    interests,
    geometry: roundGeometry(simplified.geometry),
  });
}

const ownerList = [...owners.values()].map((owner) => {
  const notes = [
    owner.priority === "high" ? "Priority 1 on the 9/11/2026 Stockyards tracking report." : "Priority 2 on the 9/11/2026 Stockyards tracking report.",
    ...owner._comments,
  ].join(" ");
  const titleChain = owner._legals.length
    ? [
        {
          id: `${owner.id}-report`,
          instrumentType: "Tracking report",
          instDate: "2026-09-11",
          recordDate: "2026-09-11",
          grantor: "",
          grantee: owner.name,
          bookPage: "",
          tenancy: "",
          minerals: owner._title.join("; ").slice(0, 500),
          legalDescription: owner._legals.join("; ").slice(0, 1200),
          remarks: "Ownership position from the Stockyards tracking report. This is not a recorded instrument.",
          vestingDeed: false,
        },
      ]
    : [];
  return {
    id: owner.id,
    name: owner.name,
    phone: owner.phone,
    email: owner.email,
    address: owner.address,
    status: owner.status,
    priority: owner.priority,
    agent: "Rick Romo",
    notes: notes.slice(0, 2000),
    isLead: true,
    updatedAt: owner.updatedAt,
    specialProvisions: "",
    lookup: owner.lookup,
    titleChain,
    encumbrances: [],
    documents: [],
  };
});

const owners = ownerList.sort((a, b) => a.name.localeCompare(b.name));
const campaign = { owners, parcels: annotateSteptoe(parcels, owners) };
writeFileSync(join(root, "data", "campaign.json"), JSON.stringify(campaign));
console.log(`Mapped ${parcels.length} tracts, ${ownerList.length} owners, ${insideCounty} centroids inside White Pine County.`);
if (unmapped.length) {
  console.log(`Unmapped ${unmapped.length}:`);
  for (const line of unmapped) console.log(`  ${line}`);
}

import { writeFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

const ownersSpec = [
  { name: "Harper Lane Farms LLC", n: 4, status: "acquired", priority: "high", agent: "Alex Rivera", lead: true },
  { name: "Nolan Briggs", n: 2, status: "under_contract", priority: "high", agent: "Alex Rivera", lead: true },
  { name: "Elena Voss", n: 2, status: "offer_pending", priority: "medium", agent: "Jordan Hale", lead: true },
  { name: "Cedar Ridge Trust", n: 3, status: "under_review", priority: "medium", agent: "Jordan Hale", lead: true },
  { name: "Blackwood Family LP", n: 3, status: "under_review", priority: "low", agent: "Sam Okonkwo", lead: true },
  { name: "June Okonkwo", n: 2, status: "acquired", priority: "high", agent: "Sam Okonkwo", lead: true },
  { name: "Theo Marsh", n: 2, status: "offer_pending", priority: "medium", agent: "Alex Rivera", lead: true },
  { name: "Inez Calder", n: 1, status: "under_contract", priority: "high", agent: "Jordan Hale", lead: true },
  { name: "Marcus Hale", n: 2, status: "available", priority: "low", agent: "Sam Okonkwo", lead: true },
  { name: "Priya Shah", n: 2, status: "available", priority: "medium", agent: "Sam Okonkwo", lead: true },
  { name: "Owen Keller", n: 1, status: "not_available", priority: "low", agent: "Jordan Hale", lead: true },
  { name: "Ruth Adler", n: 1, status: "excluded", priority: "low", agent: "", lead: true },
  { name: "Clyde Barnett", n: 2, status: "under_review", priority: "medium", agent: "Alex Rivera", lead: true },
  { name: "Ada Moretti", n: 1, status: "available", priority: "low", agent: "", lead: true },
  { name: "Old Ridge Cemetery Association", n: 1, status: "excluded", priority: "low", agent: "", lead: true },
  { name: "Dale Pendergast", n: 2, status: "available", priority: "low", agent: "", lead: false },
  { name: "Willa Crowe", n: 2, status: "available", priority: "low", agent: "", lead: false },
  { name: "Grant Ellis", n: 3, status: "available", priority: "low", agent: "", lead: false },
  { name: "Nora Quinn", n: 2, status: "available", priority: "low", agent: "", lead: false },
  { name: "Felix Romero", n: 2, status: "available", priority: "low", agent: "", lead: false },
  { name: "Hester Blum", n: 2, status: "available", priority: "low", agent: "", lead: false },
  { name: "Lila Chen", n: 2, status: "available", priority: "low", agent: "", lead: false },
  { name: "South Fork Holdings", n: 2, status: "available", priority: "medium", agent: "", lead: false },
  { name: "Pike and Morrow", n: 2, status: "available", priority: "low", agent: "", lead: false },
];

const totalParcels = ownersSpec.reduce((sum, owner) => sum + owner.n, 0);
if (totalParcels !== 48) {
  throw new Error(`Expected 48 parcels, got ${totalParcels}`);
}

const originLng = -114.92;
const originLat = 39.19;
const cellW = 0.0064;
const cellH = 0.0047;
const cols = 8;

function emailFor(name) {
  const slug = name
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, ".")
    .replace(/^\.|\.$/g, "");
  return `${slug}@example.com`;
}

function phoneFor(index) {
  return `(775) 555-${String(140 + index).padStart(4, "0")}`;
}

function agreementDate(status, index) {
  if (status !== "acquired" && status !== "under_contract") return undefined;
  const day = String(4 + (index % 18)).padStart(2, "0");
  return `2026-09-${day}T15:00:00.000Z`;
}

const quarters = ["NE 1/4", "NW 1/4", "SE 1/4", "SW 1/4"];
const parcels = [];
const owners = [];
let parcelIndex = 0;

ownersSpec.forEach((spec, ownerIndex) => {
  const id = `o${String(ownerIndex + 1).padStart(2, "0")}`;
  const phone = phoneFor(ownerIndex);
  const email = emailFor(spec.name);
  const address = `${240 + ownerIndex * 10} Steptoe Valley Road, Ely, NV 89301`;
  const ownerParcels = [];

  for (let n = 0; n < spec.n; n += 1) {
    const col = parcelIndex % cols;
    const row = Math.floor(parcelIndex / cols);
    const shrink = 0.00018;
    const lng = originLng + col * cellW + shrink;
    const lat = originLat + row * cellH + shrink;
    const w = cellW - shrink * 2 - (parcelIndex % 3) * 0.00012;
    const h = cellH - shrink * 2 - (parcelIndex % 4) * 0.00008;
    const acres = Math.round((34 + ((parcelIndex * 17) % 49)) * 10) / 10;
    const parcelId = `p${String(parcelIndex + 1).padStart(2, "0")}`;
    const section = 8 + (parcelIndex % 16);
    const legal = `The ${quarters[parcelIndex % 4]} of Section ${section}, Township 15 North, Range 63 East, MDM, White Pine County, Nevada`;
    parcels.push({
      id: parcelId,
      ownerId: id,
      acres,
      apn: `010-${String(section).padStart(2, "0")}-${String(parcelIndex + 1).padStart(3, "0")}`,
      legal,
      geometry: {
        type: "Polygon",
        coordinates: [[
          [Number(lng.toFixed(6)), Number(lat.toFixed(6))],
          [Number((lng + w).toFixed(6)), Number(lat.toFixed(6))],
          [Number((lng + w).toFixed(6)), Number((lat + h).toFixed(6))],
          [Number(lng.toFixed(6)), Number((lat + h).toFixed(6))],
          [Number(lng.toFixed(6)), Number(lat.toFixed(6))],
        ]],
      },
    });
    ownerParcels.push(parcels[parcels.length - 1]);
    parcelIndex += 1;
  }

  const first = ownerParcels[0];
  const chain = spec.lead
    ? [
        {
          id: `${id}-t1`,
          instrumentType: "WD",
          instDate: "1998-04-12",
          recordDate: "1998-04-20",
          grantor: "HAROLD J. PENCE",
          grantee: spec.name.toUpperCase(),
          bookPage: `${2010 + ownerIndex} / ${120 + ownerIndex}`,
          tenancy: "Not specified",
          minerals: "Silent",
          legalDescription: first.legal,
          remarks: "Warranty deed into the current owner. No mineral reservation is recited in this instrument.",
          vestingDeed: true,
        },
        {
          id: `${id}-t2`,
          instrumentType: "EASE",
          instDate: "1976-11-03",
          recordDate: "1976-11-18",
          grantor: spec.name.toUpperCase(),
          grantee: "WHITE PINE CONSERVATION DISTRICT",
          bookPage: `${880 + ownerIndex} / 44`,
          tenancy: "Easement",
          minerals: "Surface only",
          legalDescription: first.legal,
          remarks: "Stock-water and ditch easement along the north line. Confirm it does not block the proposed array.",
          vestingDeed: false,
        },
      ]
    : [];

  const encumbrances =
    spec.lead && ["under_review", "offer_pending", "available"].includes(spec.status)
      ? [
          {
            id: `${id}-e1`,
            type: "Mortgage",
            holder: "Steptoe Valley Bank",
            recorded: "2016-08-01",
            bookPage: `${2200 + ownerIndex} / 88`,
            amount: "$185,000",
            notes: "Open mortgage. Confirm a release or subordination before closing.",
          },
        ]
      : [];

  owners.push({
    id,
    name: spec.name,
    phone,
    email,
    address,
    status: spec.status,
    priority: spec.priority,
    agent: spec.agent,
    notes: spec.lead ? "Sample campaign record. Confirm owner and contact details before outreach." : "",
    isLead: spec.lead,
    updatedAt: agreementDate(spec.status, ownerIndex) || "2026-09-12T15:00:00.000Z",
    specialProvisions: "",
    agreementGeneratedAt: agreementDate(spec.status, ownerIndex),
    exhibitGeneratedAt: spec.status === "acquired" ? agreementDate(spec.status, ownerIndex) : undefined,
    notarizationRequestedAt: spec.status === "acquired" && ownerIndex === 0 ? "2026-09-16T18:30:00.000Z" : undefined,
    titleReviewedAt: spec.status === "acquired" ? "2026-09-10T14:00:00.000Z" : undefined,
    lookup: {
      phones: [phone, `(775) 555-${String(400 + ownerIndex).padStart(4, "0")}`],
      emails: [email],
      addresses: [address, `PO Box ${80 + ownerIndex}, Ely, NV 89301`],
    },
    titleChain: chain,
    encumbrances,
    documents: spec.lead
      ? [{ name: `${first.apn}-deed.pdf`, size: 240000 }]
      : [],
  });
});

const payload = { owners, parcels };
const out = join(root, "data", "campaign.json");
mkdirSync(dirname(out), { recursive: true });
writeFileSync(out, JSON.stringify(payload));
console.log(`Wrote ${owners.length} owners and ${parcels.length} parcels`);

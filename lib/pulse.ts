export type Stakeholder = {
  id: string;
  name: string;
  role: string;
  kind: "Official" | "Business" | "Resident" | "Group";
  sentiment: "Positive" | "Negative" | "Neutral";
  score: number;
  note: string;
};

export const SENTIMENT_SERIES = [
  { label: "Apr", score: -0.35 },
  { label: "May", score: -0.22 },
  { label: "Jun", score: -0.08 },
  { label: "Jul", score: 0.06 },
  { label: "Aug", score: 0.18 },
  { label: "Sep", score: 0.27 },
];

export const STAKEHOLDERS: Stakeholder[] = [
  {
    id: "s1",
    name: "Commissioner Ada Ruiz",
    role: "County commission",
    kind: "Official",
    sentiment: "Positive",
    score: 0.62,
    note: "Asked for a decommissioning bond and a public open house before the next hearing.",
  },
  {
    id: "s2",
    name: "White Pine Farm Bureau",
    role: "Member farms in the area of interest",
    kind: "Business",
    sentiment: "Neutral",
    score: 0.08,
    note: "Wants tile-drain protection written into every lease and a local contractor preference.",
  },
  {
    id: "s3",
    name: "Neighbors for Clear Views",
    role: "Steptoe Valley residents",
    kind: "Group",
    sentiment: "Negative",
    score: -0.71,
    note: "Organizing comments on screening, glare, and property values for the planning hearing.",
  },
  {
    id: "s4",
    name: "Ely FFA Alumni",
    role: "Local agriculture program",
    kind: "Group",
    sentiment: "Positive",
    score: 0.44,
    note: "Interested in a scholarship tied to the project if the setback plan holds.",
  },
  {
    id: "s5",
    name: "Eli Navarro",
    role: "Adjacent landowner",
    kind: "Resident",
    sentiment: "Negative",
    score: -0.48,
    note: "Concerned about access dust during construction on Township Road.",
  },
  {
    id: "s6",
    name: "White Pine Conservation District",
    role: "Conservation district",
    kind: "Official",
    sentiment: "Neutral",
    score: -0.05,
    note: "Will review crossing plans for the north ditch before any grading.",
  },
  {
    id: "s7",
    name: "Hearth & Row Cafe",
    role: "Main-street business",
    kind: "Business",
    sentiment: "Positive",
    score: 0.36,
    note: "Expects construction crews to use local lodging and meals.",
  },
  {
    id: "s8",
    name: "Mara Ellison",
    role: "County road superintendent",
    kind: "Official",
    sentiment: "Neutral",
    score: 0.12,
    note: "Wants a written road-use agreement before haul trucks start.",
  },
];

export const BRIEFING = {
  summary:
    "Stockyards is the working lease campaign in White Pine County. The map and owner list follow the 9/11/2026 tracking report. Community notes below are sample context for the county, not findings from that report.",
  risks: [
    "Neighbors for Clear Views plans coordinated comments on screening and property values.",
    "A road-use agreement is still open with the county road superintendent.",
    "Two landowners next to the haul route have raised dust and ditch-crossing concerns.",
  ],
  opportunities: [
    "Commissioner Ruiz will host an open house if the decommissioning bond is on the agenda.",
    "The farm bureau will review a tile-protection rider before the next member meeting.",
    "FFA alumni will circulate a scholarship note if the setback exhibit is attached.",
  ],
  actions: [
    "Send the screening exhibit to the neighbors' group before the hearing packet closes.",
    "Draft the road-use agreement and walk it to the county road superintendent.",
    "Add the tile-protection sentence to the next batch of lease templates.",
    "Confirm the ditch-crossing sketch is in the title file for the north parcels.",
  ],
};

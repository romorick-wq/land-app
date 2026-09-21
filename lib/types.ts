import type { MultiPolygon, Polygon } from "geojson";

export type StatusId =
  | "available"
  | "under_review"
  | "offer_pending"
  | "under_contract"
  | "acquired"
  | "not_available"
  | "excluded";

export type Priority = "low" | "medium" | "high";

export type TitleInstrument = {
  id: string;
  instrumentType: string;
  instDate: string;
  recordDate: string;
  grantor: string;
  grantee: string;
  bookPage: string;
  tenancy: string;
  minerals: string;
  legalDescription: string;
  remarks: string;
  vestingDeed: boolean;
};

export type Encumbrance = {
  id: string;
  type: string;
  holder: string;
  recorded: string;
  bookPage: string;
  amount: string;
  notes: string;
};

export type SavedDocument = {
  name: string;
  size: number;
};

export type ContactLookup = {
  phones: string[];
  emails: string[];
  addresses: string[];
};

export type ContactLog = {
  reaction: string;
  notes: string;
  at: string;
};

export type Owner = {
  id: string;
  name: string;
  phone: string;
  email: string;
  address: string;
  status: StatusId;
  priority: Priority;
  agent: string;
  notes: string;
  isLead: boolean;
  updatedAt: string;
  specialProvisions: string;
  agreementGeneratedAt?: string;
  exhibitGeneratedAt?: string;
  notarizationRequestedAt?: string;
  titleReviewedAt?: string;
  lookup: ContactLookup;
  titleChain: TitleInstrument[];
  encumbrances: Encumbrance[];
  documents: SavedDocument[];
  contactLogged?: ContactLog;
};

export type Parcel = {
  id: string;
  ownerId: string;
  acres: number;
  apn: string;
  legal: string;
  geometry: Polygon | MultiPolygon;
};

export type CampaignData = {
  owners: Owner[];
  parcels: Parcel[];
};

export type Filters = {
  query: string;
  leadsOnly: boolean;
  status: StatusId | "all";
  agent: string | "all";
  priority: Priority | "all";
};

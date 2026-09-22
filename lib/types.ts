import type { MultiPolygon, Polygon } from "geojson";

export type StatusId =
  | "available"
  | "no_contact"
  | "contacted"
  | "offer_sent"
  | "offer_made"
  | "attorney_review"
  | "offer_accepted"
  | "denied"
  | "under_review"
  | "offer_pending"
  | "under_contract"
  | "acquired"
  | "not_available"
  | "excluded";

export type Priority = "low" | "medium" | "high" | "test_well";

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

export type TractInterest = {
  ownerId: string;
  netSurface: number;
  netMineral: number;
  netGeothermal: number;
  leaseStatus: string;
  titleStatus: string;
  acquisitionStatus: string;
  bonusPerAcre: number | null;
  totalDollars: number | null;
  comments: string;
  reportUrl: string;
  priority: Priority;
};

export type Parcel = {
  id: string;
  ownerId: string;
  acres: number;
  apn: string;
  legal: string;
  label?: string;
  labelAt?: [number, number];
  outline?: boolean;
  geometry: Polygon | MultiPolygon;
  status?: StatusId;
  interests?: TractInterest[];
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

"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { defaultFilters } from "@/lib/filters";
import { campaignFromGeoJSON } from "@/lib/importGeojson";
import { cloneSeed } from "@/lib/seed";
import { isPriority, isStatus } from "@/lib/statuses";
import type { CampaignData, Filters, Owner } from "@/lib/types";

const STORAGE_KEY = "land-campaign-v2";

type CampaignContextValue = {
  owners: Owner[];
  parcels: CampaignData["parcels"];
  filters: Filters;
  setFilters: (patch: Partial<Filters>) => void;
  selectedOwnerId: string | null;
  selectOwner: (id: string | null) => void;
  pendingParcelIds: string[];
  reviewParcels: (ids: string[]) => void;
  closeReview: () => void;
  addLeads: (ownerIds: string[]) => void;
  updateOwner: (id: string, patch: Partial<Owner>) => void;
  importCollection: (data: unknown) => string | null;
  resetCampaign: () => void;
  importError: string | null;
  clearImportError: () => void;
  titleOwnerId: string | null;
  docsOwnerId: string | null;
  contactOwnerId: string | null;
  openTitle: (id: string) => void;
  openDocs: (id: string) => void;
  openContact: (id: string) => void;
  closeModals: () => void;
};

const CampaignContext = createContext<CampaignContextValue | null>(null);

function sanitize(data: CampaignData): CampaignData | null {
  if (!Array.isArray(data.owners) || !Array.isArray(data.parcels) || data.parcels.length === 0) return null;
  return {
    owners: data.owners.map((owner) => ({
      ...owner,
      status: isStatus(owner.status) ? owner.status : "available",
      priority: isPriority(owner.priority) ? owner.priority : "low",
      agent: owner.agent ?? "",
      notes: owner.notes ?? "",
      specialProvisions: owner.specialProvisions ?? "",
      lookup: owner.lookup ?? { phones: [], emails: [], addresses: [] },
      titleChain: owner.titleChain ?? [],
      encumbrances: owner.encumbrances ?? [],
      documents: owner.documents ?? [],
    })),
    parcels: data.parcels,
  };
}

export function CampaignProvider({ children }: { children: React.ReactNode }) {
  const seed = useMemo(() => cloneSeed(), []);
  const [campaign, setCampaign] = useState<CampaignData>(seed);
  const [ready, setReady] = useState(false);
  const [filters, setFilterState] = useState<Filters>(defaultFilters);
  const [selectedOwnerId, setSelectedOwnerId] = useState<string | null>(null);
  const [pendingParcelIds, setPendingParcelIds] = useState<string[]>([]);
  const [importError, setImportError] = useState<string | null>(null);
  const [titleOwnerId, setTitleOwnerId] = useState<string | null>(null);
  const [docsOwnerId, setDocsOwnerId] = useState<string | null>(null);
  const [contactOwnerId, setContactOwnerId] = useState<string | null>(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = sanitize(JSON.parse(raw) as CampaignData);
        if (parsed) setCampaign(parsed);
      }
    } catch {
      localStorage.removeItem(STORAGE_KEY);
    }
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(campaign));
  }, [campaign, ready]);

  const value = useMemo<CampaignContextValue>(() => {
    return {
      owners: campaign.owners,
      parcels: campaign.parcels,
      filters,
      setFilters: (patch) => setFilterState((current) => ({ ...current, ...patch })),
      selectedOwnerId,
      selectOwner: setSelectedOwnerId,
      pendingParcelIds,
      reviewParcels: setPendingParcelIds,
      closeReview: () => setPendingParcelIds([]),
      addLeads: (ownerIds) => {
        const now = new Date().toISOString();
        setCampaign((current) => ({
          ...current,
          owners: current.owners.map((owner) => {
            if (!ownerIds.includes(owner.id) || owner.isLead) return owner;
            return { ...owner, isLead: true, status: "available", updatedAt: now };
          }),
        }));
        setPendingParcelIds([]);
        setFilterState((current) => ({ ...current, leadsOnly: true }));
      },
      updateOwner: (id, patch) => {
        setCampaign((current) => ({
          ...current,
          owners: current.owners.map((owner) =>
            owner.id === id ? { ...owner, ...patch, updatedAt: patch.updatedAt ?? new Date().toISOString() } : owner,
          ),
        }));
      },
      importCollection: (data) => {
        try {
          const next = campaignFromGeoJSON(data);
          setCampaign(next);
          setSelectedOwnerId(null);
          setPendingParcelIds([]);
          setImportError(null);
          return null;
        } catch (error) {
          const message = error instanceof Error ? error.message : "That file could not be imported.";
          setImportError(message);
          return message;
        }
      },
      resetCampaign: () => {
        const fresh = cloneSeed();
        setCampaign(fresh);
        setSelectedOwnerId(null);
        setPendingParcelIds([]);
        setFilterState(defaultFilters);
        setImportError(null);
        localStorage.removeItem(STORAGE_KEY);
      },
      importError,
      clearImportError: () => setImportError(null),
      titleOwnerId,
      docsOwnerId,
      contactOwnerId,
      openTitle: setTitleOwnerId,
      openDocs: setDocsOwnerId,
      openContact: setContactOwnerId,
      closeModals: () => {
        setTitleOwnerId(null);
        setDocsOwnerId(null);
        setContactOwnerId(null);
      },
    };
  }, [campaign, filters, selectedOwnerId, pendingParcelIds, importError, titleOwnerId, docsOwnerId, contactOwnerId]);

  if (!ready) {
    return <div className="grid h-screen place-items-center bg-[#0b0e13] text-sm text-white/60">Loading campaign…</div>;
  }

  return <CampaignContext.Provider value={value}>{children}</CampaignContext.Provider>;
}

export function useCampaign() {
  const context = useContext(CampaignContext);
  if (!context) throw new Error("useCampaign must be used inside CampaignProvider");
  return context;
}

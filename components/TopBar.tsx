"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useRef, useState } from "react";
import { useCampaign } from "./CampaignProvider";
import { campaignMetrics } from "@/lib/metrics";
import { ADMIN_LABEL, agentInitials } from "@/lib/agents";
import { PRIORITIES, PROJECT, STATUSES } from "@/lib/statuses";
import { formatAcres } from "@/lib/format";

const nav = [
  { href: "/", label: "Map" },
  { href: "/crm", label: "Landowners" },
  { href: "/dashboard", label: "Dashboard" },
  { href: "/pulse", label: "Community Pulse" },
  { href: "/admin", label: "Admin" },
];

export function TopBar() {
  const pathname = usePathname();
  const fileRef = useRef<HTMLInputElement>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [fileError, setFileError] = useState<string | null>(null);
  const { owners, parcels, agents, filters, setFilters, importCollection, resetCampaign, importError, clearImportError } = useCampaign();
  const metrics = campaignMetrics(owners, parcels);
  const leadAcres = parcels.reduce((sum, parcel) => {
    const owner = owners.find((item) => item.id === parcel.ownerId);
    return sum + (owner?.isLead ? parcel.acres : 0);
  }, 0);
  const agentNames = Array.from(
    new Set([...agents.map((agent) => agent.name), ...owners.map((owner) => owner.agent).filter(Boolean)]),
  ).sort((a, b) => a.localeCompare(b));

  async function onFile(file: File | undefined) {
    if (!file) return;
    if (file.size > 8_000_000) {
      setFileError("That file is larger than 8 MB.");
      return;
    }
    try {
      const text = await file.text();
      const error = importCollection(JSON.parse(text));
      setFileError(error);
    } catch {
      setFileError("That file is not valid JSON.");
    } finally {
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  return (
    <header className="no-print shrink-0 border-b border-white/10 bg-[#10141b]">
      <div className="flex h-12 items-center gap-3 px-3">
        <Link href="/" className="flex items-center gap-2">
          <svg viewBox="0 0 32 32" className="h-6 w-6" aria-hidden>
            <path d="M16 3 L29 28 H22 L16 15 L10 28 H3 Z" fill="#3ddc84" />
          </svg>
          <span className="text-sm font-semibold tracking-wide">{PROJECT.product}</span>
        </Link>
        <span className="hidden text-xs text-white/50 sm:inline">
          {PROJECT.name}
          <span className="text-white/30"> · {PROJECT.place}</span>
        </span>
        <input
          value={filters.query}
          onChange={(event) => setFilters({ query: event.target.value })}
          placeholder="Search owners, phones, APNs"
          aria-label="Search owners"
          className="ml-auto h-8 w-40 rounded-md border border-white/10 bg-[#0e131a] px-2 text-xs outline-none focus:border-[#3ddc84] md:w-56"
        />
        <select
          aria-label="Status"
          value={filters.status}
          onChange={(event) => setFilters({ status: event.target.value as typeof filters.status })}
          className="hidden h-8 rounded-md border border-white/10 bg-[#0e131a] px-2 text-xs lg:block"
        >
          <option value="all">All statuses</option>
          {STATUSES.map((status) => (
            <option key={status.id} value={status.id}>
              {status.label}
            </option>
          ))}
        </select>
        <select
          aria-label="Agent"
          value={filters.agent}
          onChange={(event) => setFilters({ agent: event.target.value })}
          className="hidden h-8 rounded-md border border-white/10 bg-[#0e131a] px-2 text-xs xl:block"
        >
          <option value="all">All agents</option>
          {agentNames.map((agent) => (
            <option key={agent} value={agent}>
              {agent}
            </option>
          ))}
          <option value="Unassigned">Unassigned</option>
        </select>
        <div className="flex items-center gap-1">
          {PRIORITIES.map((priority) => {
            const pressed = filters.priority === priority.id;
            return (
              <button
                key={priority.id}
                type="button"
                aria-pressed={pressed}
                onClick={() => setFilters({ priority: pressed ? "all" : priority.id })}
                className={`h-8 rounded-md px-2 text-xs ${pressed ? "bg-[#3ddc84] font-semibold text-black" : "border border-white/10 text-white/80"}`}
              >
                {priority.label}
              </button>
            );
          })}
        </div>
        <button
          type="button"
          aria-pressed={filters.leadsOnly}
          onClick={() => setFilters({ leadsOnly: !filters.leadsOnly })}
          className={`h-8 rounded-md px-2 text-xs ${filters.leadsOnly ? "bg-[#3ddc84] font-semibold text-black" : "border border-white/10 text-white/80"}`}
        >
          Leads
        </button>
        <nav className="flex items-center gap-1">
          {nav.map((item) => {
            const active = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`rounded-md px-2 py-1 text-xs ${active ? "bg-white/10 text-white" : "text-white/60 hover:text-white"}`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="relative">
          <button
            type="button"
            className="h-8 rounded-md border border-white/10 px-2 text-xs text-white/80"
            onClick={() => setMenuOpen((open) => !open)}
            aria-expanded={menuOpen}
          >
            Data
          </button>
          {menuOpen && (
            <div className="absolute right-0 z-30 mt-1 w-52 rounded-md border border-white/10 bg-[#161b22] p-1 shadow-xl">
              <button
                type="button"
                className="block w-full rounded px-2 py-1.5 text-left text-xs hover:bg-white/5"
                onClick={() => {
                  setMenuOpen(false);
                  fileRef.current?.click();
                }}
              >
                Load GeoJSON
              </button>
              <button
                type="button"
                className="block w-full rounded px-2 py-1.5 text-left text-xs hover:bg-white/5"
                onClick={() => {
                  setMenuOpen(false);
                  resetCampaign();
                }}
              >
                Reset sample campaign
              </button>
            </div>
          )}
          <input
            ref={fileRef}
            type="file"
            accept=".geojson,.json,application/geo+json,application/json"
            className="hidden"
            onChange={(event) => onFile(event.target.files?.[0])}
          />
        </div>
        <Link href="/admin" className="hidden items-center gap-2 sm:flex" aria-label={ADMIN_LABEL}>
          <span className="grid h-7 w-7 place-items-center rounded-full bg-[#3ddc84] text-[11px] font-bold text-black">
            {agentInitials("Rick Romo")}
          </span>
          <span className="whitespace-nowrap text-xs text-white/70">{ADMIN_LABEL}</span>
        </Link>
      </div>
      <div className="flex gap-3 overflow-x-auto border-t border-white/5 px-3 py-1.5 text-[11px] text-white/70">
        {STATUSES.map((status) => (
          <button
            key={status.id}
            type="button"
            onClick={() => setFilters({ status: filters.status === status.id ? "all" : status.id })}
            className={`flex shrink-0 items-center gap-1.5 rounded px-1 ${filters.status === status.id ? "bg-white/10 text-white" : ""}`}
          >
            <i className="h-2 w-2 rounded-full" style={{ background: status.color }} />
            <span>{status.label}</span>
            <strong className="font-medium text-white">{formatAcres(metrics.byStatus[status.id].acres)}</strong>
          </button>
        ))}
        <span className="ml-auto shrink-0 text-white/40">
          {metrics.leadCount} leads · {formatAcres(leadAcres)} ac
        </span>
      </div>
      {(importError || fileError) && (
        <div className="flex items-center justify-between bg-red-950/80 px-3 py-1 text-xs text-red-100">
          <span>{fileError || importError}</span>
          <button
            type="button"
            onClick={() => {
              setFileError(null);
              clearImportError();
            }}
            aria-label="Dismiss import error"
          >
            ×
          </button>
        </div>
      )}
    </header>
  );
}

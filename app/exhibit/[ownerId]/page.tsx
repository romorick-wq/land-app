"use client";

import { useEffect, useRef } from "react";
import { useParams } from "next/navigation";
import maplibregl, { type StyleSpecification } from "maplibre-gl";
import { useCampaign } from "@/components/CampaignProvider";
import { parcelsForOwner, defaultFilters } from "@/lib/filters";
import { boundsOf } from "@/lib/geo";
import { formatAcres } from "@/lib/format";
import { toMapFeatures } from "@/lib/paint";
import { PROJECT } from "@/lib/statuses";
import "maplibre-gl/dist/maplibre-gl.css";

export default function ExhibitPage() {
  const params = useParams<{ ownerId: string }>();
  const { owners, parcels } = useCampaign();
  const owner = owners.find((item) => item.id === params.ownerId);
  const owned = owner ? parcelsForOwner(parcels, owner.id) : [];
  const parcelKey = owned.map((parcel) => parcel.id).join("|");
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!ref.current || !owner) return;
    const map = new maplibregl.Map({
      container: ref.current,
      style: {
        version: 8,
        sources: {
          satellite: {
            type: "raster",
            tiles: ["https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"],
            tileSize: 256,
            attribution: "Imagery © Esri",
          },
          parcels: {
            type: "geojson",
            data: toMapFeatures(owned, owners, { ...defaultFilters, leadsOnly: false }, owner.id, owned.map((parcel) => parcel.id)),
          },
        },
        layers: [
          { id: "satellite", type: "raster", source: "satellite" },
          {
            id: "parcel-fill",
            type: "fill",
            source: "parcels",
            paint: { "fill-color": ["get", "fill"], "fill-opacity": 0.55 },
          },
          {
            id: "parcel-line",
            type: "line",
            source: "parcels",
            paint: { "line-color": "#ffffff", "line-width": 2 },
          },
        ],
      } as StyleSpecification,
      interactive: false,
      attributionControl: {},
    });
    map.on("load", () => {
      const bounds = boundsOf(owned);
      if (bounds) map.fitBounds(bounds, { padding: 32, duration: 0, maxZoom: 15 });
    });
    return () => map.remove();
  }, [owner, owners, parcelKey]);

  if (!owner) return <p className="p-8 text-sm">That owner is not in this campaign.</p>;

  return (
    <main className="mx-auto max-w-4xl px-6 py-8">
      <div className="no-print mb-4 flex gap-2">
        <button type="button" className="rounded bg-[#3ddc84] px-3 py-1.5 text-xs font-semibold text-black" onClick={() => window.print()}>
          Print / Save PDF
        </button>
        <a href="/" className="rounded border border-white/15 px-3 py-1.5 text-xs">
          Back to map
        </a>
      </div>
      <p className="text-xs uppercase tracking-[0.16em] text-white/45">Exhibit A</p>
      <h1 className="mt-1 text-xl font-semibold">{owner.name}</h1>
      <p className="text-sm text-white/50">
        {PROJECT.name} · {PROJECT.place}
      </p>
      <div ref={ref} className="mt-4 h-96 overflow-hidden rounded-lg border border-white/10" />
      <table className="mt-4 w-full text-left text-sm">
        <thead>
          <tr className="text-xs uppercase text-white/40">
            <th className="py-2">APN</th>
            <th>Acres</th>
            <th>Legal description</th>
          </tr>
        </thead>
        <tbody>
          {owned.map((parcel) => (
            <tr key={parcel.id} className="border-t border-white/10 align-top">
              <td className="py-2 pr-3">{parcel.apn}</td>
              <td className="pr-3">{formatAcres(parcel.acres)}</td>
              <td>{parcel.legal}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </main>
  );
}

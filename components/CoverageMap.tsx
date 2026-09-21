"use client";

import { useEffect, useRef } from "react";
import maplibregl, { type Map, type StyleSpecification } from "maplibre-gl";
import { boundsOf } from "@/lib/geo";
import { toMapFeatures } from "@/lib/paint";
import { defaultFilters } from "@/lib/filters";
import type { Owner, Parcel } from "@/lib/types";
import "maplibre-gl/dist/maplibre-gl.css";

export function CoverageMap({ parcels, owners }: { parcels: Parcel[]; owners: Owner[] }) {
  const ref = useRef<HTMLDivElement>(null);
  const mapRef = useRef<Map | null>(null);

  useEffect(() => {
    if (!ref.current || mapRef.current) return;
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
          parcels: { type: "geojson", data: toMapFeatures(parcels, owners, defaultFilters, null, []) },
        },
        layers: [
          { id: "satellite", type: "raster", source: "satellite" },
          {
            id: "parcel-fill",
            type: "fill",
            source: "parcels",
            paint: { "fill-color": ["get", "fill"], "fill-opacity": ["get", "fillOpacity"] },
          },
          {
            id: "parcel-line",
            type: "line",
            source: "parcels",
            paint: { "line-color": ["get", "line"], "line-width": 1 },
          },
        ],
      } as StyleSpecification,
      interactive: false,
      attributionControl: false,
    });
    map.on("load", () => {
      const bounds = boundsOf(parcels);
      if (bounds) map.fitBounds(bounds, { padding: 16, duration: 0, maxZoom: 13 });
    });
    mapRef.current = map;
    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, [owners, parcels]);

  return <div ref={ref} className="h-56 w-full overflow-hidden rounded-lg" />;
}

"use client";

import { useEffect, useRef, useState } from "react";
import maplibregl, { type GeoJSONSource, type Map, type StyleSpecification } from "maplibre-gl";
import type { Feature, FeatureCollection, MultiPolygon, Polygon, Position } from "geojson";
import { useCampaign } from "./CampaignProvider";
import { STATUSES } from "@/lib/statuses";
import {
  boundsOf,
  boxPolygon,
  lineCorridor,
  parcelAtPoint,
  parcelsIntersecting,
  radiusPolygon,
  ringPolygon,
} from "@/lib/geo";
import { toMapFeatures } from "@/lib/paint";
import "maplibre-gl/dist/maplibre-gl.css";

type DrawMode = "click" | "line" | "box" | "radius" | "polygon";

const EMPTY: FeatureCollection = { type: "FeatureCollection", features: [] };

const SATELLITE = "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}";

const HINTS: Record<DrawMode, string> = {
  click: "Click parcels to select them, then review.",
  line: "Click the start and end of a path.",
  box: "Drag a rectangle around the parcels you want.",
  radius: "Click a center, then click the edge of the circle.",
  polygon: "Click corners, then finish the shape.",
};

function mapStyle() {
  return {
    version: 8 as const,
    glyphs: "https://demotiles.maplibre.org/font/{fontstack}/{range}.pbf",
    sources: {
      satellite: {
        type: "raster" as const,
        tiles: [SATELLITE],
        tileSize: 256,
        attribution: "Imagery © Esri, Maxar, Earthstar Geographics, and the GIS User Community",
      },
      parcels: { type: "geojson" as const, data: EMPTY },
      draw: { type: "geojson" as const, data: EMPTY },
    },
    layers: [
      { id: "satellite", type: "raster" as const, source: "satellite" },
      {
        id: "parcel-fill",
        type: "fill" as const,
        source: "parcels",
        filter: ["!=", ["get", "outline"], 1],
        paint: {
          "fill-color": ["get", "fill"],
          "fill-opacity": ["get", "fillOpacity"],
        },
      },
      {
        id: "parcel-line",
        type: "line" as const,
        source: "parcels",
        filter: ["!=", ["get", "outline"], 1],
        paint: {
          "line-color": ["get", "line"],
          "line-width": ["get", "lineWidth"],
        },
      },
      {
        id: "parcel-outline",
        type: "line" as const,
        source: "parcels",
        filter: ["==", ["get", "outline"], 1],
        paint: {
          "line-color": "#ffffff",
          "line-width": 2.5,
          "line-dasharray": [2, 1.4],
        },
      },
      {
        id: "parcel-label",
        type: "symbol" as const,
        source: "parcels",
        filter: [">", ["length", ["get", "label"]], 0],
        layout: {
          "text-field": ["get", "label"],
          "text-font": ["Open Sans Bold"],
          "text-size": 13,
          "text-max-width": 10,
          "text-anchor": "center",
          "symbol-placement": "point",
          "text-allow-overlap": true,
        },
        paint: {
          "text-color": "#ffffff",
          "text-halo-color": "#0b0e13",
          "text-halo-width": 1.4,
        },
      },
      {
        id: "draw-fill",
        type: "fill" as const,
        source: "draw",
        paint: { "fill-color": "#f59e0b", "fill-opacity": 0.2 },
      },
      {
        id: "draw-line",
        type: "line" as const,
        source: "draw",
        paint: { "line-color": "#f59e0b", "line-width": 2 },
      },
    ],
  };
}

export function MapCanvas() {
  const { parcels, owners, filters, selectedOwnerId, selectOwner, pendingParcelIds, reviewParcels } = useCampaign();
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<Map | null>(null);
  const [mode, setMode] = useState<DrawMode | null>(null);
  const [minAcres, setMinAcres] = useState(0);
  const [picked, setPicked] = useState<string[]>([]);
  const [hint, setHint] = useState("");
  const [legendOpen, setLegendOpen] = useState(true);
  const modeRef = useRef(mode);
  const minRef = useRef(minAcres);
  const parcelsRef = useRef(parcels);
  const ownersRef = useRef(owners);
  const filtersRef = useRef(filters);
  const selectedRef = useRef(selectedOwnerId);
  const pickedRef = useRef(picked);
  const pendingRef = useRef(pendingParcelIds);
  const draftRef = useRef<Position[]>([]);
  const dragRef = useRef<Position | null>(null);
  const fittedRef = useRef("");

  modeRef.current = mode;
  minRef.current = minAcres;
  parcelsRef.current = parcels;
  ownersRef.current = owners;
  filtersRef.current = filters;
  selectedRef.current = selectedOwnerId;
  pickedRef.current = picked;
  pendingRef.current = pendingParcelIds;

  function paint() {
    const map = mapRef.current;
    const source = map?.getSource("parcels") as GeoJSONSource | undefined;
    if (!source) return;
    const highlighted = Array.from(new Set([...pendingRef.current, ...pickedRef.current]));
    source.setData(toMapFeatures(parcelsRef.current, ownersRef.current, filtersRef.current, selectedRef.current, highlighted));
  }

  function showDraw(feature: Feature<Polygon | MultiPolygon> | null) {
    const source = mapRef.current?.getSource("draw") as GeoJSONSource | undefined;
    if (!source) return;
    source.setData(feature ? { type: "FeatureCollection", features: [feature] } : EMPTY);
  }

  function finish(ids: string[]) {
    showDraw(null);
    draftRef.current = [];
    dragRef.current = null;
    if (!ids.length) {
      setHint("No parcels in that shape.");
      return;
    }
    setPicked(ids);
    reviewParcels(ids);
  }

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;
    const map = new maplibregl.Map({
      container: containerRef.current,
      style: mapStyle() as StyleSpecification,
      center: [-114.89, 39.2],
      zoom: 12,
      attributionControl: {},
    });
    map.addControl(new maplibregl.NavigationControl({ showCompass: false }), "bottom-right");
    map.boxZoom.disable();

    map.on("load", () => {
      paint();
      const bounds = boundsOf(parcelsRef.current);
      if (bounds) map.fitBounds(bounds, { padding: 48, duration: 0, maxZoom: 14 });
      fittedRef.current = parcelsRef.current.map((parcel) => parcel.id).join("|");
    });

    map.on("click", (event) => {
      const current = modeRef.current;
      const lngLat: Position = [event.lngLat.lng, event.lngLat.lat];
      if (!current) {
        const hit = parcelAtPoint(parcelsRef.current, lngLat[0], lngLat[1]);
        if (hit) selectOwner(hit.ownerId);
        return;
      }
      if (current === "click") {
        const hit = parcelAtPoint(parcelsRef.current, lngLat[0], lngLat[1]);
        if (!hit || hit.acres < minRef.current) return;
        setPicked((currentIds) => (currentIds.includes(hit.id) ? currentIds.filter((id) => id !== hit.id) : [...currentIds, hit.id]));
        return;
      }
      if (current === "line") {
        const draft = draftRef.current;
        if (!draft.length) {
          draftRef.current = [lngLat];
          return;
        }
        const shape = lineCorridor(draft[0], lngLat);
        finish(shape ? parcelsIntersecting(parcelsRef.current, shape, minRef.current).map((parcel) => parcel.id) : []);
        return;
      }
      if (current === "radius") {
        const draft = draftRef.current;
        if (!draft.length) {
          draftRef.current = [lngLat];
          return;
        }
        const shape = radiusPolygon(draft[0], lngLat);
        finish(shape ? parcelsIntersecting(parcelsRef.current, shape, minRef.current).map((parcel) => parcel.id) : []);
        return;
      }
      if (current === "polygon") {
        const last = draftRef.current[draftRef.current.length - 1];
        if (last && Math.abs(last[0] - lngLat[0]) < 1e-7 && Math.abs(last[1] - lngLat[1]) < 1e-7) return;
        draftRef.current = [...draftRef.current, lngLat];
        showDraw(ringPolygon(draftRef.current));
      }
    });

    map.on("dblclick", (event) => {
      if (modeRef.current !== "polygon") return;
      event.preventDefault();
      const shape = ringPolygon(draftRef.current);
      finish(shape ? parcelsIntersecting(parcelsRef.current, shape, minRef.current).map((parcel) => parcel.id) : []);
    });

    map.on("mousedown", (event) => {
      if (modeRef.current !== "box") return;
      event.preventDefault();
      map.dragPan.disable();
      dragRef.current = [event.lngLat.lng, event.lngLat.lat];
    });

    map.on("mousemove", (event) => {
      const cursor: Position = [event.lngLat.lng, event.lngLat.lat];
      const current = modeRef.current;
      if (current === "box" && dragRef.current) {
        showDraw(boxPolygon(dragRef.current, cursor));
      } else if (current === "radius" && draftRef.current.length === 1) {
        showDraw(radiusPolygon(draftRef.current[0], cursor));
      } else if (current === "line" && draftRef.current.length === 1) {
        showDraw(lineCorridor(draftRef.current[0], cursor));
      } else if (current === "polygon" && draftRef.current.length) {
        showDraw(ringPolygon([...draftRef.current, cursor]));
      }
    });

    map.on("mouseup", (event) => {
      if (modeRef.current !== "box" || !dragRef.current) return;
      const start = dragRef.current;
      dragRef.current = null;
      map.dragPan.enable();
      const shape = boxPolygon(start, [event.lngLat.lng, event.lngLat.lat]);
      if (!shape) {
        showDraw(null);
        return;
      }
      finish(parcelsIntersecting(parcelsRef.current, shape, minRef.current).map((parcel) => parcel.id));
    });

    const releaseDrag = (event: MouseEvent) => {
      if (!dragRef.current) return;
      if (containerRef.current?.contains(event.target as Node)) return;
      dragRef.current = null;
      map.dragPan.enable();
      showDraw(null);
    };
    window.addEventListener("mouseup", releaseDrag);

    mapRef.current = map;
    return () => {
      window.removeEventListener("mouseup", releaseDrag);
      map.remove();
      mapRef.current = null;
    };
    // Map instance is created once. Handlers read the latest campaign through refs.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    paint();
  }, [parcels, owners, filters, selectedOwnerId, picked, pendingParcelIds]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    if (mode === "polygon") map.doubleClickZoom.disable();
    else map.doubleClickZoom.enable();
  }, [mode]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    const signature = parcels.map((parcel) => parcel.id).join("|");
    if (fittedRef.current === signature) return;
    const bounds = boundsOf(parcels);
    if (!bounds) return;
    const run = () => {
      map.fitBounds(bounds, { padding: 48, duration: 0, maxZoom: 14 });
      fittedRef.current = signature;
    };
    if (map.isStyleLoaded()) run();
    else map.once("load", run);
  }, [parcels]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !selectedOwnerId) return;
    const owned = parcels.filter((parcel) => parcel.ownerId === selectedOwnerId);
    const bounds = boundsOf(owned);
    if (!bounds) return;
    map.fitBounds(bounds, { padding: 90, maxZoom: 15, duration: 700 });
  }, [selectedOwnerId, parcels]);

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setMode(null);
        draftRef.current = [];
        showDraw(null);
        setHint("");
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    if (!hint) return;
    const timer = window.setTimeout(() => setHint(""), 2400);
    return () => window.clearTimeout(timer);
  }, [hint]);

  const tools: { id: DrawMode; label: string }[] = [
    { id: "click", label: "Click" },
    { id: "line", label: "Line" },
    { id: "box", label: "Box" },
    { id: "radius", label: "Radius" },
    { id: "polygon", label: "Polygon" },
  ];

  return (
    <div className="relative min-w-0 flex-1">
      <div ref={containerRef} className="h-full w-full" />
      <div className="absolute left-3 top-3 w-64 rounded-lg border border-white/10 bg-[#12171e]/95 p-3 text-xs shadow-xl">
        <div className="mb-2 font-semibold">Quick add parcels</div>
        <div className="grid grid-cols-3 gap-1">
          {tools.map((tool) => (
            <button
              key={tool.id}
              type="button"
              aria-pressed={mode === tool.id}
              onClick={() => {
                setMode((current) => (current === tool.id ? null : tool.id));
                draftRef.current = [];
                showDraw(null);
                setHint("");
              }}
              className={`h-7 rounded ${mode === tool.id ? "bg-[#3ddc84] font-semibold text-black" : "bg-white/5 text-white/80"}`}
            >
              {tool.label}
            </button>
          ))}
        </div>
        <label className="mt-3 block text-[11px] uppercase tracking-wide text-white/45">
          Min acres
          <input
            type="number"
            min={0}
            value={minAcres}
            onChange={(event) => setMinAcres(Number(event.target.value) || 0)}
            className="mt-1 h-8 w-full rounded-md border border-white/10 bg-[#0e131a] px-2 text-xs"
          />
        </label>
        <p className="mt-2 text-[11px] leading-4 text-white/50">{mode ? HINTS[mode] : "Click a parcel to open the owner. Draw a shape to add leads."}</p>
        {mode === "polygon" && (
          <button
            type="button"
            className="mt-2 h-8 w-full rounded-md bg-white/10"
            onClick={() => {
              const shape = ringPolygon(draftRef.current);
              finish(shape ? parcelsIntersecting(parcels, shape, minAcres).map((parcel) => parcel.id) : []);
            }}
          >
            Finish shape
          </button>
        )}
        {mode === "click" && picked.length > 0 && (
          <button type="button" className="mt-2 h-8 w-full rounded-md bg-[#3ddc84] font-semibold text-black" onClick={() => reviewParcels(picked)}>
            Review {picked.length} parcels
          </button>
        )}
        {hint && <p className="mt-2 text-amber-300">{hint}</p>}
      </div>
      <div className="absolute bottom-3 left-3 rounded-lg border border-white/10 bg-[#12171e]/95 text-xs shadow-xl">
        <button type="button" className="px-3 py-2 font-medium" onClick={() => setLegendOpen((open) => !open)}>
          {legendOpen ? "Hide legend" : "Legend"}
        </button>
        {legendOpen && (
          <ul className="space-y-1 px-3 pb-3">
            <li className="flex items-center gap-2 whitespace-nowrap">
              <i className="inline-block h-2.5 w-2.5 shrink-0 border border-[#4ade80] bg-[#14532d]" /> Background
            </li>
            <li className="flex items-center gap-2 whitespace-nowrap">
              <i className="inline-block h-2.5 w-2.5 shrink-0 border border-amber-400" /> Selected shape
            </li>
            <li className="max-w-52 text-[10px] leading-4 text-white/40">BLM PLSS, Mount Diablo meridian, White Pine County</li>
            <li className="flex items-center gap-2 whitespace-nowrap">
              <i className="inline-block h-0.5 w-4 border-t-2 border-dashed border-white" /> Surface thermal test well
            </li>
            {STATUSES.map((status) => (
              <li key={status.id} className="flex items-center gap-2 whitespace-nowrap">
                <i className="inline-block h-2.5 w-2.5 shrink-0 rounded-sm" style={{ background: status.color }} />
                {status.label}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

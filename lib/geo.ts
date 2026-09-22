import {
  bbox,
  booleanIntersects,
  booleanPointInPolygon,
  buffer,
  circle,
  distance,
  feature,
  lineString,
  point,
  polygon,
} from "@turf/turf";
import type { Feature, FeatureCollection, MultiPolygon, Polygon, Position } from "geojson";
import type { Parcel } from "./types";

export function parcelFeature(parcel: Parcel): Feature<Polygon | MultiPolygon> {
  return feature(parcel.geometry, { id: parcel.id });
}

export function boundsOf(parcels: Parcel[]): [[number, number], [number, number]] | null {
  if (!parcels.length) return null;
  const collection: FeatureCollection = {
    type: "FeatureCollection",
    features: parcels.map(parcelFeature),
  };
  const box = bbox(collection);
  return [
    [box[0], box[1]],
    [box[2], box[3]],
  ];
}

export function parcelAtPoint(parcels: Parcel[], lng: number, lat: number) {
  const cursor = point([lng, lat]);
  return parcels.find((parcel) => !parcel.outline && booleanPointInPolygon(cursor, parcelFeature(parcel)));
}

export function parcelsIntersecting(parcels: Parcel[], shape: Feature<Polygon | MultiPolygon>, minAcres: number) {
  return parcels.filter((parcel) => !parcel.outline && parcel.acres >= minAcres && booleanIntersects(parcelFeature(parcel), shape));
}

export function boxPolygon(start: Position, end: Position): Feature<Polygon> | null {
  if (Math.abs(start[0] - end[0]) < 0.00008 || Math.abs(start[1] - end[1]) < 0.00008) return null;
  const minX = Math.min(start[0], end[0]);
  const maxX = Math.max(start[0], end[0]);
  const minY = Math.min(start[1], end[1]);
  const maxY = Math.max(start[1], end[1]);
  return polygon([
    [
      [minX, minY],
      [maxX, minY],
      [maxX, maxY],
      [minX, maxY],
      [minX, minY],
    ],
  ]);
}

export function radiusPolygon(center: Position, edge: Position): Feature<Polygon> | null {
  const kilometers = distance(point(center), point(edge), { units: "kilometers" });
  if (kilometers < 0.03) return null;
  return circle(center, kilometers, { units: "kilometers", steps: 64 });
}

export function lineCorridor(start: Position, end: Position): Feature<Polygon | MultiPolygon> | null {
  const miles = distance(point(start), point(end), { units: "kilometers" });
  if (miles < 0.02) return null;
  return buffer(lineString([start, end]), 45, { units: "meters" }) ?? null;
}

export function ringPolygon(points: Position[]): Feature<Polygon> | null {
  if (points.length < 3) return null;
  return polygon([[...points, points[0]]]);
}

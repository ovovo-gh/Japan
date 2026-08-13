"use client";

import { useEffect, useRef, useState } from "react";
import type { LayerGroup, Map as LeafletMap } from "leaflet";
import type { DayPlan, Place } from "./types";

type Props = {
  places: Place[];
  days: DayPlan[];
  selectedDay: number | "all";
  selectedPlaceId: string | null;
  onSelectPlace: (id: string) => void;
};

type LeafletApi = typeof import("leaflet");

export default function LeafletMapView({
  places,
  days,
  selectedDay,
  selectedPlaceId,
  onSelectPlace,
}: Props) {
  const mapNode = useRef<HTMLDivElement | null>(null);
  const map = useRef<LeafletMap | null>(null);
  const markerLayer = useRef<LayerGroup | null>(null);
  const leaflet = useRef<LeafletApi["default"] | null>(null);
  const [mapReady, setMapReady] = useState(false);

  useEffect(() => {
    let cancelled = false;

    void import("leaflet").then((module) => {
      if (cancelled || !mapNode.current) return;

      const L = module.default;
      leaflet.current = L;
      const nextMap = L.map(mapNode.current, {
        zoomControl: false,
        attributionControl: true,
        scrollWheelZoom: true,
      }).setView([35.6812, 139.7671], 11);

      L.control.zoom({ position: "bottomright" }).addTo(nextMap);
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        maxZoom: 19,
      }).addTo(nextMap);

      map.current = nextMap;
      markerLayer.current = L.layerGroup().addTo(nextMap);
      setMapReady(true);
      window.setTimeout(() => nextMap.invalidateSize(), 150);
    });

    return () => {
      cancelled = true;
      if (map.current) {
        map.current.remove();
        map.current = null;
        markerLayer.current = null;
        setMapReady(false);
      }
    };
  }, []);

  useEffect(() => {
    const L = leaflet.current;
    if (!L || !map.current || !markerLayer.current) return;

    markerLayer.current.clearLayers();
    const visiblePlaces = places.filter((place) =>
      selectedDay === "all" ? true : place.day === selectedDay,
    );
    const selectedCoordinates: [number, number][] = [];

    visiblePlaces.forEach((place) => {
      const day = days.find((item) => item.id === place.day);
      const color = day?.color ?? "#4f7185";
      const isSelected = place.id === selectedPlaceId;
      const marker = L.circleMarker([place.lat, place.lng], {
        radius: isSelected ? 11 : 8,
        color: "#fffaf1",
        weight: isSelected ? 4 : 2,
        fillColor: color,
        fillOpacity: 0.96,
        opacity: 1,
      });

      const popup = document.createElement("div");
      popup.className = "map-popup";
      const title = document.createElement("strong");
      title.textContent = place.title;
      const detail = document.createElement("span");
      detail.textContent = `${place.area} · Day ${place.day}`;
      popup.append(title, detail);
      marker.bindPopup(popup, { closeButton: true });
      marker.on("click", () => onSelectPlace(place.id));
      marker.addTo(markerLayer.current!);

      if (isSelected) {
        marker.openPopup();
      }
      selectedCoordinates.push([place.lat, place.lng]);
    });

    if (selectedCoordinates.length > 1) {
      map.current.fitBounds(L.latLngBounds(selectedCoordinates), {
        padding: [32, 32],
        maxZoom: selectedDay === "all" ? 12 : 14,
      });
    } else if (selectedCoordinates.length === 1) {
      map.current.setView(selectedCoordinates[0], 14, { animate: true });
    }
  }, [days, places, selectedDay, selectedPlaceId, onSelectPlace]);

  return (
    <div className="map-frame" aria-label="东京、富士山与大阪旅行地点地图">
      <div ref={mapNode} className="leaflet-map" />
      {!mapReady && <div className="map-loading">正在加载地图图层…</div>}
    </div>
  );
}

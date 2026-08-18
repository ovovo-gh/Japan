"use client";

import { useEffect, useRef, useState } from "react";
import type { LayerGroup, Map as LeafletMap } from "leaflet";
import type { DayPlan, Place } from "./types";

type Props = {
  places: Place[];
  routePlaces: Place[];
  days: DayPlan[];
  selectedDay: number | "all";
  selectedPlaceId: string | null;
  onSelectPlace: (id: string) => void;
};

type LeafletApi = typeof import("leaflet");

export default function LeafletMapView({
  places,
  routePlaces,
  days,
  selectedDay,
  selectedPlaceId,
  onSelectPlace,
}: Props) {
  const mapNode = useRef<HTMLDivElement | null>(null);
  const map = useRef<LeafletMap | null>(null);
  const routeLayer = useRef<LayerGroup | null>(null);
  const arrowLayer = useRef<LayerGroup | null>(null);
  const markerLayer = useRef<LayerGroup | null>(null);
  const leaflet = useRef<LeafletApi | null>(null);
  const [mapReady, setMapReady] = useState(false);

  useEffect(() => {
    let cancelled = false;

    void import("leaflet").then((module) => {
      if (cancelled || !mapNode.current) return;

      const L = (module as unknown as { default: LeafletApi }).default;
      leaflet.current = L;
      const nextMap = L.map(mapNode.current, {
        zoomControl: false,
        attributionControl: true,
        scrollWheelZoom: true,
      }).setView([35.6812, 139.7671], 11);

      L.control.zoom({ position: "bottomright" }).addTo(nextMap);
      const worldStreetLayer = L.tileLayer(
        "https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}",
        {
          attribution: '&copy; <a href="https://www.arcgis.com/">Esri</a> · World Street Map',
          maxZoom: 19,
        },
      );
      const fallbackLayer = L.tileLayer("https://tile.openstreetmap.de/{z}/{x}/{y}.png", {
        attribution: '&copy; <a href="https://www.openstreetmap.de/">OpenStreetMap.de</a>',
        maxZoom: 19,
      });
      let fallbackActive = false;
      worldStreetLayer.on("tileerror", () => {
        if (fallbackActive) return;
        fallbackActive = true;
        nextMap.removeLayer(worldStreetLayer);
        fallbackLayer.addTo(nextMap);
      });
      worldStreetLayer.addTo(nextMap);

      map.current = nextMap;
      routeLayer.current = L.layerGroup().addTo(nextMap);
      arrowLayer.current = L.layerGroup().addTo(nextMap);
      markerLayer.current = L.layerGroup().addTo(nextMap);
      setMapReady(true);
      window.setTimeout(() => nextMap.invalidateSize(), 150);
    });

    return () => {
      cancelled = true;
      if (map.current) {
        map.current.remove();
        map.current = null;
        routeLayer.current = null;
        arrowLayer.current = null;
        markerLayer.current = null;
        setMapReady(false);
      }
    };
  }, []);

  useEffect(() => {
    const L = leaflet.current;
    if (!L || !map.current || !routeLayer.current || !arrowLayer.current || !markerLayer.current) return;

    routeLayer.current.clearLayers();
    arrowLayer.current.clearLayers();
    markerLayer.current.clearLayers();
    const visiblePlaces = places.filter((place) =>
      selectedDay === "all" ? true : place.day === selectedDay,
    );
    const routeablePlaces = routePlaces.filter((place) =>
      selectedDay === "all" ? true : place.day === selectedDay,
    );
    const selectedCoordinates: [number, number][] = [];
    const routeCoordinates: [number, number][] = [];

    const routeGroups = new Map<number, Array<{ place: Place; sourceIndex: number }>>();
    routeablePlaces.forEach((place, sourceIndex) => {
      const group = routeGroups.get(place.day) ?? [];
      group.push({ place, sourceIndex });
      routeGroups.set(place.day, group);
    });

    const orderedGroups = [...routeGroups.entries()].map(([dayId, entries]) => [
      dayId,
      entries.sort(
        (a, b) => (a.place.routeOrder ?? a.sourceIndex) - (b.place.routeOrder ?? b.sourceIndex),
      ),
    ] as const);

    const routeOrderById = new Map<string, number>();
    orderedGroups.forEach(([, entries]) => {
      entries.forEach(({ place }, index) => routeOrderById.set(place.id, index + 1));
    });

    const drawRouteArrows = () => {
      if (!map.current || !arrowLayer.current) return;
      arrowLayer.current.clearLayers();

      orderedGroups.forEach(([dayId, entries]) => {
        const day = days.find((item) => item.id === dayId);
        const color = day?.color ?? "#4f7185";
        const coordinates = entries.map(({ place }) => [place.lat, place.lng] as [number, number]);

        coordinates.slice(0, -1).forEach((current, index) => {
          const next = coordinates[index + 1];
          const fromPoint = map.current!.latLngToLayerPoint(L.latLng(current));
          const toPoint = map.current!.latLngToLayerPoint(L.latLng(next));
          const midpoint = map.current!.layerPointToLatLng(
            L.point((fromPoint.x + toPoint.x) / 2, (fromPoint.y + toPoint.y) / 2),
          );
          const angle = Math.atan2(toPoint.y - fromPoint.y, toPoint.x - fromPoint.x) * (180 / Math.PI);
          const arrow = document.createElement("span");
          arrow.className = "route-arrow";
          arrow.textContent = "➜";
          arrow.style.color = color;
          arrow.style.transform = `rotate(${Math.round(angle)}deg)`;
          const icon = L.divIcon({
            className: "route-arrow-icon",
            html: arrow.outerHTML,
            iconSize: [24, 24],
            iconAnchor: [12, 12],
          });
          L.marker(midpoint, { icon, interactive: false, keyboard: false }).addTo(arrowLayer.current!);
        });
      });
    };

    orderedGroups.forEach(([dayId, entries]) => {
      const day = days.find((item) => item.id === dayId);
      const color = day?.color ?? "#4f7185";
      const coordinates = entries.map(({ place }) => [place.lat, place.lng] as [number, number]);
      routeCoordinates.push(...coordinates);

      if (coordinates.length > 1) {
        L.polyline(coordinates, {
          color,
          weight: 4,
          opacity: 0.76,
          lineCap: "round",
          lineJoin: "round",
        }).addTo(routeLayer.current!);
      }
    });

    const markerEntries = visiblePlaces
      .map((place, sourceIndex) => ({ place, sourceIndex }))
      .sort((a, b) => {
        const aOrder = routeOrderById.get(a.place.id) ?? Number.MAX_SAFE_INTEGER;
        const bOrder = routeOrderById.get(b.place.id) ?? Number.MAX_SAFE_INTEGER;
        return aOrder - bOrder || a.sourceIndex - b.sourceIndex;
      });

    markerEntries.forEach(({ place }, markerIndex) => {
      const day = days.find((item) => item.id === place.day);
      const color = day?.color ?? "#4f7185";
      const routeNumber = routeOrderById.get(place.id) ?? markerIndex + 1;
      const isSelected = place.id === selectedPlaceId;
      const markerNode = document.createElement("span");
      markerNode.className = "route-marker";
      markerNode.textContent = String(routeNumber);
      markerNode.style.backgroundColor = color;
      markerNode.setAttribute("aria-label", `${place.title}，第 ${routeNumber} 站`);
      const icon = L.divIcon({
        className: "route-marker-icon",
        html: markerNode.outerHTML,
        iconSize: [32, 32],
        iconAnchor: [16, 16],
        popupAnchor: [0, -17],
      });
      const marker = L.marker([place.lat, place.lng], {
        icon,
        zIndexOffset: isSelected ? 1000 : 100 + routeNumber,
      });

      const popup = document.createElement("div");
      popup.className = "map-popup";
      const title = document.createElement("strong");
      title.textContent = place.title;
      const detail = document.createElement("span");
      detail.textContent = `${day?.label ?? `DAY ${place.day}`} · 第 ${routeNumber} 站 · ${place.area}`;
      popup.append(title, detail);
      marker.bindPopup(popup, { closeButton: true });
      marker.on("click", () => onSelectPlace(place.id));
      marker.addTo(markerLayer.current!);

      if (isSelected) {
        marker.openPopup();
      }
      selectedCoordinates.push([place.lat, place.lng]);
    });

    const boundsCoordinates = routeCoordinates.length ? routeCoordinates : selectedCoordinates;
    if (boundsCoordinates.length > 1) {
      map.current.fitBounds(L.latLngBounds(boundsCoordinates), {
        padding: [32, 32],
        maxZoom: selectedDay === "all" ? 12 : 14,
        animate: false,
      });
    } else if (boundsCoordinates.length === 1) {
      map.current.setView(boundsCoordinates[0], 14, { animate: false });
    }

    const redrawArrowsAfterViewportChange = () => {
      window.requestAnimationFrame(drawRouteArrows);
    };
    map.current.on("moveend zoomend", redrawArrowsAfterViewportChange);
    window.requestAnimationFrame(drawRouteArrows);

    return () => {
      map.current?.off("moveend zoomend", redrawArrowsAfterViewportChange);
    };
  }, [days, places, routePlaces, selectedDay, selectedPlaceId, onSelectPlace, mapReady]);

  return (
    <div className="map-frame" aria-label="东京、富士山、京都、奈良与大阪旅行地点地图">
      <div ref={mapNode} className="leaflet-map" />
      <div className="map-provider-note">底图：Esri World Street Map · 加载异常会自动切换 OpenStreetMap.de</div>
      {!mapReady && <div className="map-loading">正在加载地图图层…</div>}
    </div>
  );
}

"use client";

import { useState } from "react";
import { MapContainer, TileLayer, Marker, useMapEvents } from "react-leaflet";
import L from "leaflet";
import markerIcon2x from "leaflet/dist/images/marker-icon-2x.png";
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";
import { DEFAULT_MAP_CENTER } from "@/lib/constants";

const defaultIcon = L.icon({
  iconUrl: markerIcon.src,
  iconRetinaUrl: markerIcon2x.src,
  shadowUrl: markerShadow.src,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

function ClickHandler({ onPick }: { onPick: (lat: number, lng: number) => void }) {
  useMapEvents({
    click(e) {
      onPick(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

export function LocationPicker({
  lat,
  lng,
  onChange,
  readOnly = false,
}: {
  lat: number | null;
  lng: number | null;
  onChange?: (lat: number, lng: number) => void;
  readOnly?: boolean;
}) {
  const [position, setPosition] = useState<[number, number] | null>(lat != null && lng != null ? [lat, lng] : null);

  function handlePick(newLat: number, newLng: number) {
    if (readOnly) return;
    setPosition([newLat, newLng]);
    onChange?.(newLat, newLng);
  }

  function useMyLocation() {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition((pos) => {
      handlePick(pos.coords.latitude, pos.coords.longitude);
    });
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="h-64 w-full overflow-hidden rounded-xl border border-sibol-green/20 sm:h-80">
        <MapContainer
          center={position ?? DEFAULT_MAP_CENTER}
          zoom={position ? 16 : 13}
          className="h-full w-full"
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          {!readOnly ? <ClickHandler onPick={handlePick} /> : null}
          {position ? <Marker position={position} icon={defaultIcon} /> : null}
        </MapContainer>
      </div>
      {!readOnly ? (
        <div className="flex flex-wrap items-center gap-3 text-sm">
          <button
            type="button"
            onClick={useMyLocation}
            className="tap-target rounded-xl border border-sibol-green/20 px-3.5 py-2 font-bold text-sibol-green hover:bg-sibol-green/5"
          >
            📍 Gamitin ang kasalukuyang lokasyon
          </button>
          <span className="text-sibol-green/60">
            {position ? `Pin set: ${position[0].toFixed(5)}, ${position[1].toFixed(5)}` : "I-tap ang mapa para mag-set ng pin"}
          </span>
        </div>
      ) : null}
    </div>
  );
}
